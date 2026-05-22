import Link from 'next/link';
import { LayoutGrid, BarChart2, BellRing } from 'lucide-react';
import { Header } from '@/components/layout/Header';

export default function Home() {
  return (
    <>
      <Header />

      <main className="min-h-screen relative z-10 overflow-hidden flex items-center">


        {/* ── Conteúdo centralizado ── */}
        <div className="relative z-10 w-full max-w-xl px-6 mx-auto text-center">

          <div className="mb-10">
            <h1 className="font-heading text-6xl font-bold text-white drop-shadow mb-5">
              Task<span className="text-atomic-orange">Flow</span>
            </h1>
            <p className="font-sans text-xl text-white/75 leading-relaxed">
              Gerenciamento de tarefas com Kanban, análises em tempo real e alertas de prazo por e-mail
            </p>
          </div>

          <div className="flex gap-4 justify-center mb-14">
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-3.5 bg-atomic-orange text-white font-heading font-bold text-base rounded-lg hover:bg-atomic-orange/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center px-8 py-3.5 bg-white/15 backdrop-blur-sm border border-white/30 text-white font-heading font-bold text-base rounded-lg hover:bg-white/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Criar conta
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-[calc(100%+20px)] -mx-[10px]">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 hover:-translate-y-0.5 transition-all text-left">
              <LayoutGrid size={28} className="text-atomic-orange mb-3" />
              <h3 className="font-heading font-bold text-white text-base mb-1">Quadro Kanban</h3>
              <p className="font-sans text-sm text-white/60">Arraste cards por 4 colunas de forma intuitiva</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 hover:-translate-y-0.5 transition-all text-left">
              <BarChart2 size={28} className="text-atomic-orange mb-3" />
              <h3 className="font-heading font-bold text-white text-base mb-1">Análises</h3>
              <p className="font-sans text-sm text-white/60">Gráficos, tarefas atrasadas e carga do time</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 hover:-translate-y-0.5 transition-all text-left">
              <BellRing size={28} className="text-atomic-orange mb-3" />
              <h3 className="font-heading font-bold text-white text-base mb-1">Alertas Inteligentes</h3>
              <p className="font-sans text-sm text-white/60">E-mails automáticos 24h antes dos prazos</p>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
