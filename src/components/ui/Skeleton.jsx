import styles from './Skeleton.module.css';

export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={styles.img} />
      <div className={styles.body}>
        <div className={`${styles.line} ${styles.lineShort}`} />
        <div className={`${styles.line} ${styles.lineMed}`} />
        <div className={`${styles.line} ${styles.lineThin}`} />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 4 }) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className={styles.row}>
      <div className={`${styles.line} ${styles.lineMed}`} />
      <div className={`${styles.line} ${styles.lineShort}`} />
      <div className={`${styles.line} ${styles.lineXs}`} />
    </div>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <div className={styles.list}>
      {Array.from({ length: count }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}
