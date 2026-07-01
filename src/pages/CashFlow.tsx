import { useState } from 'react';
import { Plus, Wallet2, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { useCashTransactions } from '../hooks/useLoanCalculator';
import { db, type CashTransaction } from '../lib/db';
import { calculateNetLiquidCash, formatLKR } from '../lib/calculations';
import { formatDate } from '../lib/utils';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { CashTransactionFormModal } from '../components/cash/CashTransactionFormModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function CashFlow() {
  const transactions = useCashTransactions() ?? [];
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CashTransaction | undefined>(undefined);

  const netCash = calculateNetLiquidCash(transactions);
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const byCategory = new Map<string, { income: number; expense: number }>();
  for (const t of transactions) {
    const entry = byCategory.get(t.category) ?? { income: 0, expense: 0 };
    entry[t.type] += t.amount;
    byCategory.set(t.category, entry);
  }
  const chartData = Array.from(byCategory.entries())
    .map(([category, v]) => ({ category, net: v.income - v.expense }))
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
    .slice(0, 8);

  const handleDelete = async (t: CashTransaction) => {
    if (!t.id) return;
    await db.cashTransactions.delete(t.id);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Net Liquid Cash" value={formatLKR(netCash)} icon={<Wallet2 size={18} />} tone={netCash >= 0 ? 'emerald' : 'crimson'} />
        <StatCard label="Total Income" value={formatLKR(totalIncome)} icon={<TrendingUp size={18} />} tone="brass" delay={60} />
        <StatCard label="Total Expense" value={formatLKR(totalExpense)} icon={<TrendingDown size={18} />} tone="crimson" delay={120} />
      </div>

      {chartData.length > 0 && (
        <Card className="p-5">
          <p className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Net Flow by Category
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 10, fill: 'var(--color-ink-faint)' }} axisLine={{ stroke: 'var(--color-hairline)' }} tickLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-ink-faint)' }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => `${v / 1000}K`} />
              <Tooltip
                formatter={(value) => formatLKR(Number(value ?? 0))}
                contentStyle={{ background: 'var(--color-paper-card)', border: '1px solid var(--color-hairline)', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="net" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.category} fill={entry.net >= 0 ? 'var(--color-emerald)' : 'var(--color-crimson)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Inject Income / Expense
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        {transactions.length === 0 ? (
          <EmptyState icon={<Wallet2 size={28} />} title="No cash transactions yet" description="Track income and expenses to maintain an accurate liquid cash baseline." />
        ) : (
          <div className="divide-y divide-[var(--color-hairline)]">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-[var(--color-paper-dim)]/50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${t.type === 'income' ? 'bg-[var(--color-emerald)]' : 'bg-[var(--color-crimson)]'}`}
                    />
                    <p className="truncate text-sm font-medium text-[var(--color-ink)]">{t.description}</p>
                  </div>
                  <p className="ml-4 text-xs text-[var(--color-ink-faint)]">
                    {t.category} · {formatDate(t.transactionDate)}
                  </p>
                </div>
                <p
                  className={`tabular-figures shrink-0 text-sm font-semibold ${
                    t.type === 'income' ? 'text-[var(--color-emerald)]' : 'text-[var(--color-crimson)]'
                  }`}
                >
                  {t.type === 'income' ? '+' : '−'}
                  {formatLKR(t.amount)}
                </p>
                <button
                  onClick={() => setDeleteTarget(t)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-ink-faint)] hover:bg-[var(--color-crimson-50)] hover:text-[var(--color-crimson)] cursor-pointer"
                  aria-label="Delete transaction"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <CashTransactionFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(undefined)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        title="Delete this transaction?"
        description="This will remove the entry from your cash flow history and recalculate net liquid cash."
      />
    </div>
  );
}
