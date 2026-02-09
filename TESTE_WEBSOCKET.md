# Guia de Teste - Notificações em Tempo Real

## Checklist de Verificação

### 1. Backend está rodando?
- Verifique se o Daphne está rodando na porta 8000
- O servidor deve estar usando ASGI (não WSGI)

### 2. Frontend está conectado ao WebSocket?
- Abra o Console do navegador (F12)
- Procure por mensagens como:
  - `[WebSocket] Tentando conectar...`
  - `[WebSocket] Conectado com sucesso`
- Se não aparecer, verifique:
  - Token de autenticação está no localStorage?
  - URL do WebSocket está correta?

### 3. Testar Notificação em Tempo Real

Execute no terminal do backend:
```bash
python test_realtime_notification.py
```

### 4. O que verificar no Console do Navegador

Quando a notificação for enviada, você deve ver:
```
[WebSocket] Mensagem recebida: notification
[WebSocket] Nova notificação recebida: {id: "...", titulo: "..."}
[NotificationContext] Nova notificação recebida via WebSocket: ...
[NotificationContext] Contador de não lidas atualizado: X
```

### 5. Problemas Comuns

#### WebSocket não conecta
- Verifique se o token está correto no localStorage
- Verifique se a URL do WebSocket está correta (ws://127.0.0.1:8000/ws/notifications/)
- Verifique os logs do backend para erros de autenticação

#### Notificação não aparece
- Verifique se o WebSocket está conectado (logs no console)
- Verifique se a notificação foi criada no banco de dados
- Verifique se o usuário está no grupo correto (user_{id})

#### Notificação aparece duplicada
- Isso pode acontecer se você atualizar a página enquanto recebe
- O código já tem proteção contra duplicatas

### 6. Logs do Backend

No terminal do backend, você deve ver:
```
INFO: WebSocket conectado para usuario italo (ID: 12)
INFO: Notificacao enviada via WebSocket para usuario 12: Teste de Notificacao em Tempo Real
INFO: Enviando notificacao via WebSocket para usuario 12: Teste de Notificacao em Tempo Real
```

### 7. Testar com Dados Reais

Para criar notificações reais (cards, sprints, etc.):
```bash
python create_test_notifications.py
```

Isso criará dados reais no banco e disparará os signals automaticamente.
