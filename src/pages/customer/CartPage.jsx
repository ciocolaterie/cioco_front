import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import Empty from '../../components/ui/Empty.jsx';
import usePageTitle from '../../hooks/usePageTitle.js';
import styles from './CartPage.module.css';

const CART_ICON = (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

export default function CartPage() {
  usePageTitle('Coș');
  const { cart, updateQty, removeFromCart, subtotal } = useCart();

  if (cart.length === 0) {
    return (
      <div className={`container ${styles.page}`}>
        <h1 className={styles.title}>Coș</h1>
        <Empty
          icon={CART_ICON}
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
              <Link to={`/produs/${i.product}`} className={styles.thumb}>
                {i.image
                  ? <img src={i.image} alt={i.name} />
                  : <div className={styles.placeholder} />}
              </Link>
              <div className={styles.info}>
                <Link to={`/produs/${i.product}`} className={styles.name}>{i.name}</Link>
                <div className={styles.price}>{i.price.toFixed(2)} lei / buc</div>
              </div>
              <div className={styles.right}>
                <div className={styles.qty}>
                  <button onClick={() => updateQty(i.product, i.qty - 1)}>−</button>
                  <span>{i.qty}</span>
                  <button onClick={() => updateQty(i.product, i.qty + 1)}>+</button>
                </div>
                <div className={styles.lineTotal}>{(i.price * i.qty).toFixed(2)} lei</div>
                <button className={styles.remove} onClick={() => removeFromCart(i.product)} aria-label="Șterge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className={styles.summary}>
          <h3>Sumar</h3>
          <div className={styles.row}><span>Subtotal</span><span>{subtotal.toFixed(2)} lei</span></div>
          <div className={styles.row}><span>Livrare</span><span className={styles.deliveryNote}>La checkout</span></div>
          <div className={`${styles.row} ${styles.total}`}><span>Total estimat</span><span>{subtotal.toFixed(2)} lei</span></div>
          <Link to="/checkout" className={styles.checkout}>
            Continuă la checkout
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
          <Link to="/catalog" className={styles.continue}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Continuă cumpărăturile
          </Link>
        </aside>
      </div>
    </div>
  );
}
