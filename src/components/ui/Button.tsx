import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[var(--color-ink)] text-[var(--color-paper-card)] hover:bg-[var(--color-ink-700)] active:bg-[var(--color-ink-900)] shadow-[var(--shadow-card)]',
  secondary:
    'bg-transparent text-[var(--color-ink)] border border-[var(--color-hairline)] hover:border-[var(--color-brass)] hover:text-[var(--color-brass-dark)]',
  ghost: 'bg-transparent text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-dim)]',
  danger: 'bg-[var(--color-crimson)] text-white hover:bg-[var(--color-crimson-light)] shadow-[var(--shadow-card)]',
  success: 'bg-[var(--color-emerald)] text-white hover:bg-[var(--color-emerald-light)] shadow-[var(--shadow-card)]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[36px]',
  md: 'text-sm px-4 py-2.5 gap-2 min-h-[44px]',
  lg: 'text-base px-6 py-3 gap-2.5 min-h-[48px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-sans font-semibold tracking-tight',
          'transition-all duration-200 ease-out cursor-pointer select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brass)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-paper)]',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
          'touch-manipulation',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
