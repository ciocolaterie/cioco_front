import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { myOrders } from '../../services/orders.service.js';
import { updateProfile, changePassword } from '../../services/auth.service.js';
import { Link, Navigate } from 'react-router-dom';
import Badge from '../../components/ui/Badge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { STATUS_LABEL, fmtDateTime, fmt } from '../../utils/format.js';
import { SkeletonList } from '../../components/ui/Skeleton.jsx';
import usePageTitle from '../../hooks/usePageTitle.js';
import styles from './AccountPage.module.css';

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
}

const ORDERS_PAGE = 5;

export default function AccountPage() {
  usePageTitle('Contul meu');
  const { user, logout, loading, setUser } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingPwd, setSavingPwd] = useState(false);
  const [visibleOrders, setVisibleOrders] = useState(ORDERS_PAGE);

  useEffect(() => {
    if (user) {
      myOrders().then(setOrders).catch(() => setOrders([]));
      setForm({ name: user.name || '', phone: user.phone || '' });
    }
  }, [user]);

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;

  const savePwd = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirm) return toast({ title: 'Parolele nu se potrivesc' });
    if (pwdForm.newPassword.length < 6) return toast({ title: 'Parola trebuie să aibă cel puțin 6 caractere' });
    setSavingPwd(true);
    try {
      await changePassword({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      toast({ title: 'Parolă schimbată cu succes' });
      setChangingPwd(false);
      setPwdForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast({ title: 'Eroare', body: err.response?.data?.error || err.message });
    } finally { setSavingPwd(false); }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { user: updated } = await updateProfile(form);
      setUser(updated);
      setEditing(false);
      toast({ title: 'Profil actualizat' });
    } catch (err) {
      toast({ title: 'Eroare', body: err.response?.data?.error || err.message });
    } finally { setSaving(false); }
  };

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.head}>
        <div className={styles.headLeft}>
          <div className={styles.avatar}>{initials(user.name)}</div>
          <div>
            <h1>{user.name}</h1>
            <p>{user.email}{user.phone ? ` · ${user.phone}` : ''}</p>
          </div>
        </div>
        <div className={styles.headActions}>
          <button className={styles.editBtn} onClick={() => { setEditing(e => !e); setChangingPwd(false); }}>
            {editing ? 'Anulează' : 'Editează profil'}
          </button>
          <button className={styles.editBtn} onClick={() => { setChangingPwd(e => !e); setEditing(false); }}>
            {changingPwd ? 'Anulează' : 'Schimbă parola'}
          </button>
          <button className={styles.logout} onClick={logout}>Logout</button>
        </div>
      </header>

      {editing && (
        <form onSubmit={saveProfile} className={styles.editForm}>
          <h3>Modifică datele</h3>
          <div className={styles.editFields}>
            <label>
              Nume complet
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </label>
            <label>
              Telefon
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+40 7xx xxx xxx" />
            </label>
          </div>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? 'Se salvează…' : 'Salvează'}
          </button>
        </form>
      )}

      {changingPwd && (
        <form onSubmit={savePwd} className={styles.editForm}>
          <h3>Schimbă parola</h3>
          <div className={styles.editFields}>
            <label>
              Parola curentă
              <input type="password" value={pwdForm.currentPassword} onChange={e => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))} required autoFocus />
            </label>
            <span />
            <label>
              Parolă nouă
              <input type="password" value={pwdForm.newPassword} onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))} required minLength={6} />
            </label>
            <label>
              Confirmă parola nouă
              <input type="password" value={pwdForm.confirm} onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))} required minLength={6} />
            </label>
          </div>
          <button type="submit" className={styles.saveBtn} disabled={savingPwd}>
            {savingPwd ? 'Se salvează…' : 'Salvează parola'}
          </button>
        </form>
      )}

      <h2>Comenzile tale</h2>
      {!orders ? <SkeletonList count={3} /> :
        orders.length === 0
          ? <div className={styles.empty}>
              Nu ai nicio comandă încă. <Link to="/catalog" className={styles.emptyLink}>Vezi catalogul →</Link>
            </div>
          : <div className={styles.list}>
              {orders.slice(0, visibleOrders).map(o => (
                <Link key={o._id} to={`/comanda/${o._id}`} className={styles.order}>
                  <div>
                    <div className={styles.no}>{o.orderNumber}</div>
                    <div className={styles.date}>{fmtDateTime(o.createdAt)}</div>
                  </div>
                  <div className={styles.items}>{o.items.length} produs{o.items.length > 1 ? 'e' : ''}</div>
                  <Badge variant={o.status}>{STATUS_LABEL[o.status]}</Badge>
                  <strong>{fmt(o.total)} lei</strong>
                </Link>
              ))}
              {orders.length > visibleOrders && (
                <button className={styles.loadMore} onClick={() => setVisibleOrders(v => v + ORDERS_PAGE)}>
                  Mai multe comenzi ({orders.length - visibleOrders} rămase)
                </button>
              )}
            </div>
      }
    </div>
  );
}
