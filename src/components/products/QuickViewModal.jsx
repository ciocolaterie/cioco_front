import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import styles from './QuickViewModal.module.css';

export default function QuickViewModal({ product: p, onClose }) {
  const { addToCart } = useCart();
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const handleAdd = () => {
    addToCart(p, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const full = Math.floor(p.rating || 0);
  const outOfStock = p.stock === 0;

  return createPortal(
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={p.name}>
        <button className={styles.close} onClick={onClose} aria-label="Închide">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className={styles.inner}>
          {/* Image side */}
          <div className={styles.left}>
            <div className={styles.mainImg}>
              {p.images?.[active]
                ? <img src={p.images[active]} alt={p.name} />
                : <div className={styles.imgPlaceholder} />}
            </div>
            {p.images?.length > 1 && (
              <div className={styles.thumbs}>
                {p.images.map((src, i) => (
                  <button
                    key={i}
                    className={`${styles.thumb} ${i === active ? styles.thumbActive : ''}`}
                    onClick={() => setActive(i)}
                  >
                    <img src={src} alt={`${p.name} ${i + 1}`} loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info side */}
          <div className={styles.right}>
            {p.category && <div className={styles.cat}>{p.category}</div>}
            <h2 className={styles.name}>{p.name}</h2>

            {p.rating > 0 && (
              <div className={styles.rating}>
                <span className={styles.stars}>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ color: i < full ? '#C9821A' : 'var(--bg-3)' }}>★</span>
                  ))}
                </span>
                <span className={styles.ratingVal}>{p.rating.toFixed(1)}</span>
                {p.reviewsCount > 0 && <span className={styles.ratingCount}>({p.reviewsCount})</span>}
              </div>
            )}

            {p.short && <p className={styles.short}>{p.short}</p>}

            <div className={styles.price}>
              {p.price?.toFixed(2)} <span className={styles.cur}>lei</span>
            </div>

            {!outOfStock && (
              <div className={styles.qtyRow}>
                <div className={styles.qty}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(p.stock, q + 1))}>+</button>
                </div>
                {p.weight && <span className={styles.weight}>{p.weight}</span>}
              </div>
            )}

            <button
              className={`${styles.addBtn} ${added ? styles.addBtnAdded : ''}`}
              disabled={outOfStock}
              onClick={handleAdd}
            >
              {outOfStock ? 'Stoc epuizat' : added
                ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Adăugat!</>
                : <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    Adaugă în coș
                  </>}
            </button>

            <Link to={`/produs/${p._id}`} className={styles.detailLink} onClick={onClose}>
              Pagina completă →
            </Link>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
