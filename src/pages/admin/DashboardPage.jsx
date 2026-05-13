import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as adminApi from '../../services/admin.service.js';
import { listOrders } from '../../services/orders.service.js';
import Spinner from '../../components/ui/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { STATUS_LABEL, fmt, fmtDateTime } from '../../utils/format.js';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('today');
  const [stats, setStats] = useState(null);
  const [top, setTop] = useState([]);
  const [chart, setChart] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    setStats(null);
    Promise.all([
      adminApi.stats(period),
      adminApi.topProducts(period),
      adminApi.weekChart(),
      listOrders({ limit: 5 }),
    ]).then(([s, t, c, o]) => {
      setStats(s); setTop(t); setChart(c); setRecent(o);
    }).catch(() => {
      setStats({ revenue: 0, orders: 0, newCustomers: 0, avgOrder: 0 });
    });
  }, [period]);

  const maxChart = Math.max(...chart.map((c) => c.revenue), 1);
  const newOrders = recent.filter((o) => o.status === 'noua').length;

  const trend = (curr, prev) => {
    if (!prev && prev !== 0) return null;
    if (prev === 0) return curr > 0 ? { label: '+∞%', up: true } : null;
    const pct = ((curr - prev) / prev) * 100;
    return { label: `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`, up: pct >= 0 };
  };

  return (
    <div>
      <header className={styles.head}>
        <div>
          <h1>Dashboard</h1>
          <p>Bun venit, {user?.name?.split(' ')[0] || 'Admin'}.{newOrders > 0 ? ` ${newOrders} comenzi noi de procesat.` : ''}</p>
        </div>
        <div className={styles.tabs}>
          {[['today', 'Azi'], ['week', 'Săptămâna'], ['month', 'Luna']].map(([v, l]) => (
            <button key={v} onClick={() => setPeriod(v)} className={period === v ? styles.active : ''}>{l}</button>
          ))}
        </div>
      </header>

      {!stats ? <Spinner /> : (
        <>
          <div className={styles.kpis}>
            <KPI label="VÂNZĂRI" value={`${fmt(stats.revenue)} RON`} trend={trend(stats.revenue, stats.prev?.revenue)} />
            <KPI label="COMENZI" value={stats.orders} trend={trend(stats.orders, stats.prev?.orders)} />
            <KPI label="CLIENȚI NOI" value={stats.newCustomers} trend={trend(stats.newCustomers, stats.prev?.newCustomers)} />
            <KPI label="VALOARE MEDIE" value={`${fmt(stats.avgOrder)} RON`} trend={trend(stats.avgOrder, stats.prev?.avgOrder)} />
          </div>

          <div className={styles.grid}>
            <section className={styles.card}>
              <h3>Vânzări săptămânale</h3>
              <div className={styles.cardSub}>Ultimele 7 zile</div>
              <div className={styles.chart}>
                {chart.length === 0
                  ? <div className={styles.empty}>Niciun venit înregistrat încă.</div>
                  : chart.map((c) => {
                    const day = new Date(c._id).toLocaleDateString('ro-RO', { weekday: 'short' });
                    return (
                      <div key={c._id} className={styles.bar}>
                        <span className={styles.barValue}>{c.revenue > 0 ? c.revenue : ''}</span>
                        <div className={styles.barFill} style={{ height: `${(c.revenue / maxChart) * 100}%` }} />
                        <div className={styles.barLabel}>{day.charAt(0).toUpperCase()}</div>
                      </div>
                    );
                  })
                }
              </div>
            </section>

            <section className={styles.card}>
              <h3>Top produse</h3>
              <div className={styles.cardSub}>Luna aceasta</div>
              {top.length === 0
                ? <div className={styles.empty}>Niciun produs vândut încă.</div>
                : <div className={styles.topList}>
                  {top.map((t, i) => (
                    <div key={t._id} className={styles.topRow}>
                      <span className={styles.topRank}>{String(i + 1).padStart(2, '0')}</span>
                      <span className={styles.topName}>{t.name}</span>
                      <span className={styles.topSold}>{t.sales} vândute</span>
                      <strong>{fmt(t.revenue)} RON</strong>
                    </div>
                  ))}
                </div>
              }
            </section>
          </div>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h3>Comenzi recente</h3>
              <Link to="/admin/comenzi">Vezi toate →</Link>
            </div>
            <div className={styles.cardSub} style={{ marginBottom: 0 }} />
            {recent.length === 0
              ? <div className={styles.empty}>Nicio comandă plasată încă.</div>
              : <div className={styles.recentList}>
                {recent.map((o) => (
                  <Link key={o._id} to={`/admin/comenzi/${o._id}`} className={styles.recentRow}>
                    <span className={styles.recentNo}>{o.orderNumber}</span>
                    <span>{o.customer.name}</span>
                    <span className={styles.recentDate}>{fmtDateTime(o.createdAt)}</span>
                    <Badge variant={o.status}>{STATUS_LABEL[o.status]}</Badge>
                    <strong>{fmt(o.total)} RON</strong>
                  </Link>
                ))}
              </div>
            }
          </section>
        </>
      )}
    </div>
  );
}

function KPI({ label, value, trend }) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue}>{value}</div>
      {trend && (
        <div className={`${styles.kpiTrend} ${trend.up ? styles.up : styles.down}`}>
          <span>{trend.up ? '↗' : '↘'} {trend.label}</span>
          <span style={{ color: 'var(--ink-3)', marginLeft: 4 }}>vs anterior</span>
        </div>
      )}
    </div>
  );
}
