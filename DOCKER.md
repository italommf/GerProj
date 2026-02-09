# Rodar o BWAproj com Docker Compose

Sobe **banco (PostgreSQL)**, **backend (Django + Daphne)** e o **frontend (SPA)** em um único comando. O Daphne atende HTTP, WebSocket (notificações) e a interface.

## Pré-requisito

- [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/install/) instalados.

## Subir tudo

**Opção 1 – Script completo**

- **Windows:** na raiz do projeto, execute `deploy.bat`
- **Linux/macOS:** na raiz do projeto, execute:
  ```bash
  chmod +x deploy.sh
  ./deploy.sh
  ```
  Ou: `bash deploy.sh`

O script: verifica o Docker, sobe os containers, aguarda o backend, cria o superadmin (se ainda não existir), mostra o status e oferece abrir o navegador. Para outro usuário/senha: no Windows use `set ADMIN_USERNAME=...` etc.; no Linux use `export ADMIN_USERNAME=... ADMIN_PASSWORD=... ADMIN_EMAIL=...` antes de rodar o script.

**Opção 2 – Manual**

```bash
docker compose up -d
```

- **Acesso:** abra **http://localhost:8000**
- Logs: `docker compose logs -f backend`

## Criar usuário admin

Após a primeira subida, crie um superusuário para acessar o sistema e o `/admin`:

```bash
docker compose exec backend python manage.py createsuperuser
```

## Parar

```bash
docker compose down
```

Dados do banco e arquivos em `media/` ficam em volumes e são mantidos entre `down` e um novo `up`.

## Variáveis de ambiente (opcional)

Copie `.env.docker.example` para `.env` e altere o que precisar (senha do banco, `SECRET_KEY`, etc.). Se não criar `.env`, o `docker-compose.yml` usa os valores padrão.

**Acesso na rede (Linux):** ao rodar `./deploy.sh` em um Linux, o script detecta o IP da máquina e já configura `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` e `CSRF_TRUSTED_ORIGINS` para aceitar acesso por esse IP. Use no navegador (de qualquer PC da rede): **http://IP_DA_MAQUINA:8000** (ou a porta exibida no resumo). Se outros PCs não conseguirem acessar, libere a porta no firewall: `sudo ufw allow 8000/tcp` (ou a porta usada) e `sudo ufw reload`.

Para configurar manualmente (ou no Windows), defina no `.env` (substitua pelo IP da máquina, ex: 192.168.0.10):

- `ALLOWED_HOSTS=localhost,127.0.0.1,192.168.0.10`
- `CORS_ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000,http://192.168.0.10:8000`
- `CSRF_TRUSTED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000,http://192.168.0.10:8000`

## O que cada serviço faz

| Serviço   | Descrição |
|-----------|-----------|
| **db**    | PostgreSQL 16 – banco de dados. |
| **backend** | Imagem única que: faz o **build do frontend** (Vite/React), roda **Django** e **Daphne** (ASGI). Daphne serve a API (`/api/`), WebSocket (`/ws/`) e a SPA (raiz e rotas do React). |

Não é necessário Nginx nem outro container para o front: o próprio Django serve os arquivos estáticos do build (ver `serve_spa` em `backend/config/views.py`).
