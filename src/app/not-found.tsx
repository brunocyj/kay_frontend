import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-32 flex flex-col items-center text-center gap-4">
      <span className="text-6xl font-bold text-gray-100">404</span>
      <p className="text-gray-400 text-sm">Esta página não existe.</p>
      <Link href="/" className="text-sm text-gray-900 underline underline-offset-4 hover:opacity-70">
        Voltar ao início
      </Link>
    </div>
  );
}
