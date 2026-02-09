from django.core.management.base import BaseCommand
from apps.accounts.models import User, Role


class Command(BaseCommand):
    help = 'Garante que todos os superusuários tenham role=Admin na plataforma (ex.: italoadmin).'

    def handle(self, *args, **options):
        updated = User.objects.filter(is_superuser=True).exclude(role=Role.ADMIN)
        count = updated.update(role=Role.ADMIN)
        if count:
            self.stdout.write(self.style.SUCCESS(f'Atualizado(s) {count} superusuário(s) para role=Admin.'))
        else:
            self.stdout.write('Nenhum superusuário precisou de atualização.')
