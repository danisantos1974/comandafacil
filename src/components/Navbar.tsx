'use client';

import { AuthSession } from '@/lib/types';
import {
  Coffee,
  Database,
  Grid,
  LogOut,
  Menu,
  Package,
  Receipt,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [dbStatus, setDbStatus] = useState<{ isNeon: boolean; type: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // Carregar sessão
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) {
          setSession(data.user);
        }
      })
      .catch(() => {});

    // Carregar status do banco
    fetch('/api/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.database) {
          setDbStatus(data.database);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Erro ao sair:', err);
      setLoggingOut(false);
    }
  };

  const isActive = (path: string) => {
    if (path === '/mesas' && (pathname === '/mesas' || pathname.startsWith('/comanda/'))) {
      return true;
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link
              href="/mesas"
              className="flex items-center gap-2.5 font-bold text-xl text-slate-900 group transition"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <Coffee className="w-5 h-5" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="tracking-tight text-slate-900">
                  Comanda<span className="text-orange-600">Fácil</span>
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                  Gestão Gastronômica
                </span>
              </div>
            </Link>

            {/* Status do Banco de Dados */}
            {dbStatus && (
              <div className="hidden lg:flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <span
                  className={`w-2 h-2 rounded-full ${
                    dbStatus.isNeon ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <Database className="w-3 h-3 text-slate-400" />
                <span>{dbStatus.isNeon ? 'Neon PostgreSQL' : 'Local / Demo'}</span>
              </div>
            )}
          </div>

          {/* Links Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/mesas"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                isActive('/mesas')
                  ? 'bg-orange-50 text-orange-600 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Mesas</span>
            </Link>

            <Link
              href="/comandas"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                isActive('/comandas')
                  ? 'bg-orange-50 text-orange-600 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Comandas</span>
            </Link>

            {/* Administrador Menu */}
            {session?.tipo === 'administrador' && (
              <Link
                href="/produtos"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/produtos')
                    ? 'bg-orange-50 text-orange-600 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Produtos</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                  Admin
                </span>
              </Link>
            )}
          </nav>

          {/* Usuário e Logout */}
          <div className="hidden md:flex items-center gap-3">
            {session && (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-800 leading-none">
                    {session.nome}
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    {session.tipo === 'administrador' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                        <ShieldCheck className="w-3 h-3 text-purple-600" />
                        Administrador
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                        <User className="w-3 h-3 text-sky-600" />
                        Atendente
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  title="Sair do sistema"
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition border border-slate-200 hover:border-rose-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Botão Mobile Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {session && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold text-sm text-slate-900">{session.nome}</div>
                <div className="text-xs text-slate-500">{session.email}</div>
              </div>
              <div>
                {session.tipo === 'administrador' ? (
                  <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded-md">
                    Admin
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-1 rounded-md">
                    Atendente
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Link
              href="/mesas"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                isActive('/mesas') ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-slate-700'
              }`}
            >
              <Grid className="w-5 h-5" />
              <span>Mesas</span>
            </Link>

            <Link
              href="/comandas"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                isActive('/comandas') ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-slate-700'
              }`}
            >
              <Receipt className="w-5 h-5" />
              <span>Histórico de Comandas</span>
            </Link>

            {session?.tipo === 'administrador' && (
              <Link
                href="/produtos"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive('/produtos') ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-slate-700'
                }`}
              >
                <Package className="w-5 h-5" />
                <span>Gerenciar Produtos</span>
              </Link>
            )}
          </div>

          {dbStatus && (
            <div className="text-xs text-slate-500 flex items-center gap-2 pt-2 border-t border-slate-100">
              <span
                className={`w-2 h-2 rounded-full ${
                  dbStatus.isNeon ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>Banco: {dbStatus.isNeon ? 'Neon PostgreSQL' : 'Local / Demonstração'}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition border border-rose-200"
            >
              <LogOut className="w-4 h-4" />
              <span>{loggingOut ? 'Saindo...' : 'Sair da Conta'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
