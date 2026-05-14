import styles from './Empty.module.css';

const DEFAULT_ICON = (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    <line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);

export default function Empty({ icon, title, body, action }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.iconWrap}>{icon || DEFAULT_ICON}</div>
      <div className={styles.title}>{title}</div>
      {body && <div className={styles.body}>{body}</div>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
