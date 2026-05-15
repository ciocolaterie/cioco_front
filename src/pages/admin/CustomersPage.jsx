import { useEffect, useState } from 'react';
import { listCustomers, exportCustomers } from '../../services/admin.service.js';
import Spinner from '../../components/ui/Spinner.jsx';
import { fmt, fmtDate } from '../../utils/format.js';
import styles from './CustomersPage.module.css';

const PAGE = 20;

const AVATAR_COLORS = ['#7B3D1D','#2D6A4F','#6B2737','#1D3557','#744210','#5C3317','#065F46'];
function avatarColor(name = '') {
  const n = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}
function initials(name = '') {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}
function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'azi';
  if (d === 1) return 'ieri';
  if (d < 30) return `${d}z`;
  const m = Math.floor(d / 30);
  if (m < 12) return `${m} luni`;
  return `${Math.floor(m / 12)}a`;
}

const FILTERS = [
  { v: 'all',     l: 'Toți' },
  { v: 'active',  l: 'Cu comenzi' },
  { v: 'inactive',l: 'Fără comenzi' },
];

function SortHead({ label, field, sortBy, onSort }) {
  const active = sortBy.startsWith(field);
  const asc    = sortBy === `${field}_asc`;
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

export default function CustomersPage() {
  const [list, setList]     = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('spent_desc');
  const [visible, setVisible] = useState(PAGE);

  useEffect(() => { listCustomers().then(setList); }, []);
  if (!list) return <Spinner />;

  const totalRevenue = list.reduce((s, c) => s + (c.spent || 0), 0);
  const avgRevenue   = list.length ? totalRevenue / list.length : 0;
  const avgOrders    = list.length ? list.reduce((s, c) => s + (c.orders || 0), 0) / list.length : 0;
  const withOrders   = list.filter(c => c.orders > 0).length;

  const toggleSort = (field) =>
    setSortBy(prev => prev === `${field}_desc` ? `${field}_asc` : `${field}_desc`);

  const q = search.trim().toLowerCase();
  const byFilter = filter === 'all'     ? list
    : filter === 'active'  ? list.filter(c => c.orders > 0)
    : list.filter(c => !c.orders);
  const bySearch = q
    ? byFilter.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
      )
    : byFilter;

  const sorted = [...bySearch].sort((a, b) => {
    if (sortBy === 'spent_desc')  return (b.spent || 0) - (a.spent || 0);
    if (sortBy === 'spent_asc')   return (a.spent || 0) - (b.spent || 0);
    if (sortBy === 'orders_desc') return (b.orders || 0) - (a.orders || 0);
    if (sortBy === 'orders_asc')  return (a.orders || 0) - (b.orders || 0);
    if (sortBy === 'last_desc')   return new Date(b.lastOrder || 0) - new Date(a.lastOrder || 0);
    if (sortBy === 'last_asc')    return new Date(a.lastOrder || 0) - new Date(b.lastOrder || 0);
    return 0;
  });
  const shown = sorted.slice(0, visible);

  const countFor = (v) => v === 'all' ? list.length
    : v === 'active' ? withOrders
    : list.length - withOrders;

  return (
    <div>
      <header className={styles.head}>
        <div>
          <h1>Clienți</h1>
          <p>{list.length} înregistrați · {withOrders} cu comenzi</p>
        </div>
        <button className={styles.exportBtn} onClick={exportCustomers}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span className={styles.exportBtnText}>Export CSV</span>
        </button>
      </header>

      <div className={styles.kpis}>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Total clienți</div>
          <div className={styles.kpiValue}>{list.length}</div>
          <div className={styles.kpiSub}>{withOrders} au plasat cel puțin o comandă</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Valoare medie / client</div>
          <div className={styles.kpiValue}>{fmt(avgRevenue)} <span className={styles.kpiUnit}>RON</span></div>
          <div className={styles.kpiSub}>total: {fmt(totalRevenue)} RON</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>Comenzi medii</div>
          <div className={styles.kpiValue}>{avgOrders.toFixed(1)}</div>
          <div className={styles.kpiSub}>per client înregistrat</div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={styles.searchInput}
            value={search}
            onChange={e => { setSearch(e.target.value); setVisible(PAGE); }}
            placeholder="Caută după nume, email sau telefon…"
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
        {FILTERS.map(({ v, l }) => (
          <button
            key={v}
            className={`${styles.tab} ${filter === v ? styles.tabActive : ''}`}
            onClick={() => { setFilter(v); setVisible(PAGE); }}
          >
            {l} <span className={styles.tabCount}>{countFor(v)}</span>
          </button>
        ))}
      </div>

      {list.length === 0
        ? <div className={styles.empty}>Niciun client înregistrat încă.</div>
        : sorted.length === 0
        ? <div className={styles.empty}>Niciun client găsit.</div>
        : <>
          {/* Desktop table */}
          <div className={styles.tableWrap}>
            <div className={styles.table}>
              <div className={styles.theader}>
                <span>Client</span>
                <span>Contact</span>
                <SortHead label="Comenzi"  field="orders" sortBy={sortBy} onSort={toggleSort} />
                <SortHead label="Cheltuit" field="spent"  sortBy={sortBy} onSort={toggleSort} />
                <SortHead label="Ultima comandă" field="last" sortBy={sortBy} onSort={toggleSort} />
              </div>
              {shown.map(c => (
                <div key={c._id} className={styles.row}>
                  <div className={styles.clientCell}>
                    <div className={styles.avatar} style={{ background: avatarColor(c.name) }}>
                      {initials(c.name)}
                    </div>
                    <div>
                      <div className={styles.clientName}>{c.name}</div>
                      {c.orders === 0 && <span className={styles.noBadge}>Nicio comandă</span>}
                    </div>
                  </div>
                  <div>
                    <div className={styles.email}>{c.email}</div>
                    <div className={styles.phone}>{c.phone || '—'}</div>
                  </div>
                  <span className={styles.ordersVal}>{c.orders || 0}</span>
                  <strong className={styles.spent}>
                    {fmt(c.spent || 0)} <span className={styles.ron}>RON</span>
                  </strong>
                  <span className={styles.date}>
                    {c.lastOrder ? fmtDate(c.lastOrder) : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile cards */}
          <div className={styles.mobileList}>
            {shown.map(c => (
              <div key={c._id} className={styles.mobileCard}>
                <div className={styles.avatar} style={{ background: avatarColor(c.name) }}>
                  {initials(c.name)}
                </div>
                <div className={styles.mobileBody}>
                  <div className={styles.mobileTop}>
                    <span className={styles.mobileName}>{c.name}</span>
                    <strong className={styles.mobileSpent}>{fmt(c.spent || 0)} RON</strong>
                  </div>
                  <div className={styles.mobileEmail}>{c.email}</div>
                  <div className={styles.mobileMeta}>
                    <span>{c.orders || 0} {c.orders === 1 ? 'comandă' : 'comenzi'}</span>
                    {c.lastOrder && <>
                      <span className={styles.mobileDot}>·</span>
                      <span>{timeAgo(c.lastOrder)}</span>
                    </>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.pagination}>
            {visible < sorted.length && (
              <button className={styles.loadMore} onClick={() => setVisible(v => v + PAGE)}>
                Încarcă mai mulți
              </button>
            )}
            <span className={styles.paginationInfo}>
              {Math.min(visible, sorted.length)} din {sorted.length} clienți
            </span>
          </div>
        </>
      }
    </div>
  );
}
