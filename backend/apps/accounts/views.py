from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import User
from .serializers import UserSerializer, LoginSerializer, ChangePasswordSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.exclude(role='admin')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Excluir admins de todas as listagens"""
        queryset = User.objects.exclude(role='admin')
        # Se houver filtro por role, aplicar
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Retorna o usuário atual"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated], url_path='change-password')
    def change_password(self, request):
        """Altera a senha do usuário atual"""
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            return Response({'message': 'Senha alterada com sucesso'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated], url_path='profile-picture')
    def profile_picture(self, request):
        """Atualiza a foto de perfil do usuário atual"""
        file = request.FILES.get('profile_picture')
        if not file:
            return Response(
                {'profile_picture': ['Nenhum arquivo enviado.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Remove foto anterior se existir
        if request.user.profile_picture:
            request.user.profile_picture.delete(save=False)
        request.user.profile_picture = file
        request.user.save(update_fields=['profile_picture'])
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class LoginView(APIView):
    """View de login sem CSRF para desenvolvimento"""
    permission_classes = [AllowAny]
    authentication_classes = []  # Não requer autenticação

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request):
        """Login do usuário - retorna token de autenticação"""
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            # Cria ou obtém o token do usuário
            token, created = Token.objects.get_or_create(user=user)
            user_serializer = UserSerializer(user, context={'request': request})
            return Response({
                'user': user_serializer.data,
                'token': token.key,
                'message': 'Login realizado com sucesso'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """View de logout"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Logout do usuário - remove o token"""
        if hasattr(request.user, 'auth_token'):
            request.user.auth_token.delete()
        logout(request)
        return Response({'message': 'Logout realizado com sucesso'})
