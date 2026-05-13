const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Erro desconhecido" }));
    throw new Error(error.detail ?? `Erro ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Auth ───────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    login: (identifier: string, password: string) => {
      const form = new URLSearchParams();
      form.append("username", identifier);
      form.append("password", password);
      return fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      }).then((r) => r.json());
    },
    register: (data: unknown) => request("/auth/register", { method: "POST", body: data }),
    me: (token: string) => request("/auth/me", { token }),
  },

  // ── Produtos ────────────────────────────────────────────────────────────────
  products: {
    list: (params?: Record<string, string | number | boolean>) => {
      const query = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
      return request(`/products${query}`);
    },
    get: (slug: string) => request(`/products/${slug}`),
  },

  // ── Categorias ──────────────────────────────────────────────────────────────
  categories: {
    list: () => request("/categories"),
    get: (slug: string) => request(`/categories/${slug}`),
  },

  // ── Endereços ───────────────────────────────────────────────────────────────
  addresses: {
    list: (token: string) => request("/addresses", { token }),
    create: (token: string, data: unknown) => request("/addresses", { method: "POST", body: data, token }),
    update: (token: string, id: number, data: unknown) => request(`/addresses/${id}`, { method: "PATCH", body: data, token }),
    delete: (token: string, id: number) => request(`/addresses/${id}`, { method: "DELETE", token }),
    setDefault: (token: string, id: number) => request(`/addresses/${id}/set-default`, { method: "PATCH", token }),
  },

  // ── Pedidos ─────────────────────────────────────────────────────────────────
  orders: {
    list: (token: string) => request("/orders", { token }),
    get: (token: string, id: number) => request(`/orders/${id}`, { token }),
    create: (token: string, data: unknown) => request("/orders", { method: "POST", body: data, token }),
    cancel: (token: string, id: number) => request(`/orders/${id}/cancel`, { method: "PATCH", token }),
  },

  // ── Pagamentos ──────────────────────────────────────────────────────────────
  payments: {
    get: (token: string, orderId: number) => request(`/orders/${orderId}/payment`, { token }),
    submitReceipt: (token: string, orderId: number, receiptUrl: string) =>
      request(`/orders/${orderId}/payment/receipt`, { method: "POST", body: { receipt_url: receiptUrl }, token }),
  },
};
