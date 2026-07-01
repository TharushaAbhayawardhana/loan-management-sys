import { db, type CashTransaction, type Loan, type PaymentLedger, type SystemSettings } from './db';

export interface FFMSBackupPayload {
  formatVersion: 1;
  exportedAt: string;
  appName: 'Family Financial Management System';
  data: {
    loans: Loan[];
    paymentLedger: PaymentLedger[];
    cashTransactions: CashTransaction[];
    systemSettings: SystemSettings[];
  };
}

/**
 * Serializes the entire local database into a single portable JSON backup
 * file. This is the application's core, fail-safe backup strategy since
 * there is no cloud persistence layer.
 */
export async function exportFullBackup(): Promise<FFMSBackupPayload> {
  const [loans, paymentLedger, cashTransactions, systemSettings] = await Promise.all([
    db.loans.toArray(),
    db.paymentLedger.toArray(),
    db.cashTransactions.toArray(),
    db.systemSettings.toArray(),
  ]);

  return {
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    appName: 'Family Financial Management System',
    data: { loans, paymentLedger, cashTransactions, systemSettings },
  };
}

export function downloadBackupFile(payload: FFMSBackupPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `ffms-backup-${timestamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function reviveDates<T extends object>(rows: T[], dateFields: (keyof T)[]): T[] {
  return rows.map((row) => {
    const clone = { ...row };
    for (const field of dateFields) {
      const value = clone[field];
      if (value) clone[field] = new Date(value as string) as never;
    }
    return clone;
  });
}

/**
 * Restores a previously exported backup file. This performs a full
 * destructive replace of local tables to guarantee a clean, consistent
 * restoration with no orphaned or duplicated records.
 */
export async function restoreFromBackup(payload: FFMSBackupPayload): Promise<void> {
  if (payload.formatVersion !== 1 || !payload.data) {
    throw new Error('Unrecognized backup file format.');
  }

  const loans = reviveDates(payload.data.loans, ['startDate', 'createdAt']);
  const paymentLedger = reviveDates(payload.data.paymentLedger, ['paymentDate']);
  const cashTransactions = reviveDates(payload.data.cashTransactions, ['transactionDate']);

  await db.transaction(
    'rw',
    [db.loans, db.paymentLedger, db.cashTransactions, db.systemSettings],
    async () => {
      await Promise.all([
        db.loans.clear(),
        db.paymentLedger.clear(),
        db.cashTransactions.clear(),
        db.systemSettings.clear(),
      ]);
      await db.loans.bulkAdd(loans);
      await db.paymentLedger.bulkAdd(paymentLedger);
      await db.cashTransactions.bulkAdd(cashTransactions);
      await db.systemSettings.bulkAdd(payload.data.systemSettings);
    }
  );
}

export function parseBackupFile(fileText: string): FFMSBackupPayload {
  const parsed = JSON.parse(fileText) as FFMSBackupPayload;
  if (!parsed || typeof parsed !== 'object' || !('data' in parsed)) {
    throw new Error('This file does not look like a valid FFMS backup.');
  }
  return parsed;
}

// ---------------------------------------------------------------------------
// CSV EXPORT
// ---------------------------------------------------------------------------

function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function rowsToCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers.map(escapeCsvCell).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(','));
  }
  return lines.join('\n');
}

export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
