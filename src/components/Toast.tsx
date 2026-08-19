'use client';

import { Check, Info, X } from 'lucide-react';
import { createContext, useCallback, useContext, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  sub?: string;
}

interface ToastContextValue {
  show: (message: string, options?: { type?: ToastType; sub?: string }) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let nextId = 0;

  const show = useCallback((message: string, options?: { type?: ToastType; sub?: string }) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type: options?.type ?? 'success', sub: options?.sub }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const icons = { success: Check, error: X, info: Info };
  const colors = {
    success: 'bg-surf-2 border-border text-ink',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-surf-2 border-border text-ink',
  };
  const iconColors = {
    success: 'bg-pri text-on-pri',
    error: 'bg-red-400 text-white',
    info: 'bg-pri text-on-pri',
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}

      {/* Toast 렌더 */}
      <div className="fixed bottom-24 lg:bottom-6 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-xs pointer-events-auto animate-in slide-in-from-right-4 fade-in duration-200 ${colors[toast.type]}`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${iconColors[toast.type]}`}
              >
                <Icon size={12} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{toast.message}</p>
                {toast.sub && <p className="text-xs mt-0.5 opacity-70">{toast.sub}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
