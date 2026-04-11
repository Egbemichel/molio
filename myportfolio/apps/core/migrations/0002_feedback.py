"""
Migration to add Feedback model for storing user feedback submissions
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Feedback',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rating', models.IntegerField(choices=[
                    (1, '1 Star'),
                    (2, '2 Stars'),
                    (3, '3 Stars'),
                    (4, '4 Stars'),
                    (5, '5 Stars')
                ])),
                ('message', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name_plural': 'Feedback',
                'ordering': ['-created_at'],
            },
        ),
    ]
