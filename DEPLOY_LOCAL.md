# Deploy em servidor local com domínio próprio (ex: BWATech.com.br)

Este guia explica como colocar o BWAproj no ar em um **servidor na sua rede** (PC ou servidor em casa/escritório) e acessar pelo domínio que você comprou (ex: **bwatech.com.br**).

## Visão geral

1. **Domínio** → aponta para o IP público da sua internet (ou para um subdomínio).
2. **Roteador** → encaminha as portas 80/443 para o PC onde o app está rodando.
3. **Servidor local** → Nginx recebe as requisições em HTTPS e repassa para o backend e para os arquivos do frontend.

## Pré-requisitos

- Domínio próprio (ex: bwatech.com.br).
- Um PC/servidor na rede ligado 24/7 (ou sempre que quiser o sistema no ar).
- Acesso ao painel do roteador para configurar encaminhamento de portas (port forwarding).

---

## 1. Apontar o domínio para sua internet

Você precisa que **bwatech.com.br** (ou **app.bwatech.com.br**) aponte para o **IP público** da sua conexão.

### Opção A: IP fixo (recomendado se sua operadora oferecer)

No painel do **registro.br** (ou onde o domínio está):

- Crie um registro **A**:
  - Nome: `@` (para bwatech.com.br) ou `app` (para app.bwatech.com.br).
  - Valor: **IP público** do seu link (ex: 200.150.100.50).

