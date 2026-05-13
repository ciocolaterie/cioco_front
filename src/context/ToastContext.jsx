import { createContext, useContext, useState } from 'react';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = (t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(s => [...s, { id, ...t }]);
    setTimeout(() => setToasts(s => s.filter(x => x.id !== id)), t.duration || 3500);
  };
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className={styles.wrap}>
        {toasts.map(t => (
          <div key={t.id} className={styles.toast}>
            {t.title && <div className={styles.title}>{t.title}</div>}
            {t.body && <div className={styles.body}>{t.body}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
