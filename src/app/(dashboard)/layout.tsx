import { SessionProvider } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-zinc-950">
        <Sidebar />
        <div className="lg:pl-64">
          <Header />
          <main className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
