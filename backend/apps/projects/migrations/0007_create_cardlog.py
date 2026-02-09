# Generated manually

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0006_add_sistema_area'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CardLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo_evento', models.CharField(choices=[('criado', 'Criado'), ('movimentado', 'Movimentado'), ('pendencia', 'Pendência'), ('atualizado', 'Atualizado'), ('responsavel_alterado', 'Responsável Alterado')], max_length=30, verbose_name='Tipo de Evento')),
                ('descricao', models.TextField(verbose_name='Descrição')),
                ('data', models.DateTimeField(auto_now_add=True, verbose_name='Data do Evento')),
                ('card', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='logs', to='projects.card', verbose_name='Card')),
                ('usuario', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='card_logs', to=settings.AUTH_USER_MODEL, verbose_name='Usuário')),
            ],
            options={
                'verbose_name': 'Log do Card',
                'verbose_name_plural': 'Logs dos Cards',
                'ordering': ['-data'],
            },
        ),
    ]
