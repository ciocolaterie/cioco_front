import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import styles from './BottomNav.module.css';

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
}

export default function BottomNav() {
  const { count } = useCart();
  const { user } = useAuth();
  const { pathname } = useLocation();

  const active = (path) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  return (
    <nav className={styles.nav} aria-label="Navigare principală">
      <Link to="/" className={`${styles.tab} ${active('/') ? styles.active : ''}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Acasă</span>
      </Link>

      <Link to="/catalog" className={`${styles.tab} ${active('/catalog') ? styles.active : ''}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
        <span>Catalog</span>
      </Link>

      <Link to="/cos" className={`${styles.tab} ${active('/cos') ? styles.active : ''}`}>
        <span className={styles.iconWrap}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          {count > 0 && <span className={styles.badge}>{count > 9 ? '9+' : count}</span>}
        </span>
        <span>Coș</span>
      </Link>

      <Link
        to={user ? '/cont' : '/login'}
        className={`${styles.tab} ${(active('/cont') || active('/login')) ? styles.active : ''}`}
      >
        {user ? (
          <span className={styles.avatar}>{initials(user.name)}</span>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        )}
        <span>{user ? user.name.split(' ')[0] : 'Cont'}</span>
      </Link>
    </nav>
  );
}
