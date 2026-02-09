from rest_framework import serializers
from .models import Team, TeamMember, Hierarchy, NodePosition
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


class TeamSerializer(serializers.ModelSerializer):
    supervisor_name = serializers.SerializerMethodField()
    
    def get_supervisor_name(self, obj):
        return format_user_name(obj.supervisor)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = Team
        fields = ['id', 'nome', 'tipo', 'tipo_display', 'supervisor', 'supervisor_name', 
                 'cor', 'posicao_x', 'posicao_y', 'largura', 'altura', 
                 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class TeamMemberSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)
    team_detail = TeamSerializer(source='team', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = TeamMember
        fields = ['id', 'user', 'user_detail', 'team', 'team_detail', 'role', 'role_display', 'created_at']
        read_only_fields = ['created_at']


class HierarchySerializer(serializers.ModelSerializer):
    supervisor_name = serializers.SerializerMethodField()
    gerente_name = serializers.SerializerMethodField()
    desenvolvedor_name = serializers.SerializerMethodField()
    
    def get_supervisor_name(self, obj):
        return format_user_name(obj.supervisor)
    
    def get_gerente_name(self, obj):
        return format_user_name(obj.gerente)
    
    def get_desenvolvedor_name(self, obj):
        return format_user_name(obj.desenvolvedor)

    class Meta:
        model = Hierarchy
        fields = ['id', 'supervisor', 'supervisor_name', 'gerente', 'gerente_name', 
                 'desenvolvedor', 'desenvolvedor_name', 'created_at']
        read_only_fields = ['created_at']
    
    def validate(self, data):
        """Garantir que pelo menos gerente ou desenvolvedor seja fornecido"""
        gerente = data.get('gerente')
        desenvolvedor = data.get('desenvolvedor')
        
        if not gerente and not desenvolvedor:
            raise serializers.ValidationError(
                "É necessário fornecer pelo menos um gerente ou um desenvolvedor."
            )
        
        return data


class NodePositionSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)

    class Meta:
        model = NodePosition
        fields = ['id', 'user', 'user_detail', 'x', 'y', 'updated_at']
        read_only_fields = ['updated_at']
