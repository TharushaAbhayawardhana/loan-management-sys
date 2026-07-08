import { Timestamp } from 'firebase/firestore';
import type { Loan, PaymentLedger, CashTransaction } from './db';

export interface FirestoreLoan extends Omit<Loan, 'startDate' | 'createdAt' | 'createdBy'> {
  startDate: Timestamp;
  createdAt: Timestamp;
  createdBy: string;
}

export interface FirestorePayment extends Omit<PaymentLedger, 'paymentDate' | 'recordedBy'> {
  paymentDate: Timestamp;
  recordedBy: string;
  createdAt: Timestamp;
}

export interface FirestoreCashTransaction extends Omit<CashTransaction, 'transactionDate' | 'recordedBy'> {
  transactionDate: Timestamp;
  recordedBy: string;
  createdAt: Timestamp;
}

export interface FirestoreHousehold {
  name: string;
  members: string[];
  inviteCode: string;
  createdAt: Timestamp;
  createdBy: string;
}

export interface FirestoreUser {
  householdId: string;
  email: string | null;
  displayName: string | null;
  createdAt: Timestamp;
}

export function loanToFirestore(loan: Loan, uid: string): Omit<FirestoreLoan, 'id'> {
  return {
    name: loan.name,
    category: loan.category,
    lender: loan.lender,
    originalAmount: loan.originalAmount,
    interestType: loan.interestType,
    interestRatePercentage: loan.interestRatePercentage,
    monthlyInstallment: loan.monthlyInstallment,
    startDate: Timestamp.fromDate(loan.startDate),
    dueDateDayOfMonth: loan.dueDateDayOfMonth,
    status: loan.status,
    notes: loan.notes ?? null,
    createdAt: Timestamp.fromDate(loan.createdAt || new Date()),
    createdBy: uid,
  };
}

export function firestoreToLoan(id: string, data: FirestoreLoan): Loan {
  return {
    id,
    name: data.name,
    category: data.category,
    lender: data.lender,
    originalAmount: data.originalAmount,
    interestType: data.interestType,
    interestRatePercentage: data.interestRatePercentage,
    monthlyInstallment: data.monthlyInstallment,
    startDate: data.startDate.toDate(),
    dueDateDayOfMonth: data.dueDateDayOfMonth,
    status: data.status,
    notes: data.notes,
    createdAt: data.createdAt.toDate(),
  };
}

export function paymentToFirestore(payment: Omit<PaymentLedger, 'id'>, uid: string): Omit<FirestorePayment, 'id'> {
  return {
    loanId: payment.loanId,
    amountPaid: payment.amountPaid,
    paymentDate: Timestamp.fromDate(payment.paymentDate),
    paymentMethod: payment.paymentMethod,
    notes: payment.notes ?? null,
    receiptReference: payment.receiptReference ?? null,
    calculatedBalanceAfter: payment.calculatedBalanceAfter,
    recordedBy: uid,
    createdAt: Timestamp.now(),
  };
}

export function firestoreToPayment(id: string, data: FirestorePayment): PaymentLedger {
  return {
    id,
    loanId: data.loanId,
    amountPaid: data.amountPaid,
    paymentDate: data.paymentDate.toDate(),
    paymentMethod: data.paymentMethod,
    notes: data.notes ?? undefined,
    receiptReference: data.receiptReference ?? undefined,
    calculatedBalanceAfter: data.calculatedBalanceAfter,
  };
}

export function cashTransactionToFirestore(t: Omit<CashTransaction, 'id'>, uid: string): Omit<FirestoreCashTransaction, 'id'> {
  return {
    type: t.type,
    category: t.category,
    amount: t.amount,
    transactionDate: Timestamp.fromDate(t.transactionDate),
    description: t.description,
    recordedBy: uid,
    createdAt: Timestamp.now(),
  };
}


export function firestoreToCashTransaction(id: string, data: FirestoreCashTransaction): CashTransaction {
  return {
    id,
    type: data.type,
    category: data.category,
    amount: data.amount,
    transactionDate: data.transactionDate.toDate(),
    description: data.description,
  };
}
