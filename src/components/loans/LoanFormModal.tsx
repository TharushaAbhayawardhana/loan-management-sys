import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { FormField, Input, Select, Textarea } from '../ui/Field';
import { Button } from '../ui/Button';
import { useAuth } from '../../lib/auth';
import { addLoan, updateLoan } from '../../lib/firestore-service';
import { useToast } from '../../lib/toast';
import { type Loan, type LoanCategory, type InterestType } from '../../lib/db';
import { toInputDate } from '../../lib/utils';
import { LOAN_CATEGORY_LABELS } from '../../lib/calculations';

const loanSchema = z
  .object({
    name: z.string().min(2, 'Loan name must be at least 2 characters.'),
    category: z.enum(['bank', 'interest', 'gold', 'personal', 'other']),
    lender: z.string().min(1, 'Lender / counterparty is required.'),
    originalAmount: z.coerce.number().positive('Original amount must be greater than zero.'),
    interestType: z.enum(['fixed', 'reducing', 'flat_informal', 'none']),
    interestRatePercentage: z.coerce.number().min(0, 'Interest rate cannot be negative.'),
    monthlyInstallment: z.coerce.number().positive('Monthly installment must be greater than zero.'),
    startDate: z.string().min(1, 'Start date is required.'),
    dueDateDayOfMonth: z.coerce
      .number()
      .int('Due date must be a whole number.')
      .min(1, 'Due date must be between 1 and 31.')
      .max(31, 'Due date must be between 1 and 31.'),
    status: z.enum(['active', 'overdue', 'settled']),
    notes: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.category === 'interest' && values.interestRatePercentage <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['interestRatePercentage'],
        message: 'Informal interest loans must carry a non-zero interest rate.',
      });
    }
  });

type LoanFormInput = z.input<typeof loanSchema>;
type LoanFormValues = z.output<typeof loanSchema>;

const CATEGORY_DEFAULT_INTEREST: Record<LoanCategory, InterestType> = {
  bank: 'reducing',
  interest: 'flat_informal',
  gold: 'flat_informal',
  personal: 'none',
  other: 'fixed',
};

export function LoanFormModal({
  open,
  onClose,
  editingLoan,
}: {
  open: boolean;
  onClose: () => void;
  editingLoan?: Loan;
}) {
  const { householdId, user } = useAuth();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoanFormInput, any, LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      name: '',
      category: 'bank',
      lender: '',
      originalAmount: undefined as unknown as number,
      interestType: 'reducing',
      interestRatePercentage: 0,
      monthlyInstallment: undefined as unknown as number,
      startDate: toInputDate(new Date()),
      dueDateDayOfMonth: 15,
      status: 'active',
      notes: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (editingLoan) {
      reset({
        name: editingLoan.name,
        category: editingLoan.category,
        lender: editingLoan.lender,
        originalAmount: editingLoan.originalAmount,
        interestType: editingLoan.interestType,
        interestRatePercentage: editingLoan.interestRatePercentage,
        monthlyInstallment: editingLoan.monthlyInstallment,
        startDate: toInputDate(editingLoan.startDate),
        dueDateDayOfMonth: editingLoan.dueDateDayOfMonth,
        status: editingLoan.status,
        notes: editingLoan.notes ?? '',
      });
    } else {
      reset({
        name: '',
        category: 'bank',
        lender: '',
        originalAmount: undefined as unknown as number,
        interestType: 'reducing',
        interestRatePercentage: 0,
        monthlyInstallment: undefined as unknown as number,
        startDate: toInputDate(new Date()),
        dueDateDayOfMonth: 15,
        status: 'active',
        notes: '',
      });
    }
  }, [open, editingLoan, reset]);

  const category = watch('category');

  const onSubmit = async (values: LoanFormValues) => {
    if (!householdId || !user) {
      toast('You must be signed in to modify loans.', 'error');
      return;
    }

    if (editingLoan?.id) {
      const result = await updateLoan(householdId, editingLoan.id, {
        ...values,
        startDate: new Date(values.startDate),
      });
      if (!result.success) {
        toast(result.error, 'error');
        return;
      }
      toast('Loan updated successfully.', 'success');
    } else {
      const result = await addLoan(householdId, {
        ...values,
        startDate: new Date(values.startDate),
        createdAt: new Date(),
      } as Loan, user.uid);
      if (!result.success) {
        toast(result.error, 'error');
        return;
      }
      toast('Loan created successfully.', 'success');
    }

    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingLoan ? 'Edit Loan Entity' : 'Add New Loan Entity'}
      description="Every liability is tracked against one of the five taxonomy pillars."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="Loan Name" error={errors.name?.message}>
            <Input placeholder="e.g. Sanasa Bank Personal Loan" {...register('name')} />
          </FormField>

          <FormField label="Category" error={errors.category?.message}>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select
                  {...field}
                  onChange={(e) => {
                    const nextCategory = e.target.value as LoanCategory;
                    field.onChange(nextCategory);
                    setValue('interestType', CATEGORY_DEFAULT_INTEREST[nextCategory]);
                  }}
                >
                  {Object.entries(LOAN_CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              )}
            />
          </FormField>

          <FormField label="Lender / Counterparty" error={errors.lender?.message}>
            <Input placeholder="e.g. Commercial Bank, Danushi, Akka" {...register('lender')} />
          </FormField>

          <FormField label="Status" error={errors.status?.message}>
            <Select {...register('status')}>
              <option value="active">Active</option>
              <option value="overdue">Overdue</option>
              <option value="settled">Settled</option>
            </Select>
          </FormField>

          <FormField label="Original Principal (LKR)" error={errors.originalAmount?.message}>
            <Input type="number" step="0.01" min="0" inputMode="decimal" {...register('originalAmount')} />
          </FormField>

          <FormField label="Monthly Installment (LKR)" error={errors.monthlyInstallment?.message}>
            <Input type="number" step="0.01" min="0" inputMode="decimal" {...register('monthlyInstallment')} />
          </FormField>

          <FormField label="Interest Type" error={errors.interestType?.message}>
            <Select {...register('interestType')}>
              <option value="fixed">Fixed</option>
              <option value="reducing">Reducing Balance</option>
              <option value="flat_informal">Flat / Informal</option>
              <option value="none">None</option>
            </Select>
          </FormField>

          <FormField
            label="Interest Rate (%)"
            error={errors.interestRatePercentage?.message}
            hint={category === 'interest' ? 'Informal interest loans require a non-zero rate.' : undefined}
          >
            <Input type="number" step="0.01" min="0" inputMode="decimal" {...register('interestRatePercentage')} />
          </FormField>

          <FormField label="Start Date" error={errors.startDate?.message}>
            <Input type="date" {...register('startDate')} />
          </FormField>

          <FormField
            label="Due Day of Month"
            error={errors.dueDateDayOfMonth?.message}
            hint="Integer 1–31 representing the recurring billing date."
          >
            <Input type="number" step="1" min="1" max="31" inputMode="numeric" {...register('dueDateDayOfMonth')} />
          </FormField>
        </div>

        <FormField label="Notes" error={errors.notes?.message}>
          <Textarea placeholder="Optional context, account numbers, reminders…" {...register('notes')} />
        </FormField>

        <div className="flex justify-end gap-3 border-t border-[var(--color-hairline)] pt-5">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : editingLoan ? 'Save Changes' : 'Add Loan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
