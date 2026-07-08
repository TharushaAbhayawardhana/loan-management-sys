import { useState } from 'react';
import { Plus, Landmark, Search } from 'lucide-react';
import { useAllLoansWithPaymentsRealtime } from '../hooks/useFirestoreData';
import { deleteLoan } from '../lib/firestore-service';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { type Loan, type LoanCategory } from '../lib/db';
import { LoanCard } from '../components/loans/LoanCard';
import { LoanFormModal } from '../components/loans/LoanFormModal';
import { PaymentFormModal } from '../components/loans/PaymentFormModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Field';
import { EmptyState } from '../components/ui/EmptyState';
import { LOAN_CATEGORY_LABELS, deriveLoanStatus } from '../lib/calculations';

type StatusFilter = 'all' | 'active' | 'overdue' | 'settled';

export function Loans() {
  const { householdId } = useAuth();
  const { toast } = useToast();
  const { loans, payments, isLoading } = useAllLoansWithPaymentsRealtime();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | LoanCategory>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | undefined>(undefined);
  const [paymentTarget, setPaymentTarget] = useState<string | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Loan | undefined>(undefined);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-full rounded-lg bg-[var(--color-paper-dim)]" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-[var(--color-paper-dim)]" />
          ))}
        </div>
      </div>
    );
  }

  const filteredLoans = loans.filter((loan) => {
    const matchesSearch =
      loan.name.toLowerCase().includes(search.toLowerCase()) || loan.lender.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || loan.category === categoryFilter;
    const effectiveStatus = deriveLoanStatus(loan, payments);
    const matchesStatus = statusFilter === 'all' || effectiveStatus === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const openAddModal = () => {
    setEditingLoan(undefined);
    setLoanModalOpen(true);
  };

  const openEditModal = (loan: Loan) => {
    setEditingLoan(loan);
    setLoanModalOpen(true);
  };

  const handleDelete = async (loan: Loan) => {
    if (!loan.id || !householdId) return;
    const result = await deleteLoan(householdId, loan.id);
    if (!result.success) {
      toast(result.error, 'error');
    } else {
      toast('Loan and its payment history deleted.', 'success');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]" />
            <Input
              placeholder="Search by name or lender…"
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as 'all' | LoanCategory)} className="sm:max-w-[190px]">
            <option value="all">All Categories</option>
            {Object.entries(LOAN_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="sm:max-w-[160px]">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="overdue">Overdue</option>
            <option value="settled">Settled</option>
          </Select>
        </div>
        <Button onClick={openAddModal}>
          <Plus size={16} /> Add New Loan Entity
        </Button>
      </div>

      {filteredLoans.length === 0 ? (
        <EmptyState
          icon={<Landmark size={28} />}
          title={loans.length === 0 ? 'No loans tracked yet' : 'No loans match your filters'}
          description={
            loans.length === 0
              ? 'Add your first liability across the five taxonomy pillars — bank, interest, gold, personal, or other.'
              : 'Try adjusting your search or filter criteria.'
          }
          action={
            loans.length === 0 ? (
              <Button onClick={openAddModal}>
                <Plus size={16} /> Add New Loan Entity
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLoans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              payments={payments}
              onEdit={() => openEditModal(loan)}
              onDelete={() => setDeleteTarget(loan)}
              onRecordPayment={() => setPaymentTarget(loan.id)}
            />
          ))}
        </div>
      )}

      <LoanFormModal open={loanModalOpen} onClose={() => { setLoanModalOpen(false); setEditingLoan(undefined); }} editingLoan={editingLoan} />
      <PaymentFormModal
        open={!!paymentTarget}
        onClose={() => setPaymentTarget(undefined)}
        preselectedLoanId={paymentTarget}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(undefined)}
        onConfirm={async () => {
          if (deleteTarget) await handleDelete(deleteTarget);
        }}
        title="Delete this loan?"
        description={`This will permanently remove "${deleteTarget?.name}" and its entire payment history. This action cannot be undone.`}
      />
    </div>
  );
}
