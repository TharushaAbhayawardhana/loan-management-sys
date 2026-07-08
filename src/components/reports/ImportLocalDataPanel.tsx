import { useState, useEffect } from 'react';
import { Database, Upload, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../lib/toast';
import { importDexieDataToFirestore } from '../../lib/firestore-service';
import { db as dexieDb } from '../../lib/db';

export function ImportLocalDataPanel() {
  const { householdId, user } = useAuth();
  const { toast } = useToast();
  const [hasLocalData, setHasLocalData] = useState<boolean | null>(null);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkLocalData();
  }, []);

  async function checkLocalData() {
    try {
      const [loanCount, paymentCount, cashCount] = await Promise.all([
        dexieDb.loans.count(),
        dexieDb.paymentLedger.count(),
        dexieDb.cashTransactions.count(),
      ]);
      setHasLocalData(loanCount > 0 || paymentCount > 0 || cashCount > 0);
    } catch {
      setHasLocalData(false);
    }
  }

  const handleImport = async () => {
    if (!householdId || !user) {
      toast('You must be signed in to import data.', 'error');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const [loans, payments, cashTransactions] = await Promise.all([
        dexieDb.loans.toArray(),
        dexieDb.paymentLedger.toArray(),
        dexieDb.cashTransactions.toArray(),
      ]);

      const result = await importDexieDataToFirestore(householdId, loans, payments, cashTransactions, user.uid);

      if (!result.success) {
        throw new Error(result.error);
      }

      await Promise.all([
        dexieDb.loans.clear(),
        dexieDb.paymentLedger.clear(),
        dexieDb.cashTransactions.clear(),
        dexieDb.systemSettings.clear(),
      ]);

      setImported(true);
      toast(`Imported ${loans.length} loans, ${payments.length} payments, and ${cashTransactions.length} cash transactions.`, 'success');
    } catch (err: any) {
      setError(err?.message || 'Failed to import local data.');
      toast('Import failed. Your local data was not deleted.', 'error');
    } finally {
      setImporting(false);
    }
  };

  if (hasLocalData === null) return null;
  if (imported || !hasLocalData) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Local Data</CardTitle>
        <Database size={16} className="text-[var(--color-ink-faint)]" />
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-[var(--color-brass)]/25 bg-[var(--color-brass-50)] px-4 py-3">
          <div className="flex items-start gap-3">
            <Upload size={16} className="mt-0.5 shrink-0 text-[var(--color-brass-dark)]" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--color-brass-dark)]">
                Local data detected in browser storage
              </p>
              <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                Your existing loans, payments, and cash transactions from the previous local-only version
                are still in your browser. Import them to your cloud account so they're available across all devices.
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--color-crimson)]/25 bg-[var(--color-crimson-50)] px-4 py-2.5 text-xs text-[var(--color-crimson)]">
              <AlertTriangle size={13} />
              {error}
            </div>
          )}

          <Button className="mt-3" onClick={handleImport} disabled={importing}>
            {importing ? 'Importing…' : <><Upload size={14} /> Import to Cloud Account</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
