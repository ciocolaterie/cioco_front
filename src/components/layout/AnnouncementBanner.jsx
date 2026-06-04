import { useState } from 'react';
import useStoreInfo from '../../hooks/useStoreInfo.js';
import styles from './AnnouncementBanner.module.css';

export default function AnnouncementBanner() {
  const { banner } = useStoreInfo();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('banner-dismissed') === banner?.text
  );

  if (!banner?.active || !banner?.text || dismissed) return null;

  const dismiss = () => {
    sessionStorage.setItem('banner-dismissed', banner.text);
    setDismissed(true);
  };

  return (
    <div className={`${styles.banner} ${styles[banner.color] || styles.accent}`}>
      <span className={styles.text}>{banner.text}</span>
      <button className={styles.close} onClick={dismiss} aria-label="Închide anunț">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}
