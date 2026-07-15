import { getSupabase } from "@/lib/supabase";
import type { Funcionalidade, FuncionalidadeImagem, Versao } from "@/lib/supabase-types";

// ---------- Leitura (pública) ----------

export async function getVersoesPorProjeto(projetoId: string): Promise<Versao[]> {
  const { data, error } = await getSupabase()
    .from("versoes")
    .select("*")
    .eq("projeto_id", projetoId)
    .order("ordem", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getFuncionalidadesPorVersoes(versaoIds: string[]): Promise<Funcionalidade[]> {
  if (versaoIds.length === 0) return [];
  const { data, error } = await getSupabase()
    .from("funcionalidades")
    .select("*")
    .in("versao_id", versaoIds)
    .order("ordem", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getImagensPorFuncionalidades(funcionalidadeIds: string[]): Promise<FuncionalidadeImagem[]> {
  if (funcionalidadeIds.length === 0) return [];
  const { data, error } = await getSupabase()
    .from("funcionalidade_imagens")
    .select("*")
    .in("funcionalidade_id", funcionalidadeIds)
    .order("ordem", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ---------- Escrita (admin autenticado) ----------

export async function criarVersao(projetoId: string, numero: string, descricao?: string, ordem = 0) {
  const { data, error } = await getSupabase()
    .from("versoes")
    .insert({ projeto_id: projetoId, numero, descricao: descricao ?? null, ordem })
    .select()
    .single();
  if (error) throw error;
  return data as Versao;
}

export async function atualizarVersao(id: string, patch: Partial<Pick<Versao, "numero" | "descricao" | "ordem">>) {
  const { data, error } = await getSupabase()
    .from("versoes")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Versao;
}

export async function excluirVersao(id: string) {
  const { error } = await getSupabase().from("versoes").delete().eq("id", id);
  if (error) throw error;
}

export async function criarFuncionalidade(
  versaoId: string,
  nome: string,
  descricao?: string,
  novidade = false,
  ordem = 0
) {
  const { data, error } = await getSupabase()
    .from("funcionalidades")
    .insert({ versao_id: versaoId, nome, descricao: descricao ?? null, novidade, ordem })
    .select()
    .single();
  if (error) throw error;
  return data as Funcionalidade;
}

export async function atualizarFuncionalidade(
  id: string,
  patch: Partial<Pick<Funcionalidade, "nome" | "descricao" | "novidade" | "ordem">>
) {
  const { data, error } = await getSupabase()
    .from("funcionalidades")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Funcionalidade;
}

export async function excluirFuncionalidade(id: string) {
  const { error } = await getSupabase().from("funcionalidades").delete().eq("id", id);
  if (error) throw error;
}

export async function criarFuncionalidadeImagem(params: { funcionalidadeId: string; url: string; nome?: string; ordem?: number }) {
  const { data, error } = await getSupabase()
    .from("funcionalidade_imagens")
    .insert({
      funcionalidade_id: params.funcionalidadeId,
      url: params.url,
      nome: params.nome ?? null,
      ordem: params.ordem ?? 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data as FuncionalidadeImagem;
}

export async function excluirFuncionalidadeImagem(id: string) {
  const { error } = await getSupabase().from("funcionalidade_imagens").delete().eq("id", id);
  if (error) throw error;
}
