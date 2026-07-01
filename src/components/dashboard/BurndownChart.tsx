import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Loan, PaymentLedger } from '../../lib/db';
import { calculateTotalLiabilities, formatCompactLKR, formatLKR } from '../../lib/calculations';
import { EmptyState } from '../ui/EmptyState';
import { TrendingDown } from 'lucide-react';

/**
 * Builds a monthly time series of the household's total remaining balance
 * by starting from the total original liability footprint and subtracting
 * cumulative payments as they occurred, chronologically.
 */
function buildBurndownSeries(loans: Loan[], payments: PaymentLedger[]) {
  if (loans.length === 0) return [];

  const totalPrincipal = calculateTotalLiabilities(loans);
  const sorted = [...payments].sort(
    (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
  );

  if (sorted.length === 0) {
    const now = new Date();
    const label = now.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    return [{ month: label, balance: totalPrincipal }];
  }

  const monthlyTotals = new Map<string, number>();
  let running = totalPrincipal;

  for (const payment of sorted) {
    const d = new Date(payment.paymentDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    running -= payment.amountPaid;
    monthlyTotals.set(key, Math.max(running, 0));
  }

  return Array.from(monthlyTotals.entries()).map(([key, balance]) => {
    const [year, month] = key.split('-').map(Number);
    const label = new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    return { month: label, balance };
  });
}

export function BurndownChart({ loans, payments }: { loans: Loan[]; payments: PaymentLedger[] }) {
  const data = buildBurndownSeries(loans, payments);

  if (data.length === 0) {
    return (
      <EmptyState icon={<TrendingDown size={28} />} title="No burndown data yet" description="Record payments to start tracking the debt reduction trend." />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="burndownFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-brass)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-brass)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: 'var(--color-ink-faint)', fontFamily: 'var(--font-sans)' }}
          axisLine={{ stroke: 'var(--color-hairline)' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatCompactLKR(v)}
          tick={{ fontSize: 11, fill: 'var(--color-ink-faint)', fontFamily: 'var(--font-sans)' }}
          axisLine={false}
          tickLine={false}
          width={70}
        />
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
        <Area
          type="monotone"
          dataKey="balance"
          stroke="var(--color-brass-dark)"
          strokeWidth={2.5}
          fill="url(#burndownFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
