import Dexie, { type Table } from 'dexie';

// ---------------------------------------------------------------------------
// DOMAIN TYPES
// ---------------------------------------------------------------------------

export type LoanCategory = 'bank' | 'interest' | 'gold' | 'personal' | 'other';
export type InterestType = 'fixed' | 'reducing' | 'flat_informal' | 'none';
export type LoanStatus = 'active' | 'overdue' | 'settled';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'counter_deposit' | 'other';
export type CashTransactionType = 'income' | 'expense';

export interface Loan {
  id?: string;
  name: string;
  category: LoanCategory;
  lender: string;
  originalAmount: number;
  interestType: InterestType;
  interestRatePercentage: number;
  monthlyInstallment: number;
  startDate: Date;
  dueDateDayOfMonth: number;
  status: LoanStatus;
  notes?: string;
  createdAt: Date;
}

export interface PaymentLedger {
  id?: string;
  loanId: string;
  amountPaid: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  notes?: string;
  receiptReference?: string;
  calculatedBalanceAfter: number;
}

export interface CashTransaction {
  id?: string;
  type: CashTransactionType;
  category: string;
  amount: number;
  transactionDate: Date;
  description: string;
}

export interface SystemSettings {
  id?: string;
  key: string;
  value: unknown;
}

// ---------------------------------------------------------------------------
// DATABASE DEFINITION
// ---------------------------------------------------------------------------

export class FFMSDatabase extends Dexie {
  loans!: Table<Loan, string>;
  paymentLedger!: Table<PaymentLedger, string>;
  cashTransactions!: Table<CashTransaction, string>;
  systemSettings!: Table<SystemSettings, string>;

  constructor() {
    super('ffms-family-financial-db');

    this.version(1).stores({
      loans: '++id, name, category, lender, status, dueDateDayOfMonth',
      paymentLedger: '++id, loanId, paymentDate',
      cashTransactions: '++id, type, category, transactionDate',
      systemSettings: '++id, key',
    });

    // Ensure Date objects survive round-trips through IndexedDB structured clone.
    this.loans.hook('creating', (_pk, obj) => {
      obj.createdAt = obj.createdAt ?? new Date();
    });
  }
}

export const db = new FFMSDatabase();

// ---------------------------------------------------------------------------
// SEED DATA — loaded once on first run so the dashboard has meaningful
// baseline numbers that match the target scenario in the spec.
// ---------------------------------------------------------------------------

const SEED_FLAG_KEY = 'ffms_seeded_v1';

// Module-level guard: React StrictMode intentionally invokes effects twice on
// mount in development, which was causing seedDatabaseIfEmpty() to be called
// twice concurrently — both calls could pass the "is it empty?" checks before
// either one finished writing, resulting in every loan being inserted twice.
// Caching the in-flight promise ensures a second concurrent call reuses the
// same seeding operation instead of racing it.
let seedingPromise: Promise<void> | null = null;

export function seedDatabaseIfEmpty(): Promise<void> {
  if (!seedingPromise) {
    seedingPromise = performSeed();
  }
  return seedingPromise;
}

