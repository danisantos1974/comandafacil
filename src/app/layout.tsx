import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Comanda Fácil - Sistema de Gerenciamento de Restaurantes',
  description: 'Controle ágil e descomplicado de comandas, mesas e produtos para bares, lanchonetes e restaurantes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-orange-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
