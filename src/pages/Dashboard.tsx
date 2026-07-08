import { useState } from 'react';
import { Landmark, TrendingDown, PiggyBank, CalendarClock, Wallet2, ShieldCheck, AlertTriangle, Plus, ReceiptText, Banknote } from 'lucide-react';
import { useAllLoansWithPaymentsRealtime, useCashTransactionsRealtime } from '../hooks/useFirestoreData';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DebtDistributionChart } from '../components/dashboard/DebtDistributionChart';
import { BurndownChart } from '../components/dashboard/BurndownChart';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import {
  calculateAggregatedMonthlyCommitment,
  calculateNetLiquidCash,
  calculateTotalCumulativePaid,
  calculateTotalLiabilities,
  calculateTotalRemainingDebt,
  formatLKR,
} from '../lib/calculations';
import { buildAlertDeck } from '../lib/notifications';
import { LoanFormModal } from '../components/loans/LoanFormModal';
import { PaymentFormModal } from '../components/loans/PaymentFormModal';
import { CashTransactionFormModal } from '../components/cash/CashTransactionFormModal';

export function Dashboard() {
  const { loans, payments, isLoading } = useAllLoansWithPaymentsRealtime();
  const { data: cashData } = useCashTransactionsRealtime();
  const cashTransactions = cashData ?? [];

  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [cashModalOpen, setCashModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-[var(--color-paper-dim)]" />
          ))}
        </div>
      </div>
    );
  }

  const totalLiabilities = calculateTotalLiabilities(loans);
  const remainingDebt = calculateTotalRemainingDebt(loans, payments);
  const cumulativePaid = calculateTotalCumulativePaid(loans, payments);
  const monthlyCommitment = calculateAggregatedMonthlyCommitment(loans);
  const netLiquidCash = calculateNetLiquidCash(cashTransactions);
  const alerts = buildAlertDeck(loans, payments);
  const overdueCount = alerts.filter((a) => a.severity === 'overdue').length;
  const upcomingCount = alerts.filter((a) => a.severity === 'upcoming').length;

  return (
    <div className="space-y-8">
      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Liabilities" value={formatLKR(totalLiabilities)} icon={<Landmark size={18} />} delay={0} />
          <StatCard
            label="Remaining Debt"
            value={formatLKR(remainingDebt)}
            icon={<TrendingDown size={18} />}
            tone="crimson"
            delay={60}
          />
          <StatCard
            label="Cumulative Paid"
            value={formatLKR(cumulativePaid)}
            icon={<PiggyBank size={18} />}
            tone="emerald"
            delay={120}
          />
          <StatCard
            label="Net Monthly Commitment"
            value={formatLKR(monthlyCommitment)}
            icon={<CalendarClock size={18} />}
            tone="brass"
            delay={180}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Critical Alerts"
            value={`${alerts.length} Active`}
            sublabel={`${overdueCount} overdue · ${upcomingCount} upcoming`}
            icon={<AlertTriangle size={18} />}
            tone={overdueCount > 0 ? 'crimson' : 'brass'}
            delay={240}
          />
          <StatCard label="Active Liquid Cash" value={formatLKR(netLiquidCash)} icon={<Wallet2 size={18} />} tone="emerald" delay={300} />
          <StatCard label="System Health" value={netLiquidCash >= 0 ? 'Healthy' : 'Review Needed'} icon={<ShieldCheck size={18} />} tone="emerald" delay={360} />
          <StatCard
            label="Overdue Accounts"
            value={`${overdueCount} Critical`}
            icon={<AlertTriangle size={18} />}
            tone={overdueCount > 0 ? 'crimson' : 'ink'}
            delay={420}
          />
        </div>
      </section>

      {loans.length === 0 && (
        <div className="rounded-xl border border-[var(--color-brass)]/25 bg-[var(--color-brass-50)] px-6 py-8 text-center animate-rise" style={{ animationDelay: '480ms' }}>
          <Landmark size={32} className="mx-auto mb-3 text-[var(--color-brass-dark)] opacity-70" />
          <p className="font-display text-lg font-semibold text-[var(--color-ink)]">Welcome to FFMS</p>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-[var(--color-ink-soft)]">
            Track loans across five taxonomy pillars — <strong>Bank, Interest, Gold, Personal, Other</strong>.
            Add your first loan to see your dashboard populate with metrics, charts, and payment tracking.
          </p>
          <Button className="mt-5" onClick={() => setLoanModalOpen(true)}>
            <Plus size={16} /> Add Your First Loan
          </Button>
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="animate-rise" style={{ animationDelay: loans.length === 0 ? '600ms' : '480ms' } as React.CSSProperties}>
          <CardHeader>
            <CardTitle>Debt Distribution by Taxonomy</CardTitle>
          </CardHeader>
          <CardContent>
            <DebtDistributionChart loans={loans} payments={payments} />
          </CardContent>
        </Card>

        <Card className="animate-rise" style={{ animationDelay: loans.length === 0 ? '660ms' : '540ms' } as React.CSSProperties}>
          <CardHeader>
            <CardTitle>Monthly Liability Burndown</CardTitle>
          </CardHeader>
          <CardContent>
            <BurndownChart loans={loans} payments={payments} />
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="animate-rise lg:col-span-1" style={{ animationDelay: '600ms' } as React.CSSProperties}>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" onClick={() => setLoanModalOpen(true)}>
              <Plus size={16} /> Add New Loan Entity
            </Button>
            <Button variant="success" className="w-full justify-start" onClick={() => setPaymentModalOpen(true)}>
              <ReceiptText size={16} /> Record Payment Instance
            </Button>
            <Button variant="secondary" className="w-full justify-start" onClick={() => setCashModalOpen(true)}>
              <Banknote size={16} /> Inject Income / Expense
            </Button>
          </CardContent>
        </Card>

        <Card className="animate-rise lg:col-span-2" style={{ animationDelay: '660ms' } as React.CSSProperties}>
          <CardHeader>
            <CardTitle>Recent Ledger Events</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivity loans={loans} payments={payments} />
          </CardContent>
        </Card>
      </section>

      <LoanFormModal open={loanModalOpen} onClose={() => setLoanModalOpen(false)} />
      <PaymentFormModal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} />
      <CashTransactionFormModal open={cashModalOpen} onClose={() => setCashModalOpen(false)} />
    </div>
  );
}
