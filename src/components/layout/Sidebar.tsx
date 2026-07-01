import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Landmark, BookOpenText, Wallet, FileBarChart, ScrollText, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/loans', label: 'Loans Management', icon: Landmark },
  { to: '/ledger', label: 'Payment Ledger', icon: BookOpenText },
  { to: '/cash-flow', label: 'Cash Flow', icon: Wallet },
  { to: '/reports', label: 'Reports & Audit', icon: FileBarChart },
];

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[var(--color-ink-900)]/50 lg:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[var(--color-hairline)] bg-[var(--color-ink-900)] text-[var(--color-paper)]',
          'transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-brass)] text-[var(--color-ink-900)]">
              <ScrollText size={20} strokeWidth={2.25} />
            </div>
            <div>
              <p className="font-display text-lg font-semibold leading-tight text-white">FFMS</p>
              <p className="text-[11px] uppercase tracking-widest text-white/45">Family Ledger</p>
            </div>
          </div>
          <button onClick={onCloseMobile} className="text-white/60 hover:text-white lg:hidden" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex min-h-[44px] items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-[var(--color-brass)] text-[var(--color-ink-900)] shadow-[0_2px_10px_rgba(201,150,47,0.35)]'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-6 py-5">
          <p className="text-[11px] leading-relaxed text-white/40">
            Offline-first &amp; fully local.
            <br />
            No cloud sync. Your data stays on this device.
          </p>
        </div>
      </aside>
    </>
  );
}
