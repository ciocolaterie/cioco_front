import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import useStoreInfo from '../../hooks/useStoreInfo.js';
import styles from './Footer.module.css';

export default function Footer() {
  const { isAdmin } = useAuth();
  const store = useStoreInfo();

  const scheduleText = (() => {
    const open = (store.schedule || []).filter(s => !s.closed);
    const closed = (store.schedule || []).filter(s => s.closed);
    if (!open.length) return 'Temporar închis';
    const hrs = [...new Set(open.map(s => s.hours))];
    if (hrs.length === 1) {
      const f = open[0].day.slice(0, 2);
      const l = open[open.length - 1].day.slice(0, 2);
      const range = f === l ? f : `${f}–${l}`;
      return `${range}, ${hrs[0]}${closed.length ? ` · ${closed.map(s => s.day.slice(0, 2)).join(', ')} închis` : ''}`;
    }
    return open.map(s => `${s.day.slice(0, 3)}: ${s.hours}`).join(' · ');
  })();

  return (
    <footer className={styles.footer}>
      <div className={styles.accentBar} />

      <div className={`container ${styles.grid}`}>
        <div className={styles.about}>
          <div className={styles.logoGroup}>
            <div className={styles.mark}>{(store.storeName || 'C')[0].toLowerCase()}</div>
            <div className={styles.logo}>{store.storeName}</div>
          </div>
          <p className={styles.desc}>
            Ciocolată artizanală făcută în casă, cu ingrediente atent selecționate.
            Comenzi cu ridicare din magazin sau livrare la adresă.
          </p>
          <div className={styles.socials}>
            {store.storePhone && (
              <a href={`tel:${store.storePhone.replace(/\s/g,'')}`} className={styles.socialBtn} aria-label="Telefon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/>
                </svg>
              </a>
            )}
            {store.storePhone && (
              <a href={`https://wa.me/${store.storePhone.replace(/\D/g,'')}`} className={`${styles.socialBtn} ${styles.whatsapp}`} aria-label="WhatsApp">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
              </a>
            )}
            {store.storeEmail && (
              <a href={`mailto:${store.storeEmail}`} className={styles.socialBtn} aria-label="Email">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </a>
            )}
          </div>
        </div>

        <div className={styles.col}>
          <div className={styles.colHead}>Magazin</div>
          <Link to="/catalog">Catalog</Link>
          <Link to="/catalog?cat=Cadouri">Cadouri</Link>
          <Link to="/favorite">Favorite</Link>
        </div>

        <div className={styles.col}>
          <div className={styles.colHead}>Companie</div>
          <Link to="/despre">Despre noi</Link>
          <Link to="/contact">Contact</Link>
          {isAdmin && <Link to="/admin">Admin</Link>}
        </div>

        <div className={styles.col}>
          <div className={styles.colHead}>Contact</div>
          {store.storeAddress && (
            <div className={styles.contactItem}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {store.storeAddress}
            </div>
          )}
          {store.storePhone && (
            <div className={styles.contactItem}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>
              {store.storePhone}
            </div>
          )}
          {store.storeEmail && (
            <div className={styles.contactItem}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              {store.storeEmail}
            </div>
          )}
          <div className={styles.contactItem}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {scheduleText}
          </div>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <span>© {new Date().getFullYear()} {store.storeName}. Toate drepturile rezervate.</span>
        <span className={styles.bottomBadge}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          Plată la livrare sau ridicare
        </span>
      </div>
    </footer>
  );
}
