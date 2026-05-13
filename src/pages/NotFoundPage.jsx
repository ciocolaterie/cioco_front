import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.num}>404</div>
        <h1 className={styles.title}>Pagina nu există</h1>
        <p className={styles.desc}>Pagina pe care o cauți a fost mutată sau nu a existat niciodată.</p>
        <Link to="/" className={styles.btn}>Înapoi la magazin</Link>
      </div>
    </div>
  );
}
