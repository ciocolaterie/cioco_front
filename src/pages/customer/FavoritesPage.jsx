import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { listProducts } from '../../services/products.service.js';
import ProductCard from '../../components/products/ProductCard.jsx';
import Empty from '../../components/ui/Empty.jsx';
import { SkeletonGrid } from '../../components/ui/Skeleton.jsx';
import usePageTitle from '../../hooks/usePageTitle.js';
import styles from './FavoritesPage.module.css';

export default function FavoritesPage() {
  usePageTitle('Favorite');
  const { favorites } = useCart();
  const [all, setAll] = useState(null);
  useEffect(() => {
    if (favorites.length === 0) { setAll([]); return; }
    listProducts({ ids: favorites.join(',') }).then(setAll).catch(() => setAll([]));
  }, []);
  if (!all) return <div className="container" style={{ padding: '40px 0' }}><SkeletonGrid count={4} /></div>;
  const favs = all;
  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.title}>Favorite</h1>
      {favs.length === 0
        ? <Empty icon="♡" title="Nimic la favorite încă" body="Apasă inima pe orice produs ca să-l salvezi aici." action={<Link to="/catalog" style={{ color: 'var(--accent)', fontWeight: 600 }}>Catalog →</Link>} />
        : <div className={styles.grid}>
            {favs.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
      }
    </div>
  );
}
