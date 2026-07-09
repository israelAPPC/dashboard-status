import type { Status, TipoDemanda } from "./supabase-types";

export const STATUS_LABEL: Record<Status, string> = {
  "em-aberto": "Em aberto/análise",
  parado: "Paralisado",
  "em-desenvolvimento": "Em desenvolvimento",
  "em-teste": "Em testes",
  finalizado: "Finalizado",
};

export const STATUS_CLASSES: Record<Status, string> = {
  "em-aberto": "bg-slate-50 text-slate-500 ring-1 ring-slate-100",
  parado: "bg-red-50 text-red-600 ring-1 ring-red-100",
  "em-desenvolvimento": "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
  "em-teste": "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100",
  finalizado: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
};

export const STATUS_DOT: Record<Status, string> = {
  "em-aberto": "bg-slate-400",
  parado: "bg-red-500",
  "em-desenvolvimento": "bg-amber-500",
  "em-teste": "bg-indigo-500",
  finalizado: "bg-emerald-500",
};

export const TIPO_LABEL: Record<TipoDemanda, string> = {
  erro: "Erro",
  melhoria: "Melhoria",
};

export const TIPO_CLASSES: Record<TipoDemanda, string> = {
  erro: "bg-red-50 text-red-600 ring-1 ring-red-100",
  melhoria: "bg-sky-50 text-sky-600 ring-1 ring-sky-100",
};
