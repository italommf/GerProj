# Generated manually to fix NOT NULL constraint

from django.db import migrations, models

def set_default_complexidade_values(apps, schema_editor):
    """Definir valores padrão para campos de complexidade em cards existentes"""
    Card = apps.get_model('projects', 'Card')
    # Atualizar cards que têm None para []
    Card.objects.filter(complexidade_selected_items__isnull=True).update(complexidade_selected_items=[])
    Card.objects.filter(complexidade_custom_items__isnull=True).update(complexidade_custom_items=[])

class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0012_card_complexidade_custom_items_and_more'),
    ]

    operations = [
        migrations.RunPython(set_default_complexidade_values),
        # Alterar os campos para garantir que tenham default
        migrations.AlterField(
            model_name='card',
            name='complexidade_selected_items',
            field=models.JSONField(
                blank=True,
                default=list,
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
                help_text='Array de objetos com id, label e hours dos itens personalizados criados pelo usuário',
                verbose_name='Itens Personalizados da Estimativa de Complexidade'
            ),
        ),
    ]
