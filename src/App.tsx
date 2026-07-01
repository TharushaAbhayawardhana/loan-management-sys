import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Loans } from './pages/Loans';
import { Ledger } from './pages/Ledger';
import { CashFlow } from './pages/CashFlow';
import { Reports } from './pages/Reports';
import { seedDatabaseIfEmpty } from './lib/db';
import { ScrollText } from 'lucide-react';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedDatabaseIfEmpty()
      .catch((err) => console.error('FFMS seed error:', err))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--color-paper)]">
        <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-xl bg-[var(--color-ink-900)] text-[var(--color-brass)]">
          <ScrollText size={26} />
        </div>
        <p className="font-display text-sm tracking-wide text-[var(--color-ink-faint)]">Opening the ledger…</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/cash-flow" element={<CashFlow />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
