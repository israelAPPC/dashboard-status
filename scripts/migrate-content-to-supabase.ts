/**
 * Migra o conteúdo estático atual (content/modules.json + content/updates/*.md)
 * para o Supabase, criando:
 *   - 1 projeto "Dashboard Dygnus" (slug: dashboard-dygnus)
 *   - 1 categoria por módulo de content/modules.json
 *   - 1 card por arquivo .md de content/updates (título/status/data do frontmatter)
 *   - 1 iteração por card, com o corpo do markdown como histórico inicial
 *   - 1 anexo por imagem referenciada no frontmatter (`imagem`/`imagens`)
 *
 * Uso (a partir da raiz do projeto dygnus-status):
 *   npx tsx scripts/migrate-content-to-supabase.ts
 *
 * Requer no .env.local (ou variáveis de ambiente):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (necessário para bypassar RLS na migração)
 *
 * O script é idempotente por slug/numero_demanda: pode ser reexecutado sem
 * duplicar o projeto/categorias (usa upsert por slug), mas os cards são
 * criados via insert simples — rode apenas uma vez em um banco vazio.
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de rodar este script."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const CONTENT_DIR = path.join(process.cwd(), "content");
const UPDATES_DIR = path.join(CONTENT_DIR, "updates");

type Modulo = { slug: string; nome: string };

function normalizarData(valor: unknown): string {
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  return typeof valor === "string" ? valor : new Date().toISOString().slice(0, 10);
}

function normalizarImagens(data: Record<string, unknown>): string[] {
  if (Array.isArray(data.imagens)) {
    return data.imagens
      .map((item) => (typeof item === "string" ? item : (item as { src?: string })?.src ?? ""))
      .filter(Boolean);
  }
  return typeof data.imagem === "string" && data.imagem ? [data.imagem] : [];
}

async function main() {
  const modulos: Modulo[] = JSON.parse(
    fs.readFileSync(path.join(CONTENT_DIR, "modules.json"), "utf8")
  );

  console.log(`Criando projeto "Dashboard Dygnus"...`);
  const { data: projeto, error: projetoError } = await supabase
    .from("projetos")
    .upsert({ nome: "Dashboard Dygnus", slug: "dashboard-dygnus", ordem: 0 }, { onConflict: "slug" })
    .select()
    .single();
  if (projetoError) throw projetoError;

  const categoriaIdPorSlug = new Map<string, string>();
  for (const [i, modulo] of modulos.entries()) {
    const { data: categoria, error } = await supabase
      .from("categorias")
      .upsert(
        { projeto_id: projeto.id, nome: modulo.nome, slug: modulo.slug, ordem: i },
        { onConflict: "projeto_id,slug" }
      )
      .select()
      .single();
    if (error) throw error;
    categoriaIdPorSlug.set(modulo.slug, categoria.id);
    console.log(`  categoria "${modulo.nome}" -> ${categoria.id}`);
  }

  if (!fs.existsSync(UPDATES_DIR)) {
    console.log("Nenhum content/updates encontrado — nada a migrar.");
    return;
  }

  const arquivos = fs.readdirSync(UPDATES_DIR).filter((f) => f.endsWith(".md"));
  let criados = 0;

  for (const filename of arquivos) {
    const raw = fs.readFileSync(path.join(UPDATES_DIR, filename), "utf8");
    const { data, content } = matter(raw);

    const moduloSlug = typeof data.modulo === "string" ? data.modulo : "";
    const categoriaId = categoriaIdPorSlug.get(moduloSlug);
    if (!categoriaId) {
      console.warn(`  [pulado] ${filename}: módulo "${moduloSlug}" não existe em modules.json`);
      continue;
    }

    const titulo = typeof data.titulo === "string" ? data.titulo : filename;
    const status = ["parado", "em-desenvolvimento", "finalizado"].includes(String(data.status))
      ? String(data.status)
      : "em-desenvolvimento";
    const dataISO = normalizarData(data.data);
    const imagens = normalizarImagens(data);

    const { data: card, error: cardError } = await supabase
      .from("cards")
      .insert({
        categoria_id: categoriaId,
        titulo,
        status,
        created_at: `${dataISO}T00:00:00Z`,
      })
      .select()
      .single();
    if (cardError) throw cardError;

    const { data: iteracao, error: iteracaoError } = await supabase
      .from("iteracoes")
      .insert({
        card_id: card.id,
        corpo: content.trim(),
        data: dataISO,
      })
      .select()
      .single();
    if (iteracaoError) throw iteracaoError;

    for (const src of imagens) {
      // Mantém a URL relativa original (/uploads/...). As imagens continuam
      // servidas por public/uploads; não é feito reupload para o Storage aqui.
      const { error: anexoError } = await supabase.from("anexos").insert({
        card_id: card.id,
        iteracao_id: iteracao.id,
        url: src,
      });
      if (anexoError) throw anexoError;
    }

    criados += 1;
    console.log(`  card "${titulo}" (${filename}) -> ${card.id} [demanda #${card.numero_demanda}]`);
  }

  console.log(`\nMigração concluída: ${criados} card(s) criado(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
