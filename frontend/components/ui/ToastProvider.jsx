'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'info', title = 'Notice', message = '', duration = 3800 }) => {
      const id = uid();
      setToasts((prev) => [...prev, { id, type, title, message }]);
      window.setTimeout(() => remove(id), duration);
      return id;
    },
    [remove]
  );

  const value = useMemo(
    () => ({
      showToast,
      success: (message, title = 'Success') => showToast({ type: 'success', title, message }),
      error: (message, title = 'Error') => showToast({ type: 'error', title, message }),
      warning: (message, title = 'Warning') => showToast({ type: 'warning', title, message }),
      info: (message, title = 'Info') => showToast({ type: 'info', title, message })
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-root" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item toast-${toast.type}`}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'start' }}>
              <div>
                <div className="toast-title">{toast.title}</div>
                {toast.message ? <div className="toast-message">{toast.message}</div> : null}
              </div>
              <button className="ms-btn ms-btn-secondary" style={{ height: 28, padding: '2px 10px' }} onClick={() => remove(toast.id)}>
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
