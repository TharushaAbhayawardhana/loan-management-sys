import { useMemo, useState } from 'react';
import { ArrowUpDown, BookOpenText, Plus, Trash2 } from 'lucide-react';
import { useAllLoansWithPaymentsRealtime } from '../hooks/useFirestoreData';
import { deletePayment } from '../lib/firestore-service';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { formatLKR } from '../lib/calculations';
import { formatDate } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Field';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { PaymentFormModal } from '../components/loans/PaymentFormModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import type { PaymentLedger } from '../lib/db';

type SortKey = 'date' | 'amount' | 'loan';
type SortDir = 'asc' | 'desc';

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  counter_deposit: 'Counter Deposit',
  other: 'Other',
};

export function Ledger() {
  const { householdId } = useAuth();
  const { toast } = useToast();
  const { loans, payments, isLoading } = useAllLoansWithPaymentsRealtime();
  const [loanFilter, setLoanFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PaymentLedger | undefined>(undefined);

  const loanById = useMemo(() => new Map(loans.map((l) => [l.id, l])), [loans]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-full rounded-lg bg-[var(--color-paper-dim)]" />
        <div className="h-64 rounded-xl bg-[var(--color-paper-dim)]" />
      </div>
    );
  }

  let filtered = payments.filter((p) => {
    if (loanFilter !== 'all' && p.loanId !== loanFilter) return false;
    const pd = new Date(p.paymentDate);
    if (fromDate && pd < new Date(fromDate)) return false;
    if (toDate && pd > new Date(new Date(toDate).setHours(23, 59, 59, 999))) return false;
    return true;
  });

  filtered = filtered.sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'date') cmp = new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime();
    else if (sortKey === 'amount') cmp = a.amountPaid - b.amountPaid;
    else if (sortKey === 'loan') cmp = (loanById.get(a.loanId)?.name ?? '').localeCompare(loanById.get(b.loanId)?.name ?? '');
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalFiltered = filtered.reduce((sum, p) => sum + p.amountPaid, 0);

  const handleDelete = async (payment: PaymentLedger) => {
    if (!payment.id || !householdId) return;
    const result = await deletePayment(householdId, payment.id, payment.loanId, payment.paymentDate, payment.amountPaid);
    if (!result.success) {
      toast(result.error, 'error');
    } else {
      toast('Payment entry deleted.', 'success');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          <Select value={loanFilter} onChange={(e) => setLoanFilter(e.target.value)} className="col-span-2 sm:col-span-1">
            <option value="all">All Loans</option>
            {loans.map((loan) => (
              <option key={loan.id} value={loan.id}>
                {loan.name}
              </option>
            ))}
          </Select>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} aria-label="From date" />
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} aria-label="To date" />
        </div>
        <Button onClick={() => setPaymentModalOpen(true)}>
          <Plus size={16} /> Record Payment
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--color-hairline)] px-5 py-3">
          <p className="text-sm text-[var(--color-ink-faint)]">
            {filtered.length} payment{filtered.length === 1 ? '' : 's'} · Total {formatLKR(totalFiltered)}
          </p>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<BookOpenText size={28} />}
            title="No ledger entries"
            description="Adjust filters or record a payment to build the chronological log."
          />
        ) : (
          <>
            {/* Desktop table - hidden on small screens */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-hairline)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-faint)]">
                    <th className="px-5 py-3">
                      <button onClick={() => toggleSort('date')} className="flex items-center gap-1 cursor-pointer hover:text-[var(--color-brass-dark)]">
                        Date <ArrowUpDown size={12} />
                      </button>
                    </th>
                    <th className="px-5 py-3">
                      <button onClick={() => toggleSort('loan')} className="flex items-center gap-1 cursor-pointer hover:text-[var(--color-brass-dark)]">
                        Loan <ArrowUpDown size={12} />
                      </button>
                    </th>
                    <th className="px-5 py-3 hidden sm:table-cell">Method</th>
                    <th className="px-5 py-3">
                      <button onClick={() => toggleSort('amount')} className="flex items-center gap-1 cursor-pointer hover:text-[var(--color-brass-dark)]">
                        Amount <ArrowUpDown size={12} />
                      </button>
                    </th>
                    <th className="px-5 py-3 hidden md:table-cell">Balance After</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((payment) => {
                    const loan = loanById.get(payment.loanId);
                    return (
                      <tr key={payment.id} className="border-b border-[var(--color-hairline)] last:border-0 hover:bg-[var(--color-paper-dim)]/50">
                        <td className="px-5 py-3.5 whitespace-nowrap text-[var(--color-ink-soft)]">{formatDate(payment.paymentDate)}</td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-[var(--color-ink)]">{loan?.name ?? 'Unknown'}</p>
                          <p className="text-xs text-[var(--color-ink-faint)]">{loan?.lender}</p>
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <Badge tone="neutral">{METHOD_LABELS[payment.paymentMethod]}</Badge>
                        </td>
                        <td className="tabular-figures px-5 py-3.5 font-semibold text-[var(--color-emerald)]">
                          {formatLKR(payment.amountPaid)}
                        </td>
                        <td className="tabular-figures px-5 py-3.5 hidden md:table-cell text-[var(--color-ink-faint)]">
                          {formatLKR(payment.calculatedBalanceAfter)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => setDeleteTarget(payment)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-faint)] hover:bg-[var(--color-crimson-50)] hover:text-[var(--color-crimson)] cursor-pointer"
                            aria-label="Delete payment entry"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card list - visible only on small screens */}
            <div className="divide-y divide-[var(--color-hairline)] sm:hidden">
              {filtered.map((payment) => {
                const loan = loanById.get(payment.loanId);
                return (
                  <div key={payment.id} className="px-4 py-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-[var(--color-ink)]">{loan?.name ?? 'Unknown'}</p>
                        <p className="text-xs text-[var(--color-ink-faint)]">{loan?.lender}</p>
                      </div>
                      <Badge tone="neutral">{METHOD_LABELS[payment.paymentMethod]}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--color-ink-faint)]">{formatDate(payment.paymentDate)}</span>
                      <span className="tabular-figures text-sm font-semibold text-[var(--color-emerald)]">
                        {formatLKR(payment.amountPaid)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--color-ink-faint)]">
                        Balance after: {formatLKR(payment.calculatedBalanceAfter)}
                      </span>
                      <button
                        onClick={() => setDeleteTarget(payment)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-faint)] hover:bg-[var(--color-crimson-50)] hover:text-[var(--color-crimson)] cursor-pointer"
                        aria-label="Delete payment entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      <PaymentFormModal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(undefined)}
        onConfirm={async () => {
          if (deleteTarget) await handleDelete(deleteTarget);
        }}
        title="Delete this ledger entry?"
        description="Per the immutable accounting log policy, corrections are handled via deletion and re-entry. This will recalculate the loan's outstanding balance."
      />
    </div>
  );
}
