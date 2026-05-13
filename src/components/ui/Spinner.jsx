import styles from './Spinner.module.css';
export default function Spinner({ label = 'Se încarcă…' }) {
  return <div className={styles.wrap}><div className={styles.dot} /> {label}</div>;
}
