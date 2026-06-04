import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listReviews, moderateReview, deleteReview, getFeaturedReviews, updateFeaturedReviews } from '../../services/reviews.service.js';
import { useToast } from '../../context/ToastContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { fmtDate } from '../../utils/format.js';
import styles from './ReviewsPage.module.css';

const STATUS_TABS = [
  { v: 'pending',  l: 'În așteptare' },
  { v: 'all',      l: 'Toate' },
  { v: 'approved', l: 'Aprobate' },
  { v: 'rejected', l: 'Respinse' },
];

const STATUS_BADGE  = { pending: 'warn', approved: 'success', rejected: 'anulata' };
const STATUS_LABEL  = { pending: 'În așteptare', approved: 'Aprobată', rejected: 'Respinsă' };
const AVATAR_COLORS = ['#7B3D1D','#16a34a','#2563eb','#db2777','#ea580c','#0891b2','#d97706','#0f766e'];

function avatarColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function Stars({ rating }) {
  return (
    <div className={styles.stars}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24"
          fill={i < rating ? '#C9821A' : 'none'}
          stroke={i < rating ? '#C9821A' : '#D4C5BD'}
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const toast = useToast();
  const [data, setData]       = useState(null);
  const [filter, setFilter]   = useState('pending');
  const [page, setPage]       = useState(1);
  const [busy, setBusy]       = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [featured, setFeatured] = useState({ ids: [], heroId: null });

  const load = (f = filter, p = page) =>
    listReviews(f, p).then(setData).catch(() => setData({ reviews: [], counts: {}, pagination: { page: 1, pages: 1, total: 0 } }));

  const loadFeatured = () =>
    getFeaturedReviews().then(d => setFeatured({
      ids: d.featured.map(f => f._id),
      heroId: d.heroReview?._id || null,
    })).catch(() => {});

  useEffect(() => { load(); loadFeatured(); }, []);

  const changeFilter = (f) => { setFilter(f); setPage(1); load(f, 1); };
  const changePage   = (p) => { setPage(p);   load(filter, p); };

  const moderate = async (id, status) => {
    setBusy(id + status);
    try {
      await moderateReview(id, status);
      toast({ title: status === 'approved' ? 'Recenzie aprobată' : 'Recenzie respinsă' });
      load(filter, page);
    } catch (err) {
      toast({ title: 'Eroare', body: err.response?.data?.error || err.message });
    } finally { setBusy(null); }
  };

  const togglePin = async (id) => {
    const isPinned = featured.ids.includes(id);
    const newIds   = isPinned ? featured.ids.filter(x => x !== id) : [...featured.ids, id];
    if (!isPinned && newIds.length > 3) {
      toast({ title: 'Maxim 3 recenzii pot fi afișate în testimoniale' });
      return;
    }
    try {
      await updateFeaturedReviews({ featuredIds: newIds });
      setFeatured(f => ({ ...f, ids: newIds }));
      toast({ title: isPinned ? 'Eliminată din testimoniale' : 'Adăugată în testimoniale' });
    } catch { toast({ title: 'Eroare la actualizare' }); }
  };

  const toggleHero = async (id) => {
    const isHero    = featured.heroId === id;
    const newHeroId = isHero ? null : id;
    try {
      await updateFeaturedReviews({ heroId: newHeroId });
      setFeatured(f => ({ ...f, heroId: newHeroId }));
      toast({ title: isHero ? 'Recenzie hero eliminată' : 'Recenzie setată ca hero' });
    } catch { toast({ title: 'Eroare la actualizare' }); }
  };

  const remove = async (id) => {
    setBusy(id + 'del');
    try {
      await deleteReview(id);
      toast({ title: 'Recenzie ștearsă' });
      // dacă era ultima pe pagina curentă, mergi la pagina anterioară
      const newPage = reviews.length === 1 && page > 1 ? page - 1 : page;
      setPage(newPage);
      load(filter, newPage);
    } catch (err) {
      toast({ title: 'Eroare', body: err.response?.data?.error || err.message });
    } finally { setBusy(null); }
  };

  const counts      = data?.counts || {};
  const pagination  = data?.pagination || { page: 1, pages: 1, total: 0 };
  const total       = (counts.pending || 0) + (counts.approved || 0) + (counts.rejected || 0);
  const approvalRate = total > 0 ? Math.round(((counts.approved || 0) / total) * 100) : 0;
  const avgRating   = data?.reviews?.length
    ? (data.reviews.reduce((s, r) => s + r.rating, 0) / data.reviews.length).toFixed(1)
    : '—';

  const reviews  = data?.reviews || [];
  const countFor = (v) => v === 'all' ? total : (counts[v] || 0);

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Recenzii</h1>
          <p className={styles.sub}>
            {counts.pending > 0
              ? `${counts.pending} în așteptare · ${counts.approved || 0} aprobate`
              : `${counts.approved || 0} aprobate · ${counts.rejected || 0} respinse`}
          </p>
        </div>
      </header>

      {!data ? <Spinner /> : <>

        {/* ── KPI cards ── */}
        {total > 0 && (
          <div className={styles.kpis}>
            <div className={styles.kpi}>
              <div className={styles.kpiLabel}>Total recenzii</div>
              <div className={styles.kpiValue}>{total}</div>
              <div className={styles.kpiSub}>{counts.pending || 0} în așteptare</div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiLabel}>Rating mediu</div>
              <div className={styles.kpiValue}>{avgRating}<span className={styles.kpiUnit}> / 5</span></div>
              <div className={styles.kpiSub}>toate recenziile</div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.kpiLabel}>Rata de aprobare</div>
              <div className={styles.kpiValue}>{approvalRate}<span className={styles.kpiUnit}>%</span></div>
              <div className={styles.kpiSub}>{counts.approved || 0} din {total} aprobate</div>
            </div>
          </div>
        )}

        {/* ── Filter tabs ── */}
        <div className={styles.tabs}>
          {STATUS_TABS.map(t => {
            const count = countFor(t.v);
            return (
              <button
                key={t.v}
                className={`${styles.tab} ${filter === t.v ? styles.tabActive : ''}`}
                onClick={() => changeFilter(t.v)}
              >
                {t.l}
                <span className={`${styles.tabCount} ${t.v === 'pending' && count > 0 ? styles.tabCountPending : ''}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Reviews ── */}
        {reviews.length === 0 ? (
          <div className={styles.empty}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".3">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p>Nicio recenzie în această categorie.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {reviews.map(r => {
              const isPinned = featured.ids.includes(r._id);
              const isHero   = featured.heroId === r._id;
              const initials = (r.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div key={r._id} className={`${styles.card} ${r.status === 'pending' ? styles.cardPending : ''}`}>

                  {/* Top: avatar + info + badge */}
                  <div className={styles.cardTop}>
                    <div className={styles.avatar} style={{ background: avatarColor(r.name) }}>
                      {initials}
                    </div>
                    <div className={styles.cardMeta}>
                      <div className={styles.metaRow}>
                        <span className={styles.author}>{r.name}</span>
                        <Stars rating={r.rating} />
                        <span className={styles.date}>{fmtDate(r.createdAt)}</span>
                      </div>
                      <Link to={`/produs/${r.product?._id}`} className={styles.productLink} target="_blank">
                        {r.product?.name || '—'}
                      </Link>
                    </div>
                    <div className={styles.cardBadge}>
                      <Badge variant={STATUS_BADGE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                    </div>
                  </div>

                  {/* Review text */}
                  <p className={styles.text}>{r.text}</p>

                  {/* Actions */}
                  <div className={styles.actions}>
                    <div className={styles.actionsLeft}>
                      {r.status === 'approved' && (
                        <>
                          <button
                            className={`${styles.actionBtn} ${isPinned ? styles.actionBtnPin : ''}`}
                            onClick={() => togglePin(r._id)}
                            title={isPinned ? 'Elimină din testimoniale' : 'Adaugă în testimoniale (max 3)'}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                            <span className={styles.btnLabel}>Testimonial</span>
                          </button>
                          <button
                            className={`${styles.actionBtn} ${isHero ? styles.actionBtnHero : ''}`}
                            onClick={() => toggleHero(r._id)}
                            title={isHero ? 'Elimină de pe hero' : 'Setează pe hero (homepage)'}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                              <polyline points="9 22 9 12 15 12 15 22"/>
                            </svg>
                            <span className={styles.btnLabel}>Hero</span>
                          </button>
                        </>
                      )}
                    </div>

                    <div className={styles.actionsRight}>
                      {r.status !== 'approved' && (
                        <button
                          className={styles.btnApprove}
                          disabled={busy === r._id + 'approved'}
                          onClick={() => moderate(r._id, 'approved')}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          <span className={styles.btnLabel}>Aprobă</span>
                        </button>
                      )}
                      {r.status !== 'rejected' && (
                        <button
                          className={styles.btnReject}
                          disabled={busy === r._id + 'rejected'}
                          onClick={() => moderate(r._id, 'rejected')}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                          <span className={styles.btnLabel}>Respinge</span>
                        </button>
                      )}
                      <button
                        className={styles.btnDelete}
                        disabled={busy === r._id + 'del'}
                        onClick={() => setDeleteTarget(r)}
                        title="Șterge definitiv"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {pagination.pages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              onClick={() => changePage(page - 1)}
              disabled={page === 1}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              Anterior
            </button>
            <div className={styles.pageInfo}>
              <span className={styles.pageCurrent}>{page}</span>
              <span className={styles.pageOf}>din</span>
              <span>{pagination.pages}</span>
              <span className={styles.pageTotal}>· {pagination.total} total</span>
            </div>
            <button
              className={styles.pageBtn}
              onClick={() => changePage(page + 1)}
              disabled={page === pagination.pages}
            >
              Următor
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        )}

      </>}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Ștergi recenzia?"
        body={deleteTarget ? `Recenzia lui ${deleteTarget.name} va fi eliminată definitiv.` : ''}
        confirmLabel="Șterge"
        danger
        onConfirm={() => { const id = deleteTarget._id; setDeleteTarget(null); remove(id); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
