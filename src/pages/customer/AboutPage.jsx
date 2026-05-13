import { useEffect, useState } from 'react';
import usePageTitle from '../../hooks/usePageTitle.js';
import useStoreInfo from '../../hooks/useStoreInfo.js';
import api from '../../services/api.js';
import styles from './AboutPage.module.css';

export default function AboutPage() {
  usePageTitle('Despre noi');
  const store = useStoreInfo();
  const [publicStats, setPublicStats] = useState(null);
  useEffect(() => {
    api.get('/settings/stats').then(r => setPublicStats(r.data)).catch(() => {});
  }, []);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.intro}>
          <div className={styles.eyebrow}>POVESTEA NOASTRĂ</div>
          <h1 className={styles.title}>
            O bucătărie mică,<br />o pasiune mare.
          </h1>
        </div>

        <div className={styles.imgWrap}>
          <div className={styles.img}>
            <div className={styles.imgOverlay}>
              <span className={styles.imgMark}>c</span>
              <p className={styles.imgQuote}>„Ciocolată bună nu se grăbește."</p>
            </div>
          </div>
          {store.storeAddress && (
            <div className={styles.imgCaption}>ATELIER — {store.storeAddress.toUpperCase()}</div>
          )}
        </div>

        <div className={styles.body}>
          <p>
            Am început în 2022 într-o bucătărie de bloc, cu un set de matrițe de policarbonat și o
            pasiune ciudată pentru ciocolata Dubai. Astăzi, după multe nopți, multe greșeli și mult fistic,
            lucrăm dintr-un atelier mic{store.storeAddress ? ` la ${store.storeAddress}` : ''}.
          </p>
          <p>
            Toate ciocolatele sunt făcute manual, în șarje mici, săptămânal. Folosim ciocolată belgiană
            origină 65–85% cacao, fistic adevărat din Iran, fructe românești de sezon. Nu adăugăm
            conservanți, nu folosim grăsimi vegetale ieftine, nu cumpărăm pre-fabricate.
          </p>
          <p>
            Plata se face cash pentru că vrem să rămânem mici, transparenți și aproape de client. Te
            sunăm pentru fiecare comandă. Te recunoaștem după nume.
          </p>
        </div>

        <div className={styles.statsBox}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{publicStats?.monthlyOrders ?? '—'}</span>
            <span className={styles.statLabel}>COMENZI LUNA ACEASTA</span>
          </div>
          <div className={styles.statDiv} />
          <div className={styles.stat}>
            <span className={styles.statNum}>{publicStats?.productCount ?? '—'}</span>
            <span className={styles.statLabel}>PRODUSE ÎN CATALOG</span>
          </div>
          <div className={styles.statDiv} />
          <div className={styles.stat}>
            <span className={styles.statNum}>{publicStats?.avgRating ? `${publicStats.avgRating}★` : '—'}</span>
            <span className={styles.statLabel}>RATING MEDIU</span>
          </div>
        </div>
      </div>
    </div>
  );
}
