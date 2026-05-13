"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginModal() {
  const { login, loginOpen, closeLogin } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Foca o campo ao abrir
  useEffect(() => {
    if (loginOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setError("");
      setIdentifier("");
      setPassword("");
    }
  }, [loginOpen]);

  // Fecha com ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLogin();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [closeLogin]);

  // Bloqueia scroll do body
  useEffect(() => {
    document.body.style.overflow = loginOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [loginOpen]);

  if (!loginOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(identifier, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
        onClick={closeLogin}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 pointer-events-auto relative animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fechar */}
          <button
            onClick={closeLogin}
            className="absolute top-4 right-4 text-gray-300 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>

          {/* Cabeçalho */}
          <div className="mb-7">
            <h2 className="text-lg font-semibold text-gray-900">Entrar</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Use seu e-mail ou username
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">
                E-mail ou username
              </label>
              <input
                ref={inputRef}
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400 transition-colors"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-400 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-gray-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {/* Rodapé */}
          <p className="mt-5 text-center text-xs text-gray-400">
            Não tem conta?{" "}
            <Link
              href="/auth/cadastro"
              className="text-gray-700 underline underline-offset-2 hover:text-gray-900"
              onClick={closeLogin}
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
