import { useEffect } from 'react';

export default function useScrollReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const observe = () => {
      document.querySelectorAll('[data-reveal]').forEach((el) => {
        if (!el.classList.contains('visible')) obs.observe(el);
      });
    };

    observe();

    // Watch briefly for late-rendering dynamic sections (testimonials etc.)
    const mut = new MutationObserver(observe);
    mut.observe(document.body, { childList: true, subtree: true });
    const stop = setTimeout(() => mut.disconnect(), 4000);

    return () => {
      obs.disconnect();
      mut.disconnect();
      clearTimeout(stop);
    };
  }, []);
}
