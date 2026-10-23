# from django.shortcuts import render

# # Create your views here.
# from rest_framework import generics

# from .models import Case
# from .serializers import CaseSerializer


# class CaseListView(generics.ListAPIView):
#     queryset = Case.objects.all()
#     serializer_class = CaseSerializer


# class CaseDetailView(generics.RetrieveAPIView):
#     queryset = Case.objects.all()
#     serializer_class = CaseSerializer


from rest_framework import viewsets
from .models import Case, Document
from .serializers import CaseSerializer, DocumentSerializer, AnalyzeSerializer
from rest_framework.permissions import IsAuthenticated

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer

from .ocr import extract_text_from_image_bytes
from extractors import extract_all
from risk_rules import evaluate_risks

from rest_framework.parsers import MultiPartParser, FormParser
from .ocr import analyze_document  # or whatever your main function is called


import os

from django.contrib.auth import get_user_model
from django.core.management import call_command
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["POST"])
@permission_classes([AllowAny])
def bootstrap_user(request):
    expected_key = os.environ.get("BOOTSTRAP_SECRET_KEY")
    provided_key = request.headers.get("X-Bootstrap-Key")

    if not expected_key or provided_key != expected_key:
        return Response({"detail": "Forbidden"}, status=403)

    call_command("create_bootstrap_user")
    return Response({"detail": "Bootstrap user created or already exists"})


class CaseViewSet(viewsets.ModelViewSet):
    serializer_class = CaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Case.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Document.objects.filter(
            case_id=self.kwargs["case_pk"]
        )

    def perform_create(self, serializer):
    # case comes from request.data["case"]
       serializer.save()


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            status=status.HTTP_201_CREATED,
        )

class LogoutView(APIView):
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Refresh token required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response({"detail": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Logged out successfully"})


class AnalyzeDocumentView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = AnalyzeSerializer

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get("document")  # must match React's formData.append("document", ...)

        if not file_obj:
            return Response(
                {"detail": "No file uploaded. Use field name 'document'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = analyze_document(file_obj)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"detail": f"Analysis failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )