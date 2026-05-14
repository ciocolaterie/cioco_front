import { createContext, useContext, useState } from 'react';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

const WARNINGS = new Set([
  'Completează datele de contact',
  'Adresa de livrare e obligatorie',
  'Parolele nu se potrivesc',
  'Parola trebuie să aibă cel puțin 6 caractere',
  'Maxim 3 recenzii pot fi afișate în testimoniale',
]);

function inferType({ type, title = '' }) {
  if (type) return type;
  if (title.startsWith('Eroare') || title.includes('eroare')) return 'error';
  if (WARNINGS.has(title)) return 'warning';
  return 'success';
}

const ICONS = {
  success: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  error: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  warning: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  default: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
};

const TYPE_CLASS = {
  success: styles.toastSuccess,
  error:   styles.toastError,
  warning: styles.toastWarning,
  default: styles.toastDefault,
};

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
        {toasts.map(t => {
          const type = inferType(t);
          return (
            <div key={t.id} className={`${styles.toast} ${TYPE_CLASS[type] || ''}`}>
              <span className={styles.iconWrap}>{ICONS[type] || ICONS.default}</span>
              <div className={styles.content}>
                {t.title && <div className={styles.title}>{t.title}</div>}
                {t.body && <div className={styles.body}>{t.body}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
