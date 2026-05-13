import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import Empty from '../../components/ui/Empty.jsx';
import usePageTitle from '../../hooks/usePageTitle.js';
import styles from './CartPage.module.css';

export default function CartPage() {
  usePageTitle('Coș');
  const { cart, updateQty, removeFromCart, subtotal } = useCart();

  if (cart.length === 0) {
    return (
      <div className={`container ${styles.page}`}>
        <h1 className={styles.title}>Coș</h1>
        <Empty
          icon="🛒"
          title="Coșul e gol"
          body="Adaugă câteva ciocolate din catalog."
          action={<Link to="/catalog" className={styles.link}>Vezi catalogul →</Link>}
        />
      </div>
    );
  }

  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.title}>Coș</h1>
      <div className={styles.grid}>
        <div className={styles.items}>
          {cart.map(i => (
            <div key={i.product} className={styles.item}>
              <div className={styles.thumb}>
                {i.image ? <img src={i.image} alt={i.name} /> : <div className={styles.placeholder}>◉</div>}
              </div>
              <div className={styles.info}>
                <div className={styles.name}>{i.name}</div>
                <div className={styles.price}>{i.price.toFixed(2)} lei</div>
              </div>
              <div className={styles.qty}>
                <button onClick={() => updateQty(i.product, i.qty - 1)}>−</button>
                <span>{i.qty}</span>
                <button onClick={() => updateQty(i.product, i.qty + 1)}>+</button>
              </div>
              <div className={styles.lineTotal}>{(i.price * i.qty).toFixed(2)} lei</div>
              <button className={styles.remove} onClick={() => removeFromCart(i.product)}>×</button>
            </div>
          ))}
        </div>

        <aside className={styles.summary}>
          <h3>Sumar</h3>
          <div className={styles.row}><span>Subtotal</span><span>{subtotal.toFixed(2)} lei</span></div>
          <div className={styles.row}><span>Livrare</span><span>se adaugă la checkout</span></div>
          <div className={`${styles.row} ${styles.total}`}><span>Total estimat</span><span>{subtotal.toFixed(2)} lei</span></div>
          <Link to="/checkout" className={styles.checkout}>Continuă către checkout →</Link>
          <Link to="/catalog" className={styles.continue}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Continuă cumpărăturile
          </Link>
        </aside>
      </div>
    </div>
  );
}
