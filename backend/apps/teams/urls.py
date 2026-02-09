from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TeamViewSet, TeamMemberViewSet, HierarchyViewSet, NodePositionViewSet

router = DefaultRouter()
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'team-members', TeamMemberViewSet, basename='teammember')
router.register(r'hierarchies', HierarchyViewSet, basename='hierarchy')
router.register(r'node-positions', NodePositionViewSet, basename='nodeposition')

urlpatterns = [
    path('', include(router.urls)),
]
