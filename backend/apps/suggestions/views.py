from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import ProjectSuggestion
from .serializers import ProjectSuggestionSerializer


class ProjectSuggestionViewSet(viewsets.ModelViewSet):
    queryset = ProjectSuggestion.objects.all()
    serializer_class = ProjectSuggestionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'solicitante', 'avaliado_por']
    search_fields = ['titulo', 'descricao']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
