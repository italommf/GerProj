from django.contrib import admin
from .models import GeekDayDraw


@admin.register(GeekDayDraw)
class GeekDayDrawAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'sorteado_por', 'data_sorteio', 'marcado_manual']
    list_filter = ['marcado_manual', 'data_sorteio']
    search_fields = ['usuario__username', 'usuario__first_name', 'usuario__last_name']
    readonly_fields = ['data_sorteio']
