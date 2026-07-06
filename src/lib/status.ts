import type { Status } from "./content";

export const STATUS_LABEL: Record<Status, string> = {
  parado: "Paralisado",
  "em-desenvolvimento": "Em desenvolvimento",
  finalizado: "Finalizado",
};

export const STATUS_CLASSES: Record<Status, string> = {
  parado: "bg-red-50 text-red-600 ring-1 ring-red-100",
  "em-desenvolvimento": "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
  finalizado: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
};

export const STATUS_DOT: Record<Status, string> = {
  parado: "bg-red-500",
  "em-desenvolvimento": "bg-amber-500",
  finalizado: "bg-emerald-500",
};
