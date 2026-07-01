import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { FormField, Input, Select, Textarea } from '../ui/Field';
import { Button } from '../ui/Button';
import { db } from '../../lib/db';
import { toInputDate } from '../../lib/utils';

const INCOME_CATEGORIES = ['Salary', 'Side Income', 'Savings Withdrawal', 'Gift', 'Other Income'];
const EXPENSE_CATEGORIES = [
  'Groceries',
  'Utilities',
  'Transport',
  'Loan Repayment',
  'Medical',
  'Education',
  'Household',
  'Other Expense',
];

const cashSchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category is required.'),
  amount: z.coerce.number().positive('Amount must be greater than zero.'),
  transactionDate: z.string().min(1, 'Transaction date is required.'),
  description: z.string().min(2, 'A short description is required.'),
});

type CashFormInput = z.input<typeof cashSchema>;
type CashFormValues = z.output<typeof cashSchema>;

export function CashTransactionFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CashFormInput, any, CashFormValues>({
    resolver: zodResolver(cashSchema),
    defaultValues: {
      type: 'income',
      category: INCOME_CATEGORIES[0],
      amount: 0,
      transactionDate: toInputDate(new Date()),
      description: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        type: 'income',
        category: INCOME_CATEGORIES[0],
        amount: 0,
        transactionDate: toInputDate(new Date()),
        description: '',
      });
    }
  }, [open, reset]);

  const type = watch('type');
  const categoryOptions = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const onSubmit = async (values: CashFormValues) => {
    await db.cashTransactions.add({
      type: values.type,
      category: values.category,
      amount: values.amount,
      transactionDate: new Date(values.transactionDate),
      description: values.description,
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Inject Income / Expense" description="Keeps the household's net liquid cash calculation accurate.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField label="Transaction Type" error={errors.type?.message}>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex min-h-[44px] cursor-pointer items-center justify-center rounded-md border text-sm font-semibold transition-colors ${
                type === 'income'
                  ? 'border-[var(--color-emerald)] bg-[var(--color-emerald-50)] text-[var(--color-emerald)]'
                  : 'border-[var(--color-hairline)] text-[var(--color-ink-faint)]'
              }`}
            >
              <input type="radio" value="income" className="sr-only" {...register('type')} />
              Income
            </label>
            <label
              className={`flex min-h-[44px] cursor-pointer items-center justify-center rounded-md border text-sm font-semibold transition-colors ${
                type === 'expense'
                  ? 'border-[var(--color-crimson)] bg-[var(--color-crimson-50)] text-[var(--color-crimson)]'
                  : 'border-[var(--color-hairline)] text-[var(--color-ink-faint)]'
              }`}
            >
              <input type="radio" value="expense" className="sr-only" {...register('type')} />
              Expense
            </label>
          </div>
        </FormField>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="Category" error={errors.category?.message}>
            <Select {...register('category')}>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Amount (LKR)" error={errors.amount?.message}>
            <Input type="number" step="0.01" min="0" {...register('amount')} />
          </FormField>

          <FormField label="Transaction Date" error={errors.transactionDate?.message}>
            <Input type="date" {...register('transactionDate')} />
          </FormField>
        </div>

        <FormField label="Description" error={errors.description?.message}>
          <Textarea placeholder="e.g. Monthly groceries at Cargills" {...register('description')} />
        </FormField>

        <div className="flex justify-end gap-3 border-t border-[var(--color-hairline)] pt-5">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant={type === 'income' ? 'success' : 'danger'} disabled={isSubmitting}>
            {type === 'income' ? 'Add Income' : 'Add Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
