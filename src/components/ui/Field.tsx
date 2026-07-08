import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

const fieldBase =
  'w-full rounded-md border border-[var(--color-hairline)] bg-[var(--color-paper-card)] px-3.5 py-2.5 text-base sm:text-sm text-[var(--color-ink)] ' +
  'placeholder:text-[var(--color-ink-faint)] transition-colors duration-150 min-h-[44px] ' +
  'focus:outline-none focus:ring-2 focus:ring-[var(--color-brass-light)] focus:border-[var(--color-brass)]';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldBase, className)} {...props} />
  )
);
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(fieldBase, 'cursor-pointer', className)} {...props}>
      {children}
    </select>
  )
);
Select.displayName = 'Select';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(fieldBase, 'min-h-[88px] resize-y', className)} {...props} />
  )
);
Textarea.displayName = 'Textarea';

export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)] mb-1.5', className)}
      {...props}
    >
      {children}
    </label>
  );
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-1.5 text-xs font-medium text-[var(--color-crimson)]">{children}</p>;
}

export function FormField({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-[var(--color-ink-faint)]">{hint}</p>}
      <FieldError>{error}</FieldError>
    </div>
  );
}
