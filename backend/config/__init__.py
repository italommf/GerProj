# This will make sure the app is always imported when
# Django starts so that shared_task will use this app.
# Import opcional - só importa se o Celery estiver instalado
try:
    from .celery import app as celery_app
    __all__ = ('celery_app',)
except ImportError:
    # Celery não está instalado - isso é OK para desenvolvimento
    celery_app = None
    __all__ = ()
