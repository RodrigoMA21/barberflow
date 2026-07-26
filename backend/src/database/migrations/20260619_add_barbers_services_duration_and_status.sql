BEGIN;

ALTER TABLE public.servicos
  ADD COLUMN IF NOT EXISTS duracao_minutos INTEGER NOT NULL DEFAULT 30;

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

ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS barbeiro_id INTEGER REFERENCES public.barbeiros(id),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'agendado';

CREATE INDEX IF NOT EXISTS idx_agendamentos_barbeiro_data_horario
  ON public.agendamentos (barbeiro_id, data, horario);

COMMIT;
