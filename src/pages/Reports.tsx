import { useAllLoansWithPayments, useCashTransactions } from '../hooks/useLoanCalculator';
import { CsvExportPanel } from '../components/reports/CsvExportPanel';
import { BackupRestorePanel } from '../components/reports/BackupRestorePanel';
import { PrintableAuditReport } from '../components/reports/PrintableAuditReport';

export function Reports() {
  const data = useAllLoansWithPayments();
  const cashTransactions = useCashTransactions() ?? [];

  if (!data) {
    return <div className="animate-pulse text-sm text-[var(--color-ink-faint)]">Loading reports…</div>;
  }

  return (
    <div className="space-y-6">
      <CsvExportPanel loans={data.loans} payments={data.payments} cashTransactions={cashTransactions} />
      <BackupRestorePanel />
      <PrintableAuditReport loans={data.loans} payments={data.payments} cashTransactions={cashTransactions} />
    </div>
  );
}
