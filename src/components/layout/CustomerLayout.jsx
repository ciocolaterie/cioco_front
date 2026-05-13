import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

export default function CustomerLayout() {
  const { pathname } = useLocation();
  return (
    <>
      <Header />
      <main key={pathname} style={{ animation: 'fadeIn .22s ease' }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
