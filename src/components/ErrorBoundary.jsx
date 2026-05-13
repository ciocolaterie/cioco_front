import { Component } from 'react';
import styles from './ErrorBoundary.module.css';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.page}>
          <div className={styles.inner}>
            <div className={styles.icon}>✕</div>
            <h2 className={styles.title}>Ceva n-a mers bine</h2>
            <p className={styles.desc}>A apărut o eroare neașteptată. Te rugăm să reîncarci pagina.</p>
            <button className={styles.btn} onClick={() => window.location.reload()}>
              Reîncarcă pagina
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
