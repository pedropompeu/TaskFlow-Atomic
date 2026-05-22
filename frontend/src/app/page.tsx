import Link from 'next/link';

export default function Home() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-[#FFFCF7] overflow-hidden">
      {/* Animated blobs */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 w-96 h-96 bg-orange-400/25 rounded-full filter blur-3xl animate-blob" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 w-80 h-80 bg-amber-400/25 rounded-full filter blur-3xl animate-blob animation-delay-2000" />
      <div className="pointer-events-none absolute bottom-1/4 left-1/3 w-72 h-72 bg-red-400/15 rounded-full filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 text-center max-w-2xl px-6">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-stone-900 mb-4">
            Task<span className="text-orange-600">Flow</span>
          </h1>
          <p className="text-xl text-stone-600">
            Gerenciamento de tarefas com Kanban, análises em tempo real e alertas de prazo por e-mail
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 text-base font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm shadow-orange-200"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center px-6 py-3 border border-stone-200 text-base font-medium rounded-lg text-stone-700 bg-white hover:bg-stone-50 hover:border-orange-300 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
          >
            Criar conta
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-6 text-left">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-sm border border-stone-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="text-2xl mb-2">🗂️</div>
            <h3 className="font-semibold text-stone-900 mb-1">Quadro Kanban</h3>
            <p className="text-sm text-stone-500">Arraste cards por 4 colunas de forma intuitiva</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-sm border border-stone-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-stone-900 mb-1">Análises</h3>
            <p className="text-sm text-stone-500">Gráficos, tarefas atrasadas e carga do time</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-sm border border-stone-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="text-2xl mb-2">🔔</div>
            <h3 className="font-semibold text-stone-900 mb-1">Alertas Inteligentes</h3>
            <p className="text-sm text-stone-500">E-mails automáticos 24h antes dos prazos</p>
          </div>
        </div>
      </div>
    </main>
  );
}
