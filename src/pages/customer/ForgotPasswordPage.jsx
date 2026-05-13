import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../services/auth.service.js';
import styles from './LoginPage.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'A apărut o problemă');
    } finally { setBusy(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1>Resetare parolă</h1>
        {sent ? (
          <>
            <p style={{ color: 'var(--ink-2)', marginBottom: 24, fontSize: 14 }}>
              Dacă există un cont cu adresa <strong>{email}</strong>, vei primi un email cu instrucțiuni în câteva minute.
            </p>
            <Link to="/login" className={styles.back}>← Înapoi la login</Link>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--ink-2)', marginBottom: 20, fontSize: 14 }}>
              Introdu adresa de email a contului tău și îți trimitem un link de resetare.
            </p>
            <form onSubmit={submit} className={styles.form}>
              <label>
                Email
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
              </label>
              {error && <p style={{ color: '#DC2626', fontSize: 13 }}>{error}</p>}
              <button type="submit" disabled={busy}>{busy ? '…' : 'Trimite link de resetare'}</button>
            </form>
            <Link to="/login" className={styles.back}>← Înapoi la login</Link>
          </>
        )}
      </div>
    </div>
  );
}
