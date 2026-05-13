import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white mt-20">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-10 text-sm text-gray-500">

        <div className="flex flex-col gap-3">
          <span className="text-gray-900 font-semibold text-base">Beta Bridge</span>
          <p className="leading-relaxed text-gray-400 max-w-xs">
            Produtos importados com cuidado, entregues com qualidade.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-gray-700 font-medium mb-1">Loja</span>
          <Link href="/produtos" className="hover:text-gray-900 transition-colors">Produtos</Link>
          <Link href="/categorias" className="hover:text-gray-900 transition-colors">Categorias</Link>
          <Link href="/produtos?destaque=true" className="hover:text-gray-900 transition-colors">Destaques</Link>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-gray-700 font-medium mb-1">Conta</span>
          <Link href="/auth/login" className="hover:text-gray-900 transition-colors">Entrar</Link>
          <Link href="/auth/cadastro" className="hover:text-gray-900 transition-colors">Criar conta</Link>
          <Link href="/meus-pedidos" className="hover:text-gray-900 transition-colors">Meus pedidos</Link>
        </div>
      </div>

      <div className="border-t border-gray-100 py-5 text-center text-xs text-gray-300">
        © {new Date().getFullYear()} Beta Bridge
      </div>
    </footer>
  );
}
