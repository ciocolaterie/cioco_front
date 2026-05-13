import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listOrders } from '../../services/orders.service.js';
import api from '../../services/api.js';
import Spinner from '../../components/ui/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { STATUS_LABEL, fmt, fmtDateTime } from '../../utils/format.js';
import styles from './OrdersPage.module.css';

const STATUSES = [
  { v: 'all', l: 'Toate' },
  { v: 'noua', l: 'Noi' },
  { v: 'in_pregatire', l: 'În pregătire' },
  { v: 'gata', l: 'Gata' },
  { v: 'livrata', l: 'Livrate' },
  { v: 'anulata', l: 'Anulate' },
];

const exportCSV = async () => {
  const res = await api.get('/admin/export-orders', { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'comenzi.csv';
  a.click();
  URL.revokeObjectURL(url);
};

const PAGE = 20;

export default function OrdersPage() {
  const [allOrders, setAllOrders] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [visible, setVisible] = useState(PAGE);

  useEffect(() => {
    listOrders()
      .then(setAllOrders)
      .catch(() => setAllOrders([]));
  }, []);

  const q = search.trim().toLowerCase();
  const byStatus = filter === 'all' ? (allOrders || []) : (allOrders || []).filter((o) => o.status === filter);
  const filtered = q
    ? byStatus.filter((o) =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.customer.name?.toLowerCase().includes(q) ||
        o.customer.email?.toLowerCase().includes(q) ||
        o.customer.phone?.toLowerCase().includes(q)
      )
    : byStatus;
  const countFor = (v) => v === 'all' ? (allOrders?.length || 0) : (allOrders || []).filter((o) => o.status === v).length;
  const shown = filtered.slice(0, visible);

  return (
    <div>
      <header className={styles.head}>
        <div>
          <h1>Comenzi</h1>
          <p>{allOrders ? `${allOrders.length} comenzi în total` : ''}</p>
        </div>
        <button className={styles.exportBtn} onClick={exportCSV}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            className={styles.searchInput}
            value={search}
            onChange={e => { setSearch(e.target.value); setVisible(PAGE); }}
            placeholder="Caută după client, email, telefon, #comandă…"
          />
          {search && <button type="button" className={styles.searchClear} onClick={() => setSearch('')}>×</button>}
        </div>
      </div>

      <div className={styles.tabs}>
        {STATUSES.map(({ v, l }) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`${styles.tab} ${filter === v ? styles.tabActive : ''}`}
          >
            {l} <span className={styles.tabCount}>{countFor(v)}</span>
          </button>
        ))}
      </div>

      {!allOrders ? <Spinner /> :
        filtered.length === 0 ? <div className={styles.empty}>Nicio comandă pentru acest filtru.</div> :
        <>
          <div className={styles.table}>
            <div className={styles.theader}>
              <span>ID</span>
              <span>CLIENT</span>
              <span>TELEFON</span>
              <span>TOTAL</span>
              <span>METODĂ</span>
              <span>STATUS</span>
              <span>ACȚIUNI</span>
            </div>
            {shown.map((o) => (
              <div key={o._id} className={`${styles.row} ${o.status === 'noua' ? styles.rowNew : ''}`}>
                <span className={styles.no}>{o.orderNumber}</span>
                <div>
                  <div className={styles.clientName}>{o.customer.name}</div>
                  <div className={styles.clientEmail}>{o.customer.email}</div>
                </div>
                <span className={styles.phone}>{o.customer.phone}</span>
                <strong className={styles.total}>{fmt(o.total)} RON</strong>
                <span className={styles.method}>
                  {o.method === 'livrare'
                    ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> Livrare</>
                    : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> Ridicare</>
                  }
                </span>
                <Badge variant={o.status}>{STATUS_LABEL[o.status]}</Badge>
                <Link to={`/admin/comenzi/${o._id}`} className={styles.detailBtn}>
                  Detalii →
                </Link>
              </div>
            ))}
          </div>
          {filtered.length > visible && (
            <button className={styles.loadMore} onClick={() => setVisible(v => v + PAGE)}>
              Mai multe ({filtered.length - visible} rămase)
            </button>
          )}
        </>
      }
    </div>
  );
}
