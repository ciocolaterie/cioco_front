import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle.js';
import useStoreInfo from '../../hooks/useStoreInfo.js';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { createOrder } from '../../services/orders.service.js';
import { applyPromotion } from '../../services/promotions.service.js';
import styles from './CheckoutPage.module.css';


export default function CheckoutPage() {
  usePageTitle('Finalizare comandă');
  const store = useStoreInfo();
  const { cart, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [method, setMethod] = useState('ridicare');
  const [zone, setZone] = useState('');
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: '',
    pickupTime: '',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  const zones = store.zones?.map(z => ({ id: z.id, label: z.name, fee: z.price })) || [];

  useEffect(() => {
    if (zones.length > 0 && !zone) setZone(zones[0].id);
  }, [zones.length]); // eslint-disable-line

  useEffect(() => {
    if (user) setForm(f => ({
      ...f,
      name: f.name || user.name || '',
      phone: f.phone || user.phone || '',
      email: f.email || user.email || '',
    }));
  }, [user?._id]); // eslint-disable-line

  if (cart.length === 0) return <Navigate to="/cos" replace />;
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const fee = method === 'livrare' ? (zones.find(z => z.id === zone)?.fee || 0) : 0;
  const discount = promoResult?.discount || 0;
  const total = subtotal + fee - discount;

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    setPromoResult(null);
    try {
      const result = await applyPromotion(promoCode.trim(), subtotal);
      setPromoResult(result);
    } catch (err) {
      setPromoError(err.response?.data?.error || 'Cod invalid');
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setPromoResult(null);
    setPromoCode('');
    setPromoError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email) return toast({ title: 'Completează datele de contact' });
    if (method === 'livrare' && !form.address) return toast({ title: 'Adresa de livrare e obligatorie' });
    setSubmitting(true);
    try {
      const order = await createOrder({
        items: cart.map(i => ({ product: i.product, qty: i.qty })),
        customer: { name: form.name, phone: form.phone, email: form.email },
        method,
        address: form.address,
        pickupTime: form.pickupTime,
        zone: method === 'livrare' ? zone : undefined,
        note: form.note,
        promoCode: promoResult?.promo?.code,
      });
      clearCart();
      nav(`/comanda/${order._id}`, { replace: true });
    } catch (err) {
      toast({ title: 'Eroare', body: err.response?.data?.error || err.message });
    } finally { setSubmitting(false); }
  };

  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.title}>Finalizare comandă</h1>
      <form onSubmit={submit} className={styles.grid}>
        <div className={styles.col}>
          <section className={styles.card}>
            <h3>Cum primești comanda</h3>
            <div className={styles.methods}>
              <label className={`${styles.method} ${method === 'ridicare' ? styles.active : ''}`}>
                <input type="radio" name="m" value="ridicare" checked={method === 'ridicare'} onChange={() => setMethod('ridicare')} />
                <div>
                  <strong>Ridicare din magazin</strong>
                  <div>{store.storeAddress} · Gratuit</div>
                </div>
              </label>
              <label className={`${styles.method} ${method === 'livrare' ? styles.active : ''} ${zones.length === 0 ? styles.disabled : ''}`}>
                <input type="radio" name="m" value="livrare" checked={method === 'livrare'} onChange={() => setMethod('livrare')} disabled={zones.length === 0} />
                <div>
                  <strong>Livrare la adresă</strong>
                  <div>
                    {zones.length === 0
                      ? 'Indisponibilă momentan'
                      : zones.length === 1 || Math.min(...zones.map(z => z.fee)) === Math.max(...zones.map(z => z.fee))
                        ? `${zones[0].fee} lei`
                        : `${Math.min(...zones.map(z => z.fee))}–${Math.max(...zones.map(z => z.fee))} lei`}
                  </div>
                </div>
              </label>
            </div>

            {method === 'livrare' && (
              <div className={styles.zoneRow}>
                {zones.map(z => (
                  <label key={z.id} className={`${styles.zone} ${zone === z.id ? styles.active : ''}`}>
                    <input type="radio" name="z" checked={zone === z.id} onChange={() => setZone(z.id)} />
                    <span>{z.label}</span>
                    <strong>{z.fee} lei</strong>
                  </label>
                ))}
              </div>
            )}
          </section>

          <section className={styles.card}>
            <h3>Date de contact</h3>
            <div className={styles.fields}>
              <label>Nume complet<input value={form.name} onChange={set('name')} required /></label>
              <label>Telefon<input value={form.phone} onChange={set('phone')} required /></label>
              <label className={styles.full}>Email<input type="email" value={form.email} onChange={set('email')} required /></label>
              {method === 'livrare' && (
                <label className={styles.full}>Adresă completă<input value={form.address} onChange={set('address')} required /></label>
              )}
              {method === 'ridicare' && (
                <label className={styles.full}>Ora estimată ridicare<input type="time" value={form.pickupTime} onChange={set('pickupTime')} /></label>
              )}
              <label className={styles.full}>Notă pentru noi (opțional)<textarea value={form.note} onChange={set('note')} rows={3} /></label>
            </div>
          </section>

          <section className={styles.card}>
            <h3>Plată</h3>
            <div className={styles.payment}>
              <strong>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="6" width="20" height="12" rx="2"/>
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M6 12h.01M18 12h.01"/>
                </svg>
                Cash
              </strong>
              <span>Plata se face la {method === 'livrare' ? 'livrare' : 'ridicare'}.</span>
            </div>
          </section>
        </div>

        <aside className={styles.summary}>
          <h3>Comanda ta</h3>
          {cart.map(i => (
            <div key={i.product} className={styles.line}>
              <span>{i.qty} × {i.name}</span>
              <strong>{(i.price * i.qty).toFixed(2)} lei</strong>
            </div>
          ))}
          <div className={styles.div} />
          <div className={styles.row}><span>Subtotal</span><span>{subtotal.toFixed(2)} lei</span></div>
          {fee > 0 && <div className={styles.row}><span>Livrare</span><span>{fee.toFixed(2)} lei</span></div>}
          {discount > 0 && (
            <div className={styles.row}>
              <span>Discount ({promoResult.promo.code})</span>
              <span className={styles.discount}>−{discount.toFixed(2)} lei</span>
            </div>
          )}

          {!promoResult ? (
            <div>
              <div className={styles.promoRow}>
                <input
                  className={styles.promoInput}
                  placeholder="Cod promoțional"
                  value={promoCode}
                  onChange={e => { setPromoCode(e.target.value); setPromoError(''); }}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), applyPromo())}
                />
                <button type="button" className={styles.promoBtn} onClick={applyPromo} disabled={promoLoading}>
                  {promoLoading ? '…' : 'Aplică'}
                </button>
              </div>
              {promoError && <div className={styles.promoError}>{promoError}</div>}
            </div>
          ) : (
            <div className={styles.promoSuccess}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Cod <strong>{promoResult.promo.code}</strong> aplicat
              <button type="button" onClick={removePromo} className={styles.promoRemove}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          )}

          <div className={`${styles.row} ${styles.total}`}><span>Total</span><span>{total.toFixed(2)} lei</span></div>
          <button type="submit" disabled={submitting} className={styles.submit}>
            {submitting ? 'Se procesează…' : 'Plasează comanda'}
          </button>
        </aside>
      </form>
    </div>
  );
}
