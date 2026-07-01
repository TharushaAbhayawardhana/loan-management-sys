import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, description, children, maxWidth = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-[var(--color-ink-900)]/55 backdrop-blur-[2px] animate-rise"
        style={{ animationDuration: '0.25s' }}
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full sm:w-auto sm:min-w-[420px]',
          maxWidth,
          'max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[var(--color-paper-card)]',
          'border border-[var(--color-hairline)] shadow-[var(--shadow-card-lg)] animate-rise'
        )}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--color-hairline)] bg-[var(--color-paper-card)] px-6 py-5">
          <div>
            <h2 id="modal-title" className="font-display text-xl font-semibold text-[var(--color-ink)]">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-[var(--color-ink-faint)]">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-ink-soft)] hover:bg-[var(--color-paper-dim)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
