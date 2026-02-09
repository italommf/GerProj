from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TimelineEntryViewSet

router = DefaultRouter()
router.register(r'timeline', TimelineEntryViewSet, basename='timeline')

urlpatterns = [
    path('', include(router.urls)),
]
