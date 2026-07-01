import { Menu, Bell, WifiOff } from 'lucide-react';
import { useState } from 'react';
import { useAllLoansWithPayments } from '../../hooks/useLoanCalculator';
import { buildAlertDeck } from '../../lib/notifications';
import { statusToTone, Badge } from '../ui/Badge';
import { formatCompactLKR } from '../../lib/calculations';

export function TopBar({ title, subtitle, onOpenMobile }: { title: string; subtitle?: string; onOpenMobile: () => void }) {
  const data = useAllLoansWithPayments();
  const [showAlerts, setShowAlerts] = useState(false);
  const alerts = data ? buildAlertDeck(data.loans, data.payments) : [];
  const overdueCount = alerts.filter((a) => a.severity === 'overdue').length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[var(--color-hairline)] bg-[var(--color-paper)]/90 px-4 py-4 backdrop-blur-md sm:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-dim)] lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="font-display text-xl font-semibold text-[var(--color-ink)] sm:text-2xl">{title}</h1>
          {subtitle && <p className="text-xs text-[var(--color-ink-faint)] sm:text-sm">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden items-center gap-1.5 rounded-full border border-[var(--color-hairline)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-faint)] sm:flex">
          <WifiOff size={13} /> Offline Stable
        </span>

        <div className="relative">
          <button
            onClick={() => setShowAlerts((v) => !v)}
            aria-label="View alerts"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-hairline)] text-[var(--color-ink-soft)] hover:border-[var(--color-brass)] hover:text-[var(--color-brass-dark)] transition-colors cursor-pointer"
          >
            <Bell size={18} />
            {alerts.length > 0 && (
              <span
                className={
                  'absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ' +
                  (overdueCount > 0 ? 'bg-[var(--color-crimson)]' : 'bg-[var(--color-brass)]')
                }
              >
                {alerts.length}
              </span>
            )}
          </button>

          {showAlerts && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowAlerts(false)} />
              <div className="absolute right-0 z-40 mt-2 w-80 animate-rise rounded-xl border border-[var(--color-hairline)] bg-[var(--color-paper-card)] p-2 shadow-[var(--shadow-card-lg)]">
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
                  Critical Alerts &amp; Due Dates
                </p>
                {alerts.length === 0 && (
                  <p className="px-3 py-4 text-sm text-[var(--color-ink-faint)]">No alerts. All accounts current.</p>
                )}
                <div className="max-h-80 space-y-1 overflow-y-auto">
                  {alerts.map((a) => (
                    <div key={a.loanId} className="rounded-lg px-3 py-2.5 hover:bg-[var(--color-paper-dim)]">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-[var(--color-ink)]">{a.loanName}</p>
                        <Badge tone={statusToTone(a.severity === 'overdue' ? 'overdue' : 'active')}>
                          {a.severity === 'overdue' ? 'Overdue' : `${a.daysUntilDue}d`}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--color-ink-faint)]">
                        {a.lender} · Balance {formatCompactLKR(a.outstandingBalance)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
