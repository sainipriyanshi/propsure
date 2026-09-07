from django.contrib import admin

# Register your models here.
from .models import Case, Document

admin.site.register(Case)
admin.site.register(Document)