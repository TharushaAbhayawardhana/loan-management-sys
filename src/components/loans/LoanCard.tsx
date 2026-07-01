import { Pencil, Trash2, ReceiptText, CalendarDays } from 'lucide-react';
import type { Loan, PaymentLedger } from '../../lib/db';
import { calculateOutstandingBalance, calculatePercentPaid, deriveLoanStatus, formatLKR, LOAN_CATEGORY_LABELS } from '../../lib/calculations';
import { daysUntilNextDue } from '../../lib/calculations';
import { Badge, statusToTone } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export function LoanCard({
  loan,
  payments,
  onEdit,
  onDelete,
  onRecordPayment,
}: {
  loan: Loan;
  payments: PaymentLedger[];
  onEdit: () => void;
  onDelete: () => void;
  onRecordPayment: () => void;
}) {
  const balance = calculateOutstandingBalance(loan, payments);
  const percentPaid = calculatePercentPaid(loan, payments);
  const effectiveStatus = deriveLoanStatus(loan, payments);
  const daysLeft = daysUntilNextDue(loan);
  const settled = balance <= 0;

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold text-[var(--color-ink)]">{loan.name}</p>
          <p className="text-xs text-[var(--color-ink-faint)]">{loan.lender}</p>
        </div>
        <Badge tone={statusToTone(effectiveStatus)}>{effectiveStatus}</Badge>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-ink-faint)]">
        <span className="rounded-full bg-[var(--color-paper-dim)] px-2 py-0.5 uppercase tracking-wide">
          {LOAN_CATEGORY_LABELS[loan.category]}
        </span>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <span className="tabular-figures text-xl font-semibold text-[var(--color-ink)]">{formatLKR(balance)}</span>
          <span className="text-xs text-[var(--color-ink-faint)]">of {formatLKR(loan.originalAmount)}</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-paper-dim)]">
          <div
            className="h-full rounded-full bg-[var(--color-emerald)] transition-all duration-500"
            style={{ width: `${percentPaid}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-[var(--color-ink-faint)]">{percentPaid.toFixed(1)}% repaid</p>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-[var(--color-paper-dim)] px-3 py-2 text-xs">
        <span className="flex items-center gap-1.5 text-[var(--color-ink-soft)]">
          <CalendarDays size={13} /> Due day {loan.dueDateDayOfMonth}
        </span>
        <span className={effectiveStatus === 'overdue' ? 'font-semibold text-[var(--color-crimson)]' : 'text-[var(--color-ink-faint)]'}>
          {settled ? 'Fully settled' : effectiveStatus === 'overdue' ? 'Overdue now' : `${daysLeft}d remaining`}
        </span>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" variant="success" className="flex-1" onClick={onRecordPayment} disabled={settled}>
          <ReceiptText size={14} /> Pay
        </Button>
        <Button size="sm" variant="secondary" onClick={onEdit} aria-label="Edit loan">
          <Pencil size={14} />
        </Button>
        <Button size="sm" variant="danger" onClick={onDelete} aria-label="Delete loan">
          <Trash2 size={14} />
        </Button>
      </div>
    </Card>
  );
}
