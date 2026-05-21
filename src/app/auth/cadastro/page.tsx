"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCPF, formatCNPJ, validateCPF, validateCNPJ } from "@/lib/validators";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

type PersonType = "PF" | "PJ";

export default function CadastroPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();

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
    if (!form.full_name.trim()) return t.register_err_name;
    if (!form.username.trim()) return t.register_err_username;
    if (!form.email.trim()) return t.register_err_email;
    if (form.password.length < 6) return t.register_err_pw_short;
    if (form.password !== form.confirm_password) return t.register_err_pw_mismatch;
    if (personType === "PF" && form.cpf && cpfValid === false) return t.register_err_cpf;
    if (personType === "PJ") {
      if (!form.company_name.trim()) return t.register_err_company;
      if (form.cnpj && cnpjValid === false) return t.register_err_cnpj;
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
        throw new Error(data.detail ?? t.register_err_default);
      }

      // Login automático após cadastro
      await login(form.email, form.password);
      setSuccess(true);
      setTimeout(() => router.push("/"), 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t.register_err_default);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 size={40} className="text-green-500" />
          <p className="text-gray-900 font-medium">{t.register_success}</p>
          <p className="text-sm text-gray-400">{t.register_redirecting}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{t.register_title}</h1>
        <p className="text-sm text-gray-400 mt-1">
          {t.register_has_account}{" "}
          <Link href="/" className="text-gray-700 underline underline-offset-2 hover:text-gray-900">
            {t.register_back_login}
          </Link>
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
              {type === "PF" ? t.register_pf : t.register_pj}
            </button>
          ))}
        </div>

        {/* Dados básicos */}
        <Field label={t.register_full_name}>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder={t.register_name_placeholder}
            className="input"
            required
          />
        </Field>

        <Field label={t.register_username}>
          <input
            type="text"
            value={form.username}
            onChange={(e) => set("username", e.target.value.toLowerCase().replace(/\s/g, ""))}
            placeholder={t.register_username_placeholder}
            className="input"
            required
          />
        </Field>

        <Field label={t.register_email}>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="seu@email.com"
            className="input"
            required
          />
        </Field>

        <Field label={t.register_phone}>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="(11) 90000-0000"
            className="input"
          />
        </Field>

        {personType === "PJ" && (
          <>
            <Field label={t.register_company}>
              <input
                type="text"
                value={form.company_name}
                onChange={(e) => set("company_name", e.target.value)}
                placeholder={t.register_razao_social}
                className="input"
                required
              />
            </Field>

            <Field label={t.register_cnpj} hint={cnpjValid === false ? t.register_cnpj_invalid : cnpjValid === true ? t.register_cnpj_valid : undefined} valid={cnpjValid}>
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

        {personType === "PF" && (
          <Field label={t.register_cpf} hint={cpfValid === false ? t.register_cpf_invalid : cpfValid === true ? t.register_cpf_valid : undefined} valid={cpfValid}>
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

        <Field label={t.register_password}>
          <input
            type="password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder={t.register_pw_placeholder}
            className="input"
            required
          />
        </Field>

        <Field
          label={t.register_confirm_pw}
          hint={
            form.confirm_password && form.password !== form.confirm_password
              ? t.register_pw_mismatch_hint
              : form.confirm_password && form.password === form.confirm_password
              ? t.register_pw_match_hint
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
          {loading ? t.register_submitting : t.register_submit}
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
