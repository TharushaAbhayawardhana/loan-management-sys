import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Landmark, BookOpenText, Wallet, FileBarChart, ScrollText, X, LogOut, Users } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../lib/auth';
import { getHouseholdInviteCode } from '../../lib/firestore-service';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/loans', label: 'Loans Management', icon: Landmark },
  { to: '/ledger', label: 'Payment Ledger', icon: BookOpenText },
  { to: '/cash-flow', label: 'Cash Flow', icon: Wallet },
  { to: '/reports', label: 'Reports & Audit', icon: FileBarChart },
];

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const { user, householdId, signOut } = useAuth();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShowInvite = async () => {
    if (!householdId) return;
    setShowInvite(true);
    const code = await getHouseholdInviteCode(householdId);
    setInviteCode(code);
  };

  const handleCopy = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

        {showInvite && inviteCode && (
          <div className="border-t border-white/10 px-4 py-4">
            <p className="mb-2 text-[11px] uppercase tracking-wider text-white/50">Household Invite Code</p>
            <button
              onClick={handleCopy}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-center font-mono text-sm tracking-widest text-[var(--color-brass-light)] hover:bg-white/10 cursor-pointer"
            >
              {copied ? 'Copied!' : inviteCode}
            </button>
          </div>
        )}

        <div className="border-t border-white/10 px-4 py-4">
          {user && (
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-white/80">
                {user.email?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/80">{user.email}</p>
                <button
                  onClick={handleShowInvite}
                  className="flex items-center gap-1 text-[11px] text-white/40 hover:text-[var(--color-brass-light)]"
                >
                  <Users size={11} /> Invite family
                </button>
              </div>
            </div>
          )}
          <button
            onClick={signOut}
            className="flex w-full min-h-[44px] items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium text-white/50 transition-colors hover:bg-white/10 hover:text-white/80 cursor-pointer"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
