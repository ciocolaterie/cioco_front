import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProduct, listProducts } from '../../services/products.service.js';
import { getProductReviews, submitReview } from '../../services/reviews.service.js';
import api from '../../services/api.js';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ProductCard from '../../components/products/ProductCard.jsx';
import { SkeletonGrid } from '../../components/ui/Skeleton.jsx';
import useSeo from '../../hooks/useSeo.js';
import { fmtDate } from '../../utils/format.js';
import styles from './ProductPage.module.css';

const AVATAR_COLORS = ['#7B3D1D','#16a34a','#2563eb','#db2777','#ea580c','#0891b2','#d97706','#0f766e'];
function avatarColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function avatarInitials(name = '') {
  return (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
}

function RatingStars({ rating, count }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.3;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className={styles.ratingRow}>
      {[...Array(full)].map((_, i) => <span key={`f${i}`} className={styles.starFull}>★</span>)}
      {half && <span className={styles.starHalf}>★</span>}
      {[...Array(empty)].map((_, i) => <span key={`e${i}`} className={styles.starEmpty}>★</span>)}
      <span className={styles.ratingVal}>{rating.toFixed(1)}</span>
      {count > 0 && <span className={styles.ratingCount}>({count} recenzii)</span>}
    </span>
  );
}

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className={styles.starPicker}>
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          className={`${styles.starPickerBtn} ${s <= (hover || value) ? styles.starPickerOn : ''}`}
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${s} stele`}
        >★</button>
      ))}
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [p, setP] = useState(null);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState(false);
  const { addToCart, toggleFavorite, favorites } = useCart();
  const toast = useToast();

  const actionsRef = useRef(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [addedFlash, setAddedFlash] = useState(false);

  const handleAddToCart = () => {
    addToCart(p, qty);
    toast({ title: 'Adăugat în coș', body: `${qty} × ${p.name}` });
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 1600);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: p.name, text: p.short || '', url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); toast({ title: 'Link copiat' }); } catch {}
    }
  };

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef(null);
  const [related, setRelated] = useState(null);
  const [alertEmail, setAlertEmail] = useState('');
  const [alertSent, setAlertSent] = useState(false);
  const [alertLoading, setAlertLoading] = useState(false);

  const [reviews, setReviews] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', email: '', rating: 0, text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useSeo({
    title: p?.name,
    description: p?.short || p?.description,
    image: p?.images?.[0],
    type: 'product',
    jsonLd: p ? {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      description: p.short || p.description,
      image: p.images,
      offers: {
        '@type': 'Offer',
        price: p.price,
        priceCurrency: 'RON',
        availability: p.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      },
    } : undefined,
  });
  useEffect(() => { getProduct(id).then(setP).catch(() => setError(true)); }, [id]);
  useEffect(() => { getProductReviews(id).then(setReviews).catch(() => setReviews([])); }, [id]);
  useEffect(() => {
    if (!p?.category) return;
    listProducts({ category: p.category, limit: 4 })
      .then(all => setRelated(all.filter(x => x._id !== id).slice(0, 3)))
      .catch(() => setRelated([]));
  }, [p?.category, id]);
  useEffect(() => {
    if (user) setReviewForm(f => ({ ...f, name: user.name || '', email: user.email || '' }));
  }, [user]);

  useEffect(() => {
    const el = actionsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setStickyVisible(!entry.isIntersecting), { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [p]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') setActive(a => Math.min((p?.images?.length ?? 1) - 1, a + 1));
      if (e.key === 'ArrowLeft') setActive(a => Math.max(0, a - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, p]);
  if (error) return (
    <div className={`container ${styles.errorPage}`}>
      <p className={styles.errorText}>Produsul nu a fost găsit.</p>
      <Link to="/catalog" className={styles.errorLink}>← Înapoi la catalog</Link>
    </div>
  );
  if (!p) return <Spinner />;

  const isFav = favorites.includes(p._id);
  const setField = (k) => (e) => setReviewForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (reviewForm.rating === 0) return setReviewError('Selectează un rating.');
    setSubmitting(true);
    setReviewError('');
    try {
      await submitReview(id, reviewForm);
      setSubmitted(true);
      getProductReviews(id).then(setReviews).catch(() => {});
    } catch (err) {
      setReviewError(err.response?.data?.error || 'A apărut o eroare. Încearcă din nou.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`container ${styles.page}`}>
      <nav className={styles.crumbs}>
        <Link to="/">Acasă</Link>
        <span className={styles.crumbSep}>›</span>
        <Link to="/catalog">Catalog</Link>
        <span className={styles.crumbSep}>›</span>
        <span>{p.name}</span>
      </nav>
      <div className={styles.grid}>
        <div className={styles.gallery}>
          <div
            className={styles.mainImage}
            onClick={() => { if (p.images?.[active]) setLightboxOpen(true); }}
          >
            {p.images?.[active]
              ? <img key={active} className={styles.mainImg} src={p.images[active]} alt={p.name} />
              : <div className={styles.placeholder}>
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>}
          </div>
          {p.images?.length > 1 && (
            <div className={styles.thumbs}>
              {p.images.map((src, i) => (
                <button key={i} className={`${styles.thumb} ${i === active ? styles.thumbActive : ''}`} onClick={() => setActive(i)}>
                  <img src={src} alt={`${p.name} ${i + 1}`} loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.info}>
          <div className={styles.cat}>{p.category}</div>
          <h1>{p.name}</h1>
          <div className={styles.meta}>
            {p.rating
              ? <RatingStars rating={p.rating} count={p.reviewsCount || 0} />
              : <span className={styles.noRating}>Fără recenzii încă</span>}
            {p.weight && <span className={styles.metaSep}>·</span>}
            {p.weight && <span>{p.weight}</span>}
            <Badge variant={p.stock > 0 ? 'success' : 'anulata'}>
              {p.stock === 0 ? 'Stoc epuizat' : p.stock <= 5 ? `Ultimele ${p.stock}` : 'În stoc'}
            </Badge>
          </div>
          <p className={styles.short}>{p.short}</p>
          <div className={styles.price}>{p.price?.toFixed(2)} <span className={styles.priceCur}>lei</span></div>

          <div ref={actionsRef} className={styles.actions}>
            <div className={styles.qty}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(q => Math.min(p.stock, q + 1))}>+</button>
            </div>
            <button
              className={`${styles.add} ${addedFlash ? styles.addSuccess : ''}`}
              disabled={p.stock === 0}
              onClick={handleAddToCart}
            >
              {addedFlash ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Adăugat!
                </>
              ) : p.stock === 0 ? 'Stoc epuizat' : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                  Adaugă în coș
                </>
              )}
            </button>
            <button
              className={`${styles.fav} ${isFav ? styles.favActive : ''}`}
              onClick={() => toggleFavorite(p._id)}
              aria-label={isFav ? 'Elimină din favorite' : 'Adaugă la favorite'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
            <button className={styles.shareIconBtn} onClick={handleShare} aria-label="Distribuie produsul">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
          </div>

          {p.stock === 0 && (
            alertSent ? (
              <div className={styles.stockAlertSuccess}>
                ✓ Te vom anunța când produsul revine în stoc.
              </div>
            ) : (
              <form
                className={styles.stockAlertForm}
                onSubmit={async (e) => {
                  e.preventDefault();
                  setAlertLoading(true);
                  try { await api.post(`/products/${p._id}/stock-alert`, { email: alertEmail }); setAlertSent(true); }
                  catch {}
                  setAlertLoading(false);
                }}
              >
                <p className={styles.stockAlertMsg}>Anunță-mă când revine în stoc:</p>
                <div className={styles.stockAlertRow}>
                  <input
                    type="email"
                    value={alertEmail}
                    onChange={e => setAlertEmail(e.target.value)}
                    placeholder="email@tău.ro"
                    className={styles.stockAlertInput}
                    required
                  />
                  <button type="submit" className={styles.stockAlertBtn} disabled={alertLoading}>
                    {alertLoading ? '…' : 'Anunță-mă'}
                  </button>
                </div>
              </form>
            )
          )}

          <div className={styles.trustRow}>
            <span className={styles.trustRowItem}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              100% artizanal
            </span>
            <span className={styles.trustRowDot} />
            <span className={styles.trustRowItem}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              Cash la livrare
            </span>
            <span className={styles.trustRowDot} />
            <span className={styles.trustRowItem}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Ridicare din magazin
            </span>
          </div>

          {p.description && (
            <div className={styles.section}>
              <h3>Descriere</h3>
              <p>{p.description}</p>
            </div>
          )}
          {p.ingredients && (
            <div className={styles.section}>
              <h3>Ingrediente</h3>
              <p>{p.ingredients}</p>
            </div>
          )}
          {p.allergens?.length > 0 && (
            <div className={styles.section}>
              <h3>Alergeni</h3>
              <p>{p.allergens.join(', ')}</p>
            </div>
          )}
        </div>
      </div>

      {stickyVisible && (
        <div className={styles.stickyBar}>
          <div className={styles.stickyInfo}>
            <span className={styles.stickyName}>{p.name}</span>
            <span className={styles.stickyPrice}>{p.price?.toFixed(2)} lei</span>
          </div>
          <button
            className={`${styles.stickyAdd} ${addedFlash ? styles.stickyAddSuccess : ''}`}
            disabled={p.stock === 0}
            onClick={handleAddToCart}
          >
            {addedFlash ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Adăugat!
              </>
            ) : p.stock === 0 ? 'Stoc epuizat' : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                Adaugă în coș
              </>
            )}
          </button>
        </div>
      )}

      {/* REVIEWS */}
      <div className={styles.reviewsSection}>
        <h2 className={styles.reviewsTitle}>
          Recenzii
          {reviews?.length > 0 && <span className={styles.reviewsCount}>{reviews.length}</span>}
        </h2>

        {/* Reviews list first */}
        {reviews === null ? <Spinner /> : reviews.length === 0 ? (
          <p className={styles.reviewsEmpty}>Nicio recenzie încă. Fii primul care lasă un feedback!</p>
        ) : (
          <>
            <div className={styles.reviewList}>
              {(showAll ? reviews : reviews.slice(0, 4)).map(r => (
                <div key={r._id} className={styles.reviewItem}>
                  <div className={styles.reviewTop}>
                    <div className={styles.reviewTopLeft}>
                      <div className={styles.reviewAvatar} style={{ background: avatarColor(r.name) }}>
                        {avatarInitials(r.name)}
                      </div>
                      <div>
                        <span className={styles.reviewAuthor}>{r.name}</span>
                        <span className={styles.reviewDate}>{fmtDate(r.createdAt)}</span>
                      </div>
                    </div>
                    <div className={styles.reviewStars}>
                      {'★'.repeat(r.rating)}<span className={styles.reviewStarsEmpty}>{'★'.repeat(5 - r.rating)}</span>
                    </div>
                  </div>
                  <p className={styles.reviewText}>{r.text}</p>
                </div>
              ))}
            </div>
            {reviews.length > 4 && !showAll && (
              <button className={styles.showMoreBtn} onClick={() => setShowAll(true)}>
                Arată mai multe · {reviews.length - 4} recenzii
              </button>
            )}
          </>
        )}

        {/* Form below */}
        <div className={styles.reviewFormWrap}>
          <h3 className={styles.reviewFormTitle}>Lasă o recenzie</h3>
          {submitted ? (
            <div className={styles.reviewSuccess}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Recenzia ta a fost trimisă și va fi publicată după verificare. Mulțumim!
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className={styles.reviewForm}>
              <div className={styles.reviewFormRow}>
                <label className={styles.reviewLabel}>
                  Nume
                  <input className={styles.reviewInput} value={reviewForm.name} onChange={setField('name')} required />
                </label>
                <label className={styles.reviewLabel}>
                  Email <span className={styles.reviewLabelNote}>(nu va fi afișat)</span>
                  <input type="email" className={styles.reviewInput} value={reviewForm.email} onChange={setField('email')} required />
                </label>
              </div>
              <div>
                <div className={styles.reviewLabelText}>Rating</div>
                <StarPicker value={reviewForm.rating} onChange={v => setReviewForm(f => ({ ...f, rating: v }))} />
              </div>
              <label className={styles.reviewLabel}>
                Comentariu
                <textarea className={styles.reviewTextarea} rows={4} value={reviewForm.text} onChange={setField('text')} required maxLength={1000} />
              </label>
              {reviewError && <p className={styles.reviewErr}>{reviewError}</p>}
              <button type="submit" className={styles.reviewSubmitBtn} disabled={submitting || reviewForm.rating === 0}>
                {submitting ? 'Se trimite…' : 'Trimite recenzia'}
              </button>
            </form>
          )}
        </div>
      </div>

      {related?.length > 0 && (
        <div className={styles.relatedSection}>
          <div className={styles.relatedHead}>
            <div className={styles.relatedEyebrow}>MERGE BINE CU</div>
            <h2 className={styles.relatedTitle}>Din aceeași categorie</h2>
          </div>
          <div className={styles.relatedGrid}>
            {related.map(prod => <ProductCard key={prod._id} product={prod} />)}
          </div>
        </div>
      )}

      {lightboxOpen && p.images?.[active] && (
        <div
          className={styles.lightbox}
          onClick={() => setLightboxOpen(false)}
          onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={e => {
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(dx) < 40) return;
            if (dx < 0) setActive(a => Math.min(p.images.length - 1, a + 1));
            else setActive(a => Math.max(0, a - 1));
          }}
        >
          <button
            className={styles.lightboxClose}
            onClick={e => { e.stopPropagation(); setLightboxOpen(false); }}
            aria-label="Închide"
          >✕</button>
          <img
            src={p.images[active]}
            alt={p.name}
            className={styles.lightboxImg}
            onClick={e => e.stopPropagation()}
          />
          {p.images.length > 1 && (
            <>
              <button
                className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                onClick={e => { e.stopPropagation(); setActive(a => Math.max(0, a - 1)); }}
                disabled={active === 0}
              >‹</button>
              <button
                className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                onClick={e => { e.stopPropagation(); setActive(a => Math.min(p.images.length - 1, a + 1)); }}
                disabled={active === p.images.length - 1}
              >›</button>
              <div className={styles.lightboxDots} onClick={e => e.stopPropagation()}>
                {p.images.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.lightboxDot} ${i === active ? styles.lightboxDotActive : ''}`}
                    onClick={() => setActive(i)}
                    aria-label={`Imaginea ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
