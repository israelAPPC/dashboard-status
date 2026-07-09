import { getSupabase } from "@/lib/supabase";
import type { UserRole } from "@/lib/supabase-types";

/**
 * Lê o papel do usuário logado (user_metadata.role) direto da sessão atual.
 * Retorna null se não houver sessão ou o metadata não tiver role reconhecida.
 */
export async function getUserRole(): Promise<UserRole | null> {
  const { data } = await getSupabase().auth.getUser();
  const role = data.user?.user_metadata?.role;
  if (role === "admin" || role === "externo") return role;
  return null;
}

export async function getUserId(): Promise<string | null> {
  const { data } = await getSupabase().auth.getUser();
  return data.user?.id ?? null;
}
