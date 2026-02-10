# Generated migration for Team.ordem

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('teams', '0006_update_team_types'),
    ]

    operations = [
        migrations.AddField(
            model_name='team',
            name='ordem',
            field=models.IntegerField(default=0, verbose_name='Ordem (camada no canvas)'),
        ),
    ]
