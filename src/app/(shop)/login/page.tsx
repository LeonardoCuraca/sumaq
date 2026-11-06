'use client';

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, User, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Credenciales incorrectas. Verifica tu correo o contraseña.');
      } else {
        const target =
          callbackUrl && callbackUrl.startsWith('/')
            ? callbackUrl
            : email.trim().toLowerCase() === 'admin@sumaq.pe'
            ? '/admin'
            : '/';
        router.push(target);
        router.refresh();
      }
    } catch {
      setError('Ocurrió un error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xl">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo-sumaq.png"
            alt="SUMAQ Importaciones"
            width={150}
            height={67}
            className="h-11 w-auto object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Acceso Salones & Administración</h1>
        <p className="text-xs text-slate-500 mt-1">
          Ingresa con tus credenciales para gestionar tus pedidos o consola administrativa
        </p>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
          <div className="relative">
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sumaq.pe"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 pl-10 text-slate-900 placeholder-slate-400 focus:border-sumaq-500 focus:outline-none"
            />
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Contraseña</label>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 pl-10 text-slate-900 placeholder-slate-400 focus:border-sumaq-500 focus:outline-none"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-sumaq-600 hover:bg-sumaq-500 text-white font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-sumaq-600/20"
        >
          {loading ? 'Validando...' : 'Iniciar Sesión'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link href="/trabaja-con-nosotros" className="text-xs text-sumaq-600 font-semibold hover:underline">
          ¿Aún no eres Salón Aliado? Solicita tu afiliación aquí
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="py-16 max-w-md mx-auto px-4 w-full">
      <Suspense fallback={<div className="h-96 bg-white rounded-3xl border border-slate-200 animate-pulse" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
