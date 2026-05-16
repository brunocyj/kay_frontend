"use client";

import { useState } from "react";
import { Copy, CheckCheck } from "lucide-react";

type Props = {
  total: number;
};

function fmt(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PixInfo({ total }: Props) {
  const pixKey = process.env.NEXT_PUBLIC_PIX_KEY ?? "";
  const pixName = process.env.NEXT_PUBLIC_PIX_NAME ?? "Beta Bridge";
  const [copied, setCopied] = useState(false);

  if (!pixKey) return null;

  function handleCopy() {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm shrink-0">
          ₽
        </div>
        <div>
          <p className="text-sm font-semibold text-green-800">Pague via PIX</p>
          <p className="text-xs text-green-600">Transferência instantânea · confirmaremos em até 24h</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between bg-white border border-green-100 rounded-xl px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-400 mb-0.5">Chave PIX</p>
            <p className="text-sm font-mono text-gray-900 truncate">{pixKey}</p>
            <p className="text-xs text-gray-400 mt-0.5">{pixName}</p>
          </div>
          <button
            onClick={handleCopy}
            className={`ml-3 shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              copied
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>

        <div className="flex items-center justify-between bg-white border border-green-100 rounded-xl px-4 py-3">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Valor a pagar</p>
            <p className="text-lg font-bold text-gray-900">{fmt(total)}</p>
          </div>
          <span className="text-xs text-green-600 bg-green-100 px-2.5 py-1 rounded-full font-medium">
            Transferir exatamente este valor
          </span>
        </div>
      </div>

      <p className="text-xs text-green-700 bg-green-100 rounded-lg px-3 py-2">
        Após o pagamento, aguarde a confirmação. Você acompanha o status em <strong>Meus pedidos</strong>.
      </p>
    </div>
  );
}
