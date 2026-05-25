'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { NotificationBell } from '@/components/layout/NotificationBell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div id="dashboard-root" className="min-h-screen bg-brand-bg relative overflow-hidden">

      {/* ── TopBar — Slate Protocol ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-brand-bg/85 backdrop-blur-md border-b border-brand-border-subtle/70">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">

          {/* Logo + TaskFlow */}
          <div className="flex items-center gap-3 shrink-0">
            <a href="https://atomicgroup.com.br" target="_blank" rel="noopener noreferrer">
              <Image
                src="https://atomicgroup.com.br/wp-content/uploads/2024/12/Atomic-group-white.webp"
                alt="Atomic Group"
                width={952}
                height={304}
                className="h-6 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
                priority
              />
            </a>
            <span className="text-brand-border font-light">|</span>
            <Link href="/dashboard" className="font-heading text-sm font-bold text-brand-text-primary">
              Task<span className="text-brand-accent">Flow</span>
            </Link>
          </div>

          {/* Nav + Notificações */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-lg font-heading text-sm font-medium transition-colors ${
                pathname === '/dashboard'
                  ? 'text-brand-accent bg-brand-accent-muted/40'
                  : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-surface'
              }`}
            >
              Quadros
            </Link>
            <Link
              href="/dashboard/analytics"
              className={`px-3 py-1.5 rounded-lg font-heading text-sm font-medium transition-colors ${
                pathname === '/dashboard/analytics'
                  ? 'text-brand-accent bg-brand-accent-muted/40'
                  : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-surface'
              }`}
            >
              Análises
            </Link>
            <NotificationBell />
            <button
              type="button"
              onClick={async () => {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
                  method: 'POST',
                  credentials: 'include',
                });
                window.location.href = '/login';
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-heading text-sm text-brand-text-secondary hover:text-brand-error hover:bg-brand-error-subtle transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </nav>

        </div>
      </header>

      {/* Conteúdo com espaço para o header fixo */}
      <main className="max-w-screen-xl mx-auto px-3 sm:px-6 pt-20 pb-8">{children}</main>

    </div>
  );
}
