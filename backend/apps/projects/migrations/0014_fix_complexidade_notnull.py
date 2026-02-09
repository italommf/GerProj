# Generated manually to fix NOT NULL constraint in SQLite

from django.db import migrations, models

def fix_complexidade_schema(apps, schema_editor):
    """Corrigir schema do SQLite para permitir NULL ou garantir default"""
    # Para SQLite, precisamos recriar a tabela para alterar constraints
    # Mas como estamos usando default=list no modelo, vamos garantir valores
    Card = apps.get_model('projects', 'Card')
    # Atualizar todos os cards que têm None para []
    Card.objects.filter(complexidade_selected_items__isnull=True).update(complexidade_selected_items=[])
    Card.objects.filter(complexidade_custom_items__isnull=True).update(complexidade_custom_items=[])

class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0013_fix_complexidade_defaults'),
    ]

    operations = [
        migrations.RunPython(fix_complexidade_schema),
        # Alterar campos para permitir null temporariamente, depois voltar com default
        migrations.AlterField(
            model_name='card',
            name='complexidade_selected_items',
            field=models.JSONField(
                blank=True,
                default=list,
                null=False,  # Não permitir null, mas garantir default
                help_text='Array de IDs dos itens selecionados na estimativa de complexidade',
                verbose_name='Itens Selecionados na Estimativa de Complexidade'
            ),
        ),
        migrations.AlterField(
            model_name='card',
            name='complexidade_custom_items',
            field=models.JSONField(
                blank=True,
                default=list,
                null=False,  # Não permitir null, mas garantir default
                help_text='Array de objetos com id, label e hours dos itens personalizados criados pelo usuário',
                verbose_name='Itens Personalizados da Estimativa de Complexidade'
            ),
        ),
    ]
