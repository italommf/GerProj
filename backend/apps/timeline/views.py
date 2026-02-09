from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import TimelineEntry
from .serializers import TimelineEntrySerializer


class TimelineEntryViewSet(viewsets.ModelViewSet):
    queryset = TimelineEntry.objects.all()
    serializer_class = TimelineEntrySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['projeto', 'tipo_evento', 'usuario']
    ordering_fields = ['data', 'created_at']
    ordering = ['data']
