from django.db import models
from django.conf import settings
from apps.projects.models import Project


class TimelineEventType(models.TextChoices):
    CRIACAO = 'criacao', 'Criação'
    AVALIACAO = 'avaliacao', 'Avaliação'
    ATRIBUICAO_GERENTE = 'atribuicao_gerente', 'Atribuição de Gerente'
    INICIO_DESENVOLVIMENTO = 'inicio_desenvolvimento', 'Início do Desenvolvimento'
    EVENTO = 'evento', 'Evento'
    PENDENCIA = 'pendencia', 'Pendência'
    PRIORIDADE = 'prioridade', 'Prioridade'
    TAG = 'tag', 'Tag'
    ENTREGA = 'entrega', 'Entrega'
    HOMOLOGACAO = 'homologacao', 'Homologação'
    ADIAMENTO_SOLICITADO = 'adiamento_solicitado', 'Adiamento Solicitado'
    ADIAMENTO_APROVADO = 'adiamento_aprovado', 'Adiamento Aprovado'
    ADIAMENTO_REJEITADO = 'adiamento_rejeitado', 'Adiamento Rejeitado'


class TimelineEntry(models.Model):
    projeto = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='timeline_entries',
        verbose_name='Projeto'
    )
    tipo_evento = models.CharField(
        max_length=30,
        choices=TimelineEventType.choices,
        verbose_name='Tipo de Evento'
    )
    data = models.DateTimeField(verbose_name='Data do Evento')
    descricao = models.TextField(verbose_name='Descrição')
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='timeline_entries',
        null=True,
        blank=True,
        verbose_name='Usuário'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Data de Criação')

    class Meta:
        verbose_name = 'Entrada da Timeline'
        verbose_name_plural = 'Entradas da Timeline'
        ordering = ['projeto', 'data']

    def __str__(self):
        return f"{self.projeto.nome} - {self.get_tipo_evento_display()} ({self.data})"
