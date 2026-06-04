import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCustomer, updateCustomerNote } from '../../services/admin.service.js';
import { useToast } from '../../context/ToastContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { fmt, fmtDate, STATUS_LABEL } from '../../utils/format.js';
import styles from './CustomerDetailPage.module.css';

const AVATAR_COLORS = ['#7B3D1D','#16a34a','#2563eb','#db2777','#ea580c','#0891b2','#d97706','#0f766e','#c2410c','#0284c7'];
const avatarColor = (name = '') => {
  const n = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
};
const initials = (name = '') => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
const fmtSince = d => new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });

/* ── icons ── */
const Ico = {
  star:    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  back:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>,
  email:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  phone:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.6 1.32h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>,
  cal:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  note:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  order:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  timeline:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="20" x2="12" y2="4"/><polyline points="6 10 12 4 18 10"/></svg>,
  arrow:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  plus:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
};

const TL_COLOR = { livrata:'#15803d', anulata:'#dc2626', in_pregatire:'#2563eb', noua:'#7B3D1D', gata:'#059669' };
const TL_ICON  = {
  livrata:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12"/></svg>,
  anulata:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  in_pregatire:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

/* ── Note editor tab content ── */
function NoteTab({ customerId, initial }) {
  const toast = useToast();
  const [value,  setValue]  = useState(initial || '');
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => { setValue(initial || ''); }, [initial]);

  const save = async () => {
    setSaving(true);
    try {
      await updateCustomerNote(customerId, value);
      toast({ title: 'Notă salvată' });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { toast({ title: 'Eroare la salvare', variant: 'error' }); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.noteTab}>
      <p className={styles.noteHint}>Notă internă — vizibilă doar pentru administratori.</p>
      <textarea
        className={styles.noteTextarea}
        value={value}
        onChange={e => { setValue(e.target.value); setSaved(false); }}
        rows={6}
        placeholder="Adaugă o notă internă despre acest client: preferințe, istoric, detalii de contact, etc."
      />
      <div className={styles.noteFooter}>
        <button className={`${styles.noteSave} ${saved ? styles.noteSaved : ''}`} onClick={save} disabled={saving}>
          {saved ? '✓ Salvat' : saving ? 'Salvând…' : 'Salvează nota'}
        </button>
      </div>
    </div>
  );
}

export default function CustomerDetailPage() {
  const { id } = useParams();
  const nav    = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('orders');
  const [note,    setNote]    = useState('');

  useEffect(() => {
    setLoading(true);
    getCustomer(id)
      .then(d => { setData(d); setNote(d.customerNote || ''); })
      .catch(() => nav('/admin/clienti'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (!data)   return null;

  const orders      = data.orders || [];
  const totalOrders = data.totalOrders ?? orders.length;
  const totalSpent  = data.totalSpent  ?? 0;
  const avgOrder    = totalOrders > 0 ? totalSpent / totalOrders : 0;
  const loyal       = data.loyal;

  const timeline = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const TABS = [
    { id: 'orders',   label: 'Comenzi',  count: totalOrders, icon: Ico.order },
    { id: 'timeline', label: 'Timeline', count: null,        icon: Ico.timeline },
    { id: 'note',     label: 'Notă',     count: null,        icon: Ico.note },
  ];

  return (
    <div className={styles.page}>

      {/* ── Breadcrumb ── */}
      <nav className={styles.breadcrumb}>
        <Link to="/admin/clienti" className={styles.backLink}>{Ico.back} Clienți</Link>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>{data.name}</span>
      </nav>

      {/* ── Hero card ── */}
      <div className={styles.hero}>
        {/* Left: identity */}
        <div className={styles.heroLeft}>
          <div className={styles.heroAvatar} style={{ background: avatarColor(data.name) }}>
            {initials(data.name)}
          </div>
          <div className={styles.heroMeta}>
            <div className={styles.heroNameRow}>
              <h2 className={styles.heroName}>{data.name}</h2>
              {loyal
                ? <span className={`${styles.heroBadge} ${styles.heroBadgeFidel}`}>{Ico.star} Fidel</span>
                : totalOrders > 0
                ? <span className={`${styles.heroBadge} ${styles.heroBadgeActiv}`}><i className={styles.dot}/>Activ</span>
                : <span className={`${styles.heroBadge} ${styles.heroBadgeNone}`}><i className={styles.dot}/>Fără comenzi</span>
              }
            </div>
            <div className={styles.heroContacts}>
              <a href={`mailto:${data.email}`} className={styles.contact}>
                {Ico.email} {data.email}
              </a>
              {data.phone && (
                <a href={`tel:${data.phone}`} className={styles.contact}>
                  {Ico.phone} {data.phone}
                </a>
              )}
              <span className={styles.contact}>
                {Ico.cal} Client din {fmtSince(data.createdAt)}
              </span>
            </div>
            {note && (
              <button className={styles.heroNote} onClick={() => setTab('note')}>
                {Ico.note}
                <span>{note.slice(0, 80)}{note.length > 80 ? '…' : ''}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: stats */}
        <div className={styles.heroRight}>
          <div className={styles.statBlock}>
            <span className={styles.statLabel}>Total cheltuit</span>
            <span className={styles.statBig}>{fmt(totalSpent)} <span className={styles.statCur}>RON</span></span>
          </div>
          <div className={styles.statRow}>
            <div className={styles.stat}>
              <span className={styles.statN}>{totalOrders}</span>
              <span className={styles.statS}>comenzi</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statN}>{fmt(avgOrder)}</span>
              <span className={styles.statS}>medie/comandă</span>
            </div>
          </div>
          <button className={styles.newOrderBtn} onClick={() => nav('/admin/comenzi/nou')}>
            {Ico.plus} Comandă nouă
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`${styles.tabBtn} ${tab === t.id ? styles.tabActive : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon} {t.label}
            {t.count != null && (
              <span className={styles.tabCount}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Comenzi ── */}
      {tab === 'orders' && (
        orders.length === 0
          ? <div className={styles.empty}>Nicio comandă înregistrată pentru acest client.</div>
          : <div className={styles.ordersCard}>
              <div className={styles.ordHead}>
                <span># Comandă</span>
                <span>Produse</span>
                <span>Status</span>
                <span>Data</span>
                <span>Total</span>
                <span />
              </div>
              {orders.map(o => (
                <Link key={o._id} to={`/admin/comenzi/${o._id}`} className={styles.ordRow}>
                  <span className={styles.ordNum}>{o.orderNumber}</span>
                  <span className={styles.ordItems}>
                    {o.items.map(i => `${i.name} ×${i.qty}`).join(', ').slice(0, 60)}
                    {o.items.map(i => i.name).join(', ').length > 60 ? '…' : ''}
                  </span>
                  <Badge variant={o.status}>{STATUS_LABEL[o.status]}</Badge>
                  <span className={styles.ordDate}>{fmtDate(o.createdAt)}</span>
                  <span className={styles.ordTotal}>{fmt(o.total)} RON</span>
                  <span className={styles.ordArrow}>{Ico.arrow}</span>
                </Link>
              ))}
            </div>
      )}

      {/* ── Tab: Timeline ── */}
      {tab === 'timeline' && (
        timeline.length === 0
          ? <div className={styles.empty}>Nicio activitate înregistrată.</div>
          : <div className={styles.timeline}>
              {timeline.map((o, i) => {
                const color  = TL_COLOR[o.status] || '#888';
                const icon   = TL_ICON[o.status]  || Ico.order;
                const isLast = i === timeline.length - 1;
                return (
                  <div key={o._id} className={styles.tlItem}>
                    <div className={styles.tlLeft}>
                      <div className={styles.tlIcon} style={{ color, borderColor:`${color}30`, background:`${color}10` }}>
                        {icon}
                      </div>
                      {!isLast && <div className={styles.tlLine} />}
                    </div>
                    <div className={styles.tlBody}>
                      <div className={styles.tlDate}>{fmtDate(o.createdAt)}</div>
                      <Link to={`/admin/comenzi/${o._id}`} className={styles.tlTitle}>
                        Comandă {o.orderNumber}
                      </Link>
                      <div className={styles.tlDesc}>
                        {o.items.map(i => `${i.name} ×${i.qty}`).join(' · ')}
                      </div>
                      <div className={styles.tlMeta}>
                        <Badge variant={o.status}>{STATUS_LABEL[o.status]}</Badge>
                        <span className={styles.tlTotal}>{fmt(o.total)} RON</span>
                        <span className={styles.tlMethod}>
                          {o.method === 'livrare' ? 'Livrare' : 'Ridicare'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
      )}

      {/* ── Tab: Notă ── */}
      {tab === 'note' && (
        <NoteTab customerId={data._id} initial={note} />
      )}
    </div>
  );
}
