from rest_framework import serializers
from .models import ProjectSuggestion
from apps.accounts.serializers import UserSerializer


def format_user_name(user):
    """Formata o nome do usuário com first_name e last_name"""
    if not user:
        return None
    if user.first_name and user.last_name:
        return f"{user.first_name} {user.last_name}"
    elif user.first_name:
        return user.first_name
    elif user.last_name:
        return user.last_name
    return user.username


class ProjectSuggestionSerializer(serializers.ModelSerializer):
    solicitante_detail = UserSerializer(source='solicitante', read_only=True)
    avaliado_por_name = serializers.SerializerMethodField()
    
    def get_avaliado_por_name(self, obj):
        return format_user_name(obj.avaliado_por)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ProjectSuggestion
        fields = ['id', 'titulo', 'descricao', 'solicitante', 'solicitante_detail', 
                 'status', 'status_display', 'avaliado_por', 'avaliado_por_name', 
                 'data_avaliacao', 'observacoes', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'data_avaliacao']
