import type { ReactNode } from 'react';
import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'Círculo · Panel de moderación',
  description: 'Panel interno de moderación y operación.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <nav aria-label="Navegación principal">
          <Link href="/">Resumen</Link>
          <Link href="/reports">Reportes</Link>
          <Link href="/users">Usuarios</Link>
          <Link href="/metrics">Métricas</Link>
          <Link href="/audit">Auditoría</Link>
          <Link href="/flags">Funcionalidades</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
