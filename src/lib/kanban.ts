import { getSupabase } from "@/lib/supabase";
import type { Anexo, Card, Categoria, Iteracao, Projeto, Status, TipoDemanda } from "@/lib/supabase-types";

// ---------- Leitura (pública) ----------

export async function getProjetos(): Promise<Projeto[]> {
  const { data, error } = await getSupabase()
    .from("projetos")
    .select("*")
    .order("ordem", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getProjetoPorSlug(slug: string): Promise<Projeto | null> {
  const { data, error } = await getSupabase()
    .from("projetos")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCategoriasPorProjeto(projetoId: string): Promise<Categoria[]> {
  const { data, error } = await getSupabase()
    .from("categorias")
    .select("*")
    .eq("projeto_id", projetoId)
    .order("ordem", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getCardsPorCategorias(categoriaIds: string[]): Promise<Card[]> {
  if (categoriaIds.length === 0) return [];
  const { data, error } = await getSupabase()
    .from("cards")
    .select("*")
    .in("categoria_id", categoriaIds)
    .order("ordem", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getCategoriaDemandasExternas(projetoId: string): Promise<Categoria | null> {
  const { data, error } = await getSupabase()
    .from("categorias")
    .select("*")
    .eq("projeto_id", projetoId)
    .eq("slug", "demandas-externas")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCategoriaPorId(id: string): Promise<Categoria | null> {
  const { data, error } = await getSupabase()
    .from("categorias")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProjetoPorId(id: string): Promise<Projeto | null> {
  const { data, error } = await getSupabase()
    .from("projetos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCardPorId(id: string): Promise<Card | null> {
  const { data, error } = await getSupabase()
    .from("cards")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getIteracoesPorCard(cardId: string): Promise<Iteracao[]> {
  const { data, error } = await getSupabase()
    .from("iteracoes")
    .select("*")
    .eq("card_id", cardId)
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAnexosPorCard(cardId: string): Promise<Anexo[]> {
  const { data, error } = await getSupabase()
    .from("anexos")
    .select("*")
    .eq("card_id", cardId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getAnexosPorIteracao(iteracaoId: string): Promise<Anexo[]> {
  const { data, error } = await getSupabase()
    .from("anexos")
    .select("*")
    .eq("iteracao_id", iteracaoId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ---------- Escrita (admin autenticado) ----------

export async function criarProjeto(nome: string, slug: string, descricao?: string) {
  const { data, error } = await getSupabase()
    .from("projetos")
    .insert({ nome, slug, descricao: descricao ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as Projeto;
}

export async function criarCategoria(projetoId: string, nome: string, slug: string, ordem = 0) {
  const { data, error } = await getSupabase()
    .from("categorias")
    .insert({ projeto_id: projetoId, nome, slug, ordem })
    .select()
    .single();
  if (error) throw error;
  return data as Categoria;
}

export async function criarCard(categoriaId: string, titulo: string, status: Status, descricao?: string, ordem = 0) {
  const { data, error } = await getSupabase()
    .from("cards")
    .insert({ categoria_id: categoriaId, titulo, status, descricao: descricao ?? null, ordem })
    .select()
    .single();
  if (error) throw error;
  return data as Card;
}

/**
 * Cria uma demanda externa (erro/melhoria) como card na categoria fixa
 * "Demandas Externas" do projeto informado. Autor = usuário externo logado.
 */
export async function criarDemanda(params: {
  projetoId: string;
  titulo: string;
  descricao: string;
  tipo: TipoDemanda;
  autorId: string;
  autorNome: string | null;
}): Promise<Card> {
  const categoria = await getCategoriaDemandasExternas(params.projetoId);
  if (!categoria) {
    throw new Error("Categoria de Demandas Externas não encontrada para este projeto.");
  }
  const { data, error } = await getSupabase()
    .from("cards")
    .insert({
      categoria_id: categoria.id,
      titulo: params.titulo,
      descricao: params.descricao,
      status: "em-aberto",
      tipo: params.tipo,
      autor_id: params.autorId,
      autor_nome: params.autorNome,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Card;
}

export async function atualizarCard(id: string, patch: Partial<Pick<Card, "titulo" | "descricao" | "status" | "categoria_id" | "ordem">>) {
  const { data, error } = await getSupabase()
    .from("cards")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Card;
}

export async function moverCard(id: string, categoriaId: string, ordem: number) {
  return atualizarCard(id, { categoria_id: categoriaId, ordem });
}

export async function excluirCard(id: string) {
  const { error } = await getSupabase().from("cards").delete().eq("id", id);
  if (error) throw error;
}

export async function criarIteracao(cardId: string, corpo: string, data?: string) {
  const { data: row, error } = await getSupabase()
    .from("iteracoes")
    .insert({ card_id: cardId, corpo, ...(data ? { data } : {}) })
    .select()
    .single();
  if (error) throw error;
  return row as Iteracao;
}

export async function atualizarIteracao(id: string, corpo: string) {
  const { data, error } = await getSupabase()
    .from("iteracoes")
    .update({ corpo })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Iteracao;
}

export async function criarAnexo(params: { cardId?: string; iteracaoId?: string; url: string; nome?: string }) {
  const { data, error } = await getSupabase()
    .from("anexos")
    .insert({
      card_id: params.cardId ?? null,
      iteracao_id: params.iteracaoId ?? null,
      url: params.url,
      nome: params.nome ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Anexo;
}

export async function excluirAnexo(id: string) {
  const { error } = await getSupabase().from("anexos").delete().eq("id", id);
  if (error) throw error;
}
