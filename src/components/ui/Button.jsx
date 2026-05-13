import styles from './Button.module.css';

export default function Button({ variant = 'primary', size = 'md', children, className = '', ...props }) {
  return (
    <button className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
