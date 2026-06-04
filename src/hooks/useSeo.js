import { useEffect } from 'react';

const BASE = 'Ciocolateria';

function upsertMeta(attr, name, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export default function useSeo({ title, description, image, type = 'website', jsonLd } = {}) {
  useEffect(() => {
    document.title = title ? `${title} — ${BASE}` : BASE;
    upsertMeta('property', 'og:title',       title ? `${title} — ${BASE}` : BASE);
    upsertMeta('property', 'og:type',        type);
    upsertMeta('property', 'og:url',         window.location.href);
    upsertMeta('property', 'og:site_name',   BASE);
    if (description) {
      upsertMeta('name',     'description',    description);
      upsertMeta('property', 'og:description', description);
      upsertMeta('name',     'twitter:card',   'summary_large_image');
      upsertMeta('name',     'twitter:description', description);
    }
    if (image) {
      upsertMeta('property', 'og:image',       image);
      upsertMeta('name',     'twitter:image',  image);
    }
  }, [title, description, image, type]);

  useEffect(() => {
    if (!jsonLd) return;
    let script = document.getElementById('ld-json-main');
    if (!script) {
      script = document.createElement('script');
      script.id = 'ld-json-main';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);
    return () => { script.textContent = '{}'; };
  }, [JSON.stringify(jsonLd)]); // eslint-disable-line
}
