# Rodar o BWAproj com Docker Compose

Sobe **banco (PostgreSQL)**, **backend (Django + Daphne)** e o **frontend (SPA)** em um único comando. O Daphne atende HTTP, WebSocket (notificações) e a interface.

## Pré-requisito

- [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/install/) instalados.

## Subir tudo

**Opção 1 – Script completo (Windows)**  
Na raiz do projeto, execute:

```batch
deploy.bat
```

O script: verifica o Docker, sobe os containers, aguarda o backend, cria um usuário admin (se ainda não existir), mostra o status e oferece abrir o navegador. Para usar outro usuário/senha de admin, defina antes: `set ADMIN_USERNAME=meuadmin`, `set ADMIN_PASSWORD=MinhaSenha`, `set ADMIN_EMAIL=admin@email.com`.

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

Para outros PCs na rede acessarem pelo IP da máquina (ex: 192.168.0.10), defina no `.env`:

- `ALLOWED_HOSTS=localhost,127.0.0.1,192.168.0.10`
- `CORS_ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000,http://192.168.0.10:8000`
- `CSRF_TRUSTED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000,http://192.168.0.10:8000`

## O que cada serviço faz

| Serviço   | Descrição |
|-----------|-----------|
| **db**    | PostgreSQL 16 – banco de dados. |
| **backend** | Imagem única que: faz o **build do frontend** (Vite/React), roda **Django** e **Daphne** (ASGI). Daphne serve a API (`/api/`), WebSocket (`/ws/`) e a SPA (raiz e rotas do React). |

Não é necessário Nginx nem outro container para o front: o próprio Django serve os arquivos estáticos do build (ver `serve_spa` em `backend/config/views.py`).
