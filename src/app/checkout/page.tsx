"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, Package } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type ShippingForm = {
  shipping_name: string;
  shipping_phone: string;
  shipping_zip_code: string;
  shipping_street: string;
  shipping_number: string;
  shipping_complement: string;
  shipping_neighborhood: string;
  shipping_city: string;
  shipping_state: string;
};

const EMPTY: ShippingForm = {
  shipping_name: "", shipping_phone: "", shipping_zip_code: "",
  shipping_street: "", shipping_number: "", shipping_complement: "",
  shipping_neighborhood: "", shipping_city: "", shipping_state: "",
};

export default function CheckoutPage() {
  const { token, user, loading: authLoading, openLogin } = useAuth();
  const { items, total, clearCart } = useCart();
  const router = useRouter();

  const [form, setForm] = useState<ShippingForm>(EMPTY);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [fetchingCep, setFetchingCep] = useState(false);

  useEffect(() => {
    if (!authLoading && !token) openLogin();
  }, [authLoading, token, openLogin]);

  useEffect(() => {
    if (!authLoading && token && user) {
      setForm((f) => ({ ...f, shipping_name: f.shipping_name || user.full_name }));
    }
  }, [authLoading, token, user]);

  // Busca CEP automaticamente ao atingir 8 dígitos
  async function fetchCep(value: string) {
    const cep = value.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setFetchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((f) => ({
          ...f,
          shipping_street: data.logradouro || f.shipping_street,
          shipping_neighborhood: data.bairro || f.shipping_neighborhood,
          shipping_city: data.localidade || f.shipping_city,
          shipping_state: data.uf || f.shipping_state,
        }));
      }
    } catch { /* ignore */ }
    setFetchingCep(false);
  }

  function set(field: keyof ShippingForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || items.length === 0) return;
    setSubmitting(true);
    setError("");

    const body = {
      items: items.map((i) => ({
        product_id: i.product_id,
        variation_id: i.variation_id ?? undefined,
        quantity: i.quantity,
      })),
      shipping: {
        shipping_name: form.shipping_name.trim(),
        shipping_phone: form.shipping_phone.trim() || undefined,
        shipping_zip_code: form.shipping_zip_code.replace(/\D/g, ""),
        shipping_street: form.shipping_street.trim(),
        shipping_number: form.shipping_number.trim(),
        shipping_complement: form.shipping_complement.trim() || undefined,
        shipping_neighborhood: form.shipping_neighborhood.trim(),
        shipping_city: form.shipping_city.trim(),
        shipping_state: form.shipping_state.trim().toUpperCase(),
      },
      customer_notes: notes.trim() || undefined,
    };

    const res = await fetch(`${API}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const order = await res.json();
      clearCart();
      setOrderId(order.id);
    } else {
      const err = await res.json().catch(() => ({}));
      setError(err.detail ?? "Erro ao criar pedido. Tente novamente.");
    }
    setSubmitting(false);
  }

  // Pedido criado com sucesso
  if (orderId) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Pedido realizado!</h1>
          <p className="text-sm text-gray-400 mt-2">
            Seu pedido <span className="font-medium text-gray-700">#{orderId}</span> foi registrado.
            Aguarde a confirmação de pagamento.
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl px-5 py-4 text-sm text-gray-600 text-left w-full">
          <p className="font-medium text-gray-800 mb-1">Próximos passos</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-500">
            <li>Realize o pagamento via Pix</li>
            <li>Envie o comprovante quando solicitado</li>
            <li>Aguarde a confirmação e envio</li>
          </ol>
        </div>
        <div className="flex gap-3">
          <Link href="/meus-pedidos" className="bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors">
            Ver meus pedidos
          </Link>
          <Link href="/produtos" className="border border-gray-200 text-gray-600 text-sm px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
            Continuar comprando
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !submitting) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 flex flex-col items-center text-center gap-4">
        <Package size={40} className="text-gray-200" />
        <p className="text-sm text-gray-400">Seu carrinho está vazio.</p>
        <Link href="/produtos" className="text-sm text-gray-900 underline underline-offset-2">Ver produtos</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Finalizar compra</h1>
        <p className="text-sm text-gray-400 mt-0.5">Confirme o endereço de entrega</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 flex flex-col gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Endereço de entrega</p>

            <Field label="Nome do destinatário *">
              <input required value={form.shipping_name} onChange={(e) => set("shipping_name", e.target.value)} className="inp" placeholder="Nome completo" />
            </Field>

            <Field label="Telefone">
              <input value={form.shipping_phone} onChange={(e) => set("shipping_phone", e.target.value)} className="inp" placeholder="(11) 91234-5678" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="CEP *">
                <div className="relative">
                  <input
                    required
                    value={form.shipping_zip_code}
                    onChange={(e) => {
                      set("shipping_zip_code", e.target.value);
                      fetchCep(e.target.value);
                    }}
                    className="inp pr-8"
                    placeholder="00000000 ou 00000-000"
                    maxLength={9}
                  />
                  {fetchingCep && (
                    <Loader2 size={14} className="animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  )}
                </div>
              </Field>
              <Field label="Número *">
                <input required value={form.shipping_number} onChange={(e) => set("shipping_number", e.target.value)} className="inp" placeholder="123" />
              </Field>
            </div>

            <Field label="Rua / Logradouro *">
              <input required value={form.shipping_street} onChange={(e) => set("shipping_street", e.target.value)} className="inp" placeholder="Rua das Flores" />
            </Field>

            <Field label="Complemento">
              <input value={form.shipping_complement} onChange={(e) => set("shipping_complement", e.target.value)} className="inp" placeholder="Apto 42, Bloco B" />
            </Field>

            <Field label="Bairro *">
              <input required value={form.shipping_neighborhood} onChange={(e) => set("shipping_neighborhood", e.target.value)} className="inp" placeholder="Centro" />
            </Field>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Cidade *" className="col-span-2">
                <input required value={form.shipping_city} onChange={(e) => set("shipping_city", e.target.value)} className="inp" placeholder="São Paulo" />
              </Field>
              <Field label="UF *">
                <input required value={form.shipping_state} onChange={(e) => set("shipping_state", e.target.value)} className="inp" placeholder="SP" maxLength={2} />
              </Field>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <Field label="Observações (opcional)">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="inp resize-none"
                placeholder="Instruções de entrega, referências..."
              />
            </Field>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white font-medium py-3.5 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {submitting ? "Processando..." : "Confirmar pedido"}
          </button>
        </form>

        {/* Resumo */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Resumo do pedido</p>
            <ul className="flex flex-col gap-3 mb-4">
              {items.map((item) => (
                <li key={`${item.product_id}-${item.variation_id}`} className="flex gap-3 items-start">
                  <div className="w-10 h-10 shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{item.product_name}</p>
                    {item.variation_label && <p className="text-xs text-gray-400">{item.variation_label}</p>}
                    <p className="text-xs text-gray-400">Qtd: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900 shrink-0">{fmt(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-xl font-bold text-gray-900">{fmt(total)}</span>
            </div>
          </div>
        </div>
      </div>

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

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  );
}
