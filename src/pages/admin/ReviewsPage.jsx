import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listReviews, moderateReview, deleteReview, getFeaturedReviews, updateFeaturedReviews } from '../../services/reviews.service.js';
import { useToast } from '../../context/ToastContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { fmtDate } from '../../utils/format.js';
import styles from './ReviewsPage.module.css';

const STATUS_TABS = [
  { v: 'all', l: 'Toate' },
  { v: 'approved', l: 'Aprobate' },
  { v: 'rejected', l: 'Respinse' },
  { v: 'pending', l: 'În așteptare' },
];

const STATUS_BADGE = {
  pending: 'warn',
  approved: 'success',
  rejected: 'anulata',
};

const STATUS_LABEL = {
  pending: 'În așteptare',
  approved: 'Aprobată',
  rejected: 'Respinsă',
};

export default function ReviewsPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [busy, setBusy] = useState(null);
  const [featured, setFeatured] = useState({ ids: [], heroId: null });

  const load = () =>
    listReviews('all').then(setData).catch(() => setData({ reviews: [], counts: {} }));

  const loadFeatured = () =>
    getFeaturedReviews().then(d => setFeatured({
      ids: d.featured.map(f => f._id),
      heroId: d.heroReview?._id || null,
    })).catch(() => {});

  useEffect(() => { load(); loadFeatured(); }, []);

  const moderate = async (id, status) => {
    setBusy(id + status);
    try {
      await moderateReview(id, status);
      toast({ title: status === 'approved' ? 'Recenzie aprobată' : 'Recenzie respinsă' });
      load();
    } catch (err) {
      toast({ title: 'Eroare', body: err.response?.data?.error || err.message });
    } finally { setBusy(null); }
  };

  const togglePin = async (id) => {
    const isPinned = featured.ids.includes(id);
    const newIds = isPinned ? featured.ids.filter(x => x !== id) : [...featured.ids, id];
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
    const isHero = featured.heroId === id;
    const newHeroId = isHero ? null : id;
    try {
      await updateFeaturedReviews({ heroId: newHeroId });
      setFeatured(f => ({ ...f, heroId: newHeroId }));
      toast({ title: isHero ? 'Recenzie hero eliminată' : 'Recenzie setată pe hero' });
    } catch { toast({ title: 'Eroare la actualizare' }); }
  };

  const remove = async (id) => {
    if (!confirm('Ștergi definitiv recenzia?')) return;
    setBusy(id + 'del');
    try {
      await deleteReview(id);
      toast({ title: 'Recenzie ștearsă' });
      load();
    } catch (err) {
      toast({ title: 'Eroare', body: err.response?.data?.error || err.message });
    } finally { setBusy(null); }
  };

  const counts = data?.counts || {};
  const reviews = (data?.reviews || []).filter(r => filter === 'all' || r.status === filter);

  return (
    <div>
      <header className={styles.head}>
        <div>
          <h1>Recenzii</h1>
          <p>
            {counts.pending > 0
              ? `${counts.pending} în așteptare · ${counts.approved || 0} aprobate · ${counts.rejected || 0} respinse`
              : `${counts.approved || 0} aprobate · ${counts.rejected || 0} respinse`}
          </p>
        </div>
      </header>

      <div className={styles.tabs}>
        {STATUS_TABS.map(t => {
          const count = t.v === 'all'
            ? ((counts.pending || 0) + (counts.approved || 0) + (counts.rejected || 0))
            : (counts[t.v] || 0);
          return (
            <button
              key={t.v}
              className={`${styles.tab} ${filter === t.v ? styles.tabActive : ''}`}
              onClick={() => setFilter(t.v)}
            >
              {t.l}
              {count > 0 && <span className={`${styles.tabBadge} ${t.v === 'pending' ? styles.tabBadgePending : ''}`}>{count}</span>}
            </button>
          );
        })}
      </div>

      {!data ? (
        <Spinner />
      ) : reviews.length === 0 ? (
        <div className={styles.empty}>Nicio recenzie în această categorie.</div>
      ) : (
        <div className={styles.list}>
          {reviews.map(r => (
            <div key={r._id} className={`${styles.card} ${r.status === 'pending' ? styles.cardPending : ''}`}>
              <div className={styles.cardTop}>
                <div className={styles.cardLeft}>
                  <div className={styles.stars}>
                    {'★'.repeat(r.rating)}<span className={styles.starsEmpty}>{'★'.repeat(5 - r.rating)}</span>
                  </div>
                  <div className={styles.meta}>
                    <span className={styles.author}>{r.name}</span>
                    <span className={styles.dot}>·</span>
                    <Link to={`/produs/${r.product?._id}`} className={styles.product} target="_blank">
                      {r.product?.name || '—'}
                    </Link>
                    <span className={styles.dot}>·</span>
                    <span className={styles.date}>{fmtDate(r.createdAt)}</span>
                  </div>
                </div>
                <div className={styles.cardRight}>
                  <Badge variant={STATUS_BADGE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                  <div className={styles.actions}>
                    {r.status === 'approved' && (
                      <>
                        <button
                          className={`${styles.btnPin} ${featured.ids.includes(r._id) ? styles.btnPinActive : ''}`}
                          onClick={() => togglePin(r._id)}
                          title={featured.ids.includes(r._id) ? 'Elimină din testimoniale' : 'Adaugă în testimoniale'}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        </button>
                        <button
                          className={`${styles.btnHero} ${featured.heroId === r._id ? styles.btnHeroActive : ''}`}
                          onClick={() => toggleHero(r._id)}
                          title={featured.heroId === r._id ? 'Elimină de pe hero' : 'Setează pe hero (homepage)'}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        </button>
                      </>
                    )}
                    {r.status !== 'approved' && (
                      <button
                        className={styles.btnApprove}
                        disabled={busy === r._id + 'approved'}
                        onClick={() => moderate(r._id, 'approved')}
                        title="Aprobă"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        Aprobă
                      </button>
                    )}
                    {r.status !== 'rejected' && (
                      <button
                        className={styles.btnReject}
                        disabled={busy === r._id + 'rejected'}
                        onClick={() => moderate(r._id, 'rejected')}
                        title="Respinge"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Respinge
                      </button>
                    )}
                    <button
                      className={styles.btnDelete}
                      disabled={busy === r._id + 'del'}
                      onClick={() => remove(r._id)}
                      title="Șterge definitiv"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
              <p className={styles.text}>{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
