import { useEffect, useState } from 'react';
import * as promoApi from '../../services/promotions.service.js';
import { useToast } from '../../context/ToastContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import styles from './PromotionsPage.module.css';

function fmtExpiry(d) {
  if (!d) return 'permanent';
  return new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PromotionsPage() {
  const toast = useToast();
  const [promos, setPromos] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => promoApi.listPromotions().then(setPromos).catch(() => setPromos([]));
  useEffect(() => { load(); }, []);

  const onToggle = async (p) => {
    await promoApi.updatePromotion(p._id, { active: !p.active });
    toast({ title: p.active ? 'Promoție dezactivată' : 'Promoție activată' });
    load();
  };

  const onDelete = async (p) => {
    if (!confirm(`Ștergi codul ${p.code}?`)) return;
    await promoApi.deletePromotion(p._id);
    toast({ title: 'Promoție ștearsă' });
    load();
  };

  return (
    <div>
      <header className={styles.head}>
        <div>
          <h1>Promoții</h1>
          <p>Gestionează coduri de discount</p>
        </div>
        <button className={styles.addBtn} onClick={() => { setEditing(null); setShowForm(true); }}>
          + Promoție nouă
        </button>
      </header>

      {!promos ? <Spinner /> : promos.length === 0 ? (
        <div className={styles.empty}>Nicio promoție creată încă.</div>
      ) : (
        <div className={styles.table}>
          <div className={styles.theader}>
            <span>COD</span>
            <span>DISCOUNT</span>
            <span>STATUS</span>
            <span>FOLOSIRI</span>
            <span>EXPIRĂ</span>
            <span></span>
          </div>
          {promos.map((p) => (
            <div key={p._id} className={styles.row}>
              <span className={styles.code}>{p.code}</span>
              <span className={styles.discount}>
                {p.type === 'percent' ? `${p.value}%` : `${p.value} RON`}
              </span>
              <span>
                <span className={`${styles.statusBadge} ${p.active ? styles.active : styles.expired}`}>
                  {p.active ? 'activă' : 'inactivă'}
                </span>
              </span>
              <span className={styles.uses}>{p.uses}{p.maxUses ? ` / ${p.maxUses}` : ''}</span>
              <span className={styles.expires}>{fmtExpiry(p.expiresAt)}</span>
              <div className={styles.actions}>
                <button className={styles.editBtn} onClick={() => { setEditing(p); setShowForm(true); }} title="Editează">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button className={`${styles.editBtn} ${styles.danger}`} onClick={() => onDelete(p)} title="Șterge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <PromoForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function PromoForm({ initial, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = !!initial?._id;
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    code: initial?.code || '',
    type: initial?.type || 'percent',
    value: initial?.value || '',
    maxUses: initial?.maxUses || '',
    expiresAt: initial?.expiresAt ? initial.expiresAt.slice(0, 10) : '',
    active: initial?.active ?? true,
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        code: form.code.toUpperCase(),
        type: form.type,
        value: Number(form.value),
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt || undefined,
        active: form.active,
      };
      if (isEdit) await promoApi.updatePromotion(initial._id, payload);
      else await promoApi.createPromotion(payload);
      toast({ title: isEdit ? 'Promoție actualizată' : 'Promoție creată' });
      onSaved();
    } catch (err) {
      toast({ title: 'Eroare', body: err.response?.data?.error || err.message });
    } finally { setBusy(false); }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <header className={styles.modalHead}>
          <h2>{isEdit ? 'Editează promoție' : 'Promoție nouă'}</h2>
          <button className={styles.close} onClick={onClose}>×</button>
        </header>
        <form onSubmit={submit} className={styles.form}>
          <label>Cod<input value={form.code} onChange={set('code')} required placeholder="ex: VARA2026" style={{ textTransform: 'uppercase' }} /></label>
          <label>Tip
            <select value={form.type} onChange={set('type')}>
              <option value="percent">Procent (%)</option>
              <option value="fixed">Valoare fixă (RON)</option>
            </select>
          </label>
          <label>Valoare ({form.type === 'percent' ? '%' : 'RON'})
            <input type="number" value={form.value} onChange={set('value')} required min="0" step="0.01" />
          </label>
          <label>Utilizări maxime (opțional)
            <input type="number" value={form.maxUses} onChange={set('maxUses')} min="1" placeholder="nelimitat" />
          </label>
          <label>Expiră la (opțional)
            <input type="date" value={form.expiresAt} onChange={set('expiresAt')} />
          </label>
          <label className={styles.checkRow}>
            <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
            Promoție activă
          </label>
          <div className={styles.formActions}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>Anulează</button>
            <button type="submit" disabled={busy} className={styles.saveBtn}>{busy ? '…' : 'Salvează'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
