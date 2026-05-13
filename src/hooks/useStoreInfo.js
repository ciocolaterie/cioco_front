import { useEffect, useState } from 'react';
import api from '../services/api.js';

const DEFAULTS = {
  storeName: 'Ciocolaterie',
  storePhone: '+40 722 000 000',
  storeEmail: 'salut@ciocolaterie.ro',
  storeAddress: '',
  storeLat: null,
  storeLng: null,
  schedule: [],
  zones: [],
};

let _cache = null;

export function clearStoreCache() { _cache = null; }

export default function useStoreInfo() {
  const [info, setInfo] = useState(_cache || DEFAULTS);

  useEffect(() => {
    if (_cache) return;
    api.get('/settings/info')
      .then(r => { _cache = r.data; setInfo(r.data); })
      .catch(() => {});
  }, []);

  return info;
}
