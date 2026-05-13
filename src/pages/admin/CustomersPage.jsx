import { useEffect, useState } from 'react';
import { listCustomers, exportCustomers } from '../../services/admin.service.js';
import Spinner from '../../components/ui/Spinner.jsx';
import { fmt, fmtDate } from '../../utils/format.js';
import styles from './CustomersPage.module.css';

function initials(name) {
  return (name || '').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

const PAGE = 20;

export default function CustomersPage() {
  const [list, setList] = useState(null);
  const [search, setSearch] = useState('');
  const [visible, setVisible] = useState(PAGE);
  useEffect(() => { listCustomers().then(setList); }, []);
  if (!list) return <Spinner />;

  const totalRevenue = list.reduce((s, c) => s + (c.spent || 0), 0);
  const avgRevenue = list.length ? totalRevenue / list.length : 0;
  const avgOrders = list.length ? list.reduce((s, c) => s + (c.orders || 0), 0) / list.length : 0;
  const withOrders = list.filter(c => c.orders > 0).length;

  const q = search.trim().toLowerCase();
  const filtered = q
    ? list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
      )
    : list;
  const shown = filtered.slice(0, visible);

  return (
    <div>
      <header className={styles.head}>
        <div>
          <h1>Clienți</h1>
          <p>{list.length} clienți înregistrați · {withOrders} cu comenzi</p>
        </div>
        <button className={styles.exportBtn} onClick={exportCustomers}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV
        </button>
      </header>

      <div className={styles.kpis}>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>TOTAL CLIENȚI</div>
          <div className={styles.kpiValue}>{list.length}</div>
          <div className={styles.kpiSub}>{withOrders} au plasat cel puțin o comandă</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>VALOARE MEDIE / CLIENT</div>
          <div className={styles.kpiValue}>{fmt(avgRevenue)} RON</div>
          <div className={styles.kpiSub}>total cheltuit: {fmt(totalRevenue)} RON</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiLabel}>COMENZI MEDII</div>
          <div className={styles.kpiValue}>{avgOrders.toFixed(1)}</div>
          <div className={styles.kpiSub}>per client înregistrat</div>
        </div>
      </div>

      <div className={styles.searchBar}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          className={styles.searchInput}
          value={search}
          onChange={e => { setSearch(e.target.value); setVisible(PAGE); }}
          placeholder="Caută după nume, email sau telefon…"
        />
        {search && <button type="button" className={styles.searchClear} onClick={() => setSearch('')}>×</button>}
      </div>

      {list.length === 0
        ? <div className={styles.empty}>Niciun client înregistrat încă.</div>
        : filtered.length === 0
        ? <div className={styles.empty}>Niciun client găsit pentru „{search}".</div>
        : <>
          <div className={styles.table}>
            <div className={styles.theader}>
              <span>CLIENT</span>
              <span>CONTACT</span>
              <span>COMENZI</span>
              <span>TOTAL CHELTUIT</span>
              <span>ULTIMA COMANDĂ</span>
            </div>
            {shown.map((c) => (
              <div key={c._id} className={styles.row}>
                <div className={styles.clientInfo}>
                  <div className={styles.avatar}>{initials(c.name)}</div>
                  <span className={styles.clientName}>{c.name}</span>
                </div>
                <div>
                  <div className={styles.email}>{c.email}</div>
                  <div className={styles.phone}>{c.phone || '—'}</div>
                </div>
                <span className={styles.orders}>{c.orders}</span>
                <strong className={styles.spent}>{fmt(c.spent)} <span className={styles.ron}>RON</span></strong>
                <span className={styles.date}>{c.lastOrder ? fmtDate(c.lastOrder) : '—'}</span>
              </div>
            ))}
          </div>
          {filtered.length > visible && (
            <button className={styles.loadMore} onClick={() => setVisible(v => v + PAGE)}>
              Mai mulți clienți ({filtered.length - visible} rămași)
            </button>
          )}
        </>
      }
    </div>
  );
}
