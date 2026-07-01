BEGIN;

CREATE TABLE IF NOT EXISTS public.cartao_fidelidade_registros (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  data_atendimento DATE NOT NULL,
  observacao TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cpf VARCHAR(20),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_cartao_fidelidade_registros_cliente_id
  ON public.cartao_fidelidade_registros (cliente_id, data_atendimento DESC);

COMMIT;