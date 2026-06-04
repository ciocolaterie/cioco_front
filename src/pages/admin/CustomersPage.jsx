import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import { listCustomers, exportCustomers } from '../../services/admin.service.js';
import { fmt, fmtDate } from '../../utils/format.js';
import styles from './CustomersPage.module.css';

const PAGE = 25;

const AVATAR_COLORS = ['#7B3D1D','#16a34a','#2563eb','#db2777','#ea580c','#0891b2','#d97706','#0f766e','#c2410c','#0284c7'];
const avatarColor = (name = '') => {
  const n = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
};
const initials = (name = '') => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const FILTERS = [
  { v: 'all',      l: 'Toți' },
  { v: 'loyal',    l: 'Fideli' },
  { v: 'active',   l: 'Cu comenzi' },
  { v: 'inactive', l: 'Fără comenzi' },
];

const IcoStar   = <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IcoExport = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IcoSearch = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoDots   = <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>;
const IcoEye    = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IcoX      = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

function StatusBadge({ c }) {
  if (c.loyal)       return <span className={`${styles.badge} ${styles.badgeFidel}`}>{IcoStar} Fidel</span>;
  if (c.orders > 0)  return <span className={`${styles.badge} ${styles.badgeActiv}`}><i className={styles.dot}/>Activ</span>;
  return               <span className={`${styles.badge} ${styles.badgeNone}`}><i className={styles.dot}/>Fără comenzi</span>;
}

function RowMenu({ customer, onOpen }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div className={styles.menuWrap} ref={ref} onClick={e => e.stopPropagation()}>
      <button className={styles.menuBtn} onClick={() => setOpen(o => !o)} aria-label="Opțiuni">
        {IcoDots}
      </button>
      {open && (
        <div className={styles.menuDrop}>
          <button onClick={() => { onOpen(); setOpen(false); }}>
            {IcoEye} Deschide profil
          </button>
        </div>
      )}
    </div>
  );
}

function SortBtn({ label, field, sortBy, onSort }) {
  const active = sortBy.startsWith(field);
  const asc    = sortBy === `${field}_asc`;
  return (
    <button className={`${styles.sortBtn} ${active ? styles.sortActive : ''}`} onClick={() => onSort(field)}>
      {label}
      <svg width="10" height="12" viewBox="0 0 10 14" fill="none" style={{flexShrink:0}}>
        <path d="M5 0 L5 14 M1 4 L5 0 L9 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={active && asc ? 1 : 0.25}/>
        <path d="M1 10 L5 14 L9 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={active && !asc ? 1 : 0.25}/>
      </svg>
    </button>
  );
}

function Checkbox({ checked, indeterminate, onChange, onClick }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate; }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className={styles.checkbox}
      checked={checked}
      onChange={onChange}
      onClick={onClick}
    />
  );
}

