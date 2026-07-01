import { Printer } from 'lucide-react';
import type { Loan, PaymentLedger, CashTransaction } from '../../lib/db';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  calculateNetLiquidCash,
  calculateOutstandingBalance,
  calculateTotalCumulativePaid,
  calculateTotalLiabilities,
  calculateTotalPaid,
  calculateTotalRemainingDebt,
  formatLKR,
  LOAN_CATEGORY_LABELS,
} from '../../lib/calculations';
import { formatDate } from '../../lib/utils';

export function PrintableAuditReport({
  loans,
  payments,
  cashTransactions,
}: {
  loans: Loan[];
  payments: PaymentLedger[];
  cashTransactions: CashTransaction[];
}) {
  const totalLiabilities = calculateTotalLiabilities(loans);
  const remainingDebt = calculateTotalRemainingDebt(loans, payments);
  const cumulativePaid = calculateTotalCumulativePaid(loans, payments);
  const netCash = calculateNetLiquidCash(cashTransactions);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Print-Ready Audit Report</CardTitle>
        <Button
          variant="secondary"
          size="sm"
          className="no-print"
          onClick={() => window.print()}
        >
          <Printer size={14} /> Print / Save PDF
        </Button>
      </CardHeader>
      <CardContent>
        <div id="ffms-print-report" className="space-y-6 rounded-lg border border-[var(--color-hairline)] bg-white p-6 text-[var(--color-ink)]">
          <div className="border-b border-[var(--color-hairline)] pb-4">
            <p className="font-display text-lg font-semibold">Family Financial Management System</p>
            <p className="text-xs text-[var(--color-ink-faint)]">Audit Report generated {formatDate(new Date())}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <SummaryStat label="Total Liabilities" value={formatLKR(totalLiabilities)} />
            <SummaryStat label="Remaining Debt" value={formatLKR(remainingDebt)} />
            <SummaryStat label="Cumulative Paid" value={formatLKR(cumulativePaid)} />
            <SummaryStat label="Net Liquid Cash" value={formatLKR(netCash)} />
          </div>

          <section>
            <p className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Loan Register
            </p>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-hairline)] text-left uppercase tracking-wide text-[var(--color-ink-faint)]">
                  <th className="py-1.5 pr-2">Name</th>
                  <th className="py-1.5 pr-2">Category</th>
                  <th className="py-1.5 pr-2">Lender</th>
                  <th className="py-1.5 pr-2 text-right">Principal</th>
                  <th className="py-1.5 pr-2 text-right">Paid</th>
                  <th className="py-1.5 pr-2 text-right">Balance</th>
                  <th className="py-1.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id} className="border-b border-[var(--color-hairline)]/60">
                    <td className="py-1.5 pr-2">{loan.name}</td>
                    <td className="py-1.5 pr-2">{LOAN_CATEGORY_LABELS[loan.category]}</td>
                    <td className="py-1.5 pr-2">{loan.lender}</td>
                    <td className="py-1.5 pr-2 text-right tabular-figures">{formatLKR(loan.originalAmount)}</td>
                    <td className="py-1.5 pr-2 text-right tabular-figures">{formatLKR(calculateTotalPaid(loan, payments))}</td>
                    <td className="py-1.5 pr-2 text-right tabular-figures">{formatLKR(calculateOutstandingBalance(loan, payments))}</td>
                    <td className="py-1.5 text-right capitalize">{loan.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <p className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
              Payment Ledger (Most Recent 25)
            </p>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-hairline)] text-left uppercase tracking-wide text-[var(--color-ink-faint)]">
                  <th className="py-1.5 pr-2">Date</th>
                  <th className="py-1.5 pr-2">Loan</th>
                  <th className="py-1.5 pr-2 text-right">Amount</th>
                  <th className="py-1.5 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody>
                {[...payments]
                  .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                  .slice(0, 25)
                  .map((p) => (
                    <tr key={p.id} className="border-b border-[var(--color-hairline)]/60">
                      <td className="py-1.5 pr-2">{formatDate(p.paymentDate)}</td>
                      <td className="py-1.5 pr-2">{loans.find((l) => l.id === p.loanId)?.name ?? 'Unknown'}</td>
                      <td className="py-1.5 pr-2 text-right tabular-figures">{formatLKR(p.amountPaid)}</td>
                      <td className="py-1.5 text-right tabular-figures">{formatLKR(p.calculatedBalanceAfter)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-faint)]">{label}</p>
      <p className="tabular-figures text-sm font-semibold">{value}</p>
    </div>
  );
}
