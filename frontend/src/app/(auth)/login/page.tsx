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
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-stone-900">
          Task<span className="text-orange-600">Flow</span>
        </h1>
        <p className="text-stone-500 mt-1 text-sm">Entre na sua conta</p>
      </div>

      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="voce@exemplo.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1">
            Senha
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {isError && (
          <p className="text-sm text-red-600 text-center bg-red-50 rounded-lg py-2">
            E-mail ou senha inválidos. Tente novamente.
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 px-4 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 transition-all mt-2"
        >
          {isPending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        Não tem uma conta?{' '}
        <Link href="/register" className="text-orange-600 hover:underline font-medium">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
