from django.db import models
from django.conf import settings


class GeekDayDraw(models.Model):
    """Modelo para rastrear sorteios do Geek Day"""
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='geekday_draws',
        verbose_name='Usuário Sorteado'
    )
    sorteado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='geekday_draws_made',
        null=True,
        blank=True,
        verbose_name='Sorteado Por'
    )
    data_sorteio = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Data do Sorteio'
    )
    marcado_manual = models.BooleanField(
        default=False,
        verbose_name='Marcado Manualmente',
        help_text='Indica se foi marcado manualmente como sorteado'
    )
    observacoes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observações'
    )

    class Meta:
        verbose_name = 'Sorteio Geek Day'
        verbose_name_plural = 'Sorteios Geek Day'
        ordering = ['-data_sorteio']

    def __str__(self):
        return f"{self.usuario.username} - {self.data_sorteio.strftime('%d/%m/%Y %H:%M')}"
