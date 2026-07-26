import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const registerSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const clienteSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  cpf: z.string().optional(),
  cartao_fidelidade_ativo: z.boolean(),
  cartao_fidelidade_carimbos: z.coerce.number().min(0, "Valor inválido"),
  cartao_fidelidade_meta: z.coerce.number().min(1, "Meta deve ser no mínimo 1"),
});

export const servicoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  preco: z.coerce.number().min(0.01, "Preço deve ser maior que zero"),
  duracao_minutos: z.coerce.number().min(1, "Duração deve ser no mínimo 1 minuto"),
});

export const barbeiroSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  telefone: z.string().optional(),
  especialidade: z.string().optional(),
  foto: z.string().url("URL inválida").optional().or(z.literal("")),
  ativo: z.boolean(),
  dias_atendimento: z.array(z.string()).optional(),
  horario_inicio: z.string().optional(),
  horario_fim: z.string().optional(),
  horario_intervalo_inicio: z.string().optional(),
  horario_intervalo_fim: z.string().optional(),
});

export const agendamentoSchema = z.object({
  cliente_id: z.string().min(1, "Selecione um cliente"),
  barbeiro_id: z.string().optional(),
  servico_ids: z.array(z.string()).min(1, "Selecione pelo menos um serviço"),
  data: z.string().min(1, "Selecione uma data"),
  horario: z.string().min(1, "Selecione um horário"),
  status: z.string(),
  desconto_valor: z.coerce.number().min(0, "Valor inválido").default(0),
  valor_final: z.coerce.number().optional(),
});
