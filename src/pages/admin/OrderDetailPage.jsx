import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrder, updateOrderStatus } from '../../services/orders.service.js';
import { useToast } from '../../context/ToastContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { STATUS_LABEL, NEXT_STATUS, fmt, fmtDateTime } from '../../utils/format.js';
import styles from './OrderDetailPage.module.css';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [o, setO] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [error, setError] = useState(false);
  const toast = useToast();

  useEffect(() => { getOrder(id).then(setO).catch(() => setError(true)); }, [id]);
  if (error) return (
    <div className={styles.errorWrap}>
      <p className={styles.errorText}>Comanda nu a putut fi încărcată.</p>
      <Link to="/admin/comenzi" className={styles.errorLink}>← Înapoi la comenzi</Link>
    </div>
  );
  if (!o) return <Spinner />;

  const advance = () => {
    const next = NEXT_STATUS[o.status];
    if (!next) return;
    setConfirming({ action: 'advance', next });
  };

  const cancel = () => setConfirming({ action: 'cancel' });

  const doConfirm = async () => {
    const { action, next } = confirming;
    setConfirming(null);
    try {
      const status = action === 'cancel' ? 'anulata' : next;
      const updated = await updateOrderStatus(o._id, status);
      setO(updated);
      toast({ title: action === 'cancel' ? 'Comandă anulată' : `Status: ${STATUS_LABEL[status]}`, body: `Notificare trimisă către ${o.customer.email}` });
    } catch (err) { toast({ title: 'Eroare', body: err.response?.data?.error || err.message }); }
  };

  return (
    <div>
      {confirming && (
        <div className={styles.overlay} onClick={() => setConfirming(null)}>
          <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <h3>{confirming.action === 'cancel' ? 'Anulezi comanda?' : `Avansezi la "${STATUS_LABEL[confirming.next]}"?`}</h3>
            <p>Clientul va primi o notificare pe email.</p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={() => setConfirming(null)}>Nu, renunță</button>
              <button className={`${styles.confirmOk} ${confirming.action === 'cancel' ? styles.confirmDanger : ''}`} onClick={doConfirm}>
                {confirming.action === 'cancel' ? 'Anulează comanda' : 'Confirmă'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Link to="/admin/comenzi" className={styles.back}>← Comenzi</Link>

      <header className={styles.head}>
        <div>
          <h1>Comanda {o.orderNumber}</h1>
          <div className={styles.meta}>
            <Badge variant={o.status}>{STATUS_LABEL[o.status]}</Badge>
            <span>· Plasată la {fmtDateTime(o.createdAt)}</span>
          </div>
        </div>
        <div className={styles.actions}>
          {NEXT_STATUS[o.status] && <Button variant="primary" onClick={advance}>Avansează → {STATUS_LABEL[NEXT_STATUS[o.status]]}</Button>}
          {o.status !== 'anulata' && o.status !== 'livrata' && <Button variant="outline" onClick={cancel}>Anulează</Button>}
        </div>
      </header>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h3>Produse</h3>
          {o.items.map((i, k) => (
            <div key={k} className={styles.itemRow}>
              <span>{i.qty} ×</span>
              <span>{i.name}</span>
              <span className={styles.price}>{fmt(i.price)} lei</span>
              <strong>{fmt(i.price * i.qty)} lei</strong>
            </div>
          ))}
          <div className={styles.div} />
          <div className={styles.row}><span>Subtotal</span><span>{fmt(o.subtotal)} lei</span></div>
          {o.deliveryFee > 0 && <div className={styles.row}><span>Livrare</span><span>{fmt(o.deliveryFee)} lei</span></div>}
          {o.discount > 0 && <div className={styles.row}><span>Discount ({o.promoCode})</span><span>−{fmt(o.discount)} lei</span></div>}
          <div className={`${styles.row} ${styles.total}`}><span>Total</span><span>{fmt(o.total)} lei</span></div>
          <div className={styles.payment}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></svg>
            Plată cash la {o.method === 'livrare' ? 'livrare' : 'ridicare'}
          </div>
        </section>

        <aside className={styles.side}>
          <section className={styles.card}>
            <h3>Client</h3>
            <div className={styles.field}><span>Nume</span><strong>{o.customer.name}</strong></div>
            <div className={styles.field}><span>Telefon</span><a href={`tel:${o.customer.phone}`}>{o.customer.phone}</a></div>
            <div className={styles.field}><span>Email</span><a href={`mailto:${o.customer.email}`}>{o.customer.email}</a></div>
            <div className={styles.contactBtns}>
              <a href={`tel:${o.customer.phone}`} className={styles.contactBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.33 2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.01z"/></svg>
                Sună
              </a>
              <a href={`https://wa.me/${(() => { const d = o.customer.phone.replace(/\D/g, ''); return d.startsWith('0') ? `40${d.slice(1)}` : d; })()}`} target="_blank" rel="noreferrer" className={styles.contactBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                WhatsApp
              </a>
            </div>
          </section>

          <section className={styles.card}>
            <h3>Livrare</h3>
            <div className={styles.field}><span>Metodă</span><strong>{o.method === 'livrare' ? 'Livrare' : 'Ridicare'}</strong></div>
            {o.method === 'livrare'
              ? <>
                  <div className={styles.field}><span>Adresă</span><span>{o.address}</span></div>
                  {(o.zoneName || o.zone) && <div className={styles.field}><span>Zonă</span><span>{o.zoneName || o.zone}</span></div>}
                </>
              : o.pickupTime && <div className={styles.field}><span>Ora</span><strong>{o.pickupTime}</strong></div>
            }
            {o.note && <div className={styles.note}><strong>Notă client:</strong> {o.note}</div>}
          </section>

          <section className={styles.card}>
            <h3>Istoric status</h3>
            {o.statusHistory?.length === 0
              ? <p className={styles.historyEmpty}>Niciun update.</p>
              : <ul className={styles.history}>
                {o.statusHistory.map((h, k) => (
                  <li key={k}>
                    <strong>{STATUS_LABEL[h.status]}</strong>
                    <span>{fmtDateTime(h.at)}</span>
                  </li>
                ))}
              </ul>
            }
          </section>
        </aside>
      </div>
    </div>
  );
}
