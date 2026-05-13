import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../../services/auth.service.js';
import { useAuth } from '../../context/AuthContext.jsx';
import styles from './LoginPage.module.css';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const { setUser } = useAuth();
  const nav = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Parolele nu se potrivesc'); return; }
    if (password.length < 6) { setError('Parola trebuie să aibă cel puțin 6 caractere'); return; }
    setBusy(true);
    setError('');
    try {
      const { user } = await resetPassword(token, password);
      setUser(user);
      nav('/cont');
    } catch (err) {
      setError(err.response?.data?.error || 'Link invalid sau expirat');
    } finally { setBusy(false); }
  };

  if (!token) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1>Link invalid</h1>
          <p style={{ color: 'var(--ink-2)', marginBottom: 20, fontSize: 14 }}>Acest link de resetare este invalid sau a expirat.</p>
          <Link to="/forgot-password" className={styles.back}>Cere un link nou</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1>Parolă nouă</h1>
        <form onSubmit={submit} className={styles.form}>
          <label>
            Parolă nouă
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus minLength={6} />
          </label>
          <label>
            Confirmă parola
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={6} />
          </label>
          {error && <p style={{ color: '#DC2626', fontSize: 13 }}>{error}</p>}
          <button type="submit" disabled={busy}>{busy ? '…' : 'Salvează parola nouă'}</button>
        </form>
        <Link to="/login" className={styles.back}>← Înapoi la login</Link>
      </div>
    </div>
  );
}
