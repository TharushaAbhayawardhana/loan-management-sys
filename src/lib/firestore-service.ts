import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  getDocs,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Loan, PaymentLedger, CashTransaction } from './db';
import {
  loanToFirestore,
  paymentToFirestore,
  cashTransactionToFirestore,
} from './firestore-schema';

export type MutationResult<T = void> = { success: true; data?: T } | { success: false; error: string };

function loansRef(householdId: string) {
  return collection(db, 'households', householdId, 'loans');
}

function paymentsRef(householdId: string) {
  return collection(db, 'households', householdId, 'paymentLedger');
}

function cashRef(householdId: string) {
  return collection(db, 'households', householdId, 'cashTransactions');
}

export async function addLoan(householdId: string, loan: Omit<Loan, 'id' | 'createdAt'>, uid: string): Promise<MutationResult<string>> {
  try {
    const payload = loanToFirestore(
      { ...loan, createdAt: new Date() } as Loan,
      uid,
    );
    const docRef = await addDoc(loansRef(householdId), payload);
    return { success: true, data: docRef.id };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to create loan.' };
  }
}

export async function updateLoan(householdId: string, loanId: string, updates: Partial<Loan>): Promise<MutationResult> {
  try {
    const firestoreUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) firestoreUpdates.name = updates.name;
    if (updates.category !== undefined) firestoreUpdates.category = updates.category;
    if (updates.lender !== undefined) firestoreUpdates.lender = updates.lender;
    if (updates.originalAmount !== undefined) firestoreUpdates.originalAmount = updates.originalAmount;
    if (updates.interestType !== undefined) firestoreUpdates.interestType = updates.interestType;
    if (updates.interestRatePercentage !== undefined) firestoreUpdates.interestRatePercentage = updates.interestRatePercentage;
    if (updates.monthlyInstallment !== undefined) firestoreUpdates.monthlyInstallment = updates.monthlyInstallment;
    if (updates.startDate !== undefined) firestoreUpdates.startDate = Timestamp.fromDate(updates.startDate);
    if (updates.dueDateDayOfMonth !== undefined) firestoreUpdates.dueDateDayOfMonth = updates.dueDateDayOfMonth;
    if (updates.status !== undefined) firestoreUpdates.status = updates.status;
    if (updates.notes !== undefined) firestoreUpdates.notes = updates.notes;
    await updateDoc(doc(db, 'households', householdId, 'loans', loanId), firestoreUpdates);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update loan.' };
  }
}

export async function deleteLoan(householdId: string, loanId: string): Promise<MutationResult> {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'households', householdId, 'loans', loanId));

    const paymentSnap = await getDocs(query(paymentsRef(householdId), where('loanId', '==', loanId)));
    paymentSnap.forEach((d) => batch.delete(d.ref));

    await batch.commit();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete loan.' };
  }
}

export async function addPayment(
  householdId: string,
  payment: Omit<PaymentLedger, 'id'>,
  uid: string
): Promise<MutationResult<string>> {
  try {
    const payload = paymentToFirestore(payment, uid);
    const docRef = await addDoc(paymentsRef(householdId), payload);

    await addDoc(cashRef(householdId), cashTransactionToFirestore(
      {
        type: 'expense',
        category: 'Loan Repayment',
        amount: payment.amountPaid,
        transactionDate: payment.paymentDate,
        description: `Payment to loan ${payment.loanId}`,
      },
      uid,
    ));

    return { success: true, data: docRef.id };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to record payment.' };
  }
}

export async function deletePayment(householdId: string, paymentId: string, loanId: string, paymentDate: Date, amountPaid: number): Promise<MutationResult> {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'households', householdId, 'paymentLedger', paymentId));

    const cashSnap = await getDocs(
      query(
        cashRef(householdId),
        where('category', '==', 'Loan Repayment'),
        where('description', '==', `Payment to loan ${loanId}`),
      )
    );
    cashSnap.forEach((d) => {
      const data = d.data();
      const ts = data.transactionDate as Timestamp;
      if (ts.toDate().getTime() === paymentDate.getTime() && data.amount === amountPaid) {
        batch.delete(d.ref);
      }
    });

    await batch.commit();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete payment.' };
  }
}

export async function addCashTransaction(
  householdId: string,
  t: Omit<CashTransaction, 'id'>,
  uid: string
): Promise<MutationResult<string>> {
  try {
    const payload = cashTransactionToFirestore(t, uid);
    const docRef = await addDoc(cashRef(householdId), payload);
    return { success: true, data: docRef.id };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to record transaction.' };
  }
}

export async function deleteCashTransaction(householdId: string, transactionId: string): Promise<MutationResult> {
  try {
    await deleteDoc(doc(db, 'households', householdId, 'cashTransactions', transactionId));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete transaction.' };
  }
}

export async function joinHouseholdViaCode(uid: string, inviteCode: string): Promise<MutationResult<string>> {
  try {
    const snapshot = await getDocs(
      query(collection(db, 'households'), where('inviteCode', '==', inviteCode.toUpperCase()))
    );
    if (snapshot.empty) {
      return { success: false, error: 'Invalid invite code. No household found.' };
    }
    const householdDoc = snapshot.docs[0];
    const householdId = householdDoc.id;
    const data = householdDoc.data();
    if (data.members.includes(uid)) {
      return { success: true, data: householdId };
    }
    await updateDoc(doc(db, 'households', householdId), {
      members: [...data.members, uid],
    });
    return { success: true, data: householdId };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to join household.' };
  }
}

export async function getHouseholdInviteCode(householdId: string): Promise<string | null> {
  try {
    const snap = await getDoc(doc(db, 'households', householdId));
    if (!snap.exists()) return null;
    return snap.data().inviteCode as string;
  } catch {
    return null;
  }
}

export async function importDexieDataToFirestore(
  householdId: string,
  loans: Loan[],
  payments: PaymentLedger[],
  cashTransactions: CashTransaction[],
  uid: string
): Promise<MutationResult> {
  try {
    const batch = writeBatch(db);

    for (const loan of loans) {
      const ref = doc(loansRef(householdId));
      batch.set(ref, loanToFirestore(loan, uid));
    }

    for (const payment of payments) {
      const ref = doc(paymentsRef(householdId));
      batch.set(ref, paymentToFirestore(payment, uid));
    }

    for (const t of cashTransactions) {
      const ref = doc(cashRef(householdId));
      batch.set(ref, cashTransactionToFirestore(t, uid));
    }

    await batch.commit();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to import data.' };
  }
}
