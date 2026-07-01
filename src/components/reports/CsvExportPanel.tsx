import { FileSpreadsheet, Download } from 'lucide-react';
import type { CashTransaction, Loan, PaymentLedger } from '../../lib/db';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { downloadCsv, rowsToCsv } from '../../lib/backup';
import { calculateOutstandingBalance, calculatePercentPaid, calculateTotalPaid, LOAN_CATEGORY_LABELS } from '../../lib/calculations';
import { formatDate, toInputDate } from '../../lib/utils';

function timestampSuffix(): string {
  return toInputDate(new Date());
}

export function CsvExportPanel({
  loans,
  payments,
  cashTransactions,
}: {
  loans: Loan[];
  payments: PaymentLedger[];
  cashTransactions: CashTransaction[];
}) {
  const exportLoans = () => {
    const headers = [
      'Name',
      'Category',
      'Lender',
      'Original Amount',
      'Interest Type',
      'Interest Rate %',
      'Monthly Installment',
      'Start Date',
      'Due Day',
      'Status',
      'Total Paid',
      'Outstanding Balance',
      'Percent Paid',
      'Notes',
    ];
    const rows = loans.map((loan) => [
      loan.name,
      LOAN_CATEGORY_LABELS[loan.category],
      loan.lender,
      loan.originalAmount,
      loan.interestType,
      loan.interestRatePercentage,
      loan.monthlyInstallment,
      formatDate(loan.startDate),
      loan.dueDateDayOfMonth,
      loan.status,
      calculateTotalPaid(loan, payments),
      calculateOutstandingBalance(loan, payments),
      `${calculatePercentPaid(loan, payments)}%`,
      loan.notes ?? '',
    ]);
    downloadCsv(`ffms-loans-${timestampSuffix()}.csv`, rowsToCsv(headers, rows));
  };

  const exportPayments = () => {
    const headers = ['Date', 'Loan', 'Lender', 'Amount Paid', 'Method', 'Balance After', 'Receipt Reference', 'Notes'];
    const rows = [...payments]
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
      .map((p) => {
        const loan = loans.find((l) => l.id === p.loanId);
        return [
          formatDate(p.paymentDate),
          loan?.name ?? 'Unknown',
          loan?.lender ?? '',
          p.amountPaid,
          p.paymentMethod.replace('_', ' '),
          p.calculatedBalanceAfter,
          p.receiptReference ?? '',
          p.notes ?? '',
        ];
      });
    downloadCsv(`ffms-payment-ledger-${timestampSuffix()}.csv`, rowsToCsv(headers, rows));
  };

  const exportCashFlow = () => {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Description'];
    const rows = [...cashTransactions]
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      .map((t) => [formatDate(t.transactionDate), t.type, t.category, t.amount, t.description]);
    downloadCsv(`ffms-cash-flow-${timestampSuffix()}.csv`, rowsToCsv(headers, rows));
  };

  const exports = [
    {
      label: 'Loan Register',
      description: `${loans.length} loans across all five liability pillars.`,
      onClick: exportLoans,
      disabled: loans.length === 0,
    },
    {
      label: 'Payment Ledger',
      description: `${payments.length} recorded payment instances, most recent first.`,
      onClick: exportPayments,
      disabled: payments.length === 0,
    },
    {
      label: 'Cash Flow Log',
      description: `${cashTransactions.length} income / expense transactions.`,
      onClick: exportCashFlow,
      disabled: cashTransactions.length === 0,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSV Data Exporters</CardTitle>
        <FileSpreadsheet size={16} className="text-[var(--color-ink-faint)]" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {exports.map((item) => (
            <div
              key={item.label}
              className="flex flex-col justify-between gap-3 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-paper-dim)] p-4"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">{item.label}</p>
                <p className="mt-1 text-xs text-[var(--color-ink-faint)]">{item.description}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={item.onClick} disabled={item.disabled}>
                <Download size={13} /> Export CSV
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
