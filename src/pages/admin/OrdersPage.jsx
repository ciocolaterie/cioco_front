import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listOrders } from '../../services/orders.service.js';
import api from '../../services/api.js';
import Spinner from '../../components/ui/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { STATUS_LABEL, fmt } from '../../utils/format.js';
import styles from './OrdersPage.module.css';

/* ── helpers ── */
const AVATAR_COLORS = ['#7B3D1D','#2D6A4F','#6B2737','#1D3557','#744210','#5C3317','#065F46'];
function avatarColor(name = '') {
  const n = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 2) return 'acum';
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  if (d === 1) return 'ieri';
  return `${d}z`;
}
function fmtOrderDate(dateStr) {
  const dt = new Date(dateStr);
  return {
    date: dt.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' }),
    time: dt.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
  };
}

const STATUSES = [
  { v: 'all',          l: 'Toate' },
  { v: 'noua',         l: 'Noi' },
  { v: 'in_pregatire', l: 'În pregătire' },
  { v: 'gata',         l: 'Gata' },
  { v: 'livrata',      l: 'Livrate' },
  { v: 'anulata',      l: 'Anulate' },
];

const exportCSV = async () => {
  const res = await api.get('/admin/export-orders', { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url; a.download = 'comenzi.csv'; a.click();
  URL.revokeObjectURL(url);
};

const PAGE = 20;

/* ── sort header ── */
function SortHead({ label, field, sortBy, onSort }) {
  const active = sortBy.startsWith(field);
  const asc = sortBy === `${field}_asc`;
  return (
    <button
      className={`${styles.sortHead} ${active ? styles.sortActive : ''}`}
      onClick={() => onSort(field)}
    >
      {label}
      <svg className={styles.sortIcon} width="10" height="10" viewBox="0 0 10 14" fill="none">
        <path d="M5 0 L5 14 M1 4 L5 0 L9 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={active && asc ? 1 : 0.3}/>
        <path d="M1 10 L5 14 L9 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={active && !asc ? 1 : 0.3}/>
      </svg>
    </button>
  );
}

/* ── delivery / pickup icon ── */
const DELIVERY_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);
const PICKUP_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const CHEVRON_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

export default function OrdersPage() {
  const [allOrders, setAllOrders] = useState(null);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [visible, setVisible]   = useState(PAGE);
  const [sortBy, setSortBy]     = useState('date_desc');

  useEffect(() => {
    listOrders().then(setAllOrders).catch(() => setAllOrders([]));
  }, []);

  const toggleSort = (field) =>
    setSortBy(prev => prev === `${field}_desc` ? `${field}_asc` : `${field}_desc`);

  const q         = search.trim().toLowerCase();
  const byStatus  = filter === 'all' ? (allOrders || []) : (allOrders || []).filter(o => o.status === filter);
  const bySearch  = q
    ? byStatus.filter(o =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.customer.name?.toLowerCase().includes(q) ||
        o.customer.email?.toLowerCase().includes(q) ||
        o.customer.phone?.toLowerCase().includes(q)
      )
    : byStatus;

  const sorted = [...bySearch].sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'date_asc')  return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'total_desc') return b.total - a.total;
    if (sortBy === 'total_asc')  return a.total - b.total;
    return 0;
  });

  const countFor = (v) => v === 'all' ? (allOrders?.length || 0) : (allOrders || []).filter(o => o.status === v).length;
  const shown    = sorted.slice(0, visible);

  return (
    <div>
      <header className={styles.head}>
        <div>
          <h1>Comenzi</h1>
          <p>{allOrders
            ? `${sorted.length === allOrders.length ? allOrders.length : `${sorted.length} din ${allOrders.length}`} comenzi`
            : ''
          }</p>
        </div>
        <button className={styles.exportBtn} onClick={exportCSV}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span className={styles.exportBtnText}>Export CSV</span>
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={styles.searchInput}
            value={search}
            onChange={e => { setSearch(e.target.value); setVisible(PAGE); }}
            placeholder="Caută după client, email, telefon, #comandă…"
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
        {STATUSES.map(({ v, l }) => (
          <button
            key={v}
            onClick={() => { setFilter(v); setVisible(PAGE); }}
            className={`${styles.tab} ${filter === v ? styles.tabActive : ''}`}
          >
            {l}
            <span className={styles.tabCount}>{countFor(v)}</span>
          </button>
        ))}
      </div>

      {!allOrders ? <Spinner /> : sorted.length === 0
        ? <div className={styles.empty}>Nicio comandă pentru acest filtru.</div>
        : <>
          {/* ── Desktop table ── */}
          <div className={styles.tableWrap}>
            <div className={styles.table}>
              <div className={styles.theader}>
                <span>Comandă</span>
                <span>Client</span>
                <SortHead label="Data" field="date" sortBy={sortBy} onSort={toggleSort} />
                <span>Metodă</span>
                <SortHead label="Total" field="total" sortBy={sortBy} onSort={toggleSort} />
                <span>Status</span>
              </div>

              {shown.map((o) => {
                const initials = o.customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                const { date, time } = fmtOrderDate(o.createdAt);
                return (
                  <Link
                    key={o._id}
                    to={`/admin/comenzi/${o._id}`}
                    className={`${styles.row} ${o.status === 'noua' ? styles.rowNew : ''}`}
                  >
                    <div className={styles.orderNo}>
                      {o.status === 'noua' && <span className={styles.newDot} />}
                      {o.orderNumber}
                    </div>

                    <div className={styles.clientCell}>
                      <div className={styles.clientAvatar} style={{ background: avatarColor(o.customer.name) }}>
                        {initials}
                      </div>
                      <div>
                        <div className={styles.clientName}>{o.customer.name}</div>
                        <div className={styles.clientEmail}>{o.customer.email}</div>
                      </div>
                    </div>

                    <div className={styles.dateCell}>
                      <span className={styles.dateDay}>{date}</span>
                      <span className={styles.dateTime}>{time}</span>
                    </div>

                    <span className={styles.method}>
                      {o.method === 'livrare' ? DELIVERY_ICON : PICKUP_ICON}
                      {o.method === 'livrare' ? 'Livrare' : 'Ridicare'}
                    </span>

                    <strong className={styles.total}>{fmt(o.total)} RON</strong>

                    <Badge variant={o.status}>{STATUS_LABEL[o.status]}</Badge>

                    <span className={styles.rowChevron}>{CHEVRON_ICON}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── Mobile cards ── */}
          <div className={styles.mobileList}>
            {shown.map((o) => {
              const initials = o.customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              return (
                <Link
                  key={o._id}
                  to={`/admin/comenzi/${o._id}`}
                  className={`${styles.mobileCard} ${o.status === 'noua' ? styles.mobileCardNew : ''}`}
                >
                  <div className={styles.clientAvatar} style={{ background: avatarColor(o.customer.name) }}>
                    {initials}
                  </div>
                  <div className={styles.mobileBody}>
                    <div className={styles.mobileTop}>
                      <span className={styles.mobileName}>{o.customer.name}</span>
                      <strong className={styles.mobileTotal}>{fmt(o.total)} RON</strong>
                    </div>
                    <div className={styles.mobileMid}>
                      <span className={styles.mobileNo}>{o.orderNumber}</span>
                      <span className={styles.mobileDot}>·</span>
                      <span className={styles.mobileTime}>{timeAgo(o.createdAt)}</span>
                      <span className={styles.mobileDot}>·</span>
                      <span className={styles.mobileMethod}>
                        {o.method === 'livrare' ? 'Livrare' : 'Ridicare'}
                      </span>
                    </div>
                    <div className={styles.mobileBadge}>
                      <Badge variant={o.status}>{STATUS_LABEL[o.status]}</Badge>
                    </div>
                  </div>
                  <span className={styles.mobileChevron}>{CHEVRON_ICON}</span>
                </Link>
              );
            })}
          </div>

          {/* ── Pagination ── */}
          <div className={styles.pagination}>
            {visible < sorted.length && (
              <button className={styles.loadMore} onClick={() => setVisible(v => v + PAGE)}>
                Încarcă mai multe
              </button>
            )}
            <span className={styles.paginationInfo}>
              {Math.min(visible, sorted.length)} din {sorted.length} comenzi
            </span>
          </div>
        </>
      }
    </div>
  );
}
