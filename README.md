# 💈 BarberFlow — Sistema de Gestão para Barbearias

<p align="center">

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtoken&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-FF6B6B?style=for-the-badge)

</p>

<p align="center">

<a href="https://www.linkedin.com/in/rodrigo-mayer-alves-a9255675" target="_blank">
<img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" />
</a>

</p>

---

# 📖 Sobre o projeto

BarberFlow é um sistema completo de gestão para barbearias desenvolvido como projeto pessoal para praticar desenvolvimento full stack com React moderno, Node.js e PostgreSQL.

O sistema permite gerenciar clientes, barbeiros, serviços e agendamentos de forma intuitiva, com uma agenda visual, dashboard com indicadores de desempenho e um sistema de cartão fidelidade para clientes.

---

# ✨ Funcionalidades

- **Autenticação** — Login e cadastro com JWT e proteção de rotas
- **Dashboard** — Faturamento do mês/dia/ano, ticket médio, gráficos mensais, serviços mais vendidos, CSV exportável
- **Agenda** — Visualização diária dos agendamentos por barbeiro com design intuitivo
- **Agendamentos** — Criação, edição, cancelamento com validação de conflitos de horário
- **Clientes** — Cadastro completo com busca, edição e exclusão
- **Cartão Fidelidade** — Sistema de carimbos por atendimento com resgate automático
- **Barbeiros** — Cadastro, dias/horários de atendimento, estatísticas individuais
- **Serviços** — Cadastro com preço e duração personalizada
- **Histórico** — Agendamentos passados com paginação e filtros
- **Internacionalização** — Suporte a português e inglês (i18n)
- **Tema Dark/Light** — Alternância entre temas claro e escuro
- **Responsivo** — Interface adaptável para desktop e mobile

---

# 🚀 Tecnologias utilizadas

## Backend

- Node.js
- Express 5
- PostgreSQL
- JWT (jsonwebtoken)
- bcrypt
- dotenv
- cors

## Frontend

- React 19
- Vite 8
- Tailwind CSS 4
- React Router 7
- i18next + react-i18next
- react-hook-form + zod
- Recharts
- IMask + react-imask

## Ferramentas

- Git & GitHub
- VS Code
- Nodemon
- Vitest + Testing Library

---

# 📁 Estrutura do projeto

```text
barberflow/
│
├── backend/
│   ├── src/
│   │   ├── database/     # Conexão com PostgreSQL e migrações
│   │   ├── middlewares/   # Autenticação JWT
│   │   ├── routes/        # Rotas da API (auth, clientes, barbeiros, serviços, agendamentos, dashboard)
│   │   ├── services/      # Regras de negócio (agenda, conflitos, horários)
│   │   └── server.js      # Entry point Express
│   ├── scripts/           # Scripts auxiliares
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis (UI, charts, modais)
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── routes/        # Configuração de rotas protegidas
│   │   ├── theme/         # Contexto de tema dark/light
│   │   ├── App.jsx        # Entry point React
│   │   └── main.jsx       # Renderização
│   ├── dist/              # Build de produção
│   └── package.json
│
├── LICENSE.md
└── README.md
```

---

# 💻 Desenvolvimento local

## Pré-requisitos

- Node.js 18+
- PostgreSQL

## Backend

```bash
git clone https://github.com/RodrigoMA21/barberflow.git
cd barberflow/backend
npm install
cp .env.example .env
# Configure as variáveis de ambiente no .env
npm run dev
```

O servidor iniciará em http://localhost:3000

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse em http://localhost:5173

```bash
# Build para produção
npm run build
```

---

# 📄 Licença

Este projeto possui direitos reservados. Consulte o arquivo [LICENSE.md](./LICENSE.md) para mais informações.

---

# 👨‍💻 Autor

**Rodrigo Mayer Alves**

🌐 Portfólio
https://rodrigomayer.vercel.app/

💼 LinkedIn
https://www.linkedin.com/in/rodrigo-mayer-alves-a9255675

🐙 GitHub
https://github.com/RodrigoMA21
