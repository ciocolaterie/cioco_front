import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listProducts } from '../../services/products.service.js';
import { getFeaturedReviews } from '../../services/reviews.service.js';
import api from '../../services/api.js';
import ProductCard from '../../components/products/ProductCard.jsx';
import { SkeletonGrid } from '../../components/ui/Skeleton.jsx';
import usePageTitle from '../../hooks/usePageTitle.js';
import useStoreInfo from '../../hooks/useStoreInfo.js';
import styles from './HomePage.module.css';

const ICON_MAP = {
  'Tablete': <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="7" width="18" height="10" rx="2"/></svg>,
  'Praline': <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 22 12 12 22 2 12"/></svg>,
  'Trufe': <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>,
  'Fructe glasate': <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a3 3 0 0 1 3 3c0 1-.4 1.9-1 2.6M12 2a3 3 0 0 0-3 3c0 1 .4 1.9 1 2.6M12 8c-4 0-7 2.7-7 7s3 7 7 7 7-3.1 7-7-3-7-7-7z"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/><circle cx="12" cy="17" r="1"/></svg>,
  'Caramele': <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>,
  'Cadouri': <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
};
const DEFAULT_CAT_ICON = <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/></svg>;


export default function HomePage() {
  usePageTitle('');
  const store = useStoreInfo();
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState(null);
  const [siteStats, setSiteStats] = useState(null);
  const [featured, setFeatured] = useState(null);

  useEffect(() => {
    listProducts({ sort: 'rating', limit: 3 }).then(setProducts).catch(() => setProducts([]));
    api.get('/settings/categories').then(r => setCategories(r.data)).catch(() => setCategories(Object.keys(ICON_MAP)));
    api.get('/settings/stats').then(r => setSiteStats(r.data)).catch(() => setSiteStats({}));
    getFeaturedReviews().then(setFeatured).catch(() => setFeatured({ featured: [], heroReview: null }));
  }, []);

  const cats = categories?.length ? categories : (categories === null ? null : Object.keys(ICON_MAP));

  return (
    <div className={styles.page}>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroLeft}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowLine} /> FĂCUT ÎN CASĂ, CU MÂNA
            </div>
            <h1 className={styles.title}>
              Ciocolată artizanală,
              <br />
              <em className={styles.titleEm}>turnată cu grijă.</em>
            </h1>
            <p className={styles.lead}>
              Praline, tablete signature și cadouri, făcute săptămânal în
              atelierul nostru<span className={styles.leadAddr}>{store.storeAddress ? ` din ${store.storeAddress}` : ''}</span>. Comandă online, plătești
              numerar la ridicare sau livrare.
            </p>
            <div className={styles.ctas}>
              <Link to="/catalog" className={styles.btnPrimary}>
                Vezi catalogul <span>→</span>
              </Link>
              <Link to="/despre" className={styles.btnGhost}>Povestea noastră</Link>
            </div>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statNum}>
                  {siteStats === null
                    ? <span className={styles.statSkeleton} />
                    : (siteStats.productCount || '—')}
                </span>
                <span className={styles.statLabel}>PRODUSE</span>
              </div>
              <div className={styles.statDiv} />
              <div className={styles.stat}>
                <span className={styles.statNum}>
                  {siteStats === null
                    ? <span className={styles.statSkeleton} />
                    : (siteStats.avgRating ? siteStats.avgRating.toFixed(1) : '—')}
                </span>
                <span className={styles.statLabel}>RATING MEDIU</span>
              </div>
              <div className={styles.statDiv} />
              <div className={styles.stat}>
                <span className={styles.statNum}>
                  {siteStats === null
                    ? <span className={styles.statSkeleton} />
                    : (siteStats.monthlyOrders ?? '—')}
                </span>
                <span className={styles.statLabel}>COMENZI/LUNĂ</span>
              </div>
            </div>

            {/* Mobile product strip — visible only when heroRight is hidden */}
            {products && products.length > 0 && (
              <div className={styles.heroProducts}>
                {products.slice(0, 3).map(p => (
                  <Link key={p._id} to={`/produs/${p._id}`} className={styles.heroProductThumb}>
                    <div className={styles.heroProductImg}>
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt={p.name} />
                        : null}
                    </div>
                    <span className={styles.heroProductName}>{p.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className={styles.heroRight}>
            <div className={styles.heroImg} />
            {featured?.heroReview && (
              <div className={styles.reviewCard}>
                <div className={styles.reviewStars}>
                  {'★'.repeat(featured.heroReview.rating)} <strong>{featured.heroReview.rating}.0</strong>
                </div>
                <p className={styles.reviewText}>
                  „{featured.heroReview.text.length > 90
                    ? featured.heroReview.text.slice(0, 90) + '…'
                    : featured.heroReview.text}" — {featured.heroReview.name}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <div className={styles.trustStrip}>
        <div className={`container ${styles.trustInner}`}>
          <span className={styles.trustItem}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            100% artizanal
          </span>
          <span className={styles.trustDivider} />
          <span className={styles.trustItem}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            Livrare la adresă
          </span>
          <span className={styles.trustDivider} />
          <span className={styles.trustItem}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            Plată cash la livrare
          </span>
          <span className={styles.trustDivider} />
          <span className={styles.trustItem}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Ridicare din magazin
          </span>
        </div>
      </div>

      {/* CATEGORIES */}
      <section className={`container ${styles.catsSection}`}>
        <div className={styles.sectionHead}>
          <div>
            <div className={styles.sectionEyebrow}>COLECȚIE</div>
            <h2 className={styles.sectionTitle}>Categorii</h2>
          </div>
          <Link to="/catalog" className={styles.sectionLink}>Toate →</Link>
        </div>
        <div className={styles.catsGrid}>
          {cats === null
            ? [...Array(6)].map((_, i) => <div key={i} className={styles.catSkeleton} />)
            : cats.map((name) => (
              <Link
                key={name}
                to={`/catalog?cat=${encodeURIComponent(name)}`}
                className={styles.catCard}
              >
                <div className={styles.catIcon}>{ICON_MAP[name] || DEFAULT_CAT_ICON}</div>
                <span className={styles.catName}>{name}</span>
              </Link>
            ))
          }
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className={`container ${styles.bestsection}`}>
        <div className={styles.sectionHead}>
          <div>
            <div className={styles.sectionEyebrow}>TOP PRODUSE</div>
            <h2 className={styles.sectionTitle}>Cele mai iubite</h2>
          </div>
          <Link to="/catalog" className={styles.sectionLink}>Vezi toate →</Link>
        </div>
        {!products ? (
          <SkeletonGrid count={3} />
        ) : (
          <div className={styles.grid}>
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* TESTIMONIALS — only rendered when there are featured reviews */}
      {featured?.featured?.length > 0 && (
        <section className={styles.testimonialsSection}>
          <div className="container">
            <div className={styles.sectionHead}>
              <div>
                <div className={styles.sectionEyebrow}>RECENZII</div>
                <h2 className={styles.sectionTitle}>Ce spun clienții noștri</h2>
              </div>
            </div>
            <div className={styles.testimonialsGrid}>
              {featured.featured.map((t) => (
                <div key={t._id} className={styles.testimonialCard}>
                  <div className={styles.testimonialQuote}>❝</div>
                  <div className={styles.testimonialStars}>{'★'.repeat(t.rating)}</div>
                  <p className={styles.testimonialText}>{t.text}</p>
                  <div className={styles.testimonialAuthor}>
                    <span className={styles.testimonialName}>{t.name}</span>
                    {t.product?.name && <span className={styles.testimonialLoc}>{t.product.name}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className={styles.process}>
        <div className={`container ${styles.processInner}`}>
          <div className={styles.processLeft}>
            <div className={styles.processEyebrow}>PROCESUL</div>
            <h2 className={styles.processTitle}>Cum comanzi</h2>
            <p className={styles.processDesc}>
              Simplu. Fără cont obligatoriu. Plata se face cash la livrare sau ridicare.
            </p>
          </div>
          <div className={styles.processSteps}>
            {[
              ['01', 'Alegi', 'Răsfoiești catalogul, adaugi în coș cantitățile dorite.'],
              ['02', 'Confirmi', 'Completezi nume, telefon și email. Alegi ridicare sau livrare.'],
              ['03', 'Primești', 'Te sunăm, pregătim comanda. Plătești cash. Bonus: notificări la fiecare etapă.'],
            ].map(([n, t, d]) => (
              <div key={n} className={styles.step}>
                <div className={styles.stepNum}>{n}</div>
                <h3 className={styles.stepTitle}>{t}</h3>
                <p className={styles.stepDesc}>{d}</p>
              </div>
            ))}
          </div>
        </div>
        <div className={`container ${styles.processCta}`}>
          <Link to="/catalog" className={styles.processCtaBtn}>
            Comandă acum →
          </Link>
        </div>
      </section>

    </div>
  );
}
