"""
Script para testar envio de notificação em tempo real via WebSocket
"""
import os
import django
from datetime import datetime, timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.projects.notification_utils import send_notification

User = get_user_model()

print("=" * 60)
print("TESTE DE NOTIFICACAO EM TEMPO REAL")
print("=" * 60)

# Encontrar usuário Italo
try:
    italo = User.objects.get(username__icontains='italo')
    print(f"\n[OK] Usuario encontrado: {italo.username} (ID: {italo.id})")
    
    # Enviar notificação de teste
    print("\n--- Enviando notificacao de teste ---")
    notification = send_notification(
        user_id=italo.id,
        tipo='card_created',
        titulo='Teste de Notificacao em Tempo Real',
        mensagem='Esta e uma notificacao de teste enviada em tempo real via WebSocket. Se voce esta logado como Italo e o WebSocket esta conectado, esta notificacao deve aparecer imediatamente sem precisar atualizar a pagina.',
        card_id=None,
        sprint_id=None,
        project_id=None,
        metadata={'test': True, 'timestamp': timezone.now().isoformat()}
    )
    
    if notification:
        print(f"[OK] Notificacao criada com sucesso (ID: {notification.id})")
        print(f"     Titulo: {notification.titulo}")
        print(f"     Tipo: {notification.tipo}")
        print(f"     Data: {notification.data_criacao}")
        print("\n[INFO] Verifique o frontend - a notificacao deve aparecer em tempo real!")
    else:
        print("[ERRO] Falha ao criar notificacao")
        
except User.DoesNotExist:
    print("\n[ERRO] Usuario 'Italo' nao encontrado.")
    print("       Execute primeiro o script create_test_notifications.py")

print("\n" + "=" * 60)
