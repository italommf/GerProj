from rest_framework import serializers
from .models import TimelineEntry
from apps.projects.serializers import ProjectSerializer
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


class TimelineEntrySerializer(serializers.ModelSerializer):
    projeto_detail = ProjectSerializer(source='projeto', read_only=True)
    usuario_name = serializers.SerializerMethodField()
    
    def get_usuario_name(self, obj):
        return format_user_name(obj.usuario)
    tipo_evento_display = serializers.CharField(source='get_tipo_evento_display', read_only=True)

    class Meta:
        model = TimelineEntry
        fields = ['id', 'projeto', 'projeto_detail', 'tipo_evento', 'tipo_evento_display', 
                 'data', 'descricao', 'usuario', 'usuario_name', 'created_at']
        read_only_fields = ['created_at']
