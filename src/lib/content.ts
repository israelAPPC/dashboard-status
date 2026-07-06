import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type Status = "parado" | "em-desenvolvimento" | "finalizado";

export type Modulo = {
  slug: string;
  nome: string;
};

export type Atualizacao = {
  slug: string;
  titulo: string;
  data: string;
  modulo: string;
  status: Status;
  imagens: string[];
  corpo: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content");
const UPDATES_DIR = path.join(CONTENT_DIR, "updates");

function normalizarData(valor: unknown): string {
  if (valor instanceof Date) {
    return valor.toISOString().slice(0, 10);
  }
  return typeof valor === "string" ? valor : "";
}

function normalizarImagens(data: Record<string, unknown>): string[] {
  if (Array.isArray(data.imagens)) {
    return data.imagens
      .map((item) => (typeof item === "string" ? item : (item as { src?: string })?.src ?? ""))
      .filter(Boolean);
  }
  return typeof data.imagem === "string" && data.imagem ? [data.imagem] : [];
}

export function getModulos(): Modulo[] {
  const file = path.join(CONTENT_DIR, "modules.json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function getAtualizacoes(): Atualizacao[] {
  if (!fs.existsSync(UPDATES_DIR)) return [];

  return fs
    .readdirSync(UPDATES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((filename) => {
      const raw = fs.readFileSync(path.join(UPDATES_DIR, filename), "utf8");
      const { data, content } = matter(raw);
      return {
        slug: filename.replace(/\.md$/, ""),
        titulo: data.titulo ?? "",
        data: normalizarData(data.data),
        modulo: data.modulo ?? "",
        status: (data.status ?? "em-desenvolvimento") as Status,
        imagens: normalizarImagens(data),
        corpo: content.trim(),
      };
    })
    .sort((a, b) => (a.data < b.data ? 1 : -1));
}

export function getAtualizacoesPorModulo(slug: string): Atualizacao[] {
  return getAtualizacoes().filter((a) => a.modulo === slug);
}

export function getUltimaAtualizacao(slug: string): Atualizacao | undefined {
  return getAtualizacoesPorModulo(slug)[0];
}
