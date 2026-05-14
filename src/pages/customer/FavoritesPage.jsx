import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { listProducts } from '../../services/products.service.js';
import ProductCard from '../../components/products/ProductCard.jsx';
import Empty from '../../components/ui/Empty.jsx';
import { SkeletonGrid } from '../../components/ui/Skeleton.jsx';
import usePageTitle from '../../hooks/usePageTitle.js';
import styles from './FavoritesPage.module.css';

const HEART_ICON = (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

export default function FavoritesPage() {
  usePageTitle('Favorite');
  const { favorites } = useCart();
  const [all, setAll] = useState(null);
  useEffect(() => {
    if (favorites.length === 0) { setAll([]); return; }
    listProducts({ ids: favorites.join(',') }).then(setAll).catch(() => setAll([]));
  }, [favorites.join(',')]); // eslint-disable-line
  if (!all) return <div className={`container ${styles.page}`}><SkeletonGrid count={4} /></div>;
  const favs = all;
  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.title}>Favorite</h1>
      {favs.length === 0
        ? <Empty icon={HEART_ICON} title="Nimic la favorite încă" body="Apasă inima pe orice produs ca să-l salvezi aici." action={<Link to="/catalog" className={styles.link}>Catalog →</Link>} />
        : <div className={styles.grid}>
            {favs.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
      }
    </div>
  );
}
