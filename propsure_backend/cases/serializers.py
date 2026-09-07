from rest_framework import serializers
from .models import Case, Document
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'case', 'file', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class CaseSerializer(serializers.ModelSerializer):
    documents = DocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Case
        fields = ['id', 'title', 'address', 'owner', 'status', 'risk', 'created_at', 'documents']
        read_only_fields = ['id', 'created_at', 'documents', "owner"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )
        return user

class AnalyzeSerializer(serializers.Serializer):
    document = serializers.FileField()