from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GeekDayDrawViewSet

router = DefaultRouter()
router.register(r'geekday-draws', GeekDayDrawViewSet, basename='geekdaydraw')

urlpatterns = [
    path('', include(router.urls)),
]
