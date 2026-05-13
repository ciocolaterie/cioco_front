import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const { login, register, user, loading, isAdmin } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');

  if (!loading && user) return <Navigate to={isAdmin ? '/admin' : '/cont'} replace />;
  usePageTitle(mode === 'login' ? 'Login' : 'Înregistrare');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = mode === 'login' ? await login(form.email, form.password) : await register(form);
      toast({ title: mode === 'login' ? 'Bine ai revenit' : 'Cont creat', body: u.name });
      nav(u.role === 'admin' ? '/admin' : '/cont');
    } catch (err) {
      toast({ title: 'Eroare', body: err.response?.data?.error || 'A apărut o problemă' });
    } finally { setBusy(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.tabs}>
          <button className={mode === 'login' ? styles.active : ''} onClick={() => setMode('login')}>Login</button>
          <button className={mode === 'register' ? styles.active : ''} onClick={() => setMode('register')}>Înregistrare</button>
        </div>
        <h1>{mode === 'login' ? 'Bine ai revenit' : 'Creează cont'}</h1>
        <form onSubmit={submit} className={styles.form}>
          {mode === 'register' && (
            <>
              <label>Nume<input value={form.name} onChange={set('name')} required /></label>
              <label>Telefon<input value={form.phone} onChange={set('phone')} /></label>
            </>
          )}
          <label>Email<input type="email" value={form.email} onChange={set('email')} required /></label>
          <label>Parolă<input type="password" value={form.password} onChange={set('password')} required /></label>
          {mode === 'login' && (
            <Link to="/forgot-password" className={styles.forgotLink}>Ai uitat parola?</Link>
          )}
          <button type="submit" disabled={busy}>{busy ? '…' : (mode === 'login' ? 'Intră în cont' : 'Creează cont')}</button>
        </form>
        <Link to="/" className={styles.back}>← Înapoi la magazin</Link>
      </div>
    </div>
  );
}
