import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as adminApi from '../../services/admin.service.js';
import { listOrders } from '../../services/orders.service.js';
import Spinner from '../../components/ui/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { STATUS_LABEL, fmt, fmtDateTime } from '../../utils/format.js';
import styles from './DashboardPage.module.css';

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
      listOrders({ limit: 6 }),
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
          <div className={styles.titleRow}>
            <h1>Dashboard</h1>
            {newOrders > 0 && (
              <span className={styles.newOrdersBadge}>
                {newOrders} {newOrders === 1 ? 'comandă nouă' : 'comenzi noi'}
              </span>
            )}
          </div>
          <p>Bun venit, {user?.name?.split(' ')[0] || 'Admin'}.</p>
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
            <KPI label="Vânzări" value={`${fmt(stats.revenue)} RON`} trend={trend(stats.revenue, stats.prev?.revenue)} primary />
            <KPI label="Comenzi" value={stats.orders} trend={trend(stats.orders, stats.prev?.orders)} />
            <KPI label="Clienți noi" value={stats.newCustomers} trend={trend(stats.newCustomers, stats.prev?.newCustomers)} />
            <KPI label="Valoare medie" value={`${fmt(stats.avgOrder)} RON`} trend={trend(stats.avgOrder, stats.prev?.avgOrder)} />
          </div>

          <div className={styles.grid}>
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <div>
                  <h3>Vânzări săptămânale</h3>
                  <div className={styles.cardSub}>Ultimele 7 zile</div>
                </div>
                {chart.length > 0 && (
                  <span className={styles.chartTotal}>
                    {fmt(chart.reduce((s, c) => s + c.revenue, 0))} RON total
                  </span>
                )}
              </div>
              {chart.length === 0
                ? <div className={styles.empty}>Niciun venit înregistrat încă.</div>
                : <AreaChart data={chart} maxValue={maxChart} />
              }
            </section>

            <section className={styles.card}>
              <h3>Top produse</h3>
              <div className={styles.cardSub}>Luna aceasta</div>
              {top.length === 0
                ? <div className={styles.empty}>Niciun produs vândut încă.</div>
                : <div className={styles.topList}>
                  {top.map((t, i) => {
                    const maxRev = top[0]?.revenue || 1;
                    const pct = Math.round((t.revenue / maxRev) * 100);
                    return (
                      <div key={t._id} className={styles.topRow}>
                        <span className={styles.topRank}>{String(i + 1).padStart(2, '0')}</span>
                        <div className={styles.topInfo}>
                          <div className={styles.topName}>{t.name}</div>
                          <div className={styles.topBarWrap}>
                            <div className={styles.topBarFill} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className={styles.topMeta}>
                          <span className={styles.topSold}>{t.sales} buc.</span>
                          <span className={styles.topRevenue}>{fmt(t.revenue)} RON</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              }
            </section>
          </div>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h3>Comenzi recente</h3>
                <div className={styles.cardSub}>Activitate recentă</div>
              </div>
              <Link to="/admin/comenzi" className={styles.seeAll}>
                Vezi toate
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </Link>
            </div>
            {recent.length === 0
              ? <div className={styles.empty}>Nicio comandă plasată încă.</div>
              : <div className={styles.recentList}>
                {recent.map((o) => {
                  const initials = o.customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <Link key={o._id} to={`/admin/comenzi/${o._id}`} className={styles.recentRow}>
                      <div className={styles.recentAvatar} style={{ background: avatarColor(o.customer.name) }}>
                        {initials}
                      </div>
                      <div className={styles.recentMain}>
                        <span className={styles.recentName}>{o.customer.name}</span>
                        <span className={styles.recentNo}>{o.orderNumber}</span>
                      </div>
                      <span className={styles.recentTime}>{timeAgo(o.createdAt)}</span>
                      <Badge variant={o.status}>{STATUS_LABEL[o.status]}</Badge>
                      <strong className={styles.recentTotal}>{fmt(o.total)} RON</strong>
                      <svg className={styles.recentArrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </Link>
                  );
                })}
              </div>
            }
          </section>
        </>
      )}
    </div>
  );
}

/* ── KPI card ── */
function KPI({ label, value, trend, primary }) {
  return (
    <div className={`${styles.kpi} ${primary ? styles.kpiPrimary : ''}`}>
      <div className={styles.kpiTop}>
        <div className={styles.kpiLabel}>{label}</div>
        {trend && (
          <span className={`${styles.trendPill} ${trend.up ? styles.pillUp : styles.pillDown}`}>
            {trend.up ? '↑' : '↓'} {trend.label}
          </span>
        )}
      </div>
      <div className={styles.kpiValue}>{value}</div>
      <div className={styles.kpiSub}>{trend ? 'față de anterior' : ''}</div>
    </div>
  );
}

/* ── Area chart — pure SVG, no library ── */
function AreaChart({ data, maxValue }) {
  const [hovered, setHovered] = useState(null);

  const VW = 600, VH = 120;

  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * VW,
    y: VH - Math.max((d.revenue / maxValue) * VH, 2),
    revenue: d.revenue,
    _id: d._id,
  }));

  const linePath = pts.map((p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cx = ((prev.x + p.x) / 2).toFixed(1);
    return `C ${cx} ${prev.y.toFixed(1)} ${cx} ${p.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }).join(' ');

  const areaPath = `${linePath} L ${pts.at(-1).x} ${VH} L 0 ${VH} Z`;

  return (
    <div className={styles.areaWrap} onMouseLeave={() => setHovered(null)}>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="none"
        className={styles.areaSvg}
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7B3D1D" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#7B3D1D" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map(p => (
          <line key={p}
            x1="0" y1={VH * (1 - p)} x2={VW} y2={VH * (1 - p)}
            stroke="rgba(28,20,16,.06)" strokeWidth="1" strokeDasharray="5 4"
          />
        ))}

        <path d={areaPath} fill="url(#areaGrad)" />
        <path d={linePath} fill="none" stroke="#7B3D1D" strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round" />

        {hovered !== null && (
          <line
            x1={pts[hovered].x} y1="0" x2={pts[hovered].x} y2={VH}
            stroke="rgba(28,20,16,.13)" strokeWidth="1.5"
          />
        )}

        {pts.map((p, i) => (
          <circle key={i}
            cx={p.x} cy={p.y}
            r={hovered === i ? 5 : 3.5}
            fill={hovered === i ? '#7B3D1D' : 'var(--bg-2)'}
            stroke="#7B3D1D" strokeWidth="2"
            onMouseEnter={() => setHovered(i)}
            style={{ cursor: 'default' }}
          />
        ))}
      </svg>

      <div className={styles.xAxis}>
        {pts.map((p, i) => {
          const day = new Date(p._id).toLocaleDateString('ro-RO', { weekday: 'short' });
          return (
            <span
              key={i}
              className={`${styles.xLabel} ${hovered === i ? styles.xLabelActive : ''}`}
              style={{ left: `${(p.x / VW) * 100}%` }}
              onMouseEnter={() => setHovered(i)}
            >
              {day.slice(0, 2)}
            </span>
          );
        })}
      </div>

      {hovered !== null && (
        <div className={styles.areaTooltip} style={{ left: `${(pts[hovered].x / VW) * 100}%` }}>
          <span className={styles.areaTooltipVal}>{fmt(pts[hovered].revenue)} RON</span>
          <span className={styles.areaTooltipDay}>
            {new Date(pts[hovered]._id).toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>
      )}
    </div>
  );
}