export default function CustomersPage() {
  const nav = useNavigate();
  const [list,     setList]     = useState(null);
  const [loyalty,  setLoyalty]  = useState({ orders: 5, spent: 200 });
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');
  const [sortBy,   setSortBy]   = useState('spent_desc');
  const [visible,  setVisible]  = useState(PAGE);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    api.get('/settings').then(r => {
      setLoyalty({ orders: r.data.loyaltyOrders ?? 5, spent: r.data.loyaltySpent ?? 200 });
    }).catch(() => {});
    listCustomers().then(setList);
  }, []);

  if (!list) return null;

  const totalRevenue = list.reduce((s, c) => s + (c.spent || 0), 0);
  const withOrders   = list.filter(c => c.orders > 0).length;
  const loyalCount   = list.filter(c => c.loyal).length;

  const toggleSort = field =>
    setSortBy(prev => prev === `${field}_desc` ? `${field}_asc` : `${field}_desc`);

  const q        = search.trim().toLowerCase();
  const byFilter = filter === 'all'     ? list
    : filter === 'loyal'   ? list.filter(c => c.loyal)
    : filter === 'active'  ? list.filter(c => c.orders > 0)
    : list.filter(c => !c.orders);
  const bySearch = q
    ? byFilter.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q))
    : byFilter;
  const sorted = [...bySearch].sort((a, b) => {
    if (sortBy === 'spent_desc')  return (b.spent  || 0) - (a.spent  || 0);
    if (sortBy === 'spent_asc')   return (a.spent  || 0) - (b.spent  || 0);
    if (sortBy === 'orders_desc') return (b.orders || 0) - (a.orders || 0);
    if (sortBy === 'orders_asc')  return (a.orders || 0) - (b.orders || 0);
    if (sortBy === 'last_desc')   return new Date(b.lastOrder || 0) - new Date(a.lastOrder || 0);
    if (sortBy === 'last_asc')    return new Date(a.lastOrder || 0) - new Date(b.lastOrder || 0);
    return 0;
  });
  const shown = sorted.slice(0, visible);

  const countFor = v => v === 'all' ? list.length
    : v === 'loyal'   ? loyalCount
    : v === 'active'  ? withOrders
    : list.length - withOrders;

  /* ── Selection ── */
  const allShownSelected  = shown.length > 0 && shown.every(c => selected.has(c._id));
  const someShownSelected = shown.some(c => selected.has(c._id)) && !allShownSelected;

  const toggleAll = e => {
    e.stopPropagation();
    if (allShownSelected) {
      setSelected(s => { const ns = new Set(s); shown.forEach(c => ns.delete(c._id)); return ns; });
    } else {
      setSelected(s => { const ns = new Set(s); shown.forEach(c => ns.add(c._id)); return ns; });
    }
  };
  const toggleOne = (id, e) => {
    e.stopPropagation();
    setSelected(s => { const ns = new Set(s); if (ns.has(id)) ns.delete(id); else ns.add(id); return ns; });
  };
  const clearSelection = () => setSelected(new Set());

  /* ── Export selected (client-side CSV) ── */
  const exportSelected = () => {
    const rows = [
      ['Nume', 'Email', 'Telefon', 'Comenzi', 'Total cheltuit (RON)', 'Ultima comandă'],
      ...sorted.filter(c => selected.has(c._id)).map(c => [
        c.name, c.email, c.phone || '', c.orders || 0, (c.spent || 0).toFixed(2),
        c.lastOrder ? fmtDate(c.lastOrder) : '',
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'clienti-selectati.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Clienți</h1>
          <p className={styles.sub}>
            {list.length} clienți · Total cheltuit <strong>{fmt(totalRevenue)} RON</strong> · {loyalCount} fideli
          </p>
        </div>
        <button className={styles.exportBtn} onClick={exportCustomers}>
          {IcoExport} Export CSV
        </button>
      </header>

      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>{IcoSearch}</span>
          <input
            className={styles.searchInput}
            value={search}
            onChange={e => { setSearch(e.target.value); setVisible(PAGE); }}
            placeholder="Caută după nume, email sau telefon…"
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')}>{IcoX}</button>
          )}
        </div>
        <div className={styles.filterTabs}>
          {FILTERS.map(({ v, l }) => (
            <button
              key={v}
              className={`${styles.tab} ${filter === v ? styles.tabActive : ''}`}
              onClick={() => { setFilter(v); setVisible(PAGE); clearSelection(); }}
            >
              {l} <span className={styles.tabCount}>{countFor(v)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Bulk action bar ── */}
      {selected.size > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkCount}>{selected.size} selectat{selected.size === 1 ? '' : 'i'}</span>
          <div className={styles.bulkActions}>
            <button className={styles.bulkBtn} onClick={exportSelected}>
              {IcoExport} Export CSV
            </button>
          </div>
          <button className={styles.bulkClose} onClick={clearSelection}>{IcoX}</button>
        </div>
      )}

      {/* ── Table ── */}
      {sorted.length === 0
        ? <div className={styles.empty}>{list.length === 0 ? 'Niciun client înregistrat.' : 'Niciun client găsit.'}</div>
        : (
          <div className={styles.tableCard}>
            {/* Header */}
            <div className={styles.theader}>
              <div className={styles.checkCell}>
                <Checkbox
                  checked={allShownSelected}
                  indeterminate={someShownSelected}
                  onChange={() => {}}
                  onClick={toggleAll}
                />
              </div>
              <span className={styles.starTh} />
              <span>Client</span>
              <span>Status</span>
              <SortBtn label="Comenzi"        field="orders" sortBy={sortBy} onSort={toggleSort} />
              <SortBtn label="Total cheltuit" field="spent"  sortBy={sortBy} onSort={toggleSort} />
              <SortBtn label="Ultima comandă" field="last"   sortBy={sortBy} onSort={toggleSort} />
              <span />
            </div>

            {/* Rows */}
            {shown.map(c => {
              const isSelected = selected.has(c._id);
              return (
                <div
                  key={c._id}
                  className={`${styles.row} ${isSelected ? styles.rowSelected : ''}`}
                  onClick={() => nav(`/admin/clienti/${c._id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && nav(`/admin/clienti/${c._id}`)}
                >
                  {/* Checkbox */}
                  <div className={styles.checkCell}>
                    <Checkbox
                      checked={isSelected}
                      indeterminate={false}
                      onChange={() => {}}
                      onClick={e => toggleOne(c._id, e)}
                    />
                  </div>

                  {/* Star */}
                  <div className={styles.starCell}>
                    {c.loyal && <span className={styles.starIco}>{IcoStar}</span>}
                  </div>

                  {/* Client: avatar + name + one contact */}
                  <div className={styles.clientCell}>
                    <div className={styles.avatar} style={{ background: avatarColor(c.name) }}>
                      {initials(c.name)}
                    </div>
                    <div className={styles.clientInfo}>
                      <span className={styles.clientName}>{c.name}</span>
                      <span className={styles.clientSub}>{c.email}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div><StatusBadge c={c} /></div>

                  {/* Orders count */}
                  <div className={styles.ordersCell}>
                    <span className={styles.ordersNum}>{c.orders || 0}</span>
                    <span className={styles.ordersLbl}>{c.orders === 1 ? 'comandă' : 'comenzi'}</span>
                  </div>

                  {/* Total */}
                  <div className={styles.totalCell}>
                    <span className={styles.totalAmt}>{fmt(c.spent || 0)}</span>
                    <span className={styles.totalCur}>RON</span>
                  </div>

                  {/* Last order */}
                  <div className={styles.dateCell}>
                    {c.lastOrder ? fmtDate(c.lastOrder) : '—'}
                  </div>

                  {/* 3-dot menu */}
                  <RowMenu customer={c} onOpen={() => nav(`/admin/clienti/${c._id}`)} />
                </div>
              );
            })}
          </div>
        )
      }

      {/* ── Pagination ── */}
      {visible < sorted.length && (
        <div className={styles.loadMoreRow}>
          <button className={styles.loadMore} onClick={() => setVisible(v => v + PAGE)}>
            Încarcă mai mulți ({sorted.length - visible} rămași)
          </button>
          <span className={styles.paginationInfo}>{Math.min(visible, sorted.length)} / {sorted.length}</span>
        </div>
      )}

      {/* ── Mobile cards ── */}
      <div className={styles.mobileList}>
        {shown.map(c => (
          <div key={c._id} className={`${styles.mobileCard} ${selected.has(c._id) ? styles.mobileCardSel : ''}`}>
            <div className={styles.mobileCb} onClick={e => { e.stopPropagation(); toggleOne(c._id, e); }}>
              <Checkbox
                checked={selected.has(c._id)}
                indeterminate={false}
                onChange={() => {}}
                onClick={e => toggleOne(c._id, e)}
              />
            </div>
            <div className={styles.avatar} style={{ background: avatarColor(c.name) }} onClick={() => nav(`/admin/clienti/${c._id}`)}>
              {initials(c.name)}
            </div>
            <div className={styles.mobileBody} onClick={() => nav(`/admin/clienti/${c._id}`)}>
              <div className={styles.mobileTop}>
                <span className={styles.clientName}>
                  {c.loyal && <span className={styles.starIco} style={{marginRight:4}}>{IcoStar}</span>}
                  {c.name}
                </span>
                <strong className={styles.totalAmt}>{fmt(c.spent || 0)} <span className={styles.totalCur}>RON</span></strong>
              </div>
              <span className={styles.clientSub}>{c.email}</span>
              <div className={styles.mobileMeta}>
                <StatusBadge c={c} />
                <span className={styles.dot2}>·</span>
                <span>{c.orders || 0} comenzi</span>
                {c.lastOrder && <><span className={styles.dot2}>·</span><span>{fmtDate(c.lastOrder)}</span></>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
