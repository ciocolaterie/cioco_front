import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listOrders, bulkUpdateStatus, toggleUrgent } from '../../services/orders.service.js';
import api from '../../services/api.js';
import Spinner from '../../components/ui/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { STATUS_LABEL, fmt, fmtDate } from '../../utils/format.js';
import styles from './OrdersPage.module.css';

const AVATAR_COLORS = ['#7B3D1D','#16a34a','#2563eb','#db2777','#ea580c','#0891b2','#d97706','#0f766e','#c2410c','#0284c7'];
const avatarColor = (name = '') => {
  const n = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
};
const initials = (name = '') => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
const timeAgo  = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), dy = Math.floor(diff / 86400000);
  if (m < 2) return 'acum'; if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`; if (dy === 1) return 'ieri'; return `${dy}z`;
};

const STATUSES = [
  { v: 'all',          l: 'Toate' },
  { v: 'noua',         l: 'Noi' },
  { v: 'in_pregatire', l: 'În pregătire' },
  { v: 'gata',         l: 'Gata' },
  { v: 'livrata',      l: 'Livrate' },
  { v: 'anulata',      l: 'Anulate' },
];

const SOURCE_LABEL = { online:'Online', telefon:'Telefon', whatsapp:'WhatsApp', instagram:'Instagram', fata_in_fata:'Față în față' };

const exportCSV = async () => {
  const res = await api.get('/admin/export-orders', { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
  const a   = document.createElement('a');
  a.href = url; a.download = 'comenzi.csv'; a.click();
  URL.revokeObjectURL(url);
};

const PAGE = 24; /* multiple of 3 for clean grid */

/* ── icons ── */
const Ico = {
  plus:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  export:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  search:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  x:       <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  clock:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  truck:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  pickup:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  cal:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  warn:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  check:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  dot:     <svg width="7" height="7" viewBox="0 0 7 7" fill="currentColor"><circle cx="3.5" cy="3.5" r="3.5"/></svg>,
  star:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  starFill:<svg width="13" height="13" viewBox="0 0 24 24" fill="#F97316" stroke="#F97316" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
};

function OrderCard({ order: o, selected, onSelect, onUrgent }) {
  const nav = useNavigate();

  const itemsPreview = o.items
    .slice(0, 2)
    .map(i => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ''}`)
    .join(', ');
  const moreItems = o.items.length > 2 ? ` +${o.items.length - 2}` : '';

  const isDone      = o.status === 'livrata';
  const isCancelled = o.status === 'anulata';

  return (
    <div
      className={[
        styles.card,
        selected    ? styles.cardSelected : '',
        isDone      ? styles.cardDone     : '',
        isCancelled ? styles.cardCancel   : '',
      ].filter(Boolean).join(' ')}
      onClick={() => nav(`/admin/comenzi/${o._id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && nav(`/admin/comenzi/${o._id}`)}
    >
      {/* Checkbox + urgent toggle (overlay top row) */}
      <div className={styles.cardControls}>
        <div className={styles.cardCheck} onClick={e => { e.stopPropagation(); onSelect(o._id); }}>
          <input type="checkbox" className={styles.chk} checked={selected} readOnly />
        </div>
        <button
          className={`${styles.urgentBtn} ${o.urgent ? styles.urgentBtnOn : ''}`}
          onClick={e => { e.stopPropagation(); onUrgent(o, e); }}
          title={o.urgent ? 'Elimină urgența' : 'Marchează urgent'}
        >
          {o.urgent ? Ico.starFill : Ico.star}
        </button>
      </div>

      {/* Card head: avatar + order info + status */}
      <div className={styles.cardHead}>
        <div className={styles.cardAvatar} style={{ background: avatarColor(o.customer.name) }}>
          {initials(o.customer.name)}
        </div>
        <div className={styles.cardHeadInfo}>
          <div className={styles.cardOrderNum}>{o.orderNumber}</div>
          <div className={styles.cardCustomer}>{o.customer.name}</div>
        </div>
        <Badge variant={o.status}>{STATUS_LABEL[o.status]}</Badge>
      </div>

      {/* Items preview */}
      <p className={styles.cardItems}>
        {itemsPreview}{moreItems && <span className={styles.moreItems}>{moreItems} mai multe</span>}
      </p>

      {/* Divider */}
      <div className={styles.cardDivider} />

      {/* Meta row: time left + total */}
      <div className={styles.cardMeta}>
        <span className={styles.metaItem}>{Ico.clock} {timeAgo(o.createdAt)}</span>
        <span className={styles.cardTotal}>{fmt(o.total)} RON</span>
      </div>

      {/* Method + date row */}
      <div className={styles.cardMeta}>
        <span className={styles.metaItem}>
          {o.method === 'livrare' ? Ico.truck : Ico.pickup}
          {o.method === 'livrare' ? 'Livrare' : 'Ridicare'}
          {o.method === 'livrare' && o.zoneName && <span className={styles.zoneChip}>{o.zoneName}</span>}
        </span>
        <span className={styles.metaItem} style={{color:'var(--ink-3)'}}>
          {Ico.cal} {fmtDate(o.createdAt)}
        </span>
      </div>

      {/* Source if not online */}
      {o.source && o.source !== 'online' && (
        <div className={styles.cardSource}>{SOURCE_LABEL[o.source] || o.source}</div>
      )}

      {/* Delivery date if set */}
      {o.deliveryDate && (
        <div className={styles.cardDelivery}>
          {Ico.cal} Livrare: {fmtDate(o.deliveryDate)}
        </div>
      )}

      {/* Status strip at bottom */}
      {o.status === 'noua' && !o.urgent && (
        <div className={`${styles.cardStatusLine} ${styles.cardStatusNew}`}>
          {Ico.dot} Nouă
        </div>
      )}
      {isDone && (
        <div className={`${styles.cardStatusLine} ${styles.cardStatusDone}`}>
          {Ico.check} Livrată
        </div>
      )}
      {isCancelled && (
        <div className={`${styles.cardStatusLine} ${styles.cardStatusCancel}`}>
          {Ico.x} Anulată
        </div>
      )}
      {o.urgent && !isDone && !isCancelled && (
        <div className={`${styles.cardStatusLine} ${styles.cardStatusUrgent}`}>
          {Ico.warn} Urgentă
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const nav  = useNavigate();
  const toast = useToast();
  const [allOrders,   setAllOrders]   = useState(null);
  const [filter,      setFilter]      = useState('all');
  const [search,      setSearch]      = useState('');
  const [visible,     setVisible]     = useState(PAGE);
  const [sortBy,      setSortBy]      = useState('date_desc');
  const [selected,    setSelected]    = useState(new Set());
  const [bulkStatus,  setBulkStatus]  = useState('');
  const [bulkConfirm, setBulkConfirm] = useState(false);

  const load = () =>
    listOrders().then(data => {
      setAllOrders([...data].sort((a, b) => {
        if (a.urgent && !b.urgent) return -1;
        if (!a.urgent && b.urgent) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      }));
    }).catch(() => setAllOrders([]));

  useEffect(() => { load(); }, []);

  const q        = search.trim().toLowerCase();
  const byStatus = filter === 'all' ? (allOrders || []) : (allOrders || []).filter(o => o.status === filter);
  const bySearch = q
    ? byStatus.filter(o =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.customer.name?.toLowerCase().includes(q) ||
        o.customer.email?.toLowerCase().includes(q) ||
        o.customer.phone?.toLowerCase().includes(q))
    : byStatus;

  const sorted = [...bySearch].sort((a, b) => {
    if (a.urgent && !b.urgent) return -1;
    if (!a.urgent && b.urgent) return 1;
    if (sortBy === 'date_desc')  return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'date_asc')   return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'total_desc') return b.total - a.total;
    if (sortBy === 'total_asc')  return a.total - b.total;
    return 0;
  });

  const countFor = v => v === 'all' ? (allOrders?.length || 0) : (allOrders || []).filter(o => o.status === v).length;
  const shown    = sorted.slice(0, visible);
  const totalRev = sorted.reduce((s, o) => s + (o.total || 0), 0);

  /* ── Selection ── */
  const allShownSel  = shown.length > 0 && shown.every(o => selected.has(o._id));
  const someShownSel = shown.some(o => selected.has(o._id)) && !allShownSel;

  const toggleSelect = id => setSelected(s => {
    const ns = new Set(s);
    ns.has(id) ? ns.delete(id) : ns.add(id);
    return ns;
  });
  const toggleAll = () => {
    if (allShownSel) setSelected(s => { const ns = new Set(s); shown.forEach(o => ns.delete(o._id)); return ns; });
    else             setSelected(s => { const ns = new Set(s); shown.forEach(o => ns.add(o._id)); return ns; });
  };

  const doBulk = async () => {
    setBulkConfirm(false);
    try {
      await bulkUpdateStatus([...selected], bulkStatus);
      toast({ title: `${selected.size} comenzi → ${STATUS_LABEL[bulkStatus]}` });
      setSelected(new Set()); setBulkStatus(''); load();
    } catch { toast({ title: 'Eroare la actualizare', variant: 'error' }); }
  };

  const handleUrgent = async (o, e) => {
    e.stopPropagation();
    try {
      await toggleUrgent(o._id, !o.urgent, o.urgentNote);
      toast({ title: o.urgent ? 'Urgență eliminată' : 'Marcat urgent' });
      load();
    } catch { toast({ title: 'Eroare', variant: 'error' }); }
  };

  return (
    <div className={styles.page}>
      <ConfirmDialog
        open={bulkConfirm}
        title={`Schimbi ${selected.size} comenzi la "${STATUS_LABEL[bulkStatus]}"?`}
        body="Această acțiune nu poate fi anulată."
        confirmLabel="Confirmă"
        onConfirm={doBulk}
        onCancel={() => setBulkConfirm(false)}
      />

      {/* ── Header ── */}
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Comenzi</h1>
          {allOrders && (
            <p className={styles.sub}>
              {sorted.length !== allOrders.length
                ? `${sorted.length} din ${allOrders.length} comenzi`
                : `${allOrders.length} comenzi`}
              {sorted.length > 0 && <> · Total: <strong>{fmt(totalRev)} RON</strong></>}
            </p>
          )}
        </div>
        <div className={styles.headActions}>
          <button className={styles.newOrderBtn} onClick={() => nav('/admin/comenzi/nou')}>
            {Ico.plus} Comandă nouă
          </button>
          <button className={styles.exportBtn} onClick={exportCSV}>
            {Ico.export} <span className={styles.exportTxt}>Export</span>
          </button>
        </div>
      </header>

      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>{Ico.search}</span>
          <input
            className={styles.searchInput}
            value={search}
            onChange={e => { setSearch(e.target.value); setVisible(PAGE); }}
            placeholder="Caută client, #comandă, email, telefon…"
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')}>{Ico.x}</button>
          )}
        </div>
        <select
          className={styles.sortSelect}
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          <option value="date_desc">Cele mai recente</option>
          <option value="date_asc">Cele mai vechi</option>
          <option value="total_desc">Total descrescător</option>
          <option value="total_asc">Total crescător</option>
        </select>
      </div>

      {/* ── Status tabs ── */}
      <div className={styles.tabs}>
        {STATUSES.map(({ v, l }) => (
          <button
            key={v}
            className={`${styles.tab} ${filter === v ? styles.tabActive : ''}`}
            onClick={() => { setFilter(v); setVisible(PAGE); setSelected(new Set()); }}
          >
            {l} <span className={styles.tabCount}>{countFor(v)}</span>
          </button>
        ))}
      </div>

      {/* ── Bulk bar ── */}
      {selected.size > 0 && (
        <div className={styles.bulkBar}>
          <div className={styles.bulkLeft}>
            <input
              type="checkbox"
              className={styles.chk}
              checked={allShownSel}
              ref={el => { if (el) el.indeterminate = someShownSel; }}
              onChange={toggleAll}
            />
            <span className={styles.bulkCount}>{selected.size} selectate</span>
          </div>
          <select className={styles.bulkSelect} value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}>
            <option value="">Schimbă statusul…</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button className={styles.bulkApply} disabled={!bulkStatus} onClick={() => bulkStatus && setBulkConfirm(true)}>
            Aplică
          </button>
          <button className={styles.bulkClear} onClick={() => { setSelected(new Set()); setBulkStatus(''); }}>
            {Ico.x}
          </button>
        </div>
      )}

      {/* ── Grid ── */}
      {!allOrders
        ? <Spinner />
        : sorted.length === 0
        ? <div className={styles.empty}>Nicio comandă pentru acest filtru.</div>
        : (
          <>
            <div className={styles.grid}>
              {shown.map(o => (
                <OrderCard
                  key={o._id}
                  order={o}
                  selected={selected.has(o._id)}
                  onSelect={toggleSelect}
                  onUrgent={handleUrgent}
                />
              ))}
            </div>

            {/* Load more */}
            {visible < sorted.length && (
              <div className={styles.loadMoreRow}>
                <button className={styles.loadMore} onClick={() => setVisible(v => v + PAGE)}>
                  Încarcă mai multe ({sorted.length - visible} rămase)
                </button>
                <span className={styles.paginationInfo}>{Math.min(visible, sorted.length)} / {sorted.length}</span>
              </div>
            )}
          </>
        )
      }
    </div>
  );
}
