'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-atomic-ice relative overflow-hidden">

      {/* ── Aurora — blobs animados no fundo ── */}
      <div className="pointer-events-none fixed inset-0 -z-[5] overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[520px] h-[520px] rounded-full bg-atomic-purple/10 blur-3xl animate-aurora-1" />
        <div className="absolute top-1/2 right-1/4 w-[420px] h-[420px] rounded-full bg-atomic-orange/10 blur-3xl animate-aurora-2" />
        <div className="absolute bottom-1/4 left-2/3 w-[380px] h-[380px] rounded-full bg-atomic-yellow/8 blur-3xl animate-aurora-3" />
      </div>

      {/* ── Header — pílula escura (mesmo padrão do Header público) ── */}
      <header className="fixed top-6 left-0 right-0 z-50 px-4">
        <div className="mx-auto max-w-[960px] bg-[#1D1D1B]/50 backdrop-blur-md rounded-2xl px-8 py-4 flex items-center justify-between shadow-lg">

          {/* Logo + TaskFlow */}
          <div className="flex items-center gap-3 shrink-0">
            <a href="https://atomicgroup.com.br" target="_blank" rel="noopener noreferrer">
              <Image
                src="https://atomicgroup.com.br/wp-content/uploads/2024/12/Atomic-group-white.webp"
                alt="Atomic Group"
                width={952}
                height={304}
                className="h-7 w-auto object-contain"
                priority
              />
            </a>
            <span className="text-white/25 font-light">|</span>
            <Link href="/dashboard" className="font-heading text-base font-bold text-white">
              Task<span className="text-atomic-orange">Flow</span>
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className={`font-heading text-sm transition-colors ${
                pathname === '/dashboard'
                  ? 'text-atomic-orange border-b border-atomic-orange pb-0.5'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Quadro
            </Link>
            <Link
              href="/dashboard/analytics"
              className={`font-heading text-sm transition-colors ${
                pathname === '/dashboard/analytics'
                  ? 'text-atomic-orange border-b border-atomic-orange pb-0.5'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Análises
            </Link>
            <button
              type="button"
              onClick={async () => {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
                  method: 'POST',
                  credentials: 'include',
                });
                window.location.href = '/login';
              }}
              className="flex items-center gap-1.5 font-heading text-sm text-white/70 hover:text-red-400 transition-colors"
            >
              <LogOut size={14} />
              Sair
            </button>
          </nav>

        </div>
      </header>

      {/* Conteúdo com espaço para o header fixo */}
      <main className="max-w-screen-xl mx-auto px-6 pt-28 pb-6">{children}</main>

    </div>
  );
}
