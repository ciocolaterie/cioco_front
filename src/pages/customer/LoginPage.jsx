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
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);
  usePageTitle(mode === 'login' ? 'Login' : 'Înregistrare');

  if (!loading && user) return <Navigate to={isAdmin ? '/admin' : '/cont'} replace />;

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

      {/* Left — brand panel */}
      <div className={styles.panel}>
        <span className={styles.panelMark}>c</span>
        <div className={styles.panelLine} />
        <p className={styles.panelQuote}>„Ciocolată bună<br />nu se grăbește."</p>
        <span className={styles.panelBy}>— Atelierul nostru</span>
      </div>

      {/* Right — form */}
      <div className={styles.formSide}>
        <div className={styles.card}>
          <div className={styles.tabs}>
            <button className={mode === 'login' ? styles.active : ''} onClick={() => setMode('login')}>Login</button>
            <button className={mode === 'register' ? styles.active : ''} onClick={() => setMode('register')}>Înregistrare</button>
          </div>
          <h1>{mode === 'login' ? 'Bine ai revenit' : 'Creează cont'}</h1>
          <form onSubmit={submit} className={styles.form}>
            {mode === 'register' && (
              <>
                <div className={styles.floatField}>
                  <input id="l-name" value={form.name} onChange={set('name')} placeholder=" " required />
                  <label htmlFor="l-name">Nume</label>
                </div>
                <div className={styles.floatField}>
                  <input id="l-phone" value={form.phone} onChange={set('phone')} placeholder=" " />
                  <label htmlFor="l-phone">Telefon</label>
                </div>
              </>
            )}
            <div className={styles.floatField}>
              <input id="l-email" type="email" value={form.email} onChange={set('email')} placeholder=" " required />
              <label htmlFor="l-email">Email</label>
            </div>
            <div className={styles.floatField}>
              <input id="l-pwd" type="password" value={form.password} onChange={set('password')} placeholder=" " required />
              <label htmlFor="l-pwd">Parolă</label>
            </div>
            {mode === 'login' && (
              <Link to="/forgot-password" className={styles.forgotLink}>Ai uitat parola?</Link>
            )}
            <button type="submit" disabled={busy}>{busy ? 'Se procesează…' : (mode === 'login' ? 'Intră în cont' : 'Creează cont')}</button>
          </form>
          <Link to="/" className={styles.back}>← Înapoi la magazin</Link>
        </div>
      </div>

    </div>
  );
}
