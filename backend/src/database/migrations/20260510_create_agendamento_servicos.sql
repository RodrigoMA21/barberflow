-- Migration: criar tabela agendamento_servicos e migrar dados existentes
BEGIN;

CREATE TABLE IF NOT EXISTS public.agendamento_servicos (
  id SERIAL PRIMARY KEY,
  agendamento_id INTEGER NOT NULL REFERENCES public.agendamentos(id) ON DELETE CASCADE,
  servico_id INTEGER NOT NULL REFERENCES public.servicos(id) ON DELETE CASCADE
);

-- Migrar dados existentes de agendamentos.servico_id (se houver)
INSERT INTO public.agendamento_servicos (agendamento_id, servico_id)
SELECT id AS agendamento_id, servico_id
FROM public.agendamentos
WHERE servico_id IS NOT NULL;

-- Opcional: remover a coluna servico_id da tabela agendamentos (após migração)
ALTER TABLE public.agendamentos DROP COLUMN IF EXISTS servico_id;

COMMIT;
