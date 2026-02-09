from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User


class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    profile_picture_url = serializers.SerializerMethodField(read_only=True)

    def get_profile_picture_url(self, obj):
        if not obj.profile_picture:
            return None
        url = obj.profile_picture.url
        path = url if url.startswith('/') else '/' + url
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(path)
        return path

    def validate_role(self, value):
        """
        Validação: Apenas Admin pode definir Supervisor.
        Admin e Supervisor podem definir Gerente e Desenvolvedor.
        """
        request = self.context.get('request')
        if not request:
            return value
        
        user = request.user
        current_role = self.instance.role if self.instance else None
        
        # Se está tentando definir como supervisor
        if value == 'supervisor':
            if user.role != 'admin':
                raise serializers.ValidationError(
                    'Apenas administradores podem definir usuários como supervisores.'
                )
        
        # Se está tentando alterar de supervisor para outro cargo
        if current_role == 'supervisor' and value != 'supervisor':
            if user.role != 'admin':
                raise serializers.ValidationError(
                    'Apenas administradores podem alterar o cargo de supervisores.'
                )
        
        # Admin e Supervisor podem alterar para gerente, desenvolvedor, dados ou processos
        if value in ['gerente', 'desenvolvedor', 'dados', 'processos']:
            if user.role not in ['admin', 'supervisor']:
                raise serializers.ValidationError(
                    'Apenas administradores e supervisores podem alterar cargos.'
                )
        
        return value

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'role_display', 'profile_picture_url', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Credenciais inválidas.')
            if not user.is_active:
                raise serializers.ValidationError('Usuário desativado.')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Username e senha são obrigatórios.')
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_current_password(self, value):
        request = self.context.get('request')
        if not request or not request.user.check_password(value):
            raise serializers.ValidationError('Senha atual incorreta.')
        return value
