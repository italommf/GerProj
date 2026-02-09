from django.core.management.base import BaseCommand
from apps.accounts.models import User


class Command(BaseCommand):
    help = 'Atualiza os nomes dos usuários com iniciais maiúsculas e sobrenomes'

    def handle(self, *args, **options):
        # Mapeamento de username para (first_name, last_name)
        user_names = {
            'gustavo': ('Gustavo', 'Virgilio'),
            'elton': ('Elton', 'Tavares'),
            'jefferson': ('Jefferson', 'Oliveira'),
            'thiago': ('Thiago', 'Araujo'),
            'geymerson': ('Geymerson', 'Camara'),
            'ilton': ('Ilton', 'Moreira'),
            'italo': ('Italo', 'Martins'),
            'lucas': ('Lucas', 'Felix'),
            'douglas': ('Douglas', 'Matheus'),
            'jhonnatan': ('Jhonnatan', 'Medeiros'),
            'levy': ('Levy', 'Benoni'),
            'pedro': ('Pedro', 'Silva'),
            'robert': ('Robert', 'Oliveira'),
            'neilton': ('Neilton', 'Silva'),
        }

        updated_count = 0
        not_found = []

        for username, (first_name, last_name) in user_names.items():
            try:
                user = User.objects.get(username=username)
                user.first_name = first_name
                user.last_name = last_name
                user.save()
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Atualizado: {username} -> {first_name} {last_name}'
                    )
                )
            except User.DoesNotExist:
                not_found.append(username)
                self.stdout.write(
                    self.style.WARNING(
                        f'Usuario nao encontrado: {username}'
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n=== Resumo ===\n'
                f'Usuários atualizados: {updated_count}\n'
                f'Usuários não encontrados: {len(not_found)}'
            )
        )

        if not_found:
            self.stdout.write(
                self.style.WARNING(
                    f'Usuários não encontrados: {", ".join(not_found)}'
                )
            )
