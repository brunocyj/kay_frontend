"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatCPF, formatCNPJ, validateCPF, validateCNPJ } from "@/lib/validators";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

type PersonType = "PF" | "PJ";

export default function CadastroPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [personType, setPersonType] = useState<PersonType>("PF");
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    phone: "",
    // PF
    cpf: "",
    // PJ
    company_name: "",
    cnpj: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const cpfValid = form.cpf.replace(/\D/g, "").length === 11 ? validateCPF(form.cpf) : null;
  const cnpjValid = form.cnpj.replace(/\D/g, "").length === 14 ? validateCNPJ(form.cnpj) : null;

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): string | null {
    if (!form.full_name.trim()) return "Nome completo é obrigatório.";
    if (!form.username.trim()) return "Username é obrigatório.";
    if (!form.email.trim()) return "E-mail é obrigatório.";
    if (form.password.length < 6) return "Senha deve ter no mínimo 6 caracteres.";
    if (form.password !== form.confirm_password) return "As senhas não coincidem.";
    if (personType === "PF" && form.cpf && cpfValid === false) return "CPF inválido.";
    if (personType === "PJ") {
      if (!form.company_name.trim()) return "Nome da empresa é obrigatório para PJ.";
      if (form.cnpj && cnpjValid === false) return "CNPJ inválido.";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        full_name: form.full_name,
        username: form.username,
        email: form.email,
        password: form.password,
        phone: form.phone || null,
        person_type: personType,
      };
      if (personType === "PJ") {
        body.company_name = form.company_name;
        body.cnpj = form.cnpj.replace(/\D/g, "") || null;
      }

      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? "Erro ao criar conta.");
      }

      // Login automático após cadastro
      await login(form.email, form.password);
      setSuccess(true);
      setTimeout(() => router.push("/"), 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 size={40} className="text-green-500" />
          <p className="text-gray-900 font-medium">Conta criada com sucesso!</p>
          <p className="text-sm text-gray-400">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Criar conta</h1>
        <p className="text-sm text-gray-400 mt-1">
          Já tem conta?{" "}
          <button
            onClick={() => {}}
            className="text-gray-700 underline underline-offset-2 hover:text-gray-900"
          >
            <Link href="/">Voltar e entrar</Link>
          </button>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Tipo de pessoa */}
        <div className="flex gap-2">
          {(["PF", "PJ"] as PersonType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setPersonType(type)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                personType === type
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {type === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
            </button>
          ))}
        </div>

        {/* Dados básicos */}
        <Field label="Nome completo *">
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder="Seu nome"
            className="input"
            required
          />
        </Field>

        <Field label="Username *">
          <input
            type="text"
            value={form.username}
            onChange={(e) => set("username", e.target.value.toLowerCase().replace(/\s/g, ""))}
            placeholder="seunome123"
            className="input"
            required
          />
        </Field>

        <Field label="E-mail *">
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="seu@email.com"
            className="input"
            required
          />
        </Field>

        <Field label="Telefone">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="(11) 90000-0000"
            className="input"
          />
        </Field>

        {/* Campos PJ */}
        {personType === "PJ" && (
          <>
            <Field label="Nome da empresa *">
              <input
                type="text"
                value={form.company_name}
                onChange={(e) => set("company_name", e.target.value)}
                placeholder="Razão social"
                className="input"
                required
              />
            </Field>

            <Field label="CNPJ" hint={cnpjValid === false ? "CNPJ inválido" : cnpjValid === true ? "CNPJ válido" : undefined} valid={cnpjValid}>
              <input
                type="text"
                value={form.cnpj}
                onChange={(e) => set("cnpj", formatCNPJ(e.target.value))}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                className="input"
              />
            </Field>
          </>
        )}

        {/* CPF para PF */}
        {personType === "PF" && (
          <Field label="CPF" hint={cpfValid === false ? "CPF inválido" : cpfValid === true ? "CPF válido" : undefined} valid={cpfValid}>
            <input
              type="text"
              value={form.cpf}
              onChange={(e) => set("cpf", formatCPF(e.target.value))}
              placeholder="000.000.000-00"
              maxLength={14}
              className="input"
            />
          </Field>
        )}

        {/* Senha */}
        <Field label="Senha *">
          <input
            type="password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="input"
            required
          />
        </Field>

        <Field
          label="Confirmar senha *"
          hint={
            form.confirm_password && form.password !== form.confirm_password
              ? "Senhas não coincidem"
              : form.confirm_password && form.password === form.confirm_password
              ? "Senhas coincidem"
              : undefined
          }
          valid={
            form.confirm_password
              ? form.password === form.confirm_password
              : null
          }
        >
          <input
            type="password"
            value={form.confirm_password}
            onChange={(e) => set("confirm_password", e.target.value)}
            placeholder="••••••••"
            className="input"
            required
          />
        </Field>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
            <XCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-500">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-gray-900 text-white text-sm font-medium py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  valid,
  children,
}: {
  label: string;
  hint?: string;
  valid?: boolean | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <style>{`.input { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; font-size: 14px; color: #111; outline: none; width: 100%; } .input:focus { border-color: #9ca3af; }`}</style>
      {children}
      {hint && (
        <span className={`text-xs flex items-center gap-1 ${valid ? "text-green-500" : "text-red-400"}`}>
          {valid ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
          {hint}
        </span>
      )}
    </div>
  );
}
