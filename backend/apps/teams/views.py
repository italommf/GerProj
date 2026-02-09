from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Team, TeamMember, Hierarchy, NodePosition
from .serializers import TeamSerializer, TeamMemberSerializer, HierarchySerializer, NodePositionSerializer


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'supervisor']
    search_fields = ['nome']
    ordering_fields = ['nome', 'created_at']
    ordering = ['-created_at']


class TeamMemberViewSet(viewsets.ModelViewSet):
    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['team', 'user', 'role']
    ordering_fields = ['created_at']
    ordering = ['-created_at']


class HierarchyViewSet(viewsets.ModelViewSet):
    queryset = Hierarchy.objects.all()
    serializer_class = HierarchySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['supervisor', 'gerente', 'desenvolvedor']
    ordering_fields = ['created_at']
    ordering = ['-created_at']


class NodePositionViewSet(viewsets.ModelViewSet):
    queryset = NodePosition.objects.all()
    serializer_class = NodePositionSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """Cria ou atualiza a posição do node (upsert)"""
        user_id = request.data.get('user')
        if not user_id:
            return Response({'error': 'user é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar se já existe uma posição para este usuário
        try:
            node_position = NodePosition.objects.get(user_id=user_id)
            # Atualizar
            serializer = self.get_serializer(node_position, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        except NodePosition.DoesNotExist:
            # Criar novo
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def bulk(self, request):
        """Retorna todas as posições dos nodes"""
        positions = NodePosition.objects.all()
        serializer = self.get_serializer(positions, many=True)
        return Response(serializer.data)
