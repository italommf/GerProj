from apps.accounts.models import User, Role

def seed_users():
    # Usuários iniciais do sistema
    initial_users = [
        ('admin', 'admin@example.com', 'admin123', Role.ADMIN),
        ('supervisor', 'supervisor@example.com', 'supervisor123', Role.SUPERVISOR),
        ('gerente', 'gerente@example.com', 'gerente123', Role.GERENTE),
        ('dev', 'dev@example.com', 'dev123', Role.DESENVOLVEDOR),
    ]

    # Novos usuários - todos começam como desenvolvedor
    # O admin pode alterar os cargos depois
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
    ]

    all_users = initial_users + new_users

    for username, email, password, role in all_users:
        if not User.objects.filter(username=username).exists():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                role=role,
                is_staff=True if role in [Role.ADMIN, Role.SUPERVISOR] else False,
                is_superuser=True if role == Role.ADMIN else False
            )
            print(f"Usuário criado: {username} ({role}) - Email: {email} - Senha: {password}")
        else:
            print(f"Usuário já existe: {username}")

    print("\n=== Resumo ===")
    print("Todos os novos usuários foram criados como DESENVOLVEDOR.")
    print("O ADMIN deve alterar os cargos de Gustavo e Elton para SUPERVISOR.")
    print("Os SUPERVISORES podem alterar os cargos dos outros usuários.")

if __name__ == '__main__':
    seed_users()
