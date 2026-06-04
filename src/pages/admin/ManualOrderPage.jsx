import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { createOrderAdmin } from '../../services/orders.service.js';
import { lookupByPhone } from '../../services/admin.service.js';
import { useToast } from '../../context/ToastContext.jsx';
import { fmt } from '../../utils/format.js';
import styles from './ManualOrderPage.module.css';

const SOURCES = [
  { v: 'online',       l: 'Online' },
  { v: 'telefon',      l: 'Telefon' },
  { v: 'whatsapp',     l: 'WhatsApp' },
  { v: 'instagram',    l: 'Instagram' },
  { v: 'fata_in_fata', l: 'Față în față' },
];

export default function ManualOrderPage() {
  const nav = useNavigate();
  const toast = useToast();

  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });
  const [source, setSource] = useState('telefon');
  const [method, setMethod] = useState('ridicare');
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState('');
  const [note, setNote] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [items, setItems] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [zones, setZones] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [phoneLookupDone, setPhoneLookupDone] = useState(false);
  const searchRef = useRef();
  const phoneTimeout = useRef();

  useEffect(() => {
    api.get('/settings').then(r => setZones(r.data.zones || [])).catch(() => {});
  }, []);

  // Phone lookup
  const handlePhoneChange = (val) => {
    setCustomer(c => ({ ...c, phone: val }));
    clearTimeout(phoneTimeout.current);
    if (val.length >= 7) {
      phoneTimeout.current = setTimeout(async () => {
        try {
          const data = await lookupByPhone(val);
          if (data?.user) {
            setCustomer(c => ({
              phone: c.phone,
              name: data.user.name || c.name,
              email: data.user.email || c.email,
            }));
            if (data.lastOrder?.address) setAddress(data.lastOrder.address);
            setPhoneLookupDone(true);
            toast({ title: 'Client găsit', body: data.user.name });
          }
        } catch {}
      }, 600);
    }
  };

  // Product search
  useEffect(() => {
    if (!productSearch.trim()) { setProductResults([]); return; }
    const t = setTimeout(() => {
      api.get('/admin/products').then(r => {
        const q = productSearch.toLowerCase();
        setProductResults(r.data.filter(p => p.name.toLowerCase().includes(q) && p.stock > 0).slice(0, 8));
      }).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  const addProduct = (p) => {
    setItems(prev => {
      const existing = prev.find(i => i.product === p._id);
      if (existing) return prev.map(i => i.product === p._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product: p._id, name: p.name, price: p.price, qty: 1 }];
    });
    setProductSearch('');
    setProductResults([]);
  };

  const updateQty = (productId, qty) => {
    if (qty <= 0) { setItems(prev => prev.filter(i => i.product !== productId)); return; }
    setItems(prev => prev.map(i => i.product === productId ? { ...i, qty } : i));
  };

  const selectedZone = zones.find(z => z.id === zone);
  const deliveryFee = method === 'livrare' ? (selectedZone?.price || 0) : 0;
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal + deliveryFee;

  const submit = async () => {
    if (!customer.name || !customer.phone) return toast({ title: 'Completează numele și telefonul clientului' });
    if (!items.length) return toast({ title: 'Adaugă cel puțin un produs' });
    if (method === 'livrare' && !address) return toast({ title: 'Completează adresa de livrare' });
    setSubmitting(true);
    try {
      const order = await createOrderAdmin({
        customer,
        items,
        method,
        address: method === 'livrare' ? address : '',
        zone: method === 'livrare' ? zone : '',
        note,
        source,
        deliveryDate: deliveryDate || undefined,
      });
      toast({ title: `Comandă ${order.orderNumber} creată` });
      nav(`/admin/comenzi/${order._id}`);
    } catch (err) {
      toast({ title: 'Eroare', body: err.response?.data?.error || err.message });
    } finally { setSubmitting(false); }
  };

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1>Comandă nouă</h1>
          <p>Comandă plasată manual (telefon, WhatsApp, Instagram, față în față)</p>
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.left}>
          {/* Customer */}
          <section className={styles.card}>
            <h3>Date client</h3>

            <label className={styles.label}>
              Telefon
              <div className={styles.phoneWrap}>
                <input
                  className={styles.input}
                  value={customer.phone}
                  onChange={e => handlePhoneChange(e.target.value)}
                  placeholder="+40 7xx xxx xxx"
                  type="tel"
                />
                {phoneLookupDone && <span className={styles.lookupBadge}>✓ găsit</span>}
              </div>
            </label>

            <label className={styles.label}>
              Nume complet *
              <input className={styles.input} value={customer.name}
                onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))}
                placeholder="Ion Popescu"
              />
            </label>

            <label className={styles.label}>
              Email (opțional)
              <input className={styles.input} value={customer.email}
                onChange={e => setCustomer(c => ({ ...c, email: e.target.value }))}
                placeholder="ion@email.com" type="email"
              />
            </label>
          </section>

          {/* Products */}
          <section className={styles.card}>
            <h3>Produse</h3>

            <div className={styles.productSearchWrap} ref={searchRef}>
              <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className={styles.productSearchInput}
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Caută produs după nume…"
              />
              {productResults.length > 0 && (
                <div className={styles.productDropdown}>
                  {productResults.map(p => (
                    <button key={p._id} className={styles.productOption} onClick={() => addProduct(p)}>
                      <span className={styles.productOptionName}>{p.name}</span>
                      <span className={styles.productOptionMeta}>{fmt(p.price)} RON · {p.stock} buc.</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {items.length === 0
              ? <p className={styles.emptyItems}>Niciun produs adăugat.</p>
              : <div className={styles.itemsList}>
                {items.map(item => (
                  <div key={item.product} className={styles.itemRow}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemPrice}>{fmt(item.price)} RON</span>
                    <div className={styles.qtyControl}>
                      <button onClick={() => updateQty(item.product, item.qty - 1)}>−</button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateQty(item.product, item.qty + 1)}>+</button>
                    </div>
                    <span className={styles.itemTotal}>{fmt(item.price * item.qty)} RON</span>
                  </div>
                ))}
              </div>
            }
          </section>

          {/* Delivery */}
          <section className={styles.card}>
            <h3>Livrare</h3>
            <div className={styles.methodPills}>
              <button
                className={`${styles.methodPill} ${method === 'ridicare' ? styles.methodPillActive : ''}`}
                onClick={() => setMethod('ridicare')}
              >Ridicare</button>
              <button
                className={`${styles.methodPill} ${method === 'livrare' ? styles.methodPillActive : ''}`}
                onClick={() => setMethod('livrare')}
              >Livrare</button>
            </div>

            {method === 'livrare' && (
              <>
                <label className={styles.label}>
                  Adresă *
                  <input className={styles.input} value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Str. Exemplu nr. 1, București"
                  />
                </label>
                {zones.length > 0 && (
                  <label className={styles.label}>
                    Zonă / Județ
                    <select className={styles.select} value={zone} onChange={e => setZone(e.target.value)}>
                      <option value="">— fără taxă livrare —</option>
                      {zones.map(z => (
                        <option key={z.id} value={z.id}>{z.name} — {z.price} RON</option>
                      ))}
                    </select>
                  </label>
                )}
              </>
            )}

            <label className={styles.label}>
              Data livrare (opțional)
              <input className={styles.input} type="date" value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
              />
            </label>
          </section>

          {/* Meta */}
          <section className={styles.card}>
            <h3>Detalii suplimentare</h3>
            <label className={styles.label}>
              Sursă comandă
              <div className={styles.sourcePills}>
                {SOURCES.map(s => (
                  <button
                    key={s.v}
                    className={`${styles.sourcePill} ${source === s.v ? styles.sourcePillActive : ''}`}
                    onClick={() => setSource(s.v)}
                  >{s.l}</button>
                ))}
              </div>
            </label>
            <label className={styles.label}>
              Notă internă / client
              <textarea className={styles.textarea} value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="ex: client a cerut fără alune, livrare urgent…"
                rows={3}
              />
            </label>
          </section>
        </div>

        {/* Summary */}
        <aside className={styles.summary}>
          <section className={styles.card}>
            <h3>Sumar</h3>
            {items.length === 0
              ? <p className={styles.emptyItems}>Niciun produs.</p>
              : <>
                {items.map(i => (
                  <div key={i.product} className={styles.sumRow}>
                    <span>{i.qty} × {i.name}</span>
                    <span>{fmt(i.price * i.qty)} RON</span>
                  </div>
                ))}
                <div className={styles.sumDiv} />
                <div className={styles.sumRow}><span>Subtotal</span><span>{fmt(subtotal)} RON</span></div>
                {deliveryFee > 0 && <div className={styles.sumRow}><span>Livrare</span><span>{fmt(deliveryFee)} RON</span></div>}
                <div className={`${styles.sumRow} ${styles.sumTotal}`}>
                  <span>Total</span><strong>{fmt(total)} RON</strong>
                </div>
              </>
            }

            <div className={styles.sumMeta}>
              <span>Client:</span>
              <span>{customer.name || '—'}</span>
              <span>Sursă:</span>
              <span>{SOURCES.find(s => s.v === source)?.l}</span>
              <span>Metodă:</span>
              <span>{method === 'livrare' ? 'Livrare' : 'Ridicare'}</span>
            </div>

            <button
              className={styles.submitBtn}
              onClick={submit}
              disabled={submitting || !items.length || !customer.name}
            >
              {submitting ? 'Se creează…' : 'Creează comanda'}
            </button>
            <p className={styles.submitNote}>
              Comanda va fi creată cu statusul „În pregătire".
              {customer.email ? ' Email de confirmare va fi trimis.' : ''}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
