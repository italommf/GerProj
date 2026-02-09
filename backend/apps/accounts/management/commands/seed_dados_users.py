from django.core.management.base import BaseCommand
from apps.accounts.models import User, Role


class Command(BaseCommand):
    help = 'Cadastra usuários de Dados e remove usuários antigos (dev, gerente, supervisor)'

    def handle(self, *args, **options):
        # Usuários de Dados a serem criados
        dados_users = [
            ('pedro', 'pedro@gmail.com', 'pedro123', Role.DADOS),
            ('levy', 'levy@gmail.com', 'levy123', Role.DADOS),
            ('douglas', 'douglas@gmail.com', 'douglas123', Role.DADOS),
            ('jhonnatan', 'jhonnatan@gmail.com', 'jhonnatan123', Role.DADOS),
        ]

        # Usuários a serem deletados
        users_to_delete = ['dev', 'gerente', 'supervisor']

        # Deletar usuários antigos
        deleted_count = 0
        for username in users_to_delete:
            try:
                user = User.objects.get(username=username)
                user.delete()
                self.stdout.write(
                    self.style.SUCCESS(f'[DELETADO] Usuario removido: {username}')
                )
                deleted_count += 1
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'[NAO ENCONTRADO] Usuario nao existe: {username}')
                )

        # Criar usuários de Dados
        created_count = 0
        existing_count = 0

        for username, email, password, role in dados_users:
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    role=role,
                    is_staff=False,
                    is_superuser=False
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f'[OK] Usuario criado: {username} - Email: {email} - Senha: {password} - Role: Dados'
                    )
                )
                created_count += 1
            else:
                self.stdout.write(
                    self.style.WARNING(f'[EXISTE] Usuario ja existe: {username}')
                )
                existing_count += 1

        self.stdout.write(self.style.SUCCESS(f'\n=== Resumo ==='))
        self.stdout.write(f'Usuarios deletados: {deleted_count}')
        self.stdout.write(f'Usuarios de Dados criados: {created_count}')
        self.stdout.write(f'Usuarios de Dados ja existentes: {existing_count}')
