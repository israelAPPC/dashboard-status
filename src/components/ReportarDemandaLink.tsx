"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquarePlus } from "lucide-react";
import { getUserRole } from "@/lib/auth-role";

/**
 * Link "Reportar erro/melhoria" visível apenas para usuários autenticados
 * com role=externo (user_metadata.role). Some para todo mundo mais (admin
 * ou visitante anônimo/diretoria).
 */
export default function ReportarDemandaLink({ projetoSlug }: { projetoSlug?: string }) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    let ativo = true;
    getUserRole().then((role) => {
      if (ativo && role === "externo") setVisivel(true);
    });
    return () => {
      ativo = false;
    };
  }, []);

  if (!visivel) return null;

  const href = projetoSlug ? `/demandas/nova?projeto=${projetoSlug}` : "/demandas/nova";

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-[#2c98b0] hover:bg-[#2c98b0]/90 rounded-lg px-3 py-1.5 transition-colors"
    >
      <MessageSquarePlus className="w-3.5 h-3.5" />
      Reportar erro/melhoria
    </Link>
  );
}
