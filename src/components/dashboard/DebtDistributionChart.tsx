import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Loan, PaymentLedger } from '../../lib/db';
import { LOAN_CATEGORY_COLORS, LOAN_CATEGORY_LABELS, calculateOutstandingBalance, formatLKR } from '../../lib/calculations';
import { EmptyState } from '../ui/EmptyState';
import { PieChart as PieIcon } from 'lucide-react';

export function DebtDistributionChart({ loans, payments }: { loans: Loan[]; payments: PaymentLedger[] }) {
  const byCategory = new Map<string, number>();
  for (const loan of loans) {
    const balance = calculateOutstandingBalance(loan, payments);
    if (balance <= 0) continue;
    byCategory.set(loan.category, (byCategory.get(loan.category) ?? 0) + balance);
  }

  const data = Array.from(byCategory.entries()).map(([category, value]) => ({
    name: LOAN_CATEGORY_LABELS[category as Loan['category']],
    value,
    color: LOAN_CATEGORY_COLORS[category as Loan['category']],
  }));

  if (data.length === 0) {
    return <EmptyState icon={<PieIcon size={28} />} title="No active debt" description="Once loans are added, the distribution will appear here." />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={100}
          paddingAngle={2}
          strokeWidth={2}
          stroke="var(--color-paper-card)"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatLKR(Number(value ?? 0))}
          contentStyle={{
            background: 'var(--color-paper-card)',
            border: '1px solid var(--color-hairline)',
            borderRadius: 8,
            fontSize: 12,
            fontFamily: 'var(--font-sans)',
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-sans)', color: 'var(--color-ink-soft)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
