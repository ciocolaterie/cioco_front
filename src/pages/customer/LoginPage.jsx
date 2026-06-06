import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import useStoreInfo from '../../hooks/useStoreInfo.js';
import styles from './LoginPage.module.css';

const DEFAULT_LOGO = 'https://res.cloudinary.com/do3wzvgto/image/upload/v1780763493/ciocolaterie/logo-email.svg';

export default function LoginPage() {
  const { login, register, user, loading, isAdmin } = useAuth();
  const { storeLogo, storeName } = useStoreInfo();
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
      const u = mode === 'login'
        ? await login(form.email, form.password)
        : await register(form);
      toast({ title: mode === 'login' ? 'Bine ai revenit' : 'Cont creat', body: u.name });
      nav(u.role === 'admin' ? '/admin' : '/cont');
    } catch (err) {
      toast({ title: 'Eroare', body: err.response?.data?.error || 'A apărut o problemă' });
    } finally { setBusy(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.overlay} />

      <div className={styles.card}>
        {/* Brand */}
        <div className={styles.brand}>
          <img
            src={storeLogo || DEFAULT_LOGO}
            className={styles.logo}
            width="48"
            height="48"
            alt={storeName || 'Ciocolateria'}
          />
          <span className={styles.brandName}>{storeName || 'Ciocolateria'}</span>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={mode === 'login' ? styles.tabActive : styles.tab}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            className={mode === 'register' ? styles.tabActive : styles.tab}
            onClick={() => setMode('register')}
          >
            Înregistrare
          </button>
        </div>

        {/* Heading */}
        <h1 className={styles.heading}>
          {mode === 'login' ? 'Bine ai revenit' : 'Creează cont'}
        </h1>

        {/* Form */}
        <form onSubmit={submit} className={styles.form}>
          {mode === 'register' && (
            <>
              <div className={styles.floatField}>
                <input id="l-name" value={form.name} onChange={set('name')} placeholder=" " required />
                <label htmlFor="l-name">Numele tău</label>
              </div>
              <div className={styles.floatField}>
                <input id="l-phone" value={form.phone} onChange={set('phone')} placeholder=" " />
                <label htmlFor="l-phone">Telefon (opțional)</label>
              </div>
            </>
          )}
          <div className={styles.floatField}>
            <input id="l-email" type="email" value={form.email} onChange={set('email')} placeholder=" " required />
            <label htmlFor="l-email">Adresa de email</label>
          </div>
          <div className={styles.floatField}>
            <input id="l-pwd" type="password" value={form.password} onChange={set('password')} placeholder=" " required />
            <label htmlFor="l-pwd">Parolă</label>
          </div>

          {mode === 'login' && (
            <Link to="/forgot-password" className={styles.forgotLink}>Ai uitat parola?</Link>
          )}

          <button type="submit" className={styles.submitBtn} disabled={busy}>
            {busy
              ? <span className={styles.spinner} />
              : (mode === 'login' ? 'Intră în cont' : 'Creează cont')
            }
          </button>
        </form>

        <Link to="/" className={styles.back}>← Înapoi la magazin</Link>
      </div>
    </div>
  );
}
