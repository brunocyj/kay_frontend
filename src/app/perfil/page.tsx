"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

type UserFull = {
  id: number;
  full_name: string;
  username: string;
  email: string;
  phone: string | null;
  person_type: "PF" | "PJ";
  company_name: string | null;
  cnpj: string | null;
  role: string;
  is_verified: boolean;
  created_at: string;
};

type Feedback = { type: "success" | "error"; message: string };

export default function PerfilPage() {
  const { token, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [user, setUser] = useState<UserFull | null>(null);
  const [loading, setLoading] = useState(true);

  // Campos do perfil
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<Feedback | null>(null);

  // Campos de senha
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    if (!authLoading && !token) router.replace("/");
  }, [authLoading, token, router]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setUser(data);
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
        setCompanyName(data.company_name ?? "");
        setLoading(false);
      });
  }, [token]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileFeedback(null);

    const body: Record<string, string | null> = { full_name: fullName.trim() };
    if (phone.trim()) body.phone = phone.trim();
    if (user?.person_type === "PJ") body.company_name = companyName.trim() || null;

    const res = await fetch(`${API}/auth/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const updated = await res.json();
      setUser(updated);
      setProfileFeedback({ type: "success", message: t.profile_saved_ok });
    } else {
      const err = await res.json().catch(() => ({}));
      setProfileFeedback({ type: "error", message: err.detail ?? t.profile_save_err });
    }
    setSavingProfile(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: "error", message: t.profile_pw_mismatch });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordFeedback({ type: "error", message: t.profile_pw_too_short });
      return;
    }

    setSavingPassword(true);
    const res = await fetch(`${API}/auth/me/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });

    if (res.status === 204) {
      setPasswordFeedback({ type: "success", message: t.profile_pw_ok });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const err = await res.json().catch(() => ({}));
      setPasswordFeedback({ type: "error", message: err.detail ?? t.profile_pw_err });
    }
    setSavingPassword(false);
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">{t.profile_title}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{t.profile_subtitle}</p>
      </div>

      {/* Informações não editáveis */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">{t.profile_account_data}</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <InfoRow label={t.profile_username} value={`@${user.username}`} />
          <InfoRow label={t.profile_email} value={user.email} />
          <InfoRow label={t.profile_type} value={user.person_type === "PF" ? t.profile_type_pf : t.profile_type_pj} />
          {user.person_type === "PF"
            ? null
            : user.cnpj && <InfoRow label="CNPJ" value={user.cnpj} />
          }
          <InfoRow label={t.profile_member_since} value={new Date(user.created_at).toLocaleDateString("pt-BR")} />
        </div>
      </div>

      {/* Editar perfil */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 flex flex-col gap-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.profile_personal_info}</p>

        <Field label={t.profile_full_name}>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="inp"
            placeholder="Seu nome completo"
          />
        </Field>

        <Field label={t.profile_phone}>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="inp"
            placeholder="(11) 91234-5678"
          />
        </Field>

        {user.person_type === "PJ" && (
          <Field label={t.profile_company}>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="inp"
              placeholder="Razão social"
            />
          </Field>
        )}

        {profileFeedback && <FeedbackMsg feedback={profileFeedback} />}

        <button
          type="submit"
          disabled={savingProfile}
          className="self-end flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {savingProfile && <Loader2 size={14} className="animate-spin" />}
          {savingProfile ? t.profile_saving : t.profile_save}
        </button>
      </form>

      {/* Trocar senha */}
      <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.profile_change_pw}</p>

        <Field label={t.profile_current_pw}>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="inp"
            placeholder="••••••••"
          />
        </Field>

        <Field label={t.profile_new_pw}>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="inp"
            placeholder={t.register_pw_placeholder}
          />
        </Field>

        <Field label={t.profile_confirm_pw}>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="inp"
            placeholder={t.profile_confirm_pw_placeholder}
          />
        </Field>

        {passwordFeedback && <FeedbackMsg feedback={passwordFeedback} />}

        <button
          type="submit"
          disabled={savingPassword}
          className="self-end flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {savingPassword && <Loader2 size={14} className="animate-spin" />}
          {savingPassword ? t.profile_pw_changing : t.profile_pw_change}
        </button>
      </form>
      <style jsx global>{`
        .inp {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #111827;
          outline: none;
          transition: border-color 0.15s;
          background: white;
        }
        .inp:focus { border-color: #9ca3af; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm text-gray-700 font-medium">{value}</span>
    </div>
  );
}

function FeedbackMsg({ feedback }: { feedback: Feedback }) {
  const isSuccess = feedback.type === "success";
  return (
    <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
      isSuccess ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-500"
    }`}>
      {isSuccess ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
      {feedback.message}
    </div>
  );
}

