import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * Erro específico para configuração ausente (env vars no servidor),
 * distinto de "token inválido"/"não é admin", para que o handler possa
 * expor uma mensagem clara ao admin em vez do genérico "Erro na
 * requisição." do client (esta tela só é acessível por admins).
 */
class SupabaseAdminConfigError extends Error {}

/**
 * Confirma, via service_role, que o token enviado pertence a um usuário
 * com role=admin. Nunca confiar em role vindo do corpo da requisição.
 * Lança SupabaseAdminConfigError se a service_role key/URL não estiverem
 * configuradas no ambiente (ex.: env var ausente no Netlify).
 */
async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (e) {
    throw new SupabaseAdminConfigError(
      e instanceof Error ? e.message : "Supabase admin não configurado."
    );
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  if (data.user.user_metadata?.role !== "admin") return null;
  return data.user;
}

export async function GET(request: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin(request);
  } catch (e) {
    if (e instanceof SupabaseAdminConfigError) {
      console.error("SupabaseAdminConfigError em GET /api/admin/usuarios:", e.message);
      return NextResponse.json(
        { error: `Configuração do servidor ausente: ${e.message}` },
        { status: 500 }
      );
    }
    throw e;
  }
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const usuarios: { id: string; email: string | null; nome: string | null; created_at: string }[] = [];
    let page = 1;
    const perPage = 200;

    // listUsers é paginado; percorremos até não haver mais páginas.
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;

      for (const u of data.users) {
        if (u.user_metadata?.role === "externo") {
          usuarios.push({
            id: u.id,
            email: u.email ?? null,
            nome: typeof u.user_metadata?.nome === "string" ? u.user_metadata.nome : null,
            created_at: u.created_at,
          });
        }
      }

      if (data.users.length < perPage) break;
      page += 1;
    }

    usuarios.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

    return NextResponse.json({ usuarios });
  } catch (e) {
    console.error("Erro ao listar usuários externos:", e);
    const detalhe = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Erro ao listar usuários: ${detalhe}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin(request);
  } catch (e) {
    if (e instanceof SupabaseAdminConfigError) {
      console.error("SupabaseAdminConfigError em POST /api/admin/usuarios:", e.message);
      return NextResponse.json(
        { error: `Configuração do servidor ausente: ${e.message}` },
        { status: 500 }
      );
    }
    throw e;
  }
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: { email?: string; senha?: string; nome?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const email = body.email?.trim();
  const senha = body.senha ?? "";
  const nome = body.nome?.trim();

  if (!email || !senha || !nome) {
    return NextResponse.json({ error: "Preencha email, senha e nome." }, { status: 400 });
  }
  if (senha.length < 6) {
    return NextResponse.json({ error: "A senha deve ter ao menos 6 caracteres." }, { status: 400 });
  }

  try {
    const { data, error } = await getSupabaseAdmin().auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { role: "externo", nome },
    });

    if (error) {
      const mensagem = /already registered|already exists/i.test(error.message)
        ? "Já existe um usuário com esse email."
        : `Não foi possível criar o usuário: ${error.message}`;
      return NextResponse.json({ error: mensagem }, { status: 400 });
    }

    return NextResponse.json({
      usuario: {
        id: data.user.id,
        email: data.user.email,
        nome,
        created_at: data.user.created_at,
      },
    });
  } catch (e) {
    console.error("Erro ao criar usuário externo:", e);
    const detalhe = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Não foi possível criar o usuário: ${detalhe}` }, { status: 500 });
  }
}
