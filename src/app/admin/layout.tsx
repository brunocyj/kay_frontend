"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import LogoutConfirm from "@/components/LogoutConfirm";
import {
  LayoutDashboard, Package, ShoppingBag, Users,
  Truck, Tag, LogOut, ChevronRight
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const NAV = [
    { href: "/admin", label: t.admin_nav_dashboard, icon: LayoutDashboard },
    { href: "/admin/pedidos", label: t.admin_nav_orders, icon: ShoppingBag },
    { href: "/admin/produtos", label: t.admin_nav_products, icon: Package },
    { href: "/admin/categorias", label: t.admin_nav_categories, icon: Tag },
    { href: "/admin/fornecedores", label: t.admin_nav_suppliers, icon: Truck },
    { href: "/admin/usuarios", label: t.admin_nav_users, icon: Users },
  ];

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
    <div className="fixed inset-0 flex bg-gray-50 z-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-gray-100">
          <Link href="/" className="block">
            <span className="text-sm font-semibold text-gray-900">Beta Bridge</span>
            <p className="text-xs text-gray-400 mt-0.5">{t.admin_panel_subtitle}</p>
          </Link>
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

        <div className="px-3 py-4 border-t border-gray-100 flex flex-col gap-1">
          <div className="px-3 py-1.5 text-xs text-gray-400 truncate">
            {user?.email}
          </div>

          {/* Botão de idioma */}
          <button
            onClick={() => setLang(lang === "pt" ? "zh" : "pt")}
            title={lang === "pt" ? "Switch to Chinese" : "切换到葡萄牙语"}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <span className="text-base leading-none">{lang === "pt" ? "🇨🇳" : "🇧🇷"}</span>
            <span className="font-semibold">{lang === "pt" ? "中文" : "PT"}</span>
          </button>

          <button
            onClick={() => setConfirmLogout(true)}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut size={15} />
            {t.admin_logout}
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
