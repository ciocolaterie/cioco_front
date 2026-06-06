import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle.js';
import styles from './NotFoundPage.module.css';

const LINKS = [
  { to: '/catalog',           label: 'Catalog produse' },
  { to: '/catalog?cat=Praline', label: 'Praline'       },
  { to: '/despre',            label: 'Despre noi'      },
  { to: '/contact',           label: 'Contact'         },
];

export default function NotFoundPage() {
  usePageTitle('404 – Pagina nu există');
  return (
    <div className={styles.page}>
      <div className={styles.bg404}>404</div>

      <div className={styles.inner}>
        <div className={styles.monogram}>c</div>

        <h1 className={styles.title}>
          Pagina s-a<br />rătăcit.
        </h1>
        <p className={styles.desc}>
          Ce cauți nu există sau a fost mutată.<br />
          Dar ciocolata noastră e tot acolo unde o lași.
        </p>

        <div className={styles.actions}>
          <Link to="/" className={styles.btnPrimary}>Acasă</Link>
          <Link to="/catalog" className={styles.btnSecondary}>Catalog →</Link>
        </div>

        <div className={styles.divider} />

        <div className={styles.linksLabel}>Explorează</div>
        <div className={styles.links}>
          {LINKS.map(l => (
            <Link key={l.to} to={l.to} className={styles.chip}>{l.label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
