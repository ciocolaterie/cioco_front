import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { calendarOrders, productionSummary } from '../../services/admin.service.js';
import Spinner from '../../components/ui/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { STATUS_LABEL, fmt, fmtDateTime } from '../../utils/format.js';
import styles from './CalendarPage.module.css';

const DAYS_RO = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];
const MONTHS_RO = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];

const STATUS_DOT = { noua: '#A0451B', in_pregatire: '#92400E', gata: '#065F46', livrata: '#6B7280', anulata: '#991B1B' };

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}
function getFirstDayOfWeek(year, month) {
  const d = new Date(year, month - 1, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [orders, setOrders] = useState(null);
  const [summary, setSummary] = useState([]);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('month');

  useEffect(() => {
    setOrders(null);
    Promise.all([
      calendarOrders(year, month),
      productionSummary(),
    ]).then(([o, s]) => { setOrders(o); setSummary(s); }).catch(() => setOrders([]));
  }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelected(null);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelected(null);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDow    = getFirstDayOfWeek(year, month);

  const ordersByDay = {};
  (orders || []).forEach(o => {
    const dateKey = o.deliveryDate
      ? new Date(o.deliveryDate).toISOString().slice(0, 10)
      : new Date(o.createdAt).toISOString().slice(0, 10);
    const d = parseInt(dateKey.split('-')[2]);
    const m = parseInt(dateKey.split('-')[1]);
    if (m === month) (ordersByDay[d] = ordersByDay[d] || []).push(o);
  });

  const selectedOrders = selected ? (ordersByDay[selected] || []) : [];
  const todayDay = now.getFullYear() === year && now.getMonth() + 1 === month ? now.getDate() : null;

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1>Calendar producție</h1>
          <p>Planificarea livrărilor și producției zilnice</p>
        </div>
        <div className={styles.headRight}>
          <div className={styles.viewPills}>
            <button className={`${styles.viewPill} ${view === 'month' ? styles.viewPillActive : ''}`} onClick={() => setView('month')}>Lunar</button>
            <button className={`${styles.viewPill} ${view === 'week' ? styles.viewPillActive : ''}`} onClick={() => setView('week')}>Săptămânal</button>
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.calendarCol}>
          {/* Month nav */}
          <div className={styles.monthNav}>
            <button className={styles.navBtn} onClick={prevMonth}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className={styles.monthTitle}>{MONTHS_RO[month - 1]} {year}</span>
            <button className={styles.navBtn} onClick={nextMonth}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          {/* Day headers */}
          <div className={styles.dayHeaders}>
            {DAYS_RO.map(d => <span key={d} className={styles.dayHeader}>{d}</span>)}
          </div>

          {/* Calendar grid */}
          {!orders ? <div className={styles.loadingCal}><Spinner /></div> : (
            <div className={styles.calGrid}>
              {Array.from({ length: firstDow }).map((_, i) => (
                <div key={`empty-${i}`} className={styles.cellEmpty} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayOrders = ordersByDay[day] || [];
                const hasUrgent = dayOrders.some(o => o.urgent);
                const isToday = day === todayDay;
                const isSelected = day === selected;
                return (
                  <button
                    key={day}
                    className={`${styles.cell} ${isToday ? styles.cellToday : ''} ${isSelected ? styles.cellSelected : ''} ${hasUrgent ? styles.cellUrgent : ''}`}
                    onClick={() => setSelected(isSelected ? null : day)}
                  >
                    <span className={styles.cellDay}>{day}</span>
                    {dayOrders.length > 0 && (
                      <div className={styles.cellDots}>
                        {dayOrders.slice(0, 4).map((o, k) => (
                          <span key={k} className={styles.cellDot} style={{ background: STATUS_DOT[o.status] || '#999' }} />
                        ))}
                        {dayOrders.length > 4 && <span className={styles.cellMore}>+{dayOrders.length - 4}</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className={styles.rightCol}>
          {/* Production summary */}
          <section className={styles.card}>
            <h3>Sumar producție</h3>
            <p className={styles.cardSub}>Comenzi active (nouă + în pregătire)</p>
            {summary.length === 0
              ? <p className={styles.empty}>Nicio comandă activă.</p>
              : <div className={styles.summaryList}>
                {summary.map(s => (
                  <div key={s.name} className={styles.summaryRow}>
                    <span className={styles.summaryName}>{s.name}</span>
                    <div className={styles.summaryMeta}>
                      <strong>{s.qty} buc.</strong>
                      <span>{s.orders} {s.orders === 1 ? 'comandă' : 'comenzi'}</span>
                    </div>
                  </div>
                ))}
              </div>
            }
          </section>

          {/* Selected day */}
          {selected && (
            <section className={styles.card}>
              <h3>{selected} {MONTHS_RO[month - 1]}</h3>
              {selectedOrders.length === 0
                ? <p className={styles.empty}>Nicio comandă pentru această zi.</p>
                : <>
                  <p className={styles.cardSub}>{selectedOrders.length} {selectedOrders.length === 1 ? 'comandă' : 'comenzi'}</p>
                  <div className={styles.dayOrders}>
                    {selectedOrders.map(o => (
                      <Link key={o._id} to={`/admin/comenzi/${o._id}`} className={`${styles.dayOrder} ${o.urgent ? styles.dayOrderUrgent : ''}`}>
                        <div className={styles.dayOrderHead}>
                          <span className={styles.dayOrderNo}>
                            {o.urgent && '⚠️ '}
                            {o.orderNumber}
                          </span>
                          <Badge variant={o.status}>{STATUS_LABEL[o.status]}</Badge>
                        </div>
                        <div className={styles.dayOrderBody}>
                          <span>{o.customer.name}</span>
                          <strong>{fmt(o.total)} RON</strong>
                        </div>
                        {o.items?.length > 0 && (
                          <div className={styles.dayOrderItems}>
                            {o.items.map((i, k) => <span key={k}>{i.qty}×{i.name}</span>)}
                          </div>
                        )}
                        {o.note && <div className={styles.dayOrderNote}>{o.note}</div>}
                      </Link>
                    ))}
                  </div>
                </>
              }
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
