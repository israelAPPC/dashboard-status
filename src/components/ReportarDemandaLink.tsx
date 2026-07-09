"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, MessageSquarePlus } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { getUserRole } from "@/lib/auth-role";

/**
 * Widget de autenticação externa exibido na home:
 * - visitante anônimo ou sem sessão: link "Login" para /login.
 * - usuário logado com role=externo: link "Reportar erro/melhoria" + "Sair".
 * - usuário logado como admin: nada (admin usa /admin, fluxos separados).
 */
export default function ReportarDemandaLink({ projetoSlug }: { projetoSlug?: string }) {
  const router = useRouter();
  const [role, setRole] = useState<"externo" | "admin" | null | undefined>(undefined);

  useEffect(() => {
    let ativo = true;
    getUserRole().then((r) => {
      if (ativo) setRole(r);
    });
    return () => {
      ativo = false;
    };
  }, []);

  async function handleLogout() {
    await getSupabase().auth.signOut();
    setRole(null);
    router.refresh();
  }

  if (role === undefined || role === "admin") return null;

  if (role === "externo") {
    const href = projetoSlug ? `/demandas/nova?projeto=${projetoSlug}` : "/demandas/nova";
    return (
      <div className="flex items-center gap-2">
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-[#2c98b0] hover:bg-[#2c98b0]/90 rounded-lg px-3 py-1.5 transition-colors"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          Reportar erro/melhoria
        </Link>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-[#2c98b0]/40 hover:text-[#2c98b0] transition-colors"
    >
      <LogIn className="w-3.5 h-3.5" />
      Login
    </Link>
  );
}
