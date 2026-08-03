# BarberFlow — Guia de Deploy

Infraestrutura gratuita usada:

| Camada | Serviço | URL |
| ------ | ------- | --- |
| Frontend | Vercel | https://barberflow-two-beta.vercel.app |
| Backend | Oracle Cloud Free VM (Always Free) | https://barberflow.duckdns.org |
| Banco | Neon (PostgreSQL, São Paulo) | connection string da Neon |

Login de teste: `rodxlr@gmail.com` / `123456`

---

## Visão geral

- O frontend (Vite/React) roda na Vercel e chama a API do backend via HTTPS.
- O backend (Express) roda num container Docker numa VM gratuita da Oracle, sempre ligada (sem cold start).
- O Caddy na VM faz o proxy reverso `https://barberflow.duckdns.org → localhost:3000` e cuida do certificado HTTPS automático (Let's Encrypt).
- O DuckDNS aponta `barberflow.duckdns.org` para o IP público da VM e atualiza o IP automaticamente a cada 5 minutos.

---

## 1. Banco de dados (Neon)

- Criar schema (rodar uma vez): conteúdo de `backend/database/init.sql` no SQL Editor da Neon.
- A connection string (`DATABASE_URL`) fica no dashboard do projeto Neon (aba Connect → Password).

## 2. Backend (Oracle Cloud Free VM)

### Credenciais da VM

- IP público: `168.138.138.52`
- Usuário SSH: `ubuntu`
- Chave: `C:\Users\Rodrigo\.ssh\barberflow_oci` (no PC)

### Conectar

```
ssh -i $env:USERPROFILE\.ssh\barberflow_oci ubuntu@168.138.138.52
```

### Primeira instalação (só uma vez)

```bash
sudo apt update -y
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER
# sair e entrar de novo para valer o grupo docker
```

### Subir/atualizar o backend

```bash
cd /srv/barberflow
git pull
cd backend
docker build -t barberflow-api .
docker rm -f barberflow-api
docker run -d --name barberflow-api --restart always -p 3000:3000 \
  -e DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx.sa-east-1.aws.neon.tech/neondb?sslmode=require" \
  -e JWT_SECRET="SEU-SEGREDO-AQUI" \
  barberflow-api
```

- `DATABASE_URL`: connection string da Neon (com password).
- `JWT_SECRET`: pode gerar com `openssl rand -hex 32`. Se mudar, todos os tokens antigos são invalidados (não tem problema, só pede login de novo).

### Caddy (proxy HTTPS)

Arquivo `/etc/caddy/Caddyfile`:

```
barberflow.duckdns.org {
	reverse_proxy localhost:3000
}
```

Recarregar após editar: `sudo systemctl reload caddy`.

### Firewall da VM

A Oracle tem regras iptables que bloqueiam tudo menos SSH. Já aplicadas e salvas:

```bash
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

### Firewall do OCI (console Oracle)

A subnet precisa liberar as portas 22, 80, 443 e 3000 (Security Lists → Ingress Rules).

### Atualização automática de IP (DuckDNS)

Cron a cada 5 min (já configurado):

```
*/5 * * * * curl -s https://www.duckdns.org/update?domains=barberflow\&token=TOKEN\&ip=
```

## 3. Frontend (Vercel)

- Root directory: `frontend`
- Build: `npm run build` · Output: `dist` (detectado automaticamente pelo Vite)
- Variável de ambiente: `VITE_API_URL = https://barberflow.duckdns.org`
- Redeploy após mudar variável: Deployments → ⋮ → Redeploy

---

## Notas

- CORS do backend: aberto (`*`) — ok para uso pessoal. Para restringir, usar a variável `CORS_ORIGIN` com o domínio da Vercel.
- As variáveis do backend vêm de `DATABASE_URL` (Neon) ou, na ausência dela, `DB_USER/DB_HOST/DB_NAME/DB_PASSWORD/DB_PORT` (Postgres local).
- Segredos (senhas, tokens) **não** devem ser commitados. `backend/.env` já está no `.gitignore`.
