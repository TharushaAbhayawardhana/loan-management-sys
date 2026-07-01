import { useRef, useState } from 'react';
import { DatabaseBackup, UploadCloud, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import {
  downloadBackupFile,
  exportFullBackup,
  parseBackupFile,
  restoreFromBackup,
  type FFMSBackupPayload,
} from '../../lib/backup';

type StatusMessage = { tone: 'success' | 'error'; text: string } | null;

export function BackupRestorePanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingPayload, setPendingPayload] = useState<FFMSBackupPayload | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [status, setStatus] = useState<StatusMessage>(null);

  const handleExport = async () => {
    setStatus(null);
    setIsExporting(true);
    try {
      const payload = await exportFullBackup();
      downloadBackupFile(payload);
      setStatus({ tone: 'success', text: 'Backup downloaded successfully. Store this file somewhere safe.' });
    } catch {
      setStatus({ tone: 'error', text: 'Could not generate the backup file. Please try again.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setStatus(null);
    try {
      const text = await file.text();
      const payload = parseBackupFile(text);
      setPendingPayload(payload);
    } catch {
      setStatus({ tone: 'error', text: 'This file does not look like a valid FFMS backup. No changes were made.' });
    }
  };

  const handleConfirmRestore = async () => {
    if (!pendingPayload) return;
    setIsRestoring(true);
    setStatus(null);
    try {
      await restoreFromBackup(pendingPayload);
      setStatus({ tone: 'success', text: 'Backup restored. All loans, payments, and cash records have been replaced.' });
    } catch {
      setStatus({ tone: 'error', text: 'Restore failed. Your existing data was not modified.' });
    } finally {
      setIsRestoring(false);
      setPendingPayload(null);
    }
  };

  const backupDate = pendingPayload ? new Date(pendingPayload.exportedAt) : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fail-Safe Local Backup</CardTitle>
        <DatabaseBackup size={16} className="text-[var(--color-ink-faint)]" />
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-xs text-[var(--color-ink-faint)]">
          The FFMS runs entirely offline with no cloud persistence layer — this JSON export is the only safeguard
          against browser data loss. Download it regularly and store it somewhere secure.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col justify-between gap-3 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-paper-dim)] p-4">
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">Export Full Backup</p>
              <p className="mt-1 text-xs text-[var(--color-ink-faint)]">
                Serializes every loan, payment, and cash transaction into a single portable JSON file.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleExport} disabled={isExporting}>
              <DatabaseBackup size={13} /> {isExporting ? 'Preparing…' : 'Download Backup JSON'}
            </Button>
          </div>

          <div className="flex flex-col justify-between gap-3 rounded-lg border border-[var(--color-crimson)]/25 bg-[var(--color-crimson-50)] p-4">
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)]">Restore From Backup</p>
              <p className="mt-1 text-xs text-[var(--color-ink-faint)]">
                Destructive operation — this replaces all current local data with the contents of the file.
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isRestoring}>
              <UploadCloud size={13} /> {isRestoring ? 'Restoring…' : 'Select Backup File…'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleFileSelected}
            />
          </div>
        </div>

        {status && (
          <div
            className={`mt-4 flex items-start gap-2 rounded-lg border px-4 py-3 text-xs ${
              status.tone === 'success'
                ? 'border-[var(--color-emerald)]/25 bg-[var(--color-emerald-50)] text-[var(--color-emerald)]'
                : 'border-[var(--color-crimson)]/25 bg-[var(--color-crimson-50)] text-[var(--color-crimson)]'
            }`}
          >
            {status.tone === 'success' ? (
              <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            )}
            <span>{status.text}</span>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={!!pendingPayload}
        onClose={() => setPendingPayload(null)}
        onConfirm={handleConfirmRestore}
        confirmLabel="Replace All Data"
        title="Restore this backup?"
        description={`This will permanently delete all current loans, payments, and cash transactions and replace them with the backup exported on ${
          backupDate ? backupDate.toLocaleString('en-GB') : 'an unknown date'
        }. This cannot be undone.`}
      />

      <div className="mx-5 mb-5 flex items-center gap-2 rounded-lg border border-[var(--color-hairline)] px-4 py-2.5 text-[11px] text-[var(--color-ink-faint)]">
        <ShieldAlert size={13} className="shrink-0" />
        Backups are stored only on your device unless you move the downloaded file elsewhere.
      </div>
    </Card>
  );
}
