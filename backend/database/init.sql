-- BarberFlow — Schema completo para PostgreSQL (Neon)
-- Executar uma única vez no banco do Neon (SQL Editor / psql)

BEGIN;

CREATE TABLE IF NOT EXISTS public.usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.clientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(30),
  email VARCHAR(255),
  cpf VARCHAR(20),
  endereco VARCHAR(255),
  cartao_fidelidade_ativo BOOLEAN NOT NULL DEFAULT FALSE,
  cartao_fidelidade_carimbos INTEGER NOT NULL DEFAULT 0,
  cartao_fidelidade_meta INTEGER NOT NULL DEFAULT 10,
  cartao_fidelidade_usados INTEGER NOT NULL DEFAULT 0,
  cartao_fidelidade_auto BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.barbeiros (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(30),
  especialidade VARCHAR(255),
  foto TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  dias_atendimento JSONB NOT NULL DEFAULT '[]'::jsonb,
  horario_inicio TIME,
  horario_fim TIME,
  horario_intervalo_inicio TIME,
  horario_intervalo_fim TIME,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.servicos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  preco NUMERIC(10,2) NOT NULL,
  duracao_minutos INTEGER NOT NULL DEFAULT 30,
  descricao TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS public.agendamentos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES public.clientes(id),
  barbeiro_id INTEGER REFERENCES public.barbeiros(id),
  data DATE NOT NULL,
  horario TIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'agendado',
  desconto_valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_final NUMERIC(10,2)
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_barbeiro_data_horario
  ON public.agendamentos (barbeiro_id, data, horario);

CREATE TABLE IF NOT EXISTS public.agendamento_servicos (
  id SERIAL PRIMARY KEY,
  agendamento_id INTEGER NOT NULL REFERENCES public.agendamentos(id) ON DELETE CASCADE,
  servico_id INTEGER NOT NULL REFERENCES public.servicos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.cartao_fidelidade_registros (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  data_atendimento DATE NOT NULL,
  observacao TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cartao_fidelidade_registros_cliente_id
  ON public.cartao_fidelidade_registros (cliente_id, data_atendimento DESC);

CREATE TABLE IF NOT EXISTS public.config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL
);

COMMIT;
