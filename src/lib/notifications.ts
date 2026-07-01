import type { Loan, PaymentLedger } from './db';
import { calculateOutstandingBalance, daysUntilNextDue, deriveLoanStatus } from './calculations';

export type AlertSeverity = 'overdue' | 'upcoming' | 'settled-recently';

export interface LoanAlert {
  loanId: string;
  loanName: string;
  lender: string;
  severity: AlertSeverity;
  message: string;
  daysUntilDue: number;
  outstandingBalance: number;
}

const UPCOMING_WINDOW_DAYS = 3; // 72-hour window

/**
 * Scans every active loan and produces a prioritized alert deck:
 *  - "overdue": due date has passed this cycle with no payment recorded
 *  - "upcoming": due date falls within the next 72 hours
 * Settled loans are excluded entirely.
 */
export function buildAlertDeck(loans: Loan[], payments: PaymentLedger[], today: Date = new Date()): LoanAlert[] {
  const alerts: LoanAlert[] = [];

  for (const loan of loans) {
    const balance = calculateOutstandingBalance(loan, payments);
    if (balance <= 0) continue;

    const effectiveStatus = deriveLoanStatus(loan, payments, today);
    const daysLeft = daysUntilNextDue(loan, today);

    if (effectiveStatus === 'overdue') {
      alerts.push({
        loanId: loan.id ?? '',
        loanName: loan.name,
        lender: loan.lender,
        severity: 'overdue',
        message: `Payment overdue for ${loan.name} (${loan.lender}). Immediate action required.`,
        daysUntilDue: daysLeft,
        outstandingBalance: balance,
      });
    } else if (daysLeft <= UPCOMING_WINDOW_DAYS) {
      alerts.push({
        loanId: loan.id ?? '',
        loanName: loan.name,
        lender: loan.lender,
        severity: 'upcoming',
        message: `${loan.name} installment due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`,
        daysUntilDue: daysLeft,
        outstandingBalance: balance,
      });
    }
  }

  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'overdue' ? -1 : 1;
    return a.daysUntilDue - b.daysUntilDue;
  });
}

export function countOverdue(loans: Loan[], payments: PaymentLedger[], today: Date = new Date()): number {
  return buildAlertDeck(loans, payments, today).filter((a) => a.severity === 'overdue').length;
}

export function countUpcoming(loans: Loan[], payments: PaymentLedger[], today: Date = new Date()): number {
  return buildAlertDeck(loans, payments, today).filter((a) => a.severity === 'upcoming').length;
}

/**
 * Requests browser Notification permission and, if granted, fires native
 * OS-level notifications for any "overdue" or imminent "upcoming" alerts.
 * This is entirely local — no server, no push service.
 */
export async function dispatchBrowserNotifications(alerts: LoanAlert[]): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
  if (Notification.permission !== 'granted') return;

  const urgent = alerts.filter((a) => a.severity === 'overdue' || a.daysUntilDue <= 1);
  for (const alert of urgent) {
    new Notification('FFMS Alert', { body: alert.message, tag: alert.loanId });
  }
}
