import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ConfirmDialog.module.css';

export default function ConfirmDialog({ open, title, body, confirmLabel = 'Confirmă', cancelLabel = 'Anulează', danger = false, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>
        <h3 className={styles.title}>{title}</h3>
        {body && <p className={styles.body}>{body}</p>}
        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onCancel}>{cancelLabel}</button>
          <button className={`${styles.confirm} ${danger ? styles.danger : ''}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
