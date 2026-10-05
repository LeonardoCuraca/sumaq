'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock, User, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
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
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Ocurrió un error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-16 max-w-md mx-auto px-4 w-full">
      <div className="bg-[#131519] border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-sumaq-600/20 text-sumaq-400 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Acceso Salones & Aliados</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Ingresa para acceder a tus tarifas preferenciales y pedidos
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-zinc-300 mb-1">Correo Electrónico o RUC</label>
            <div className="relative">
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="salon@ejemplo.pe"
                className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2.5 pl-10 text-white focus:border-sumaq-500 focus:outline-none"
              />
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-300 mb-1">Contraseña</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#181a20] border border-white/10 rounded-xl px-3.5 py-2.5 pl-10 text-white focus:border-sumaq-500 focus:outline-none"
              />
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-sumaq-600 hover:bg-sumaq-500 text-white font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Validando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div className="mt-6 pt-6 border-t border-white/5 text-[11px] text-zinc-400 space-y-1 bg-white/[0.02] p-3 rounded-xl">
          <p className="font-bold text-zinc-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Cuentas de Acceso Rápido:
          </p>
          <p>
            • <strong>Salón Aliado:</strong> <code className="text-zinc-200">salon@demo.pe</code> / Contraseña:{' '}
            <code className="text-zinc-200">123456</code>
          </p>
          <p>
            • <strong>Admin SUMAQ:</strong> <code className="text-zinc-200">admin@sumaq.pe</code> / Contraseña:{' '}
            <code className="text-zinc-200">Lizze2026</code>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/trabaja-con-nosotros" className="text-xs text-sumaq-400 hover:underline">
            ¿Aún no eres Salón Aliado? Solicita tu afiliación aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
