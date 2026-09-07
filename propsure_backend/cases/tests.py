from pathlib import Path

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


def create_auth_client():
    user = User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="testpass123",
    )
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client, user


class CaseAndDocumentTests(TestCase):
    def test_create_case_unauthenticated(self):
        client = APIClient()
        url = reverse("case-list")
        data = {
            "title": "Test Case",
            "address": "123 Test St",
            "owner": "Test Owner",
            "status": "pending",
            "risk": "low",
        }
        response = client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_case_authenticated(self):
        client, user = create_auth_client()
        url = reverse("case-list")
        data = {
            "title": "Test Case",
            "address": "123 Test St",
            "owner": user.username,
            "status": "pending",
            "risk": "low",
        }
        response = client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Test Case")

    def test_upload_document_authenticated(self):
        client, user = create_auth_client()

        # create a case
        case_url = reverse("case-list")
        case_data = {
            "title": "Doc Test Case",
            "address": "456 Doc St",
            "owner": user.username,
            "status": "pending",
            "risk": "medium",
        }
        case_res = client.post(case_url, case_data, format="json")
        self.assertEqual(case_res.status_code, status.HTTP_201_CREATED)
        case_id = case_res.data["id"]

        # upload a document
        doc_url = reverse("document-list")

        # path to dummy file next to this tests.py
        test_file_path = Path(__file__).resolve().parent / "tests_dummy.pdf"

        with open(test_file_path, "rb") as f:
            response = client.post(
                doc_url,
                {"case": case_id, "file": f},
                format="multipart",
            )
        
        print("Status:", response.status_code)
        print("Response data:", response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)