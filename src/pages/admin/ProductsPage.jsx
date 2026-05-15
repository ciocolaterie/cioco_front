import { useEffect, useState } from 'react';
import * as productsApi from '../../services/products.service.js';
import api from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { fmt } from '../../utils/format.js';
import styles from './ProductsPage.module.css';

const PAGE = 20;

export default function ProductsPage() {
  const [items, setItems]     = useState(null);
  const [editing, setEditing] = useState(null);
  const [cats, setCats]       = useState(['Tablete', 'Praline', 'Cadouri', 'Ciocolată caldă', 'Bombonierie']);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [visible, setVisible] = useState(PAGE);
  const toast = useToast();

  const load = () => api.get('/admin/products').then(r => setItems(r.data));
  useEffect(() => {
    load();
    api.get('/settings/categories').then(r => setCats(r.data)).catch(() => {});
  }, []);

  const onDelete = async (p) => {
    if (!confirm(`Ștergi ${p.name}?`)) return;
    try {
      await productsApi.deleteProduct(p._id);
      toast({ title: 'Produs șters' });
      load();
    } catch (err) {
      toast({ title: 'Eroare', body: err.response?.data?.error || 'Nu s-a putut șterge' });
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = (items || []).filter(p => {
    const matchCat    = filter === 'all' || p.category === filter;
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });
  const shown = filtered.slice(0, visible);

  const countFor = (v) => v === 'all'
    ? (items?.length || 0)
    : (items || []).filter(p => p.category === v).length;

  return (
    <div>
      <header className={styles.head}>
        <div>
          <h1>Produse</h1>
          <p>{items
            ? `${items.length} produse · ${items.filter(p => p.stock <= 2 && p.stock > 0).length} stoc redus · ${items.filter(p => p.stock === 0).length} epuizate`
            : ''
          }</p>
        </div>
        <button className={styles.addBtn} onClick={() => setEditing({})}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span className={styles.addBtnText}>Produs nou</span>
        </button>
      </header>

      {!items ? <Spinner /> : items.length === 0
        ? <div className={styles.empty}>Niciun produs. Adaugă primul.</div>
        : <>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className={styles.searchInput}
                value={search}
                onChange={e => { setSearch(e.target.value); setVisible(PAGE); }}
                placeholder="Caută produs sau categorie…"
              />
              {search && (
                <button type="button" className={styles.searchClear} onClick={() => setSearch('')}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${filter === 'all' ? styles.tabActive : ''}`}
              onClick={() => { setFilter('all'); setVisible(PAGE); }}
            >
              Toate <span className={styles.tabCount}>{countFor('all')}</span>
            </button>
            {cats.map(c => (
              <button
                key={c}
                className={`${styles.tab} ${filter === c ? styles.tabActive : ''}`}
                onClick={() => { setFilter(c); setVisible(PAGE); }}
              >
                {c} <span className={styles.tabCount}>{countFor(c)}</span>
              </button>
            ))}
          </div>

          {filtered.length === 0
            ? <div className={styles.empty}>Niciun produs pentru acest filtru.</div>
            : <>
              {/* Desktop table */}
              <div className={styles.tableWrap}>
                <div className={styles.table}>
                  <div className={styles.theader}>
                    <span />
                    <span>Produs</span>
                    <span>Categorie</span>
                    <span>Preț</span>
                    <span>Stoc</span>
                    <span>Rating</span>
                    <span />
                  </div>
                  {shown.map(p => (
                    <div key={p._id} className={styles.row}>
                      <div className={styles.thumb}>
                        {p.images?.[0]
                          ? <img src={p.images[0]} alt="" />
                          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.5">
                              <rect x="3" y="3" width="18" height="18" rx="2"/>
                              <circle cx="8.5" cy="8.5" r="1.5"/>
                              <polyline points="21 15 16 10 5 21"/>
                            </svg>
                        }
                      </div>
                      <div>
                        <div className={styles.name}>
                          {p.name}
                          {!p.active && <span className={styles.inactiveBadge}>Inactiv</span>}
                        </div>
                        <div className={styles.weight}>{p.weight}</div>
                      </div>
                      <span className={styles.cat}>{p.category}</span>
                      <div className={styles.priceVal}>
                        {fmt(p.price)} <span className={styles.priceSub}>RON</span>
                      </div>
                      <Badge variant={p.stock > 5 ? 'success' : p.stock > 0 ? 'warn' : 'anulata'}>
                        {p.stock > 0 ? `${p.stock} buc` : 'Epuizat'}
                      </Badge>
                      <Stars rating={p.rating} count={p.reviewsCount} />
                      <div className={styles.rowActions}>
                        <button onClick={() => setEditing(p)} className={styles.iconBtn} title="Editează">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button onClick={() => onDelete(p)} className={`${styles.iconBtn} ${styles.iconBtnDanger}`} title="Șterge">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                {shown.map(p => (
                  <div key={p._id} className={styles.mobileCard}>
                    <div className={styles.mobileThumb}>
                      {p.images?.[0] && <img src={p.images[0]} alt="" />}
                    </div>
                    <div className={styles.mobileBody}>
                      <div className={styles.mobileTop}>
                        <span className={styles.mobileName}>
                          {p.name}
                          {!p.active && <span className={styles.inactiveBadge}>Inactiv</span>}
                        </span>
                        <span className={styles.mobilePrice}>{fmt(p.price)} RON</span>
                      </div>
                      <div className={styles.mobileMid}>
                        <span className={styles.mobileCat}>{p.category}</span>
                        {p.weight && <><span className={styles.mobileDot}>·</span><span className={styles.mobileWeight}>{p.weight}</span></>}
                      </div>
                      <div className={styles.mobileBot}>
                        <Badge variant={p.stock > 5 ? 'success' : p.stock > 0 ? 'warn' : 'anulata'}>
                          {p.stock > 0 ? `${p.stock} buc` : 'Epuizat'}
                        </Badge>
                        <div className={styles.mobileActions}>
                          <button onClick={() => setEditing(p)} className={styles.iconBtn} title="Editează">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button onClick={() => onDelete(p)} className={`${styles.iconBtn} ${styles.iconBtnDanger}`} title="Șterge">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filtered.length > visible && (
                <div className={styles.pagination}>
                  <button className={styles.loadMore} onClick={() => setVisible(v => v + PAGE)}>
                    Încarcă mai multe
                  </button>
                  <span className={styles.paginationInfo}>{Math.min(visible, filtered.length)} din {filtered.length} produse</span>
                </div>
              )}
            </>
          }
        </>
      }

      {editing && (
        <ProductForm
          initial={editing}
          cats={cats}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

/* ── SVG star rating ── */
function Stars({ rating, count }) {
  const r = Math.round(rating || 0);
  return (
    <div className={styles.stars}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24"
          fill={i < r ? '#C9821A' : 'none'}
          stroke={i < r ? '#C9821A' : 'var(--ink-3)'}
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
      <span className={styles.starsCount}>({count || 0})</span>
    </div>
  );
}

/* ── Chip input ── */
function ChipInput({ value, onChange, placeholder }) {
  const [input, setInput] = useState('');
  const add = (raw) => {
    const v = raw.trim();
    if (!v || value.includes(v)) return;
    onChange([...value, v]);
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter')     { e.preventDefault(); add(input); setInput(''); }
    else if (e.key === ',')    { e.preventDefault(); add(input); setInput(''); }
    else if (e.key === 'Backspace' && !input && value.length) onChange(value.slice(0, -1));
  };
  const handleChange = (e) => {
    const v = e.target.value;
    if (v.includes(',')) {
      v.split(',').slice(0, -1).forEach(p => add(p));
      setInput(v.split(',').at(-1));
    } else setInput(v);
  };
  return (
    <div className={styles.chipInput}>
      {value.map((v, i) => (
        <span key={i} className={styles.chipTag}>
          {v}
          <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))}>×</button>
        </span>
      ))}
      <input
        className={styles.chipField}
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ''}
      />
    </div>
  );
}

const slugify = (str) =>
  str.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ── Product form modal ── */
function ProductForm({ initial, cats, onClose, onSaved }) {
  const toast = useToast();
  const [busy, setBusy]           = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '', slug: '', category: cats[0] || '', price: 0, stock: 0,
    weight: '', short: '', description: '', ingredients: '',
    allergens: [], tags: [], images: [], active: true,
    ...initial,
  });
  const isEdit = !!initial._id;

  const set    = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setNum = (k) => (e) => setForm(f => ({ ...f, [k]: Number(e.target.value) || 0 }));

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await productsApi.uploadImage(file);
      setForm(f => ({ ...f, images: [...(f.images || []), url] }));
      toast({ title: 'Imagine urcată' });
    } catch (err) {
      toast({ title: 'Eroare upload', body: err.response?.data?.error || err.message });
    } finally { setUploading(false); e.target.value = ''; }
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, slug: form.slug || slugify(form.name) };
    setBusy(true);
    try {
      if (isEdit) await productsApi.updateProduct(initial._id, payload);
      else        await productsApi.createProduct(payload);
      toast({ title: isEdit ? 'Produs actualizat' : 'Produs creat' });
      onSaved();
    } catch (err) {
      toast({ title: 'Eroare', body: err.response?.data?.error || err.message });
    } finally { setBusy(false); }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <header className={styles.modalHead}>
          <h2>{isEdit ? 'Editează produs' : 'Adaugă produs'}</h2>
          <button onClick={onClose} className={styles.close} aria-label="Închide">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </header>
        <form onSubmit={submit} className={styles.form}>
          <label className={styles.full}>Nume<input value={form.name} onChange={set('name')} required /></label>
          <label>Slug<input value={form.slug} onChange={set('slug')} placeholder="auto-generat" /></label>
          <label>Categorie
            <select value={form.category} onChange={set('category')}>
              {cats.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label>Preț (lei)<input type="number" step="0.01" value={form.price} onChange={setNum('price')} required /></label>
          <label>Stoc<input type="number" value={form.stock} onChange={setNum('stock')} required /></label>
          <label>Greutate<input value={form.weight} onChange={set('weight')} placeholder="ex: 100g" /></label>
          <label className={styles.full}>Descriere scurtă<input value={form.short} onChange={set('short')} maxLength={200} /></label>
          <label className={styles.full}>Descriere completă<textarea value={form.description} onChange={set('description')} rows={4} /></label>
          <label className={styles.full}>Ingrediente<textarea value={form.ingredients} onChange={set('ingredients')} rows={2} /></label>
          <div className={styles.full}>
            <div className={styles.chipLabel}>Alergeni</div>
            <ChipInput value={form.allergens} onChange={v => setForm(f => ({ ...f, allergens: v }))} placeholder="ex: lapte, nuci — Enter sau virgulă" />
          </div>
          <div className={styles.full}>
            <div className={styles.chipLabel}>Tag-uri</div>
            <ChipInput value={form.tags} onChange={v => setForm(f => ({ ...f, tags: v }))} placeholder="ex: vegan, best-seller — Enter sau virgulă" />
          </div>
          <div className={styles.full}>
            <div className={styles.imagesLabel}>Imagini</div>
            <div className={styles.images}>
              {form.images.map((u, i) => (
                <div key={i} className={styles.imageItem}>
                  <img src={u} alt="" />
                  <button type="button" onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, k) => k !== i) }))}>×</button>
                </div>
              ))}
              <label className={styles.uploadBox}>
                {uploading ? '…' : '+ Adaugă'}
                <input type="file" accept="image/*" onChange={onUpload} hidden disabled={uploading} />
              </label>
            </div>
          </div>
          <label className={`${styles.full} ${styles.checkbox}`}>
            <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
            Activ (vizibil pe site)
          </label>
          <div className={`${styles.full} ${styles.formActions}`}>
            <Button type="button" variant="outline" onClick={onClose}>Anulează</Button>
            <Button type="submit" disabled={busy}>{busy ? '…' : 'Salvează'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
