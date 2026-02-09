"""
Teste para verificar se o Celery inicializa sem erros
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

try:
    from config.celery import app
    print("[OK] Celery configurado com sucesso!")
    print(f"    Broker URL: {app.conf.broker_url}")
    print(f"    Result Backend: {app.conf.result_backend}")
    print(f"    Connection Retry on Startup: {app.conf.broker_connection_retry_on_startup}")
except Exception as e:
    print(f"[ERRO] Falha ao configurar Celery: {e}")
    import traceback
    traceback.print_exc()
