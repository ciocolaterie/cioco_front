import { useEffect, useRef, useState } from 'react';
import usePageTitle from '../../hooks/usePageTitle.js';
import useStoreInfo from '../../hooks/useStoreInfo.js';
import useScrollReveal from '../../hooks/useScrollReveal.js';
import api from '../../services/api.js';
import styles from './AboutPage.module.css';

const VALUES = [
  {
    num: '01',
    title: 'Ingrediente Reale',
    body: 'Ciocolată belgiană 65–85% cacao, fistic iranian, fructe românești de sezon. Nicio grăsime vegetală, niciun conservant.',
  },
  {
    num: '02',
    title: 'Meșteșug Manual',
    body: 'Fiecare bucată e turnată, decorată și ambalată de mână, în șarje mici săptămânale. Nu avem linie de producție industrială.',
  },
  {
    num: '03',
    title: 'Relație Directă',
    body: 'Te sunăm pentru fiecare comandă. Plata cash, fără intermediari. Te recunoaștem după nume, nu după numărul de ordine.',
  },
];

function useCountUp(target, active, { duration = 1400, decimals = 0 } = {}) {
  const [value, setValue] = useState(null);
  const started = useRef(false);
  useEffect(() => {
    if (!active || target == null) return;
    if (started.current) return;
    started.current = true;
    const t = Number(target);
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setValue((t * ease).toFixed(decimals));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target]);
  return value;
}

export default function AboutPage() {
  usePageTitle('Despre noi');
  useScrollReveal();
  const store = useStoreInfo();
  const [publicStats, setPublicStats] = useState(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    api.get('/settings/stats').then(r => setPublicStats(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setStatsVisible(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const ordersVal  = useCountUp(publicStats?.monthlyOrders, statsVisible);
  const productsVal = useCountUp(publicStats?.productCount,  statsVisible);
  const ratingVal  = useCountUp(publicStats?.avgRating,     statsVisible, { decimals: 1 });

  const fmt = (v, fallback) => v !== null ? v : (publicStats ? '0' : fallback ?? '—');

  return (
    <div className={styles.page}>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent} data-reveal>
          <div className={styles.eyebrow}>POVESTEA NOASTRĂ</div>
          <h1 className={styles.heroTitle}>
            O bucătărie mică,<br />o pasiune mare.
          </h1>
          <p className={styles.heroSub}>
            Ciocolată artizanală făcută cu mâna, cu răbdare și cu ingrediente adevărate.
          </p>
        </div>
        <div className={styles.heroScroll} data-reveal data-delay="1">↓</div>
      </section>

      {/* STORY */}
      <section className={styles.story}>
        <div className="container">
          <div className={styles.storyGrid}>
            <div className={styles.storyText} data-reveal>
              <div className={styles.storyEyebrow}>CUM AM ÎNCEPUT</div>
              <p className={styles.storyLead}>
                Am început în 2022 într-o bucătărie de bloc, cu un set de matrițe de policarbonat și o pasiune ciudată pentru ciocolata Dubai.
              </p>
              <p className={styles.storyBody}>
                Astăzi, după multe nopți, multe greșeli și mult fistic, lucrăm dintr-un atelier mic
                {store.storeAddress ? ` la ${store.storeAddress}` : ''}. Fiecare rețetă a trecut prin zeci de teste. Fiecare ciocolată pe care o primești a trecut prin mâinile noastre.
              </p>
              <p className={styles.storyBody}>
                Folosim ciocolată belgiană origine 65–85% cacao, fistic adevărat din Iran, fructe românești de sezon. Nu adăugăm conservanți, nu folosim grăsimi vegetale ieftine, nu cumpărăm pre-fabricate.
              </p>
              {store.storeAddress && (
                <div className={styles.storyAtelier}>
                  <span className={styles.storyAtelierLabel}>ATELIER</span>
                  <span className={styles.storyAtelierAddr}>{store.storeAddress}</span>
                </div>
              )}
            </div>

            <div className={styles.storyImgWrap} data-reveal data-delay="1">
              <img
                className={styles.storyImg}
                src="https://res.cloudinary.com/do3wzvgto/image/upload/v1780765890/ciocolaterie/about-story.jpg"
                alt="Ciocolată artizanală"
              />
              <div className={styles.storyImgBadge}>
                <span className={styles.storyImgBadgeMark}>c</span>
                <span className={styles.storyImgBadgeText}>din 2022</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className={styles.values}>
        <div className="container">
          <div className={styles.valuesHeader} data-reveal>
            <div className={styles.eyebrow}>DE CE NOI</div>
            <h2 className={styles.valuesTitle}>Ce ne face diferiți</h2>
          </div>
          <div className={styles.valuesGrid}>
            {VALUES.map((v, i) => (
              <div key={v.num} className={styles.valueCard} data-reveal data-delay={String(i + 1)}>
                <span className={styles.valueNum}>{v.num}</span>
                <h3 className={styles.valueTitle}>{v.title}</h3>
                <p className={styles.valueBody}>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className={styles.statsSection} ref={statsRef}>
        <div className="container">
          <div className={styles.statsGrid}>
            <div className={styles.statItem} data-reveal>
              <span className={styles.statNum}>{fmt(ordersVal)}</span>
              <span className={styles.statLabel}>COMENZI LUNA ACEASTA</span>
            </div>
            <div className={styles.statDiv} />
            <div className={styles.statItem} data-reveal data-delay="1">
              <span className={styles.statNum}>{fmt(productsVal)}</span>
              <span className={styles.statLabel}>PRODUSE ÎN CATALOG</span>
            </div>
            <div className={styles.statDiv} />
            <div className={styles.statItem} data-reveal data-delay="2">
              <span className={styles.statNum}>{fmt(ratingVal)}</span>
              <span className={styles.statLabel}>RATING MEDIU</span>
            </div>
          </div>
        </div>
      </section>

      {/* CLOSING QUOTE */}
      <section className={styles.quoteSection}>
        <div className="container">
          <div className={styles.quoteWrap} data-reveal>
            <div className={styles.quoteMark}>"</div>
            <blockquote className={styles.quoteText}>
              Ciocolată bună nu se grăbește.
            </blockquote>
            <div className={styles.quoteLine} />
            <p className={styles.quoteAttr}>{store.storeName || 'Ciocolaterie'} · Artizanal din 2022</p>
          </div>
        </div>
      </section>

    </div>
  );
}
