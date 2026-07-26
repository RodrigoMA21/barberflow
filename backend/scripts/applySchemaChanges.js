const pool = require("../src/database/db");

async function main() {
  const statements = [
    `ALTER TABLE public.servicos ADD COLUMN IF NOT EXISTS duracao_minutos INTEGER NOT NULL DEFAULT 30`,
    `ALTER TABLE public.agendamentos
      ADD COLUMN IF NOT EXISTS desconto_valor NUMERIC(10,2) NOT NULL DEFAULT 0`,
    `ALTER TABLE public.agendamentos
      ADD COLUMN IF NOT EXISTS valor_final NUMERIC(10,2)`,
    `CREATE TABLE IF NOT EXISTS public.cartao_fidelidade_registros (
      id SERIAL PRIMARY KEY,
      cliente_id INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
      data_atendimento DATE NOT NULL,
      observacao TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
    `ALTER TABLE public.clientes
      ADD COLUMN IF NOT EXISTS email VARCHAR(255)`,
    `ALTER TABLE public.clientes
      ADD COLUMN IF NOT EXISTS cpf VARCHAR(20)`,
    `ALTER TABLE public.clientes
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW()`,
    `CREATE INDEX IF NOT EXISTS idx_cartao_fidelidade_registros_cliente_id
      ON public.cartao_fidelidade_registros (cliente_id, data_atendimento DESC)`,
    `CREATE TABLE IF NOT EXISTS public.barbeiros (
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
    )`,
    `ALTER TABLE public.barbeiros
      ADD COLUMN IF NOT EXISTS dias_atendimento JSONB NOT NULL DEFAULT '[]'::jsonb`,
    `ALTER TABLE public.barbeiros
      ADD COLUMN IF NOT EXISTS horario_inicio TIME`,
    `ALTER TABLE public.barbeiros
      ADD COLUMN IF NOT EXISTS horario_fim TIME`,
    `ALTER TABLE public.barbeiros
      ADD COLUMN IF NOT EXISTS horario_intervalo_inicio TIME`,
    `ALTER TABLE public.barbeiros
      ADD COLUMN IF NOT EXISTS horario_intervalo_fim TIME`,
    `ALTER TABLE public.agendamentos
      ADD COLUMN IF NOT EXISTS barbeiro_id INTEGER REFERENCES public.barbeiros(id)`,
    `ALTER TABLE public.agendamentos
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'agendado'`,
    `ALTER TABLE public.clientes
      ADD COLUMN IF NOT EXISTS cartao_fidelidade_ativo BOOLEAN NOT NULL DEFAULT FALSE`,
    `ALTER TABLE public.clientes
      ADD COLUMN IF NOT EXISTS cartao_fidelidade_carimbos INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE public.clientes
      ADD COLUMN IF NOT EXISTS cartao_fidelidade_meta INTEGER NOT NULL DEFAULT 10`,
    `CREATE INDEX IF NOT EXISTS idx_agendamentos_barbeiro_data_horario
      ON public.agendamentos (barbeiro_id, data, horario)`
  ];

  for (const statement of statements) {
    await pool.query(statement);
  }

  console.log("Schema applied successfully.");
  await pool.end();
}

main().catch(async (error) => {
  console.error("Schema apply failed:", error);
  await pool.end().catch(() => {});
  process.exit(1);
});
