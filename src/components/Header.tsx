"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingCart, User, Search, Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LogoutConfirm from "./LogoutConfirm";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { user, isAdmin, logout, openLogin } = useAuth();
  const { count, openCart } = useCart();
  const { lang, setLang, t } = useLanguage();

  function handleLogout() {
    logout();
    setConfirmLogout(false);
    setMenuOpen(false);
  }

  function toggleLang() {
    setLang(lang === "pt" ? "zh" : "pt");
  }

  return (
    <>
      <LogoutConfirm
        open={confirmLogout}
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />

      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">

          {/* Logo */}
          <Link href="/" className="shrink-0">
            <span className="text-lg font-semibold tracking-tight text-gray-900">
              Beta Bridge
            </span>
          </Link>

          {/* Nav central — desktop */}
          <nav className="hidden md:flex items-center gap-7 text-sm text-gray-500">
            <Link href="/produtos" className="hover:text-gray-900 transition-colors">{t.nav_products}</Link>
            {user && !isAdmin && (
              <Link href="/meus-pedidos" className="hover:text-gray-900 transition-colors">
                {t.nav_my_orders}
              </Link>
            )}
          </nav>

          {/* Ações — desktop */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            <button className="text-gray-400 hover:text-gray-700 transition-colors">
              <Search size={18} />
            </button>

            {/* Botão de idioma */}
            <button
              onClick={toggleLang}
              className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors border border-gray-200 rounded-md px-2 py-1 leading-none hover:border-gray-400"
              title={lang === "pt" ? "Switch to Chinese" : "切换到葡萄牙语"}
            >
              {lang === "pt" ? "中文" : "PT"}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 text-xs font-medium bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <LayoutDashboard size={13} />
                    {t.nav_panel}
                  </Link>
                )}

                <Link
                  href="/perfil"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors truncate max-w-[120px]"
                >
                  {user.full_name.split(" ")[0]}
                </Link>

                <button
                  onClick={() => setConfirmLogout(true)}
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                  title={t.nav_logout}
                >
                  <LogOut size={17} />
                </button>
              </div>
            ) : (
              <button
                onClick={openLogin}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5"
              >
                <User size={18} />
                {t.nav_login}
              </button>
            )}

            {!isAdmin && (
              <button
                onClick={openCart}
                className="relative text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ShoppingCart size={18} />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Menu mobile */}
          <button
            className="md:hidden text-gray-500"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Dropdown mobile */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 flex flex-col gap-4 text-sm text-gray-600">
            <Link href="/produtos" className="hover:text-gray-900" onClick={() => setMenuOpen(false)}>{t.nav_products}</Link>
            {user ? (
              <>
                <Link href="/perfil" className="hover:text-gray-900" onClick={() => setMenuOpen(false)}>{t.nav_my_profile}</Link>
                {!isAdmin && (
                  <Link href="/meus-pedidos" className="hover:text-gray-900" onClick={() => setMenuOpen(false)}>{t.nav_my_orders}</Link>
                )}
                {isAdmin && (
                  <Link href="/admin" className="font-medium text-gray-900" onClick={() => setMenuOpen(false)}>
                    {t.nav_admin_panel}
                  </Link>
                )}
                <button
                  onClick={() => { setMenuOpen(false); setConfirmLogout(true); }}
                  className="text-left text-red-400 hover:text-red-600"
                >
                  {t.nav_logout}
                </button>
              </>
            ) : (
              <button onClick={() => { openLogin(); setMenuOpen(false); }} className="text-left hover:text-gray-900">
                {t.nav_login}
              </button>
            )}
            <button
              onClick={() => { toggleLang(); setMenuOpen(false); }}
              className="text-left text-xs font-semibold text-gray-400 hover:text-gray-700 w-fit border border-gray-200 rounded-md px-2 py-1"
            >
              {lang === "pt" ? "中文" : "PT"}
            </button>
          </div>
        )}
      </header>
    </>
  );
}
