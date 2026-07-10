"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pronto, setPronto] = useState(false);
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (isLogin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPronto(true);
      return;
    }

    let ativo = true;
    getSupabase()
      .auth.getSession()
      .then(async ({ data }) => {
        if (!ativo) return;
        if (!data.session) {
          router.replace("/admin/login");
          return;
        }
        // Força a renovação do token: garante que claims como
        // user_metadata.role reflitam qualquer alteração feita no
        // Supabase Dashboard após o login (sem exigir logout manual).
        await getSupabase().auth.refreshSession();
        if (!ativo) return;
        setPronto(true);
      });

    const { data: sub } = getSupabase().auth.onAuthStateChange((_event, session) => {
      if (!session && !isLogin) {
        router.replace("/admin/login");
      }
    });

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, [isLogin, router]);

  async function handleLogout() {
    await getSupabase().auth.signOut();
    router.replace("/admin/login");
  }

  if (!pronto) {
    return <p className="text-sm text-slate-400">Verificando sessão...</p>;
  }

  return (
    <div>
      {!isLogin && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      )}
      {children}
    </div>
  );
}