Para saber seu IP público: acesse [https://meuip.com.br](https://meuip.com.br) pelo mesmo link que o servidor usa.

### Opção B: IP dinâmico (Dynamic DNS)

Se seu IP muda de tempos em tempos:

1. Use um serviço de **Dynamic DNS** (No-IP, DuckDNS, Cloudflare, etc.).
2. Instale um cliente no PC/servidor para atualizar o DNS quando o IP mudar.
3. No registro do domínio, crie um **CNAME** apontando para o hostname que o DDNS fornece (ex: `meuservidor.ddns.net`).

Exemplo com **DuckDNS**: criar um subdomínio gratuito e no seu roteador ou no PC rodar um script que atualiza o IP no DuckDNS.

---

## 2. Encaminhamento de portas no roteador

O roteador precisa mandar tráfego das portas **80** (HTTP) e **443** (HTTPS) para o PC do servidor.

1. Acesse o roteador (ex: 192.168.0.1 ou 192.168.1.1).
2. Procure por **Port Forwarding**, **Encaminhamento de portas** ou **Virtual Server**.
3. Crie duas regras:

| Porta externa | Porta interna | IP interno (PC do servidor) | Protocolo |
|---------------|---------------|-----------------------------|-----------|
| 80            | 80            | ex: 192.168.0.10            | TCP       |
| 443           | 443           | ex: 192.168.0.10            | TCP       |

O **IP interno** deve ser o IP fixo do PC na sua rede (configure IP fixo no PC ou reserva de DHCP no roteador).

---

## 3. Servidor local (Windows ou Linux)

No PC que vai hospedar o app (ex: 192.168.0.10):

### 3.1 Instalar

- **Python 3.11+** (backend Django).
- **Node.js 18+** (para build do frontend).
- **PostgreSQL** (recomendado) ou usar SQLite para teste.
- **Nginx** (ou Caddy) como proxy reverso e para servir HTTPS.

### 3.2 Backend (Django)

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Linux:   source venv/bin/activate
pip install -r requirements.txt
```

Crie um arquivo `.env` na pasta `backend/` (use o `backend/.env.example` como base):

```env
USE_POSTGRES=True
DB_NAME=bwaproj_db
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=uma-chave-secreta-longa-e-aleatoria
DEBUG=False
ALLOWED_HOSTS=bwatech.com.br,www.bwatech.com.br,app.bwatech.com.br
```

Ajuste `backend/config/settings.py` para ler `ALLOWED_HOSTS` e CORS do ambiente em produção (veja seção 5 abaixo).

Depois:

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

Para rodar em produção com WebSockets use **Daphne** ou **Gunicorn + Daphne** (Daphne para o canal `/ws/`). Exemplo com Daphne na porta 8000:

```bash
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

### 3.3 Frontend (React/Vite)

O frontend deve chamar a API e o WebSocket usando o **mesmo domínio** (ex: bwatech.com.br), assim não precisa de CORS para a API em produção.

1. Crie `frontend/.env.production`:

```env
VITE_API_URL=https://bwatech.com.br/api
VITE_WS_URL=wss://bwatech.com.br
```

(Se usar subdomínio, ex: `https://app.bwatech.com.br/api` e `wss://app.bwatech.com.br`.)

2. Build:

```bash
cd frontend
npm ci
npm run build
```

A pasta `frontend/dist` será usada pelo Nginx.

---

## 4. Nginx como proxy reverso e HTTPS

O Nginx escuta em 80/443, usa **HTTPS** (certificado) e:

- Serve os arquivos estáticos do frontend (`frontend/dist`).
- Encaminha `/api` e `/ws` para o backend (Daphne na porta 8000).
- Encaminha `/media` e `/static` para o Django (ou para as pastas estáticas).

### Exemplo de configuração (Nginx)

Arquivo: `/etc/nginx/sites-available/bwaproj` (Linux) ou equivalente no Windows.

```nginx
# Redirecionar HTTP para HTTPS
server {
    listen 80;
    server_name bwatech.com.br www.bwatech.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bwatech.com.br www.bwatech.com.br;

    # Certificado SSL (Let's Encrypt com certbot)
    ssl_certificate     /etc/letsencrypt/live/bwatech.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bwatech.com.br/privkey.pem;

    # Frontend (arquivos estáticos do build)
    root /var/www/bwaproj/frontend/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Django
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket (notificações)
    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Mídia e estáticos do Django
    location /media/ {
        alias /var/www/bwaproj/backend/media/;
    }
    location /static/ {
        alias /var/www/bwaproj/backend/static/;
    }
}
```

Ajuste os caminhos (`/var/www/bwaproj/...`) para onde o projeto está no seu servidor.

### Obter certificado SSL (Let's Encrypt)

No servidor (Linux), com Nginx instalado:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d bwatech.com.br -d www.bwatech.com.br
```

Siga as instruções (e-mail, aceitar termos). O Certbot configura o Nginx para usar os certificados. Renovação automática: `sudo certbot renew --dry-run`.

---

## 5. Ajustes no projeto para produção

### Backend: ALLOWED_HOSTS e CORS

No `backend/config/settings.py`, use variáveis de ambiente em produção:

```python
import os
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# CORS: em produção, permitir apenas o domínio
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173').split(',')
# Exemplo .env: CORS_ALLOWED_ORIGINS=https://bwatech.com.br,https://www.bwatech.com.br
```

Inclua também em `CSRF_TRUSTED_ORIGINS` as origens HTTPS do seu domínio.

### Frontend: URLs da API e WebSocket

O frontend já está preparado para usar:

- `VITE_API_URL` → base da API (ex: `https://bwatech.com.br/api`).
- `VITE_WS_URL` → base do WebSocket (ex: `wss://bwatech.com.br`).

Assim, ao acessar **https://bwatech.com.br**, o app usa o mesmo domínio para API e WS, sem problemas de CORS em produção.

---

## 6. Resumo do fluxo

1. Usuário acessa **https://bwatech.com.br** → DNS resolve para seu IP público.
2. Roteador encaminha 443 → PC do servidor (Nginx).
3. Nginx serve o frontend (HTML/JS/CSS) e faz proxy de `/api/` e `/ws/` para o Django (Daphne na porta 8000).
4. O navegador carrega o React e chama a API em `https://bwatech.com.br/api` e o WebSocket em `wss://bwatech.com.br/ws/`.

---

## 7. Manter o backend rodando (opcional)

No Linux, use **systemd** para subir o Daphne ao reiniciar o servidor. Exemplo de serviço:

Arquivo `/etc/systemd/system/bwaproj-daphne.service`:

```ini
[Unit]
Description=BWAproj Daphne ASGI
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/bwaproj/backend
Environment="PATH=/var/www/bwaproj/backend/venv/bin"
ExecStart=/var/www/bwaproj/backend/venv/bin/daphne -b 127.0.0.1 -p 8000 config.asgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```

Depois:

```bash
sudo systemctl daemon-reload
sudo systemctl enable bwaproj-daphne
sudo systemctl start bwaproj-daphne
```

---

## 8. Observações

- **Segurança**: use `DEBUG=False`, `SECRET_KEY` forte e senhas fortes no banco.
- **Firewall**: no PC do servidor, libere apenas o que for necessário (Nginx já escuta 80/443).
- **Backup**: faça backup regular do banco (PostgreSQL) e da pasta `media/`.
- Se preferir não expor sua rede, use um **VPS** (ex: DigitalOcean, Contabo, Locaweb) e aponte o domínio para o IP do VPS; o resto do guia (Nginx, Daphne, build do frontend) é o mesmo.

Se quiser, na próxima etapa podemos gerar um exemplo de `backend/.env.example` e um script de deploy (build + collectstatic + restart do serviço).
