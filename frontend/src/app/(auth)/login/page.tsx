'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const { mutate, isPending, isError } = useMutation({
    mutationFn: (data: FormData) => api.post('/auth/login', data),
    onSuccess: () => router.push('/dashboard'),
  });

  return (
    <div className="min-h-screen relative z-10 overflow-hidden flex items-center">

                                                                           

        {/* ── Card glassmorphism à esquerda (centralizado no mobile) ── */}
        <div className="relative z-10 w-full max-w-[468px] px-4 mx-auto">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-10">

            <div className="mb-8 text-center">
              <h1 className="font-heading text-2xl font-bold text-white drop-shadow">
                Task<span className="text-atomic-orange">Flow</span>
              </h1>
              <p className="font-sans text-white/70 mt-1 text-sm">
                Entre na sua conta
              </p>
            </div>

            <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="block font-sans text-sm font-medium text-white/90 mb-1.5">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="w-full px-4 py-2.5 bg-white/15 border border-white/25 rounded-lg font-sans text-sm text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-atomic-orange/60 focus:border-atomic-orange/50 transition-all"
                  placeholder="voce@exemplo.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-300">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block font-sans text-sm font-medium text-white/90 mb-1.5">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className="w-full px-4 py-2.5 bg-white/15 border border-white/25 rounded-lg font-sans text-sm text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-atomic-orange/60 focus:border-atomic-orange/50 transition-all"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-300">{errors.password.message}</p>
                )}
              </div>

              {isError && (
                <p className="text-sm text-red-300 text-center bg-red-500/20 border border-red-400/30 rounded-lg py-2 px-3">
                  E-mail ou senha inválidos. Tente novamente.
                </p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 px-4 bg-atomic-orange text-white font-heading font-bold text-sm rounded-lg hover:bg-atomic-orange/90 active:scale-[0.99] disabled:opacity-60 transition-all mt-2"
              >
                {isPending ? 'Entrando…' : 'Entrar'}
              </button>
            </form>

            <p className="mt-6 text-center font-sans text-sm text-white/60">
              Não tem uma conta?{' '}
              <Link href="/register" className="text-white hover:text-atomic-orange font-medium transition-colors">
                Criar conta
              </Link>
            </p>

          </div>
        </div>

    </div>
  );
}
