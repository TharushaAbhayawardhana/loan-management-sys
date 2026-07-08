import { useEffect, useState, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  type Unsubscribe,
  type FirestoreError,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import type { Loan, PaymentLedger, CashTransaction } from '../lib/db';
import { firestoreToLoan, firestoreToPayment, firestoreToCashTransaction } from '../lib/firestore-schema';

type LoadingState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

function useCollectionRealtime<T>(
  householdId: string | null,
  subcollection: string,
  converter: (id: string, data: any) => T,
  orderByField?: string
): LoadingState<T[]> {
  const [state, setState] = useState<LoadingState<T[]>>({ status: 'loading' });

  useEffect(() => {
    if (!householdId) {
      setState({ status: 'success', data: [] });
      return;
    }

    const ref = collection(db, 'households', householdId, subcollection);
    const q = orderByField ? query(ref, orderBy(orderByField, 'desc')) : query(ref);

    const unsubscribe: Unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => converter(d.id, d.data()));
        setState({ status: 'success', data: items });
      },
      (err: FirestoreError) => {
        console.error(`Firestore snapshot error (${subcollection}):`, err);
        setState({ status: 'error', error: err.message });
      }
    );

    return unsubscribe;
  }, [householdId, subcollection, orderByField]);

  return state;
}

export function useLoansRealtime() {
  const { householdId } = useAuth();
  const result = useCollectionRealtime<Loan>(householdId, 'loans', firestoreToLoan);
  const data = useMemo(() => (result.status === 'success' ? result.data : undefined), [result]);
  return { data, isLoading: result.status === 'loading', error: result.status === 'error' ? result.error : null };
}

export function usePaymentLedgerRealtime() {
  const { householdId } = useAuth();
  const result = useCollectionRealtime<PaymentLedger>(householdId, 'paymentLedger', firestoreToPayment, 'paymentDate');
  const data = useMemo(() => (result.status === 'success' ? result.data : undefined), [result]);
  return { data, isLoading: result.status === 'loading', error: result.status === 'error' ? result.error : null };
}

export function useCashTransactionsRealtime() {
  const { householdId } = useAuth();
  const result = useCollectionRealtime<CashTransaction>(householdId, 'cashTransactions', firestoreToCashTransaction, 'transactionDate');
  const data = useMemo(() => (result.status === 'success' ? result.data : undefined), [result]);
  return { data, isLoading: result.status === 'loading', error: result.status === 'error' ? result.error : null };
}

export function useAllLoansWithPaymentsRealtime() {
  const loans = useLoansRealtime();
  const payments = usePaymentLedgerRealtime();

  return {
    loans: loans.data ?? [],
    payments: payments.data ?? [],
    isLoading: loans.isLoading || payments.isLoading,
    error: loans.error || payments.error,
  };
}
