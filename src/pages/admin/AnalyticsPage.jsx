import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  BarChart, Bar,
  PieChart, Pie, Cell,
  LabelList,
} from 'recharts';
import { getAnalytics } from '../../services/admin.service.js';
import Spinner from '../../components/ui/Spinner.jsx';
import { fmt } from '../../utils/format.js';
import styles from './AnalyticsPage.module.css';

const MONTHS_RO   = ['ian','feb','mar','apr','mai','iun','iul','aug','sep','oct','noi','dec'];
const PIE_COLORS  = ['#7B3D1D','#16a34a','#2563eb','#db2777','#ea580c','#0891b2'];
const SOURCE_LABEL= { online:'Online', telefon:'Telefon', whatsapp:'WhatsApp', instagram:'Instagram', fata_in_fata:'Față în față' };

const TABS = [
  { id: 'overview', label: 'Prezentare generală',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
  { id: 'products', label: 'Per produse',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.27 6.96 8.73 5.04 8.73-5.04"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> },
];

/* ── Build 12-month grid ── */
function buildMonthly(raw) {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const yr = d.getFullYear(), mo = d.getMonth() + 1;
    const found = (raw || []).find(r => r._id.year === yr && r._id.month === mo);
    return { month: MONTHS_RO[d.getMonth()], revenue: found?.revenue || 0, orders: found?.orders || 0 };
  });
}

/* ── Build lineData (12 historical + 3 projected) ── */
function buildLineData(monthly) {
  const nonZero = monthly.filter(m => m.revenue > 0);
  const last3   = monthly.slice(-3).map(m => m.revenue);
  const avg     = last3.reduce((s, v) => s + v, 0) / Math.max(last3.filter(v => v > 0).length, 1);

  const now  = new Date();
  const proj = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
    return { month: MONTHS_RO[d.getMonth()], revenue: null, orders: 0, projection: Math.round(avg * Math.pow(1.02, i + 1)) };
  });

  // Mark last real month as projection starting point (visual connection)
  const line = monthly.map((m, idx) => ({
    ...m,
    projection: idx === monthly.length - 1 ? m.revenue : null,
  }));

  return [...line, ...proj];
}

/* ── Custom tooltips ── */
function LineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.ttLabel}>{label}</div>
      {payload.map(p => p.value != null && (
        <div key={p.dataKey} className={styles.ttRow}>
          <span className={styles.ttDot} style={{ background: p.color, borderStyle: p.dataKey === 'projection' ? 'dashed' : 'solid' }} />
          {p.dataKey === 'projection' ? 'Proiecție' : 'Realizat'}: <strong>{fmt(p.value)} RON</strong>
        </div>
      ))}
    </div>
  );
}

function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.ttLabel}>{label}</div>
      <div className={styles.ttRow}><strong>{payload[0].value}</strong> comenzi</div>
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.ttLabel}>{payload[0].name}</div>
      <div className={styles.ttRow}><strong>{fmt(payload[0].value)} RON</strong></div>
    </div>
  );
}

/* ── Y-axis tick formatter ── */
const yFmt = v => v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : String(v);

