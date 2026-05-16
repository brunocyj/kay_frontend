"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function HomeCTA() {
  const { user, openLogin } = useAuth();

  if (user) return null;

  return (
    <section className="py-16 border-t border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="flex flex-col gap-1">
        <span className="text-base font-semibold text-gray-900">Pronto para comprar?</span>
        <span className="text-sm text-gray-400">Cadastre-se e faça seu primeiro pedido.</span>
      </div>
      <button
        onClick={openLogin}
        className="bg-gray-900 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap"
      >
        Criar conta grátis
      </button>
    </section>
  );
}
