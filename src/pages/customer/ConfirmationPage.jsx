import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrder, cancelOrder } from '../../services/orders.service.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import usePageTitle from '../../hooks/usePageTitle.js';
import { STATUS_LABEL, fmtDateTime, fmt } from '../../utils/format.js';
import styles from './ConfirmationPage.module.css';

const STATUS_ORDER = ['noua', 'in_pregatire', 'gata', 'livrata'];

function OrderTimeline({ status, method }) {
  const steps = [
    { key: 'noua',         label: 'Plasată' },
    { key: 'in_pregatire', label: 'În pregătire' },
    { key: 'gata',         label: 'Gata' },
    { key: 'livrata',      label: method === 'livrare' ? 'Livrată' : 'Ridicată' },
  ];
  const currentIdx = STATUS_ORDER.indexOf(status);

  return (
    <div className={styles.timeline}>
      {steps.map((step, i) => {
        const done    = currentIdx > i;
        const current = currentIdx === i;
        return (
          <div key={step.key} className={styles.timelineStep}>
            <div className={styles.stepTop}>
              {i > 0 && (
                <div className={`${styles.stepLine} ${done || current ? styles.stepLineDone : ''}`} />
              )}
              <div className={`${styles.stepCircle} ${done ? styles.stepDone : ''} ${current ? styles.stepCurrent : ''}`}>
                {done
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  : <span>{i + 1}</span>}
              </div>
              {i < steps.length - 1 && (
                <div className={`${styles.stepLine} ${done ? styles.stepLineDone : ''}`} />
              )}
            </div>
            <div className={`${styles.stepLabel} ${(done || current) ? styles.stepLabelActive : ''}`}>
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ConfirmationPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [error, setError] = useState(false);
  usePageTitle(order ? `Comanda ${order.orderNumber}` : 'Comandă');

  useEffect(() => { getOrder(id).then(setOrder).catch(() => setError(true)); }, [id]);
  if (error) return (
    <div className={`container ${styles.page}`}>
      <div className={styles.errorWrap}>
        <p className={styles.errorText}>Comanda nu a putut fi încărcată.</p>
        <Link to="/cont" className={styles.errorLink}>← Contul meu</Link>
      </div>
    </div>
  );
  if (!order) return <Spinner />;

  const canCancel = order.status === 'noua' && user && (String(order.user) === user._id || user.role === 'admin');

  const doCancel = async () => {
    setCancelling(true);
    try {
      const updated = await cancelOrder(id);
      setOrder(updated);
      toast({ title: 'Comandă anulată' });
    } catch (err) {
      toast({ title: 'Eroare', body: err.response?.data?.error || 'Nu s-a putut anula' });
    } finally { setCancelling(false); }
  };

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.success}>
        {order.status === 'anulata' ? (
          <div className={styles.checkCancel}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
        ) : (
          <div className={styles.check}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        )}
        <h1>Comanda {order.orderNumber} {order.status === 'anulata' ? 'a fost anulată' : 'a fost plasată'}</h1>
        {order.status !== 'anulata' && (
          <p>Ți-am trimis un email de confirmare la <strong>{order.customer.email}</strong>. Vei primi notificare automată când comanda îți este pregătită.</p>
        )}
      </div>

      {order.status !== 'anulata' && (
        <OrderTimeline status={order.status} method={order.method} />
      )}

      <div className={styles.grid}>
        <section className={styles.card}>
          <h3>Detalii comandă</h3>
          <div className={styles.row}><span>Status</span><Badge variant={order.status}>{STATUS_LABEL[order.status]}</Badge></div>
          <div className={styles.row}><span>Plasată la</span><span>{fmtDateTime(order.createdAt)}</span></div>
          <div className={styles.row}><span>Metodă</span><span>{order.method === 'livrare' ? 'Livrare' : 'Ridicare'}</span></div>
          {order.method === 'livrare' && <div className={styles.row}><span>Adresă</span><span>{order.address}</span></div>}
          {order.pickupTime && <div className={styles.row}><span>Ora ridicare</span><span>{order.pickupTime}</span></div>}
          <div className={styles.row}><span>Plată</span><span>Cash la {order.method === 'livrare' ? 'livrare' : 'ridicare'}</span></div>
        </section>

        <section className={styles.card}>
          <h3>Produse</h3>
          {order.items.map((i, k) => (
            <div key={k} className={styles.itemRow}>
              <span>{i.qty} × {i.name}</span>
              <strong>{fmt(i.price * i.qty)} lei</strong>
            </div>
          ))}
          <div className={styles.div} />
          <div className={styles.row}><span>Subtotal</span><span>{fmt(order.subtotal)} lei</span></div>
          {order.deliveryFee > 0 && <div className={styles.row}><span>Livrare</span><span>{fmt(order.deliveryFee)} lei</span></div>}
          {order.discount > 0 && <div className={styles.row}><span>Reducere</span><span>−{fmt(order.discount)} lei</span></div>}
          <div className={`${styles.row} ${styles.total}`}><span>Total</span><span>{fmt(order.total)} lei</span></div>
        </section>
      </div>

      <div className={styles.actions}>
        <Link to="/" className={styles.btnGhost}>Înapoi la magazin</Link>
        {user && <Link to="/cont" className={styles.btnPrimary}>Vezi istoric comenzi</Link>}
        {canCancel && (
          <button className={styles.btnCancel} onClick={() => setCancelDialog(true)} disabled={cancelling}>
            {cancelling ? 'Se anulează…' : 'Anulează comanda'}
          </button>
        )}
      </div>
      <ConfirmDialog
        open={cancelDialog}
        title="Anulezi comanda?"
        body="Comanda va fi marcată ca anulată. Această acțiune nu poate fi inversată."
        confirmLabel="Da, anulează"
        danger
        onConfirm={() => { setCancelDialog(false); doCancel(); }}
        onCancel={() => setCancelDialog(false)}
      />
    </div>
  );
}
