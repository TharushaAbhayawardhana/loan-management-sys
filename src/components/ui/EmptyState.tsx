import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-hairline)] px-6 py-14 text-center">
      {icon && <div className="mb-3 text-[var(--color-brass)] opacity-70">{icon}</div>}
      <p className="font-display text-lg font-semibold text-[var(--color-ink)]">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-[var(--color-ink-faint)]">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
