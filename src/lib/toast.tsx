import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-rise flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-[var(--shadow-card-lg)] ${
              t.type === 'success'
                ? 'border-[var(--color-emerald)]/25 bg-[var(--color-emerald-50)] text-[var(--color-emerald)]'
                : t.type === 'error'
                ? 'border-[var(--color-crimson)]/25 bg-[var(--color-crimson-50)] text-[var(--color-crimson)]'
                : 'border-[var(--color-hairline)] bg-[var(--color-paper-card)] text-[var(--color-ink-soft)]'
            }`}
          >
            {t.type === 'success' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> :
             t.type === 'error' ? <AlertTriangle size={16} className="mt-0.5 shrink-0" /> :
             <Info size={16} className="mt-0.5 shrink-0" />}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => remove(t.id)} className="shrink-0 opacity-60 hover:opacity-100 cursor-pointer" aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
