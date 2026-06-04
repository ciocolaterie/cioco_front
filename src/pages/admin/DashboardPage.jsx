import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as adminApi from '../../services/admin.service.js';
import { listOrders } from '../../services/orders.service.js';
import Spinner from '../../components/ui/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { STATUS_LABEL, fmt } from '../../utils/format.js';
import styles from './DashboardPage.module.css';

/* ── helpers ── */
const AVATAR_COLORS = ['#7B3D1D','#16a34a','#2563eb','#db2777','#ea580c','#0891b2','#d97706','#0f766e','#c2410c','#0284c7'];
const avatarColor = (name = '') => {
  const n = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
};
const timeAgo = (ds) => {
  const diff = Date.now() - new Date(ds).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
  if (m < 2) return 'acum'; if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`; if (d === 1) return 'ieri'; return `${d}z`;
};
const deliveryLabel = (order) => {
  const date = order.deliveryDate ? new Date(order.deliveryDate) : null;
  if (!date) return { text: 'fără dată', cls: 'neutral' };
  const diff = Math.round((date - Date.now()) / 86400000);
  if (diff < -1) return { text: `${Math.abs(diff)}z întârziat`, cls: 'danger' };
  if (diff <= 0)  return { text: 'azi', cls: 'warning' };
  if (diff === 1) return { text: 'mâine', cls: 'info' };
  return { text: `în ${diff} zile`, cls: 'neutral' };
};
const calcTrend = (curr, prev) => {
  if (prev === undefined || prev === null) return null;
  if (prev === 0) return curr > 0 ? { label: '+∞%', up: true } : null;
  const pct = ((curr - prev) / prev) * 100;
  return { label: `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`, up: pct >= 0 };
};

const SOURCE_LABEL = { online:'Online', telefon:'Telefon', whatsapp:'WhatsApp', instagram:'Instagram', fata_in_fata:'Față în față' };
const SOURCE_COLOR = { online:'#059669', telefon:'#2563EB', whatsapp:'#25D366', instagram:'#C026D3', fata_in_fata:'#D97706' };

/* ── icons ── */
const Ico = {
  chart:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  orders:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  calendar: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  star:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  users:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  bolt:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  globe:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  product:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.27 6.96 8.73 5.04 8.73-5.04"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  user:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  review:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  arrow:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  check:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  warn:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  plus:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
};

/* ═══════════════════ PAGE ═══════════════════ */
export default function DashboardPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [period, setPeriod] = useState('today');
  const [stats,       setStats]       = useState(null);
  const [top,         setTop]         = useState([]);
  const [chart,       setChart]       = useState([]);
  const [recent,      setRecent]      = useState([]);
  const [novOrders,   setNovOrders]   = useState([]);
  const [urgent,      setUrgent]      = useState([]);
  const [todayOrders, setTodayOrders] = useState([]);
  const [srcStats,    setSrcStats]    = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminApi.stats(period),
      adminApi.topProducts(period),
      adminApi.weekChart(),
      listOrders({ limit: 6 }),
      listOrders({ status: 'noua', limit: 6 }),
      adminApi.urgentOrders(),
      adminApi.todayDeliveries(),
      adminApi.sourceStats(3),
    ]).then(([s, t, c, r, nov, u, td, src]) => {
      setStats(s); setTop(t); setChart(c); setRecent(r);
      setNovOrders(nov); setUrgent(u); setTodayOrders(td); setSrcStats(src);
    }).catch(() => {
      setStats({ revenue:0, orders:0, newCustomers:0, avgOrder:0, pendingCount:0, prev:{} });
    }).finally(() => setLoading(false));
  }, [period]);

  const maxChart = Math.max(...chart.map(c => c.revenue), 1);
  const maxSrc   = Math.max(...srcStats.map(s => s.orders), 1);
  const newCount = recent.filter(o => o.status === 'noua').length;

  /* merge urgent + noua, deduplicated, urgent first */
  const urgentIds = new Set(urgent.map(o => String(o._id)));
  const actionItems = [
    ...urgent,
    ...novOrders.filter(o => !urgentIds.has(String(o._id))),
  ].slice(0, 7);

  if (loading && !stats) return <Spinner />;
  if (!stats) return null;

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <header className={styles.head}>
        <div>
          <div className={styles.titleRow}>
            <h1>Dashboard</h1>
            {newCount > 0 && (
              <span className={styles.newBadge}>
                {newCount} {newCount === 1 ? 'comandă nouă' : 'comenzi noi'}
              </span>
            )}
          </div>
          <p className={styles.headSub}>Bun venit, {user?.name?.split(' ')[0] || 'Admin'}.</p>
        </div>
        <div className={styles.headRight}>
          <div className={styles.tabs}>
            {[['today','Azi'],['week','7 zile'],['month','30 zile']].map(([v,l]) => (
              <button key={v} onClick={() => setPeriod(v)} className={period === v ? styles.tabActive : ''}>{l}</button>
            ))}
          </div>
          <button className={styles.newOrderBtn} onClick={() => nav('/admin/comenzi/nou')}>
            {Ico.plus} Comandă nouă
          </button>
        </div>
      </header>

      {/* ── KPIs ── */}
      {(() => {
        const periodLabel = period === 'today' ? 'față de ieri' : period === 'week' ? 'față de săptămâna anterioară' : 'față de luna anterioară';
        return (
          <div className={styles.kpis}>
            <KpiCard icon={Ico.chart}  label={period === 'today' ? 'Vânzări azi' : period === 'week' ? 'Vânzări 7 zile' : 'Vânzări 30 zile'}
              value={`${fmt(stats.revenue)} RON`}
              t={calcTrend(stats.revenue, stats.prev?.revenue)}
              prevLabel={stats.prev?.revenue != null ? `vs ${fmt(stats.prev.revenue)} RON ${periodLabel}` : null}
            />
            <KpiCard icon={Ico.orders} label="Comenzi"
              value={stats.orders}
              t={calcTrend(stats.orders, stats.prev?.orders)}
              prevLabel={stats.prev?.orders != null ? `vs ${stats.prev.orders} comenzi ${periodLabel}` : null}
            />
            <KpiCard icon={Ico.bolt}   label="În așteptare"
              value={stats.pendingCount ?? '—'}
              sub="noua + în pregătire"
            />
            <KpiCard icon={Ico.users}  label="Clienți noi"
              value={stats.newCustomers}
              t={calcTrend(stats.newCustomers, stats.prev?.newCustomers)}
              prevLabel={stats.prev?.newCustomers != null ? `vs ${stats.prev.newCustomers} ${periodLabel}` : null}
            />
          </div>
        );
      })()}

      {/* ── Row 2: Chart + Recent orders ── */}
      <div className={styles.row2}>
        <Card icon={Ico.chart} title="Vânzări recente" subtitle="Ultimele 7 zile"
          extra={chart.length > 0 && <span className={styles.chartExtra}>{fmt(chart.reduce((s,c) => s+c.revenue,0))} RON total</span>}
        >
          {chart.length === 0
            ? <Empty>Nicio vânzare înregistrată.</Empty>
            : <AreaChart data={chart} maxValue={maxChart} />
          }
        </Card>

        <Card icon={Ico.orders} title="Comenzi recente" subtitle="Ultimele 6 comenzi"
          action={<Link to="/admin/comenzi" className={styles.seeAll}>Toate {Ico.arrow}</Link>}
        >
          {recent.length === 0
            ? <Empty>Nicio comandă plasată încă.</Empty>
            : <div className={styles.recentList}>
              {recent.map(o => {
                const ini = o.customer.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
                return (
                  <Link key={o._id} to={`/admin/comenzi/${o._id}`} className={styles.recentRow}>
                    <div className={styles.recentAv} style={{ background: avatarColor(o.customer.name) }}>{ini}</div>
                    <div className={styles.recentMain}>
                      <span className={styles.recentName}>
                        {o.urgent && <span className={styles.urgFlag}>⚠</span>}{o.customer.name}
                      </span>
                      <span className={styles.recentSub}>{o.orderNumber} · {timeAgo(o.createdAt)}</span>
                    </div>
                    <Badge variant={o.status}>{STATUS_LABEL[o.status]}</Badge>
                  </Link>
                );
              })}
            </div>
          }
        </Card>
      </div>

      {/* ── Row 3: Today deliveries + Actions needed ── */}
      <div className={styles.row3}>
        <Card icon={Ico.calendar} title="Livrări azi"
          subtitle={`${todayOrders.length} ${todayOrders.length === 1 ? 'comandă' : 'comenzi'} de procesat`}
          action={<Link to="/admin/comenzi" className={styles.seeAll}>Toate {Ico.arrow}</Link>}
        >
          {todayOrders.length === 0
            ? <Empty>Nicio comandă de livrat azi. 🎉</Empty>
            : <div className={styles.delivList}>
              {todayOrders.slice(0,8).map(o => {
                const dl = deliveryLabel(o);
                return (
                  <Link key={o._id} to={`/admin/comenzi/${o._id}`} className={styles.delivRow}>
                    <span className={`${styles.delivIco} ${o.urgent ? styles.delivIcoWarn : ''}`}>
                      {o.urgent ? Ico.warn : Ico.orders}
                    </span>
                    <div className={styles.delivMain}>
                      <span className={styles.delivName}>{o.orderNumber} · {o.customer.name}</span>
                      <span className={styles.delivSub}>{STATUS_LABEL[o.status]}{o.customer.phone ? ` · ${o.customer.phone}` : ''}</span>
                    </div>
                    <span className={`${styles.delivTag} ${styles[`tag_${dl.cls}`]}`}>{dl.text}</span>
                  </Link>
                );
              })}
            </div>
          }
        </Card>

        <Card icon={Ico.bolt} title="Acțiuni necesare"
          subtitle="Comenzi ce necesită atenție"
          action={urgent.length > 0 && (
            <span className={styles.urgentCount}>{urgent.length} urgent{urgent.length !== 1 ? 'e' : 'ă'}</span>
          )}
        >
          {actionItems.length === 0
            ? <Empty>Nicio acțiune necesară. ✓</Empty>
            : <div className={styles.actionList}>
              {actionItems.map(o => {
                const isUrg = urgentIds.has(String(o._id));
                const ini = o.customer.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
                return (
                  <Link key={o._id} to={`/admin/comenzi/${o._id}`} className={`${styles.actionRow} ${isUrg ? styles.actionRowUrg : ''}`}>
                    <div className={styles.actionAv} style={{ background: isUrg ? '#C2410C' : avatarColor(o.customer.name) }}>{ini}</div>
                    <div className={styles.actionMain}>
                      <span className={styles.actionName}>{o.customer.name}</span>
                      <span className={styles.actionSub}>{o.orderNumber} · {timeAgo(o.createdAt)}</span>
                    </div>
                    <span className={styles.actionEnd}>{isUrg ? Ico.warn : Ico.check}</span>
                  </Link>
                );
              })}
            </div>
          }
        </Card>
      </div>

      {/* ── Row 4: Quick actions + Top products + Sources ── */}
      <div className={styles.row4}>
        <Card icon={Ico.bolt} title="Acțiuni rapide" subtitle="Scurtături">
          <div className={styles.quickGrid}>
            {[
              { icon: Ico.orders,  label: 'Comandă nouă', to: '/admin/comenzi/nou' },
              { icon: Ico.product, label: 'Produs nou',   to: '/admin/produse' },
              { icon: Ico.user,    label: 'Client nou',   to: '/admin/clienti' },
              { icon: Ico.review,  label: 'Recenzii',     to: '/admin/recenzii' },
            ].map(({ icon, label, to }) => (
              <Link key={to} to={to} className={styles.quickBtn}>
                <span className={styles.quickIco}>{icon}</span>
                <span className={styles.quickLbl}>{label}</span>
              </Link>
            ))}
          </div>
        </Card>

        <Card icon={Ico.star} title="Top produse" subtitle="Luna aceasta">
          {top.length === 0
            ? <Empty>Niciun produs vândut.</Empty>
            : <div className={styles.topList}>
              {top.slice(0,5).map((p, i) => {
                const pct = Math.round((p.revenue / (top[0]?.revenue || 1)) * 100);
                return (
                  <div key={p._id} className={styles.topRow}>
                    <span className={styles.topRank}>{String(i+1).padStart(2,'0')}</span>
                    <div className={styles.topInfo}>
                      <span className={styles.topName}>{p.name}</span>
                      <div className={styles.topBar}><div className={styles.topBarFill} style={{ width:`${pct}%` }} /></div>
                    </div>
                    <div className={styles.topMeta}>
                      <span className={styles.topSold}>{p.sales} buc.</span>
                      <span className={styles.topRev}>{fmt(p.revenue)} RON</span>
                    </div>
                  </div>
                );
              })}
            </div>
          }
        </Card>

        <Card icon={Ico.globe} title="Surse comenzi" subtitle="Ultimele 3 luni">
          {srcStats.length === 0
            ? <Empty>Nu există date.</Empty>
            : <div className={styles.srcList}>
              {srcStats.map(s => (
                <div key={s._id} className={styles.srcRow}>
                  <div className={styles.srcHead}>
                    <span className={styles.srcDot} style={{ background: SOURCE_COLOR[s._id] || '#888' }} />
                    <span className={styles.srcLbl}>{SOURCE_LABEL[s._id] || s._id}</span>
                    <span className={styles.srcCount}>{s.orders} comenzi</span>
                  </div>
                  <div className={styles.srcBar}>
                    <div className={styles.srcBarFill}
                      style={{ width:`${Math.round((s.orders/maxSrc)*100)}%`, background: SOURCE_COLOR[s._id] || '#888' }} />
                  </div>
                </div>
              ))}
            </div>
          }
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════ SUB-COMPONENTS ═══════════════════ */

function KpiCard({ icon, label, value, t, sub, prevLabel }) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiHead}>
        <span className={styles.kpiIco}>{icon}</span>
        <span className={styles.kpiLbl}>{label}</span>
      </div>
      <div className={styles.kpiVal}>{value}</div>
      <div className={styles.kpiFoot}>
        {t ? (
          <>
            <span className={`${styles.pill} ${t.up ? styles.pillUp : styles.pillDn}`}>
              {t.up ? '↑' : '↓'} {t.label}
            </span>
            {prevLabel && <span className={styles.kpiSub}>{prevLabel}</span>}
          </>
        ) : (
          sub && <span className={styles.kpiSub}>{sub}</span>
        )}
      </div>
    </div>
  );
}

function Card({ icon, title, subtitle, action, extra, children }) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.cardTitle}>
          <span className={styles.cardIco}>{icon}</span>
          <div>
            <div className={styles.cardTitleTxt}>{title}</div>
            {subtitle && <div className={styles.cardSub}>{subtitle}</div>}
          </div>
        </div>
        <div className={styles.cardRight}>{extra}{action}</div>
      </div>
      {children}
    </section>
  );
}

function Empty({ children }) {
  return <div className={styles.empty}>{children}</div>;
}

function AreaChart({ data, maxValue }) {
  const [hovered, setHovered] = useState(null);
  const VW = 600, VH = 110;
  const pts = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * VW,
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
      <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" className={styles.areaSvg}>
        <defs>
          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map(p => (
          <line key={p} x1="0" y1={VH*(1-p)} x2={VW} y2={VH*(1-p)}
            stroke="var(--line)" strokeWidth="1" strokeDasharray="4 4" />
        ))}
        <path d={areaPath} fill="url(#ag)" />
        <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round" />
        {hovered !== null && (
          <line x1={pts[hovered].x} y1="0" x2={pts[hovered].x} y2={VH}
            stroke="var(--line)" strokeWidth="1.5" />
        )}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={hovered === i ? 5 : 3.5}
            fill={hovered === i ? 'var(--accent)' : 'var(--bg-2)'}
            stroke="var(--accent)" strokeWidth="2"
            onMouseEnter={() => setHovered(i)} style={{ cursor: 'default' }} />
        ))}
      </svg>
      <div className={styles.xAxis}>
        {pts.map((p, i) => {
          const day = new Date(p._id).toLocaleDateString('ro-RO', { weekday: 'short' });
          return (
            <span key={i}
              className={`${styles.xLbl} ${hovered === i ? styles.xLblActive : ''}`}
              style={{ left: `${(p.x / VW) * 100}%` }}
              onMouseEnter={() => setHovered(i)}>
              {day.slice(0, 2)}
            </span>
          );
        })}
      </div>
      {hovered !== null && (
        <div className={styles.tooltip} style={{ left:`${(pts[hovered].x/VW)*100}%` }}>
          <span className={styles.tooltipVal}>{fmt(pts[hovered].revenue)} RON</span>
          <span className={styles.tooltipDay}>
            {new Date(pts[hovered]._id).toLocaleDateString('ro-RO',{ weekday:'short', day:'numeric', month:'short' })}
          </span>
        </div>
      )}
    </div>
  );
}
