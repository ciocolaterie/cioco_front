import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import useStoreInfo from '../../hooks/useStoreInfo.js';
import styles from './Header.module.css';

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
}

const NAV_LINKS = [
  { to: '/catalog', label: 'Catalog' },
  { to: '/catalog?cat=Cadouri', label: 'Cadouri' },
  { to: '/despre', label: 'Despre' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const { user, isAdmin } = useAuth();
  const { count, favorites } = useCart();
  const { storeName } = useStoreInfo();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const onSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setOpen(false);
    }
  };

  return (
    <header className={styles.header}>
      <div className={`container ${styles.row}`}>
        <Link to="/" className={styles.logo} onClick={() => setOpen(false)}>
          <span className={styles.mark}>{(storeName || 'C')[0].toLowerCase()}</span>
          <span className={styles.brand}>{storeName || 'Ciocolaterie'}</span>
        </Link>

        <nav className={styles.nav}>
          {NAV_LINKS.map(l => (
            <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
          ))}
        </nav>

        <form className={styles.searchForm} onSubmit={onSearch}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className={styles.searchInput}
            placeholder="Caută în catalog..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className={styles.actions}>
          <Link to="/favorite" className={styles.iconBtn} title="Favorite">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {favorites.length > 0 && <span className={styles.badge}>{favorites.length}</span>}
          </Link>

          {user ? (
            <Link to={isAdmin ? '/admin' : '/cont'} className={styles.avatarBtn} title={user.name}>
              <span className={styles.avatar}>{initials(user.name)}</span>
              <span className={styles.avatarName}>{user.name.split(' ')[0]}</span>
            </Link>
          ) : (
            <Link to="/login" className={styles.loginBtn}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Login
            </Link>
          )}

          <Link to="/cos" className={styles.iconBtn} title="Coș">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            {count > 0 && <span className={styles.badge}>{count}</span>}
          </Link>

          <button className={styles.hamburger} onClick={() => setOpen(o => !o)} aria-label="Meniu">
            <span style={open ? { transform: 'translateY(6.5px) rotate(45deg)' } : {}} />
            <span style={open ? { opacity: 0 } : {}} />
            <span style={open ? { transform: 'translateY(-6.5px) rotate(-45deg)' } : {}} />
          </button>
        </div>
      </div>

      {open && (
        <div className={styles.drawer}>
          <form className={styles.drawerSearch} onSubmit={onSearch}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              placeholder="Caută în catalog..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          {NAV_LINKS.map(l => (
            <Link key={l.to} to={l.to} className={styles.drawerLink} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          {!user && (
            <Link to="/login" className={styles.drawerLink} onClick={() => setOpen(false)}>
              Login / Cont nou
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
