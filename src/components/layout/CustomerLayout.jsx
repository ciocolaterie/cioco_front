import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import CartDrawer from './CartDrawer.jsx';
import ScrollToTop from './ScrollToTop.jsx';
import AnnouncementBanner from './AnnouncementBanner.jsx';
import styles from './CustomerLayout.module.css';

export default function CustomerLayout() {
  const { pathname } = useLocation();
  const wrapRef  = useRef(null);
  const dotRef   = useRef(null);
  const labelRef = useRef(null);
  const pos    = useRef({ x: -200, y: -200 });
  const target = useRef({ x: -200, y: -200 });

  useEffect(() => {
    let raf;
    const tick = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.14;
      pos.current.y += (target.current.y - pos.current.y) * 0.14;
      if (wrapRef.current) {
        wrapRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e) => { target.current = { x: e.clientX, y: e.clientY }; };
    const onOver = (e) => {
      const el  = e.target.closest('[data-cursor]');
      const dot = dotRef.current;
      const lbl = labelRef.current;
      if (el && el.dataset.cursor) {
        dot?.classList.add(styles.dotExpanded);
        if (lbl) lbl.textContent = el.dataset.cursor;
      } else {
        dot?.classList.remove(styles.dotExpanded);
        if (lbl) lbl.textContent = '';
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
    };
  }, []);

  return (
    <>
      <div ref={wrapRef} className={styles.cursorWrap} aria-hidden="true">
        <div ref={dotRef} className={styles.cursorDot}>
          <span ref={labelRef} className={styles.cursorLabel} />
        </div>
      </div>
      <ScrollToTop />
      <CartDrawer />
      <AnnouncementBanner />
      <Header />
      <div className={styles.content}>
        <main key={pathname} className={styles.outlet}>
          <Outlet />
        </main>
        {!['/login', '/forgot-password', '/reset-password'].includes(pathname) && <Footer />}
      </div>
    </>
  );
}
