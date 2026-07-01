import type { CashTransaction, Loan, PaymentLedger } from './db';

/**
 * Dynamic Loan Balance Evaluation.
 *
 * Given the initial principal P for loan L, and the set of all payments T_L
 * associated with loan L:
 *
 *   CurrentOutstandingBalance(L) = P - Σ(p_i.amountPaid) for p_i in T_L
 *
 * The balance is NEVER read from a stored field — it is always derived from
 * the original principal and the full historical transaction log so it can
 * never drift out of sync with reality.
 */
export function calculateOutstandingBalance(loan: Loan, payments: PaymentLedger[]): number {
  const totalPaid = payments
    .filter((p) => p.loanId === loan.id)
    .reduce((sum, p) => sum + p.amountPaid, 0);
  const balance = loan.originalAmount - totalPaid;
  return round2(Math.max(balance, 0));
}

export function calculateTotalPaid(loan: Loan, payments: PaymentLedger[]): number {
  return round2(
    payments.filter((p) => p.loanId === loan.id).reduce((sum, p) => sum + p.amountPaid, 0)
  );
}

export function calculatePercentPaid(loan: Loan, payments: PaymentLedger[]): number {
  if (loan.originalAmount <= 0) return 0;
  const paid = calculateTotalPaid(loan, payments);
  return Math.min(100, round2((paid / loan.originalAmount) * 100));
}

/**
 * Liquid Cash Valuation Engine.
 *
 *   CurrentNetLiquidCash = Σ(c_j.amount | type = income) - Σ(c_j.amount | type = expense)
 */
export function calculateNetLiquidCash(transactions: CashTransaction[]): number {
  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return round2(income - expense);
}

export function calculateTotalLiabilities(loans: Loan[]): number {
  return round2(loans.reduce((sum, l) => sum + l.originalAmount, 0));
}

export function calculateTotalRemainingDebt(loans: Loan[], payments: PaymentLedger[]): number {
  return round2(loans.reduce((sum, l) => sum + calculateOutstandingBalance(l, payments), 0));
}

export function calculateTotalCumulativePaid(loans: Loan[], payments: PaymentLedger[]): number {
  return round2(loans.reduce((sum, l) => sum + calculateTotalPaid(l, payments), 0));
}

export function calculateAggregatedMonthlyCommitment(loans: Loan[]): number {
  return round2(
    loans.filter((l) => l.status !== 'settled').reduce((sum, l) => sum + l.monthlyInstallment, 0)
  );
}

/**
 * Determines the *effective* status of a loan based on today's date and its
 * derived balance, rather than trusting a manually-set status field. A loan
 * becomes "overdue" once its due date this month has passed without a
 * payment recorded in the current billing cycle, and "settled" once its
 * dynamic balance reaches zero.
 */
export function deriveLoanStatus(loan: Loan, payments: PaymentLedger[], today: Date = new Date()): Loan['status'] {
  const balance = calculateOutstandingBalance(loan, payments);
  if (balance <= 0) return 'settled';

  const dueThisMonth = new Date(today.getFullYear(), today.getMonth(), loan.dueDateDayOfMonth);
  const loanPayments = payments.filter((p) => p.loanId === loan.id);
  const paidThisCycle = loanPayments.some((p) => {
    const pd = new Date(p.paymentDate);
    return pd.getFullYear() === dueThisMonth.getFullYear() && pd.getMonth() === dueThisMonth.getMonth();
  });

  if (today > dueThisMonth && !paidThisCycle) return 'overdue';
  return 'active';
}

export function daysUntilNextDue(loan: Loan, today: Date = new Date()): number {
  let due = new Date(today.getFullYear(), today.getMonth(), loan.dueDateDayOfMonth);
  if (due < today) {
    due = new Date(today.getFullYear(), today.getMonth() + 1, loan.dueDateDayOfMonth);
  }
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((due.getTime() - today.getTime()) / msPerDay);
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatLKR(amount: number): string {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace('LKR', 'LKR ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatCompactLKR(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `LKR ${round2(amount / 1_000_000)}M`;
  if (Math.abs(amount) >= 1_000) return `LKR ${round2(amount / 1_000)}K`;
  return formatLKR(amount);
}

export const LOAN_CATEGORY_LABELS: Record<Loan['category'], string> = {
  bank: 'Bank Loans',
  interest: 'Interest Loans',
  gold: 'Gold Loans',
  personal: 'Personal Loans',
  other: 'Other Obligations',
};

export const LOAN_CATEGORY_COLORS: Record<Loan['category'], string> = {
  bank: 'var(--color-brass)',
  interest: 'var(--color-crimson)',
  gold: '#b8860b',
  personal: 'var(--color-emerald)',
  other: '#6b6456',
};
