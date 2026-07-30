BEGIN;

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS cartao_fidelidade_auto BOOLEAN NOT NULL DEFAULT true;

COMMIT;
