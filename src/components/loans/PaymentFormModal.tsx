import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Modal } from '../ui/Modal';
import { FormField, Input, Select, Textarea } from '../ui/Field';
import { Button } from '../ui/Button';
import { db, type Loan } from '../../lib/db';
import { toInputDate } from '../../lib/utils';
import { calculateOutstandingBalance, formatLKR } from '../../lib/calculations';

const paymentSchema = z.object({
  loanId: z.string().min(1, 'Please select a loan.'),
  amountPaid: z.coerce.number().positive('Payment amount must be greater than zero.'),
  paymentDate: z.string().min(1, 'Payment date is required.'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'counter_deposit', 'other']),
  receiptReference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormInput = z.input<typeof paymentSchema>;
type PaymentFormValues = z.output<typeof paymentSchema>;

export function PaymentFormModal({
  open,
  onClose,
  preselectedLoanId,
}: {
  open: boolean;
  onClose: () => void;
  preselectedLoanId?: string;
}) {
  const loans = useLiveQuery(() => db.loans.toArray(), []) ?? [];
  const payments = useLiveQuery(() => db.paymentLedger.toArray(), []) ?? [];

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormInput, any, PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      loanId: preselectedLoanId ?? '',
      amountPaid: 0,
      paymentDate: toInputDate(new Date()),
      paymentMethod: 'bank_transfer',
      receiptReference: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        loanId: preselectedLoanId ?? (loans[0]?.id ?? ''),
        amountPaid: 0,
        paymentDate: toInputDate(new Date()),
        paymentMethod: 'bank_transfer',
        receiptReference: '',
        notes: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preselectedLoanId]);

  const selectedLoanId = watch('loanId');
  const selectedLoan: Loan | undefined = loans.find((l) => l.id === selectedLoanId);
  const currentBalance = useMemo(
    () => (selectedLoan ? calculateOutstandingBalance(selectedLoan, payments) : 0),
    [selectedLoan, payments]
  );
  const amountEntered = Number(watch('amountPaid')) || 0;
  const projectedBalance = Math.max(currentBalance - amountEntered, 0);

  const onSubmit = async (values: PaymentFormValues) => {
    const loan = loans.find((l) => l.id === values.loanId);
    if (!loan) return;

    const balanceBefore = calculateOutstandingBalance(loan, payments);
    const calculatedBalanceAfter = Math.max(balanceBefore - values.amountPaid, 0);

    await db.paymentLedger.add({
      loanId: values.loanId,
      amountPaid: values.amountPaid,
      paymentDate: new Date(values.paymentDate),
      paymentMethod: values.paymentMethod,
      receiptReference: values.receiptReference || undefined,
      notes: values.notes || undefined,
      calculatedBalanceAfter,
    });

    // Also log this as an automatic expense against liquid cash so the
    // Liquid Cash Valuation Engine stays consistent with real household cash.
    await db.cashTransactions.add({
      type: 'expense',
      category: 'Loan Repayment',
      amount: values.amountPaid,
      transactionDate: new Date(values.paymentDate),
      description: `Payment to ${loan.name} (${loan.lender})`,
    });

    if (calculatedBalanceAfter <= 0 && loan.id) {
      await db.loans.update(loan.id, { status: 'settled' });
    } else if (loan.id && loan.status === 'settled') {
      await db.loans.update(loan.id, { status: 'active' });
    }

    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Record Payment Instance" description="Payments are immutable — corrections require a deletion and re-entry.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField label="Loan" error={errors.loanId?.message}>
          <Select {...register('loanId')} disabled={!!preselectedLoanId}>
            <option value="" disabled>
              Select a loan…
            </option>
            {loans.map((loan) => (
              <option key={loan.id} value={loan.id}>
                {loan.name} — {loan.lender}
              </option>
            ))}
          </Select>
        </FormField>

        {selectedLoan && (
          <div className="flex items-center justify-between rounded-lg bg-[var(--color-paper-dim)] px-4 py-3 text-sm">
            <span className="text-[var(--color-ink-faint)]">Current outstanding balance</span>
            <span className="tabular-figures font-semibold text-[var(--color-ink)]">{formatLKR(currentBalance)}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="Amount Paid (LKR)" error={errors.amountPaid?.message}>
            <Input type="number" step="0.01" min="0" {...register('amountPaid')} />
          </FormField>

          <FormField label="Payment Date" error={errors.paymentDate?.message}>
            <Input type="date" {...register('paymentDate')} />
          </FormField>

          <FormField label="Payment Method" error={errors.paymentMethod?.message}>
            <Select {...register('paymentMethod')}>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="counter_deposit">Counter Deposit</option>
              <option value="other">Other</option>
            </Select>
          </FormField>

          <FormField label="Receipt Reference" error={errors.receiptReference?.message}>
            <Input placeholder="Optional slip / reference no." {...register('receiptReference')} />
          </FormField>
        </div>

        {selectedLoan && amountEntered > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-[var(--color-emerald)]/25 bg-[var(--color-emerald-50)] px-4 py-3 text-sm">
            <span className="text-[var(--color-emerald)]">Projected balance after this payment</span>
            <span className="tabular-figures font-semibold text-[var(--color-emerald)]">{formatLKR(projectedBalance)}</span>
          </div>
        )}

        <FormField label="Notes" error={errors.notes?.message}>
          <Textarea placeholder="Optional notes about this payment…" {...register('notes')} />
        </FormField>

        <div className="flex justify-end gap-3 border-t border-[var(--color-hairline)] pt-5">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="success" disabled={isSubmitting || loans.length === 0}>
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
