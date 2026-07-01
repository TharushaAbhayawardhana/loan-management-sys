import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import {
  calculateOutstandingBalance,
  calculatePercentPaid,
  calculateTotalPaid,
  deriveLoanStatus,
} from '../lib/calculations';

/**
 * Re-evaluates a single loan's dynamic balance on every execution loop by
 * subscribing to both the loan record and its full payment history via
 * Dexie live queries. Any mutation to either table automatically triggers
 * a recomputation — there is no cached/stale balance state anywhere.
 */
export function useLoanCalculator(loanId: string | undefined) {
  return useLiveQuery(async () => {
    if (!loanId) return undefined;

    const loan = await db.loans.get(loanId);
    if (!loan) return undefined;

    const payments = await db.paymentLedger.where('loanId').equals(loanId).sortBy('paymentDate');

    const outstandingBalance = calculateOutstandingBalance(loan, payments);
    const totalPaid = calculateTotalPaid(loan, payments);
    const percentPaid = calculatePercentPaid(loan, payments);
    const effectiveStatus = deriveLoanStatus(loan, payments);

    return { loan, payments, outstandingBalance, totalPaid, percentPaid, effectiveStatus };
  }, [loanId]);
}

/** Live query over every loan, joined with the full payment ledger. */
export function useAllLoansWithPayments() {
  return useLiveQuery(async () => {
    const [loans, payments] = await Promise.all([
      db.loans.toArray(),
      db.paymentLedger.toArray(),
    ]);
    return { loans, payments };
  }, []);
}

export function useCashTransactions() {
  return useLiveQuery(() => db.cashTransactions.orderBy('transactionDate').reverse().toArray(), []);
}

export function usePaymentLedger() {
  return useLiveQuery(() => db.paymentLedger.orderBy('paymentDate').reverse().toArray(), []);
}
