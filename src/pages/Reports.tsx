import { useAllLoansWithPaymentsRealtime, useCashTransactionsRealtime } from '../hooks/useFirestoreData';
import { CsvExportPanel } from '../components/reports/CsvExportPanel';
import { BackupRestorePanel } from '../components/reports/BackupRestorePanel';
import { PrintableAuditReport } from '../components/reports/PrintableAuditReport';
import { ImportLocalDataPanel } from '../components/reports/ImportLocalDataPanel';

export function Reports() {
  const { loans, payments, isLoading } = useAllLoansWithPaymentsRealtime();
  const { data: cashTransactions } = useCashTransactionsRealtime();

  if (isLoading) {
    return <div className="animate-pulse text-sm text-[var(--color-ink-faint)]">Loading reports…</div>;
  }

  return (
    <div className="space-y-6">
      <CsvExportPanel loans={loans} payments={payments} cashTransactions={cashTransactions ?? []} />
      <ImportLocalDataPanel />
      <BackupRestorePanel loans={loans} payments={payments} cashTransactions={cashTransactions ?? []} />
      <PrintableAuditReport loans={loans} payments={payments} cashTransactions={cashTransactions ?? []} />
    </div>
  );
}
