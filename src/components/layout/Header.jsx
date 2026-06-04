import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import useStoreInfo from '../../hooks/useStoreInfo.js';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import styles from './Header.module.css';

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
}

const NAV_LINKS = [
  { to: '/catalog',          label: 'Catalog'  },
  { to: '/catalog?cat=Cadouri', label: 'Cadouri'  },
  { to: '/despre',           label: 'Despre'   },
  { to: '/contact',          label: 'Contact'  },
];

export default function Header() {
  const { user, isAdmin } = useAuth();
  const { count, favorites, openCart } = useCart();
  const { storeName } = useStoreInfo();
  const navigate = useNavigate();

  const [search, setSearch]       = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [badgePop, setBadgePop]   = useState(false);
  const prevCount = useRef(count);
  const searchRef = useRef(null);

  /* cart badge pop animation */
  useEffect(() => {
    if (count > prevCount.current) {
      setBadgePop(true);
      const t = setTimeout(() => setBadgePop(false), 400);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  /* scroll shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ESC closes search overlay */
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') closeSearch(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  /* focus input when overlay opens */
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  const openSearch = () => { setSearch(''); setSearchOpen(true); setMenuOpen(false); };
  const closeSearch = () => { setSearchOpen(false); setSearch(''); };

  const onSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(search.trim())}`);
      closeSearch();
      setMenuOpen(false);
    }
  };

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <div className={`container ${styles.row}`}>

          {/* Logo */}
          <Link to="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
            <span className={styles.mark}>{(storeName || 'C')[0].toLowerCase()}</span>
            <span className={styles.brand}>{storeName || 'Ciocolaterie'}</span>
          </Link>

          {/* Desktop nav */}
          <nav className={styles.nav}>
            {NAV_LINKS.map(l => (
              <NavLink key={l.to} to={l.to}>{l.label}</NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className={styles.actions}>
            <ThemeToggle className={styles.themeBtn} />

            <button className={styles.iconBtn} onClick={openSearch} title="Caută" aria-label="Caută">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>

            <Link to="/favorite" className={styles.iconBtn} title="Favorite">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {favorites.length > 0 && <span className={styles.badge}>{favorites.length}</span>}
            </Link>

            <span className={styles.userArea}>
              {user ? (
                <Link to={isAdmin ? '/admin' : '/cont'} className={styles.avatarBtn} title={user.name}>
                  <span className={styles.avatar}>{initials(user.name)}</span>
                  <span className={styles.avatarName}>{user.name.split(' ')[0]}</span>
                </Link>
              ) : (
                <Link to="/login" className={styles.loginBtn}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  Login
                </Link>
              )}
            </span>

            <button className={`${styles.iconBtn} ${styles.cartBtn}`} onClick={openCart} title="Coș">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              {count > 0 && <span className={`${styles.badge} ${badgePop ? styles.badgePop : ''}`}>{count}</span>}
            </button>

            <button className={styles.hamburger} onClick={() => setMenuOpen(o => !o)} aria-label="Meniu">
              <span style={menuOpen ? { transform: 'translateY(6.5px) rotate(45deg)' } : {}} />
              <span style={menuOpen ? { opacity: 0 } : {}} />
              <span style={menuOpen ? { transform: 'translateY(-6.5px) rotate(-45deg)' } : {}} />
            </button>
          </div>
        </div>

      </header>

      {/* Mobile drawer — side panel */}
      {menuOpen && (
        <>
          <div className={styles.drawerBackdrop} onClick={() => setMenuOpen(false)} />
          <div className={styles.drawer}>

            <div className={styles.drawerTop}>
              <span className={styles.drawerBrand}>{storeName || 'Ciocolaterie'}</span>
              <button className={styles.drawerClose} onClick={() => setMenuOpen(false)} aria-label="Închide">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <nav className={styles.drawerNav}>
              {NAV_LINKS.map(l => (
                <Link key={l.to} to={l.to} className={styles.drawerLink} onClick={() => setMenuOpen(false)}>
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className={styles.drawerFooter}>
              {user ? (
                <Link to={isAdmin ? '/admin' : '/cont'} className={styles.drawerAccount} onClick={() => setMenuOpen(false)}>
                  <span className={styles.drawerAvatar}>{initials(user.name)}</span>
                  <div>
                    <div className={styles.drawerAccountName}>{user.name.split(' ')[0]}</div>
                    <div className={styles.drawerAccountSub}>Contul meu</div>
                  </div>
                </Link>
              ) : (
                <Link to="/login" className={styles.drawerLoginBtn} onClick={() => setMenuOpen(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  Login / Cont nou
                </Link>
              )}
              <div className={styles.drawerTheme}>
                <span className={styles.drawerThemeLabel}>Temă</span>
                <ThemeToggle />
              </div>
            </div>

          </div>
        </>
      )}

      {/* Search overlay */}
      {searchOpen && (
        <div className={styles.searchOverlay} onClick={closeSearch}>
          <div className={styles.searchBox} onClick={e => e.stopPropagation()}>
            <form className={styles.searchForm} onSubmit={onSearch}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={styles.searchIco}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                ref={searchRef}
                className={styles.searchInput}
                placeholder="Caută produse, ciocolată, cadouri…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" className={styles.searchClear} onClick={() => setSearch('')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </form>
            <p className={styles.searchHint}>Apasă <kbd>Enter</kbd> pentru a căuta · <kbd>Esc</kbd> pentru a închide</p>
          </div>
        </div>
      )}
    </>
  );
}