async function performSeed(): Promise<void> {
  // Wrapping the check-and-insert in a single Dexie transaction makes the
  // whole operation atomic, so even calls from another tab/context can't
  // interleave between the "is it seeded?" check and the actual insert.
  await db.transaction('rw', db.loans, db.systemSettings, async () => {
    const seededRow = await db.systemSettings.where('key').equals(SEED_FLAG_KEY).first();
    if (seededRow) return;

    const loanCount = await db.loans.count();
    if (loanCount > 0) {
      await db.systemSettings.add({ key: SEED_FLAG_KEY, value: true });
      return;
    }

    const now = new Date();

    const seedLoans: Loan[] = [
      // -------------------------------------------------------------------
      // Bank Loans — Sanasa Bank
      // -------------------------------------------------------------------
      {
        name: 'Sanasa Bank Loan 1',
        category: 'bank',
        lender: 'Sanasa Bank',
        originalAmount: 79155,
        interestType: 'reducing',
        interestRatePercentage: 14,
        monthlyInstallment: 4200,
        startDate: new Date(2026, 1, 2),
        dueDateDayOfMonth: 28,
        status: 'active',
        notes: '~19 months remaining; assumed 24-month tenor. Interest rate estimated — confirm with bank.',
        createdAt: now,
      },
      {
        name: 'Sanasa Bank Loan 2',
        category: 'bank',
        lender: 'Sanasa Bank',
        originalAmount: 65720,
        interestType: 'reducing',
        interestRatePercentage: 14,
        monthlyInstallment: 2860,
        startDate: new Date(2026, 5, 2),
        dueDateDayOfMonth: 5,
        status: 'active',
        notes: 'Combined advances: 47,720 + 18,000. ~23 months remaining. Interest rate estimated.',
        createdAt: now,
      },
      {
        name: 'Sanasa Bank Loan 3',
        category: 'bank',
        lender: 'Sanasa Bank',
        originalAmount: 14400,
        interestType: 'reducing',
        interestRatePercentage: 13,
        monthlyInstallment: 2400,
        startDate: new Date(2026, 0, 2),
        dueDateDayOfMonth: 15,
        status: 'active',
        notes: 'Combined advances: 13,200 + 1,200. ~6 months remaining, assumed 12-month tenor. Interest rate estimated.',
        createdAt: now,
      },
      {
        name: 'Sanasa Bank Loan 4',
        category: 'bank',
        lender: 'Sanasa Bank',
        originalAmount: 19800,
        interestType: 'reducing',
        interestRatePercentage: 13,
        monthlyInstallment: 6600,
        startDate: new Date(2026, 3, 2),
        dueDateDayOfMonth: 20,
        status: 'active',
        notes: 'Combined advances: 18,000 + 1,800. ~3 months remaining, assumed 6-month tenor. Interest rate estimated.',
        createdAt: now,
      },
      {
        name: 'Sanasa Bank Loan 5',
        category: 'bank',
        lender: 'Sanasa Bank',
        originalAmount: 4000,
        interestType: 'reducing',
        interestRatePercentage: 13,
        monthlyInstallment: 4000,
        startDate: new Date(2026, 5, 2),
        dueDateDayOfMonth: 10,
        status: 'active',
        notes: 'No schedule given — treated as short-term. Interest rate estimated.',
        createdAt: now,
      },

      // -------------------------------------------------------------------
      // Interest Loans — Navinna Poli Mudalali
      // -------------------------------------------------------------------
      {
        name: 'Navinna Poli — Heena Wana Seshaya',
        category: 'interest',
        lender: 'Navinna Poli Mudalali',
        originalAmount: 34500,
        interestType: 'flat_informal',
        interestRatePercentage: 10,
        monthlyInstallment: 4417,
        startDate: new Date(2026, 5, 1),
        dueDateDayOfMonth: 5,
        status: 'active',
        notes: 'Decreasing installment schedule, 9 remaining: 4417, 4260, 4162, 3945, 3787, 3630, 3472, 3315, 3157. Rate estimated.',
        createdAt: now,
      },
      {
        name: 'Navinna Poli — 8-Month Loan',
        category: 'interest',
        lender: 'Navinna Poli Mudalali',
        originalAmount: 67080,
        interestType: 'flat_informal',
        interestRatePercentage: 10,
        monthlyInstallment: 8385,
        startDate: new Date(2026, 5, 1),
        dueDateDayOfMonth: 5,
        status: 'active',
        notes: 'Fixed installment, 8 months, nothing paid yet. Rate estimated.',
        createdAt: now,
      },

      // -------------------------------------------------------------------
      // Gold Loans
      // -------------------------------------------------------------------
      {
        name: 'Gold Pendant Pawn',
        category: 'gold',
        lender: 'Pawn Center (unspecified)',
        originalAmount: 80000,
        interestType: 'flat_informal',
        interestRatePercentage: 1.5,
        monthlyInstallment: 1200,
        startDate: new Date(2025, 10, 2),
        dueDateDayOfMonth: 12,
        status: 'active',
        notes: 'Estimated interest-only payment at 1.5%/month — confirm actual pawn center terms.',
        createdAt: now,
      },
      {
        name: 'Gold Chain Pawn',
        category: 'gold',
        lender: 'Pawn Center (unspecified)',
        originalAmount: 380000,
        interestType: 'flat_informal',
        interestRatePercentage: 1.5,
        monthlyInstallment: 5700,
        startDate: new Date(2025, 8, 2),
        dueDateDayOfMonth: 18,
        status: 'active',
        notes: 'Estimated interest-only payment at 1.5%/month — confirm actual pawn center terms.',
        createdAt: now,
      },

      // -------------------------------------------------------------------
      // Personal Loans — zero/low interest friendly capital
      // -------------------------------------------------------------------
      {
        name: 'Police — Personal Assistance',
        category: 'personal',
        lender: 'Police',
        originalAmount: 10000,
        interestType: 'none',
        interestRatePercentage: 0,
        monthlyInstallment: 10000,
        startDate: new Date(2026, 4, 2),
        dueDateDayOfMonth: 10,
        status: 'active',
        createdAt: now,
      },
      {
        name: 'Danushi — Family Support',
        category: 'personal',
        lender: 'Danushi',
        originalAmount: 30000,
        interestType: 'none',
        interestRatePercentage: 0,
        monthlyInstallment: 30000,
        startDate: new Date(2026, 3, 2),
        dueDateDayOfMonth: 30,
        status: 'active',
        createdAt: now,
      },
      {
        name: 'Chuti Bappa',
        category: 'personal',
        lender: 'Chuti Bappa',
        originalAmount: 12500,
        interestType: 'none',
        interestRatePercentage: 0,
        monthlyInstallment: 12500,
        startDate: new Date(2026, 4, 15),
        dueDateDayOfMonth: 15,
        status: 'active',
        createdAt: now,
      },
      {
        name: 'Namal Mahappa',
        category: 'personal',
        lender: 'Namal Mahappa',
        originalAmount: 30000,
        interestType: 'none',
        interestRatePercentage: 0,
        monthlyInstallment: 30000,
        startDate: new Date(2026, 2, 2),
        dueDateDayOfMonth: 20,
        status: 'active',
        createdAt: now,
      },
      {
        name: 'Sudu Bappa',
        category: 'personal',
        lender: 'Sudu Bappa',
        originalAmount: 5000,
        interestType: 'none',
        interestRatePercentage: 0,
        monthlyInstallment: 5000,
        startDate: new Date(2026, 5, 10),
        dueDateDayOfMonth: 10,
        status: 'active',
        createdAt: now,
      },
      {
        name: 'Mallika Anty',
        category: 'personal',
        lender: 'Mallika Anty',
        originalAmount: 5000,
        interestType: 'none',
        interestRatePercentage: 0,
        monthlyInstallment: 5000,
        startDate: new Date(2026, 5, 15),
        dueDateDayOfMonth: 15,
        status: 'active',
        createdAt: now,
      },
      {
        name: 'Loku Mahappa',
        category: 'personal',
        lender: 'Loku Mahappa',
        originalAmount: 17000,
        interestType: 'none',
        interestRatePercentage: 0,
        monthlyInstallment: 17000,
        startDate: new Date(2026, 1, 2),
        dueDateDayOfMonth: 25,
        status: 'active',
        createdAt: now,
      },
      {
        name: 'Achichi',
        category: 'personal',
        lender: 'Achichi',
        originalAmount: 1400,
        interestType: 'none',
        interestRatePercentage: 0,
        monthlyInstallment: 1400,
        startDate: new Date(2026, 5, 20),
        dueDateDayOfMonth: 20,
        status: 'active',
        createdAt: now,
      },
      {
        name: 'Akka',
        category: 'personal',
        lender: 'Akka',
        originalAmount: 4000,
        interestType: 'none',
        interestRatePercentage: 0,
        monthlyInstallment: 4000,
        startDate: new Date(2026, 4, 25),
        dueDateDayOfMonth: 25,
        status: 'active',
        createdAt: now,
      },
      {
        name: 'Kumara Uncle',
        category: 'personal',
        lender: 'Kumara Uncle',
        originalAmount: 5000,
        interestType: 'none',
        interestRatePercentage: 0,
        monthlyInstallment: 5000,
        startDate: new Date(2026, 3, 15),
        dueDateDayOfMonth: 15,
        status: 'active',
        createdAt: now,
      },
      {
        name: 'Pushkara Uncle',
        category: 'personal',
        lender: 'Pushkara Uncle',
        originalAmount: 7500,
        interestType: 'none',
        interestRatePercentage: 0,
        monthlyInstallment: 7500,
        startDate: new Date(2026, 2, 20),
        dueDateDayOfMonth: 20,
        status: 'active',
        createdAt: now,
      },
      {
        name: 'Shehan Uncle',
        category: 'personal',
        lender: 'Shehan Uncle',
        originalAmount: 5000,
        interestType: 'none',
        interestRatePercentage: 0,
        monthlyInstallment: 5000,
        startDate: new Date(2026, 5, 5),
        dueDateDayOfMonth: 5,
        status: 'active',
        createdAt: now,
      },

      // -------------------------------------------------------------------
      // Other / Future Obligations
      // -------------------------------------------------------------------
      {
        name: 'Bike Repair Loan',
        category: 'other',
        lender: 'Unspecified',
        originalAmount: 3000,
        interestType: 'none',
        interestRatePercentage: 0,
        monthlyInstallment: 3000,
        startDate: new Date(2026, 5, 25),
        dueDateDayOfMonth: 25,
        status: 'active',
        notes: 'For bike repair ("Bike eka hadanna").',
        createdAt: now,
      },
      {
        name: 'Kadeta (Shop Credit)',
        category: 'other',
        lender: 'Local Shop',
        originalAmount: 21000,
        interestType: 'none',
        interestRatePercentage: 0,
        monthlyInstallment: 21000,
        startDate: new Date(2026, 3, 10),
        dueDateDayOfMonth: 10,
        status: 'active',
        createdAt: now,
      },
      {
        name: 'Suwarapola Kade (Shop Credit)',
        category: 'other',
        lender: 'Suwarapola Kade',
        originalAmount: 16500,
        interestType: 'none',
        interestRatePercentage: 0,
        monthlyInstallment: 16500,
        startDate: new Date(2026, 2, 15),
        dueDateDayOfMonth: 15,
        status: 'active',
        createdAt: now,
      },
    ];

    await db.loans.bulkAdd(seedLoans);

    // No historical payments or cash transactions are seeded — none of this
    // is real yet. Record actual payments via the Payment modal and actual
    // income/expense entries via the Cash Flow page as they occur.

    await db.systemSettings.add({ key: SEED_FLAG_KEY, value: true });
  });
}