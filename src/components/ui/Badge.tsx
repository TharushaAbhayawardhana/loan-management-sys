import { type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type Tone = 'brass' | 'crimson' | 'emerald' | 'neutral';

const toneClasses: Record<Tone, string> = {
  brass: 'bg-[var(--color-brass-50)] text-[var(--color-brass-dark)] border-[var(--color-brass)]/30',
  crimson: 'bg-[var(--color-crimson-50)] text-[var(--color-crimson)] border-[var(--color-crimson)]/25',
  emerald: 'bg-[var(--color-emerald-50)] text-[var(--color-emerald)] border-[var(--color-emerald)]/25',
  neutral: 'bg-[var(--color-paper-dim)] text-[var(--color-ink-soft)] border-[var(--color-hairline)]',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap',
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function statusToTone(status: 'active' | 'overdue' | 'settled'): Tone {
  if (status === 'overdue') return 'crimson';
  if (status === 'settled') return 'emerald';
  return 'brass';
}