/* ── Products tab ── */
function ProductsTab({ products }) {
  if (products.length === 0) {
    return <div className={styles.empty}>Nicio comandă înregistrată încă.</div>;
  }

  const totalRevenue = products.reduce((s, p) => s + p.revenue, 0);
  const top10        = products.slice(0, 10);

  return (
    <>
      {/* Horizontal bar chart */}
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <span className={styles.cardTitle}>Top produse după vânzări</span>
          <span className={styles.avgBadge}>{products.length} produse</span>
        </div>
        <ResponsiveContainer width="100%" height={top10.length * 42 + 20}>
          <BarChart data={top10} layout="vertical" margin={{ top: 0, right: 70, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--ink-3)' }} axisLine={false} tickLine={false} tickFormatter={yFmt} />
            <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 12.5, fill: 'var(--ink-2)' }} axisLine={false} tickLine={false} />
            <RTooltip content={<ProdTooltip />} cursor={{ fill: 'var(--bg-3)' }} />
            <Bar dataKey="revenue" fill="#7B3D1D" radius={[0, 4, 4, 0]} maxBarSize={22}>
              <LabelList dataKey="revenue" position="right" formatter={v => `${fmt(v)} RON`} style={{ fontSize: 11.5, fill: 'var(--ink-3)' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Products table */}
      <div className={`${styles.card} ${styles.tableCard}`}>
        <div className={styles.cardHead}>
          <span className={styles.cardTitle}>Toate produsele</span>
        </div>
        <div className={styles.prodTable}>
          <div className={styles.prodHead}>
            <span>#</span>
            <span>Produs</span>
            <span>Buc. vândute</span>
            <span>Nr. comenzi</span>
            <span>Preț mediu</span>
            <span>Venit total</span>
            <span>% din total</span>
          </div>
          {products.map((p, i) => {
            const pct = totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0;
            return (
              <div key={p.name} className={styles.prodRow}>
                <span className={styles.prodRank}>{i + 1}</span>
                <span className={styles.prodName}>{p.name}</span>
                <span className={styles.prodNum}>{p.qty}</span>
                <span className={styles.prodNum}>{p.orders}</span>
                <span className={styles.prodNum}>{fmt(p.avgPrice)} RON</span>
                <span className={styles.prodRev}>{fmt(p.revenue)} RON</span>
                <span className={styles.prodPct}>
                  <span className={styles.pctBar}>
                    <span className={styles.pctFill} style={{ width: `${pct}%` }} />
                  </span>
                  {pct.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function ProdTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <div className={styles.ttLabel}>{p.name}</div>
      <div className={styles.ttRow}><strong>{fmt(p.revenue)} RON</strong> venit</div>
      <div className={styles.ttRow}>{p.qty} buc. · {p.orders} comenzi</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData]   = useState(null);
  const [tab,  setTab]    = useState('overview');

  useEffect(() => {
    getAnalytics().then(setData).catch(() => setData({}));
  }, []);

  if (!data) return <Spinner />;

  const monthly    = buildMonthly(data.monthlyRevenue);
  const lineData   = buildLineData(monthly);
  const avgMonthly = monthly.reduce((s, m) => s + m.revenue, 0) / 12;
  const customers  = (data.revenuePerCustomer || []).map((c, i) => ({ ...c, color: PIE_COLORS[i % PIE_COLORS.length] }));

  return (
    <div className={styles.page}>

      {/* Header */}
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.sub}>Performanță, vânzări și tendințe</p>
        </div>
        <button className={styles.exportBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export
        </button>
      </header>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button key={t.id} className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* ── Line chart (full width) ── */}
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>Venit lunar + proiecție 3 luni</span>
              <span className={styles.avgBadge}>medie {fmt(avgMonthly)} RON/lună</span>
            </div>
            <ResponsiveContainer width="100%" height={270}>
              <LineChart data={lineData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11.5, fill: 'var(--ink-3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--ink-3)' }} axisLine={false} tickLine={false} tickFormatter={yFmt} width={40} />
                <RTooltip content={<LineTooltip />} cursor={{ stroke: 'var(--line)', strokeWidth: 1 }} />
                <Line type="monotone" dataKey="revenue"    stroke="#7B3D1D" strokeWidth={2.2} dot={false} connectNulls={false} />
                <Line type="monotone" dataKey="projection" stroke="#7B3D1D" strokeWidth={2.2} strokeDasharray="6 4" dot={false} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className={styles.chartLegend}>
              <span className={styles.legendItem}><span className={styles.legendSolid} />Realizat</span>
              <span className={styles.legendItem}><span className={styles.legendDash} />Proiecție</span>
            </div>
          </div>

          {/* ── Two columns: pie + bar ── */}
          <div className={styles.twoCol}>

            {/* Pie: venit per client */}
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardTitle}>Venit per client</span>
              </div>
              {customers.length === 0
                ? <div className={styles.empty}>Nicio dată disponibilă.</div>
                : (
                  <div className={styles.pieWrap}>
                    <PieChart width={140} height={140}>
                      <Pie data={customers} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={66} paddingAngle={2} strokeWidth={0}>
                        {customers.map((c, i) => <Cell key={i} fill={c.color} />)}
                      </Pie>
                      <RTooltip content={<PieTooltip />} />
                    </PieChart>
                    <div className={styles.pieLegend}>
                      {customers.map((c, i) => (
                        <div key={i} className={styles.pieLegendRow}>
                          <span className={styles.pieDot} style={{ background: c.color }} />
                          <span className={styles.pieName}>{c.name}</span>
                          <span className={styles.pieAmt}>{fmt(c.total)} RON</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }
            </div>

            {/* Bar: comenzi per luna */}
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardTitle}>Comenzi per lună</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthly} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--ink-3)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--ink-3)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <RTooltip content={<BarTooltip />} cursor={{ fill: 'var(--bg-3)' }} />
                  <Bar dataKey="orders" fill="#7B3D1D" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── KPI cards ── */}
          <div className={styles.kpiRow}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Cel mai profitabil client
              </div>
              <div className={styles.kpiName}>{data.topCustomer?.name || '—'}</div>
              {data.topCustomer && <div className={styles.kpiSub}>{fmt(data.topCustomer.total)} RON total</div>}
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.27 6.96 8.73 5.04 8.73-5.04"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                Cel mai comandat produs
              </div>
              <div className={styles.kpiName}>{data.topProduct?.name || '—'}</div>
              {data.topProduct && <div className={styles.kpiSub}>{data.topProduct.qty} buc. comandate</div>}
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiTop}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                Sursa cu cele mai multe comenzi
              </div>
              <div className={styles.kpiName}>{data.topSource ? (SOURCE_LABEL[data.topSource.source] || data.topSource.source) : '—'}</div>
              {data.topSource && <div className={styles.kpiSub}>{data.topSource.count} comenzi aduse</div>}
            </div>
          </div>
        </>
      )}

      {tab === 'products' && <ProductsTab products={data.products || []} />}
    </div>
  );
}
