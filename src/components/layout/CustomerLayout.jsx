import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import BottomNav from './BottomNav.jsx';
import styles from './CustomerLayout.module.css';

export default function CustomerLayout() {
  const { pathname } = useLocation();
  return (
    <>
      <Header />
      <div className={styles.content}>
        <main key={pathname} style={{ animation: 'fadeIn .22s ease' }}>
          <Outlet />
        </main>
        <Footer />
      </div>
      <BottomNav />
    </>
  );
}
