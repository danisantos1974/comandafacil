'use client';

import { Coffee, KeyRound, Lock, LogIn, Mail, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/mesas';

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !senha.trim()) {
      setError('Por favor, informe e-mail e senha.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Credenciais inválidas. Tente novamente.');
        setLoading(false);
        return;
      }

      // Sucesso!
      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      setError('Ocorreu um erro de rede. Tente novamente.');
      setLoading(false);
    }
  };

  const fillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setSenha(userPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-xl shadow-orange-500/30 mb-4 animate-bounce">
          <Coffee className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Comanda<span className="text-orange-400">Fácil</span>
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Sistema de gerenciamento de comandas e mesas
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-white/20">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@restaurante.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-orange-500/25 text-sm font-semibold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition disabled:opacity-60 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Entrando no sistema...' : 'Entrar no Sistema'}</span>
            </button>
          </form>

          {/* Atalhos Rápidos para Demonstração / Avaliação */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Acesso Rápido para Teste
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fillCredentials('atendente@comanda.com', 'atendente123')}
                className="flex flex-col items-center justify-center p-2.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 border border-slate-200 rounded-xl transition text-center group cursor-pointer"
              >
                <span className="font-semibold text-sky-600 group-hover:scale-105 transition-transform flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Atendente
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">atendente@comanda.com</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('admin@comanda.com', 'admin123')}
                className="flex flex-col items-center justify-center p-2.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 border border-slate-200 rounded-xl transition text-center group cursor-pointer"
              >
                <span className="font-semibold text-purple-600 group-hover:scale-105 transition-transform flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5" /> Administrador
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">admin@comanda.com</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-3">
              Senha padrão dos perfis: <span className="font-mono text-slate-600">atendente123</span> / <span className="font-mono text-slate-600">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
