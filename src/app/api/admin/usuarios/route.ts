import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * Confirma, via service_role, que o token enviado pertence a um usuário
 * com role=admin. Nunca confiar em role vindo do corpo da requisição.
 */
async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) return null;
  if (data.user.user_metadata?.role !== "admin") return null;
  return data.user;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
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
  } catch {
    return NextResponse.json({ error: "Erro ao listar usuários." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
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
        : "Não foi possível criar o usuário.";
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
  } catch {
    return NextResponse.json({ error: "Não foi possível criar o usuário." }, { status: 500 });
  }
}
