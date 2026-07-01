import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Family financial command center — updated in real time' },
  '/loans': { title: 'Loans Management', subtitle: 'Every liability, across all five taxonomy pillars' },
  '/ledger': { title: 'Payment Ledger', subtitle: 'Immutable chronological record of every payment made' },
  '/cash-flow': { title: 'Cash Flow', subtitle: 'Income, expenses, and net liquid cash on hand' },
  '/reports': { title: 'Reports & Audit', subtitle: 'Export, print, and back up your financial records' },
};

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const meta = PAGE_META[location.pathname] ?? { title: 'FFMS', subtitle: '' };

  return (
    <div className="paper-texture min-h-screen bg-[var(--color-paper)] lg:flex">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar title={meta.title} subtitle={meta.subtitle} onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
