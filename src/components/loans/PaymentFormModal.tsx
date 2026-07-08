import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { FormField, Input, Select, Textarea } from '../ui/Field';
import { Button } from '../ui/Button';
import { useAuth } from '../../lib/auth';
import { useLoansRealtime, usePaymentLedgerRealtime } from '../../hooks/useFirestoreData';
import { addPayment } from '../../lib/firestore-service';
import { useToast } from '../../lib/toast';
import { type Loan } from '../../lib/db';
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
  const { householdId, user } = useAuth();
  const { toast } = useToast();
  const { data: loans } = useLoansRealtime();
  const { data: payments } = usePaymentLedgerRealtime();
  const loanList = loans ?? [];
  const paymentList = payments ?? [];

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormInput, any, PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      loanId: preselectedLoanId ?? (loanList[0]?.id ?? ''),
      amountPaid: undefined as unknown as number,
      paymentDate: toInputDate(new Date()),
      paymentMethod: 'bank_transfer',
      receiptReference: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      const defaultLoanId = preselectedLoanId ?? (loanList[0]?.id ?? '');
      reset({
        loanId: defaultLoanId,
        amountPaid: undefined as unknown as number,
        paymentDate: toInputDate(new Date()),
        paymentMethod: 'bank_transfer',
        receiptReference: '',
        notes: '',
      });
    }
  }, [open, preselectedLoanId, loanList, reset]);

  const selectedLoanId = watch('loanId');
  const selectedLoan: Loan | undefined = loanList.find((l) => l.id === selectedLoanId);
  const currentBalance = useMemo(
    () => (selectedLoan ? calculateOutstandingBalance(selectedLoan, paymentList) : 0),
    [selectedLoan, paymentList]
  );
  const amountEntered = Number(watch('amountPaid')) || 0;
  const projectedBalance = Math.max(currentBalance - amountEntered, 0);

  async function onSubmit(values: PaymentFormValues) {
    if (!householdId || !user) {
      toast('You must be signed in to record payments.', 'error');
      return;
    }

    const loan = loanList.find((l) => l.id === values.loanId);
    if (!loan) {
      toast('Selected loan not found.', 'error');
      return;
    }

    const result = await addPayment(householdId, {
      loanId: values.loanId,
      amountPaid: values.amountPaid,
      paymentDate: new Date(values.paymentDate),
      paymentMethod: values.paymentMethod,
      receiptReference: values.receiptReference || undefined,
      notes: values.notes || undefined,
      calculatedBalanceAfter: 0,
    }, user.uid);

    if (!result.success) {
      toast(result.error, 'error');
      return;
    }

    toast('Payment recorded successfully.', 'success');
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Record Payment Instance" description="Payments are immutable — corrections require a deletion and re-entry.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField label="Loan" error={errors.loanId?.message}>
          <Select {...register('loanId')} disabled={!!preselectedLoanId}>
            <option value="" disabled>
              Select a loan…
            </option>
            {loanList.map((loan) => (
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
            <Input type="number" step="0.01" min="0" inputMode="decimal" {...register('amountPaid')} />
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
          <Button type="submit" variant="success" disabled={isSubmitting || loanList.length === 0}>
            {isSubmitting ? 'Recording…' : 'Record Payment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
