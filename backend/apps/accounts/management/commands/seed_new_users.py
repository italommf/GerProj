from django.core.management.base import BaseCommand
from apps.accounts.models import User, Role


class Command(BaseCommand):
    help = 'Cadastra os novos usuários do sistema'

    def handle(self, *args, **options):
        # Novos usuários - todos começam como desenvolvedor
        new_users = [
            # Supervisores (serão definidos pelo admin)
            ('gustavo', 'gustavo@gmail.com', 'gustavo123', Role.DESENVOLVEDOR),
            ('elton', 'elton@gmail.com', 'elton123', Role.DESENVOLVEDOR),
            # Gerentes de Projeto (serão definidos pelo supervisor)
            ('jefferson', 'jefferson@gmail.com', 'jefferson123', Role.DESENVOLVEDOR),
            ('thiago', 'thiago@gmail.com', 'thiago123', Role.DESENVOLVEDOR),
            ('robert', 'robert@gmail.com', 'robert123', Role.DESENVOLVEDOR),
            # Desenvolvedores
            ('ilton', 'ilton@gmail.com', 'ilton123', Role.DESENVOLVEDOR),
            ('lucas', 'lucas@gmail.com', 'lucas123', Role.DESENVOLVEDOR),
            ('italo', 'italo@gmail.com', 'italo123', Role.DESENVOLVEDOR),
            ('geymerson', 'geymerson@gmail.com', 'geymerson123', Role.DESENVOLVEDOR),
            ('neilton', 'neilton@gmail.com', 'neilton123', Role.DESENVOLVEDOR),
        ]

        created_count = 0
        existing_count = 0

        for username, email, password, role in new_users:
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
                        f'[OK] Usuario criado: {username} - Email: {email} - Senha: {password}'
                    )
                )
                created_count += 1
            else:
                self.stdout.write(
                    self.style.WARNING(f'[EXISTE] Usuario ja existe: {username}')
                )
                existing_count += 1

        self.stdout.write(self.style.SUCCESS(f'\n=== Resumo ==='))
        self.stdout.write(f'Usuarios criados: {created_count}')
        self.stdout.write(f'Usuarios ja existentes: {existing_count}')
        self.stdout.write(self.style.WARNING(
            '\n[ATENCAO] Todos os novos usuarios foram criados como DESENVOLVEDOR.'
        ))
        self.stdout.write(
            '[INFO] O ADMIN deve alterar os cargos de Gustavo e Elton para SUPERVISOR.'
        )
        self.stdout.write(
            '[INFO] Os SUPERVISORES podem alterar os cargos dos outros usuarios.'
        )
