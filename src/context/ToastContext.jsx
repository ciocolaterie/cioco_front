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

const TYPE_CLASS = {
  success: styles.toastSuccess,
  error:   styles.toastError,
  warning: styles.toastWarning,
  default: styles.toastDefault,
};

function inferType({ type, title = '' }) {
  if (type) return type;
  if (title.startsWith('Eroare') || title.includes('eroare')) return 'error';
  if (WARNINGS.has(title)) return 'warning';
  return 'success';
}

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
          <div key={t.id} className={`${styles.toast} ${TYPE_CLASS[inferType(t)] || ''}`}>
            {t.title && <div className={styles.title}>{t.title}</div>}
            {t.body && <div className={styles.body}>{t.body}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
