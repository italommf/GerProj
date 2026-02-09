from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectSuggestionViewSet

router = DefaultRouter()
router.register(r'suggestions', ProjectSuggestionViewSet, basename='suggestion')

urlpatterns = [
    path('', include(router.urls)),
]
