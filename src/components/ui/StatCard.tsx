import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

type Tone = 'ink' | 'brass' | 'crimson' | 'emerald';

const toneClasses: Record<Tone, string> = {
  ink: 'text-[var(--color-ink)]',
  brass: 'text-[var(--color-brass-dark)]',
  crimson: 'text-[var(--color-crimson)]',
  emerald: 'text-[var(--color-emerald)]',
};

interface StatCardProps {
  label: string;
  value: string;
  icon?: ReactNode;
  tone?: Tone;
  sublabel?: string;
  delay?: number;
}

export function StatCard({ label, value, icon, tone = 'ink', sublabel, delay = 0 }: StatCardProps) {
  return (
    <div
      className="animate-rise rounded-xl border border-[var(--color-hairline)] bg-[var(--color-paper-card)] p-5 shadow-[var(--shadow-card)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">{label}</p>
        {icon && <span className={cn('opacity-70', toneClasses[tone])}>{icon}</span>}
      </div>
      <p className={cn('tabular-figures mt-2 text-2xl font-semibold leading-tight', toneClasses[tone])}>{value}</p>
      {sublabel && <p className="mt-1 text-xs text-[var(--color-ink-faint)]">{sublabel}</p>}
    </div>
  );
}
