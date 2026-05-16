"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingCart, User, Search, Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LogoutConfirm from "./LogoutConfirm";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { user, isAdmin, logout, openLogin } = useAuth();

  function handleLogout() {
    logout();
    setConfirmLogout(false);
    setMenuOpen(false);
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
          <Link href="/produtos" className="hover:text-gray-900 transition-colors">Produtos</Link>
          {user && !isAdmin && (
            <Link href="/meus-pedidos" className="hover:text-gray-900 transition-colors">
              Meus pedidos
            </Link>
          )}
          </nav>

          {/* Ações — desktop */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            <button className="text-gray-400 hover:text-gray-700 transition-colors">
              <Search size={18} />
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 text-xs font-medium bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <LayoutDashboard size={13} />
                    Painel
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
                  title="Sair"
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
                Entrar
              </button>
            )}

            {!isAdmin && (
              <Link href="/carrinho" className="text-gray-500 hover:text-gray-900 transition-colors">
                <ShoppingCart size={18} />
              </Link>
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
            <Link href="/produtos" className="hover:text-gray-900" onClick={() => setMenuOpen(false)}>Produtos</Link>
            {user ? (
              <>
                <Link href="/perfil" className="hover:text-gray-900" onClick={() => setMenuOpen(false)}>Meu perfil</Link>
                {!isAdmin && (
                  <Link href="/meus-pedidos" className="hover:text-gray-900" onClick={() => setMenuOpen(false)}>Meus pedidos</Link>
                )}
                {isAdmin && (
                  <Link href="/admin" className="font-medium text-gray-900" onClick={() => setMenuOpen(false)}>
                    Painel admin
                  </Link>
                )}
                <button
                  onClick={() => { setMenuOpen(false); setConfirmLogout(true); }}
                  className="text-left text-red-400 hover:text-red-600"
                >
                  Sair
                </button>
              </>
            ) : (
              <button onClick={() => { openLogin(); setMenuOpen(false); }} className="text-left hover:text-gray-900">
                Entrar
              </button>
            )}
          </div>
        )}
      </header>
    </>
  );
}
