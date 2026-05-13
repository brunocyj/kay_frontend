"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import LogoutConfirm from "@/components/LogoutConfirm";
import {
  LayoutDashboard, Package, ShoppingBag, Users,
  Truck, Tag, LogOut, ChevronRight
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/categorias", label: "Categorias", icon: Tag },
  { href: "/admin/fornecedores", label: "Fornecedores", icon: Truck },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) router.replace("/");
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) return null;

  function handleLogout() {
    logout();
    setConfirmLogout(false);
    router.replace("/");
  }

  return (
    <>
    <LogoutConfirm
      open={confirmLogout}
      onConfirm={handleLogout}
      onCancel={() => setConfirmLogout(false)}
    />
    {/* Ocupa a tela toda — sobrepõe o Header/Footer do layout raiz via isolamento */}
    <div className="fixed inset-0 flex bg-gray-50 z-30">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">Beta Bridge</span>
          <p className="text-xs text-gray-400 mt-0.5">Painel admin</p>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors group
                  ${active
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
              >
                <Icon size={16} className={active ? "text-white" : "text-gray-400 group-hover:text-gray-700"} />
                {label}
                {!active && (
                  <ChevronRight size={12} className="ml-auto text-gray-300 group-hover:text-gray-400" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <div className="px-3 py-1.5 text-xs text-gray-400 truncate mb-2">
            {user?.email}
          </div>
          <button
            onClick={() => setConfirmLogout(true)}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut size={15} />
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex-1 overflow-auto">
        <main className="p-8">{children}</main>
      </div>
    </div>
    </>
  );
}
