'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, Menu, X, Zap } from 'lucide-react';

const NAV_ITEMS = [
  {
    label: 'Atomic Growth Club',
    href: 'https://atomicgroup.com.br/atomicgrowthclub/',
  },
  {
    label: 'Crescimento Atômico',
    children: [
      { label: 'Podcast',   href: 'https://open.spotify.com/show/51K62WIPZoPbTbpFu2MqpH' },
      { label: 'Instagram', href: 'https://www.instagram.com/crescimentoatomico/' },
      { label: 'LinkedIn',  href: 'https://www.linkedin.com/company/crescimento-at%C3%B4mico' },
    ],
  },
  { label: 'Atomic Ventures', href: 'https://www.instagram.com/atomic.ventures/' },
  { label: 'Atomic Apps',     href: 'https://lp.atomicapps.com.br/atomic-apps-solucoes-de-automacao-para-empresas' },
  { label: 'Br24',            href: 'https://br24.io/' },
] as const;

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-6 left-0 right-0 z-50 px-4">

      {/* ── Pílula principal ── */}
      <div className="mx-auto max-w-[960px] bg-[#1D1D1B]/50 backdrop-blur-md rounded-2xl px-6 py-3 flex items-center justify-between shadow-lg">

        {/* Logo oficial */}
        <a href="https://atomicgroup.com.br" target="_blank" rel="noopener noreferrer" className="shrink-0">
          <Image
            src="https://atomicgroup.com.br/wp-content/uploads/2024/12/Atomic-group-white.webp"
            alt="Atomic Group"
            width={952}
            height={304}
            className="h-8 md:h-10 w-auto object-contain"
            priority
          />
        </a>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            if ('children' in item) {
              return (
                <div key={item.label} className="relative group">
                  <button className="flex items-center gap-1 font-heading text-sm font-normal text-white/80 hover:text-white transition-colors">
                    {item.label}
                    <ChevronDown size={13} className="opacity-60 group-hover:rotate-180 transition-transform duration-200" />
                  </button>
                  <div className="absolute left-0 top-full hidden group-hover:block pt-3 min-w-[180px]">
                    <ul className="bg-[#1D1D1B]/95 backdrop-blur-md rounded-xl border border-white/10 py-1.5 shadow-xl">
                      {item.children.map((child) => (
                        <li key={child.label}>
                          <a
                            href={child.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block px-4 py-2.5 font-sans text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            {child.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            }
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-heading text-sm font-normal text-white/80 hover:text-white transition-colors"
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* CTA + burger */}
        <div className="flex items-center gap-3">
          <a
            href="#"
            className="hidden md:inline-flex items-center gap-2 bg-atomic-purple text-white font-heading font-bold text-xs rounded-lg px-5 py-2 hover:bg-atomic-purple/90 transition-colors"
          >
            <Zap size={12} className="fill-white" />
            SEJA EXTRAORDINÁRIO
          </a>
          <button
            className="md:hidden p-1.5 text-white/80 hover:text-white transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Alternar menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ── Menu mobile (segunda pílula) ── */}
      {mobileOpen && (
        <div className="md:hidden mt-2 mx-auto max-w-[960px] bg-[#1D1D1B]/95 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden">
          <ul className="py-3">
            {NAV_ITEMS.map((item) => {
              if ('children' in item) {
                return (
                  <li key={item.label}>
                    <p className="px-5 pt-3 pb-1 font-heading text-xs font-bold uppercase tracking-widest text-white/40">
                      {item.label}
                    </p>
                    {item.children.map((child) => (
                      <a
                        key={child.label}
                        href={child.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block pl-8 pr-5 py-2 font-sans text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.label}
                      </a>
                    ))}
                  </li>
                );
              }
              return (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-5 py-3 font-heading text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
          <div className="px-5 py-4 border-t border-white/10">
            <a
              href="#"
              className="flex items-center justify-center gap-2 bg-atomic-purple text-white font-heading font-bold text-sm rounded-lg px-6 py-3 w-full"
            >
              <Zap size={13} className="fill-white" />
              SEJA EXTRAORDINÁRIO
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
