import type { Metadata } from 'next';
import { Roboto, Cabin } from 'next/font/google';
import { Providers } from '@/lib/providers';
import './globals.css';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
});

const cabin = Cabin({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-cabin',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TaskFlow — Gerenciamento de Tarefas Kanban',
  description: 'Gerencie tarefas do seu time com Kanban, análises e alertas de prazo por e-mail',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${roboto.variable} ${cabin.variable}`}>
      <body className="font-sans bg-atomic-light text-atomic-dark antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
