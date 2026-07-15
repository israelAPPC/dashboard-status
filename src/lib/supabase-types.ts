export type Status = "em-aberto" | "parado" | "em-desenvolvimento" | "em-teste" | "finalizado";

export type TipoDemanda = "erro" | "melhoria";

export type UserRole = "admin" | "externo";

export type Projeto = {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  ordem: number;
  created_at: string;
};

export type Categoria = {
  id: string;
  projeto_id: string;
  nome: string;
  slug: string;
  ordem: number;
  created_at: string;
};

export type Card = {
  id: string;
  categoria_id: string;
  numero_demanda: number;
  titulo: string;
  descricao: string | null;
  status: Status;
  tipo: TipoDemanda | null;
  autor_id: string | null;
  autor_nome: string | null;
  ordem: number;
  created_at: string;
  updated_at: string;
};

export type Iteracao = {
  id: string;
  card_id: string;
  corpo: string;
  data: string;
  created_at: string;
};

export type Anexo = {
  id: string;
  card_id: string | null;
  iteracao_id: string | null;
  url: string;
  nome: string | null;
  created_at: string;
};

export type Versao = {
  id: string;
  projeto_id: string;
  numero: string;
  descricao: string | null;
  ordem: number;
  created_at: string;
};

export type Funcionalidade = {
  id: string;
  versao_id: string;
  nome: string;
  descricao: string | null;
  novidade: boolean;
  ordem: number;
  created_at: string;
};

export type FuncionalidadeImagem = {
  id: string;
  funcionalidade_id: string;
  url: string;
  nome: string | null;
  ordem: number;
  created_at: string;
};
