# from django.urls import path
# from .views import CaseListView, CaseDetailView

# urlpatterns = [
#     path("cases/", CaseListView.as_view(), name="case-list"),
#     path("cases/<int:pk>/", CaseDetailView.as_view(), name="case-detail"),
# ]


from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedDefaultRouter
from .views import CaseViewSet, DocumentViewSet, AnalyzeDocumentView

router = DefaultRouter()
router.register("cases", CaseViewSet, basename="case")
router.register(r"documents", DocumentViewSet, basename="document")

nested_router = NestedDefaultRouter(router, "cases", lookup="case")
nested_router.register(
    "documents",
    DocumentViewSet,
    basename="case-documents",
)

urlpatterns = [
    path("", include(router.urls)),
    path("", include(nested_router.urls)),
    path("", include(router.urls)),
    path("analyze/", AnalyzeDocumentView.as_view(), name="analyze-document"),
]