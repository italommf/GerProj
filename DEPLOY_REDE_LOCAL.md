# Deploy em rede local (localhost / IP da máquina)

Rodar o BWAproj em um servidor local para acesso pela **rede local**: no próprio PC por **http://localhost:8000** ou de outros dispositivos por **http://IP-DO-SERVIDOR:8000** (ex: http://192.168.0.10:8000).

Sem domínio externo por enquanto; uso de domínio (ex: bwatech.com.br) fica para depois.

---

## 1. Build do frontend

Na pasta do frontend, gere o build (o app usará a mesma origem para API e WebSocket, então não precisa de variáveis de ambiente):

```bash
cd frontend
npm ci
npm run build
```

Isso gera a pasta `frontend/dist`.

---

## 2. Backend (Django + Daphne)

Na pasta do backend:

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
```

Configure o `.env` (pode copiar de `.env.example`). Para rede local, o padrão já permite acesso:

- Para **outros PCs na rede** usarem pelo IP (ex: 192.168.0.10), no `.env`:

```env
ALLOWED_HOSTS=localhost,127.0.0.1,192.168.0.10
CORS_ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000,http://192.168.0.10:8000
CSRF_TRUSTED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000,http://192.168.0.10:8000
```

Troque `192.168.0.10` pelo IP real da máquina onde o servidor está rodando.

Se for usar **só no mesmo PC** (localhost), pode deixar os valores padrão (ou só localhost).

Depois:

```bash
python manage.py migrate
python manage.py createsuperuser
```

---

## 3. Subir o servidor

Com o frontend já buildado (`frontend/dist` existindo), suba o Django com **Daphne** (para API + WebSocket) escutando em todas as interfaces (`0.0.0.0`) para aceitar conexões da rede:

```bash
cd backend
# Com o venv ativado
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

- **Só neste PC:** abra o navegador em **http://localhost:8000**
- **De outro PC/celular na rede:** use **http://IP-DO-SERVIDOR:8000** (ex: http://192.168.0.10:8000)

O mesmo endereço serve a interface (SPA) e a API; não precisa de CORS entre front e back quando acessa pelo mesmo host/porta.

---

## 4. Resumo

| Onde acessa | URL |
|-------------|-----|
| No próprio PC | http://localhost:8000 |
| Outro dispositivo na rede | http://192.168.0.10:8000 (troque pelo IP do servidor) |

---

## 5. Dicas

- **IP do servidor:** no PC onde o Daphne está rodando, use `ipconfig` (Windows) ou `ip addr` (Linux) para ver o IP na rede (ex: 192.168.0.10).
- **Firewall:** se outro PC não conseguir acessar, libere a porta **8000** no firewall do Windows (ou do Linux) para conexões de entrada.
- **Banco:** para produção local é melhor usar PostgreSQL (`USE_POSTGRES=True` no `.env`). SQLite também funciona para teste.
- **Domínio depois:** quando for usar um domínio (ex: bwatech.com.br), siga o **DEPLOY_LOCAL.md** para DNS, Nginx e HTTPS.
