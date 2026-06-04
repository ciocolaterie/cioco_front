import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import styles from './CartDrawer.module.css';

export default function CartDrawer() {
  const { cart, updateQty, removeFromCart, subtotal, count, cartOpen, closeCart } = useCart();

  const closeCartRef = useRef(closeCart);
  closeCartRef.current = closeCart;

  useEffect(() => {
    if (!cartOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') closeCartRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [cartOpen]);

  if (!cartOpen) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={closeCart} />
      <div className={styles.drawer}>
        <div className={styles.head}>
          <h2 className={styles.title}>
            Coș
            {count > 0 && <span className={styles.count}>{count}</span>}
          </h2>
          <button className={styles.close} onClick={closeCart} aria-label="Închide">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {cart.length === 0 ? (
          <div className={styles.empty}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" color="var(--ink-3)">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <p>Coșul e gol.</p>
            <button className={styles.emptyBtn} onClick={closeCart}>
              Continuă cumpărăturile
            </button>
          </div>
        ) : (
          <>
            <div className={styles.items}>
              {cart.map(item => (
                <div key={item.product} className={styles.item}>
                  <Link to={`/produs/${item.product}`} className={styles.thumb} onClick={closeCart}>
                    {item.image
                      ? <img src={item.image} alt={item.name} />
                      : <div className={styles.thumbPlaceholder} />}
                  </Link>
                  <div className={styles.info}>
                    <Link to={`/produs/${item.product}`} className={styles.name} onClick={closeCart}>
                      {item.name}
                    </Link>
                    <div className={styles.price}>{item.price.toFixed(2)} lei / buc</div>
                    <div className={styles.qty}>
                      <button onClick={() => updateQty(item.product, item.qty - 1)}>−</button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateQty(item.product, item.qty + 1)}>+</button>
                    </div>
                  </div>
                  <div className={styles.itemRight}>
                    <div className={styles.lineTotal}>{(item.price * item.qty).toFixed(2)} lei</div>
                    <button className={styles.remove} onClick={() => removeFromCart(item.product)} aria-label="Șterge">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.footer}>
              <div className={styles.subtotalRow}>
                <span>Subtotal</span>
                <span className={styles.subtotalVal}>{subtotal.toFixed(2)} lei</span>
              </div>
              <Link to="/checkout" className={styles.checkoutBtn} onClick={closeCart}>
                Comandă acum →
              </Link>
              <Link to="/cos" className={styles.cartLink} onClick={closeCart}>
                Vezi coșul complet
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
