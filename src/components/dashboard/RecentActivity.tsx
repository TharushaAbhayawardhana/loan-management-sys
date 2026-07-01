import type { Loan, PaymentLedger } from '../../lib/db';
import { formatLKR } from '../../lib/calculations';
import { formatDate } from '../../lib/utils';
import { EmptyState } from '../ui/EmptyState';
import { History, ArrowUpRight } from 'lucide-react';
import { buildAlertDeck } from '../../lib/notifications';

export function RecentActivity({ loans, payments }: { loans: Loan[]; payments: PaymentLedger[] }) {
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    .slice(0, 6);

  const alerts = buildAlertDeck(loans, payments).slice(0, 2);
  const loanById = new Map(loans.map((l) => [l.id, l]));

  if (recentPayments.length === 0 && alerts.length === 0) {
    return (
      <EmptyState
        icon={<History size={26} />}
        title="No activity yet"
        description="Recorded payments and critical alerts will appear here as a chronological log."
      />
    );
  }

  return (
    <div className="space-y-2.5">
      {alerts.map((alert) => (
        <div
          key={`alert-${alert.loanId}`}
          className="flex items-start gap-3 rounded-lg border border-[var(--color-crimson)]/25 bg-[var(--color-crimson-50)] px-4 py-3"
        >
          <ArrowUpRight size={16} className="mt-0.5 shrink-0 text-[var(--color-crimson)]" />
          <p className="text-sm text-[var(--color-crimson)]">
            <span className="font-semibold">Alert:</span> {alert.message}
          </p>
        </div>
      ))}

      {recentPayments.map((payment) => {
        const loan = loanById.get(payment.loanId);
        return (
          <div key={payment.id} className="flex items-center justify-between gap-3 rounded-lg px-4 py-3 hover:bg-[var(--color-paper-dim)] transition-colors">
            <div className="min-w-0">
              <p className="truncate text-sm text-[var(--color-ink)]">
                Paid <span className="tabular-figures font-semibold">{formatLKR(payment.amountPaid)}</span> to{' '}
                <span className="font-medium">{loan?.name ?? 'Unknown loan'}</span>
              </p>
              <p className="text-xs text-[var(--color-ink-faint)]">
                {formatDate(payment.paymentDate)} · Balance left: {formatLKR(payment.calculatedBalanceAfter)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
