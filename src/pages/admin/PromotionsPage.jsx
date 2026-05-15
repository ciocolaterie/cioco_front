import { useEffect, useState } from 'react';
import * as promoApi from '../../services/promotions.service.js';
import { useToast } from '../../context/ToastContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import styles from './PromotionsPage.module.css';

function fmtExpiry(d) {
  if (!d) return 'permanent';
  return new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
}
function isExpired(p) {
  return p.expiresAt && new Date(p.expiresAt) < new Date();
}

function StatusBadge({ promo }) {
  if (isExpired(promo)) return <span className={`${styles.badge} ${styles.badgeExpired}`}>Expirată</span>;
  if (!promo.active)   return <span className={`${styles.badge} ${styles.badgeOff}`}>Inactivă</span>;
  return <span className={`${styles.badge} ${styles.badgeOn}`}>Activă</span>;
}

function CopyBtn({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button className={styles.copyBtn} onClick={copy} title="Copiază codul">
      {copied
        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      }
    </button>
  );
}

export default function PromotionsPage() {
  const toast = useToast();
  const [promos, setPromos]   = useState(null);
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

  const active   = (promos || []).filter(p => p.active && !isExpired(p)).length;
  const expired  = (promos || []).filter(p => isExpired(p)).length;
  const totalUses = (promos || []).reduce((s, p) => s + (p.uses || 0), 0);

  return (
    <div>
      <header className={styles.head}>
        <div>
          <h1>Promoții</h1>
          <p>Coduri de discount</p>
        </div>
        <button className={styles.addBtn} onClick={() => setEditing({})}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span className={styles.addBtnText}>Promoție nouă</span>
        </button>
      </header>

      {!promos ? <Spinner /> : <>
        {promos.length > 0 && (
          <div className={styles.kpis}>
            <div className={styles.kpi}>
              <div className={styles.kpiLabel}>Active</div>
              <div className={styles.kpiValue}>{active}</div>
              <div className={styles.kpiSub}>din {promos.length} total</div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiLabel}>Total folosiri</div>
              <div className={styles.kpiValue}>{totalUses}</div>
              <div className={styles.kpiSub}>cumulat toate codurile</div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiLabel}>Expirate</div>
              <div className={styles.kpiValue}>{expired}</div>
              <div className={styles.kpiSub}>{promos.length - expired} valabile</div>
            </div>
          </div>
        )}

        {promos.length === 0
          ? <div className={styles.empty}>
              Nicio promoție creată încă.
              <button className={styles.emptyAction} onClick={() => setEditing({})}>Creează prima promoție</button>
            </div>
          : <>
            {/* Desktop table */}
            <div className={styles.tableWrap}>
              <div className={styles.table}>
                <div className={styles.theader}>
                  <span>Cod</span>
                  <span>Discount</span>
                  <span>Status</span>
                  <span>Folosiri</span>
                  <span>Expiră</span>
                  <span />
                </div>
                {promos.map(p => (
                  <div key={p._id} className={`${styles.row} ${!p.active || isExpired(p) ? styles.rowDim : ''}`}>
                    <div className={styles.codeCell}>
                      <span className={styles.code}>{p.code}</span>
                      <CopyBtn code={p.code} />
                    </div>
                    <span className={styles.discount}>
                      {p.type === 'percent' ? `${p.value}%` : `${p.value} RON`}
                    </span>
                    <StatusBadge promo={p} />
                    <span className={styles.uses}>
                      {p.uses || 0}{p.maxUses ? ` / ${p.maxUses}` : ''}
                    </span>
                    <span className={styles.expires}>{fmtExpiry(p.expiresAt)}</span>
                    <div className={styles.actions}>
                      <button
                        className={`${styles.iconBtn} ${p.active && !isExpired(p) ? styles.iconBtnOn : ''}`}
                        onClick={() => onToggle(p)}
                        title={p.active ? 'Dezactivează' : 'Activează'}
                        disabled={isExpired(p)}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                      </button>
                      <button className={styles.iconBtn} onClick={() => setEditing(p)} title="Editează">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => onDelete(p)} title="Șterge">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile cards */}
            <div className={styles.mobileList}>
              {promos.map(p => (
                <div key={p._id} className={`${styles.mobileCard} ${!p.active || isExpired(p) ? styles.mobileCardDim : ''}`}>
                  <div className={styles.mobileCardTop}>
                    <div className={styles.codeCell}>
                      <span className={styles.code}>{p.code}</span>
                      <CopyBtn code={p.code} />
                    </div>
                    <StatusBadge promo={p} />
                  </div>
                  <div className={styles.mobileCardMid}>
                    <span className={styles.mobileDiscount}>
                      {p.type === 'percent' ? `${p.value}% reducere` : `${p.value} RON reducere`}
                    </span>
                    <span className={styles.mobileDot}>·</span>
                    <span className={styles.mobileUses}>
                      {p.uses || 0}{p.maxUses ? `/${p.maxUses}` : ''} folosiri
                    </span>
                    <span className={styles.mobileDot}>·</span>
                    <span className={styles.mobileExpires}>{fmtExpiry(p.expiresAt)}</span>
                  </div>
                  <div className={styles.mobileCardActions}>
                    <button
                      className={`${styles.toggleBtn} ${p.active && !isExpired(p) ? styles.toggleBtnOn : styles.toggleBtnOff}`}
                      onClick={() => onToggle(p)}
                      disabled={isExpired(p)}
                    >
                      {p.active && !isExpired(p) ? 'Activă' : 'Inactivă'}
                    </button>
                    <div className={styles.mobileIcons}>
                      <button className={styles.iconBtn} onClick={() => setEditing(p)} title="Editează">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => onDelete(p)} title="Șterge">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        }
      </>}

      {editing !== null && (
        <PromoForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
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
    code:      initial?.code      || '',
    type:      initial?.type      || 'percent',
    value:     initial?.value     || '',
    maxUses:   initial?.maxUses   || '',
    expiresAt: initial?.expiresAt ? initial.expiresAt.slice(0, 10) : '',
    active:    initial?.active    ?? true,
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        code:      form.code.toUpperCase(),
        type:      form.type,
        value:     Number(form.value),
        maxUses:   form.maxUses   ? Number(form.maxUses)  : undefined,
        expiresAt: form.expiresAt ? form.expiresAt        : undefined,
        active:    form.active,
      };
      if (isEdit) await promoApi.updatePromotion(initial._id, payload);
      else        await promoApi.createPromotion(payload);
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
          <button className={styles.close} onClick={onClose} aria-label="Închide">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </header>
        <form onSubmit={submit} className={styles.form}>
          <label>
            Cod
            <input value={form.code} onChange={set('code')} required placeholder="ex: VARA2026" style={{ textTransform: 'uppercase' }} />
          </label>
          <label>
            Tip
            <select value={form.type} onChange={set('type')}>
              <option value="percent">Procent (%)</option>
              <option value="fixed">Valoare fixă (RON)</option>
            </select>
          </label>
          <label>
            Valoare ({form.type === 'percent' ? '%' : 'RON'})
            <input type="number" value={form.value} onChange={set('value')} required min="0" step="0.01" />
          </label>
          <label>
            Utilizări maxime
            <input type="number" value={form.maxUses} onChange={set('maxUses')} min="1" placeholder="nelimitat" />
          </label>
          <label>
            Expiră la
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
