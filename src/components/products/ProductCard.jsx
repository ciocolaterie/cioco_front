import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
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

export default function ProductCard({ product }) {
  const { addToCart, toggleFavorite, favorites } = useCart();
  const [added, setAdded] = useState(false);
  const isFav = favorites.includes(product._id);
  const isBestSeller = product.tags?.includes('best-seller') || product.tags?.includes('bestseller');
  const outOfStock = product.stock === 0;
  const lowStock = !outOfStock && product.stock > 0 && product.stock <= 3;

  return (
    <div className={`${styles.card} ${outOfStock ? styles.cardSoldOut : ''}`}>
      <Link to={`/produs/${product._id}`} className={styles.imageWrap}>
        {product.images?.[0]
          ? <img src={product.images[0]} alt={product.name} className={styles.img} loading="lazy" />
          : <div className={styles.imgPlaceholder} />
        }
        {outOfStock && <div className={styles.soldOutOverlay}>Epuizat</div>}
        {!outOfStock && isBestSeller && <span className={styles.bestBadge}>Best seller</span>}
        {lowStock && <span className={styles.lowStockBadge}>Ultimele {product.stock}</span>}
        <div className={styles.imgCaption}>{product.name.toUpperCase()}</div>
      </Link>

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
