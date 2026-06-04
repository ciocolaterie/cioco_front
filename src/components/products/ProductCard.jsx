import { memo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import QuickViewModal from './QuickViewModal.jsx';
import styles from './ProductCard.module.css';

function Stars({ rating = 0, count = 0 }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className={styles.stars}>
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < full ? styles.starFull : (i === full && half ? styles.starHalf : styles.starEmpty)}>★</span>
      ))}
      {count > 0 && <span className={styles.starsCount}>{rating.toFixed(1)} · {count} recenzii</span>}
    </div>
  );
}

const SKIP_TAGS = new Set(['best-seller', 'bestseller', 'new', 'featured']);

function ProductCard({ product }) {
  const { addToCart, toggleFavorite, favorites } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const [qvOpen, setQvOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const cardRef = useRef(null);
  const isFav = favorites.includes(product._id);
  const isBestSeller = product.tags?.includes('best-seller') || product.tags?.includes('bestseller');
  const outOfStock = product.stock === 0;
  const lowStock = !outOfStock && product.stock > 0 && product.stock <= 3;
  const isNew = product.createdAt && (Date.now() - new Date(product.createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000;

  const handleMouseMove = (e) => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const rect = cardRef.current.getBoundingClientRect();
    const rotY = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 7;
    const rotX = -((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * 4;
    cardRef.current.style.transition = 'transform 0.05s ease-out';
    cardRef.current.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  };
  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transition = 'transform 0.4s ease';
    cardRef.current.style.transform = '';
  };

  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${outOfStock ? styles.cardSoldOut : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Link to={`/produs/${product._id}`} className={styles.imageWrap} data-cursor="→">
        {product.images?.[0]
          ? <img src={product.images[0]} alt={product.name} className={`${styles.img} ${imgLoaded ? styles.imgLoaded : ''}`} loading="lazy" onLoad={() => setImgLoaded(true)} />
          : <div className={styles.imgPlaceholder} />
        }
        {outOfStock && <div className={styles.soldOutOverlay}>Epuizat</div>}
        {!outOfStock && isBestSeller && <span className={styles.bestBadge}>Best seller</span>}
        {lowStock && <span className={styles.lowStockBadge}>Ultimele {product.stock}</span>}
        {isNew && !isBestSeller && !outOfStock && !lowStock && <span className={styles.newBadge}>Nou</span>}
        <div className={styles.imgCaption}>{product.name.toUpperCase()}</div>
        {!outOfStock && (
          <button
            className={styles.qvBtn}
            onClick={e => { e.preventDefault(); setQvOpen(true); }}
            aria-label="Previzualizare rapidă"
            data-cursor=""
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span className={styles.qvBtnLabel}>Previzualizare</span>
          </button>
        )}
      </Link>
      {qvOpen && <QuickViewModal product={product} onClose={() => setQvOpen(false)} />}

      <button
        className={`${styles.favBtn} ${isFav ? styles.favActive : ''}`}
        onClick={(e) => { e.preventDefault(); toggleFavorite(product._id); }}
        aria-label="Favorite"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>

      <div className={styles.body}>
        <div className={styles.nameRow}>
          <Link to={`/produs/${product._id}`} className={styles.name}>{product.name}</Link>
          <div className={styles.priceBox}>
            <span className={styles.price}>{product.price?.toFixed(2)}</span>
            <span className={styles.ron}>RON</span>
          </div>
        </div>
        <Stars rating={product.rating || 0} count={product.reviewsCount || 0} />
        {product.short && <p className={styles.short}>{product.short}</p>}
        {product.tags?.filter(t => !SKIP_TAGS.has(t)).length > 0 && (
          <div className={styles.tags}>
            {product.tags.filter(t => !SKIP_TAGS.has(t)).slice(0, 3).map(tag => (
              <button
                key={tag}
                className={styles.tagChip}
                onClick={(e) => { e.preventDefault(); navigate(`/catalog?tags=${encodeURIComponent(tag)}`); }}
              >{tag}</button>
            ))}
          </div>
        )}
        <button
          className={`${styles.addBtn} ${added ? styles.addBtnAdded : ''}`}
          disabled={outOfStock}
          onClick={() => {
            if (outOfStock) return;
            addToCart(product);
            setAdded(true);
            setTimeout(() => setAdded(false), 1200);
          }}
        >
          {outOfStock ? 'Epuizat' : added ? '✓ Adăugat' : '+ Adaugă în coș'}
        </button>
      </div>
    </div>
  );
}

export default memo(ProductCard);
