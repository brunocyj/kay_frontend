"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function HomeHero() {
  const { user, openLogin } = useAuth();

  return (
    <section className="py-20 md:py-28 flex flex-col gap-6 max-w-xl">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
        Produtos importados
      </span>
      <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 leading-tight tracking-tight">
        Qualidade direto<br />para você.
      </h1>
      <p className="text-gray-400 text-base leading-relaxed">
        Encontre o que precisa, faça seu pedido e acompanhe cada etapa. Simples assim.
      </p>
      <div className="flex gap-3 pt-2">
        <Link
          href="/produtos"
          className="bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Ver produtos
        </Link>
        {!user && (
          <button
            onClick={openLogin}
            className="border border-gray-200 text-gray-600 text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Criar conta
          </button>
        )}
      </div>
    </section>
  );
}
