from apps.accounts.models import User, Role
from apps.teams.models import Team, TeamMember, TeamMemberRole, Hierarchy, TeamType

def seed_data():
    # Carregar usuários
    admin = User.objects.get(username='admin')
    supervisor = User.objects.get(username='supervisor')
    gerente = User.objects.get(username='gerente')
    dev = User.objects.get(username='dev')

    # 1. Criar Equipe
    team, _ = Team.objects.get_or_create(
        nome='Equipe Alpha',
        defaults={'tipo': TeamType.BACK, 'supervisor': supervisor}
    )
    print(f"Equipe criada: {team.nome}")

    # 2. Adicionar Membros à Equipe
    TeamMember.objects.get_or_create(
        user=gerente,
        team=team,
        defaults={'role': TeamMemberRole.GERENTE}
    )
    TeamMember.objects.get_or_create(
        user=dev,
        team=team,
        defaults={'role': TeamMemberRole.DESENVOLVEDOR}
    )
    print(f"Membros adicionados à equipe {team.nome}")

    # 3. Criar Hierarquia
    Hierarchy.objects.get_or_create(
        supervisor=supervisor,
        gerente=gerente,
        desenvolvedor=dev
    )
    print(f"Hierarquia criada: {supervisor.username} -> {gerente.username} -> {dev.username}")

if __name__ == '__main__':
    seed_data()
