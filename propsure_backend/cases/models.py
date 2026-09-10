from django.db import models
from django.contrib.auth.models import User
from django.conf import settings

# Create your models here.
class Case(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cases",
)
    client = models.CharField(max_length=255)
    title = models.CharField(max_length=200)
    address = models.CharField(max_length=300)
    status = models.CharField(max_length=50)
    risk = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Document(models.Model):
    case = models.ForeignKey(
        Case,
        on_delete=models.CASCADE,
        related_name="documents",
    )

    file = models.FileField(upload_to="documents/")

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_documents",
    )

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file.name