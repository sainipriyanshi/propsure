import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Creates the initial user from environment variables"

    def handle(self, *args, **options):
        User = get_user_model()

        username = os.environ.get("BOOTSTRAP_USERNAME")
        email = os.environ.get("BOOTSTRAP_EMAIL")
        password = os.environ.get("BOOTSTRAP_PASSWORD")

        if not username or not password:
            self.stderr.write("BOOTSTRAP_USERNAME and BOOTSTRAP_PASSWORD are required")
            return

        if User.objects.filter(username=username).exists():
            self.stdout.write("User already exists")
            return

        User.objects.create_superuser(
            username=username,
            email=email or "",
            password=password,
        )

        self.stdout.write("Bootstrap user created")