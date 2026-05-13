import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle.js';
import { listProducts } from '../../services/products.service.js';
import api from '../../services/api.js';
import ProductCard from '../../components/products/ProductCard.jsx';
import Empty from '../../components/ui/Empty.jsx';
import { SkeletonGrid } from '../../components/ui/Skeleton.jsx';
import styles from './CatalogPage.module.css';

export default function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const category  = params.get('cat')    || 'Toate';
  const search    = params.get('q')      || '';
  const sort      = params.get('sort')   || 'popular';
  const activeTags = params.get('tags')?.split(',').filter(Boolean) || [];
  const inStock   = params.get('inStock') === '1';

  usePageTitle(category === 'Toate' ? 'Catalog' : category);

  const [products,        setProducts]        = useState(null);
  const [cats,            setCats]            = useState(['Toate']);
  const [availTags,       setAvailTags]       = useState([]);
  const [searchInput,     setSearchInput]     = useState(search);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [showFilters,     setShowFilters]     = useState(false);

  useEffect(() => {
    api.get('/settings/categories').then(r => setCats(['Toate', ...r.data])).catch(() => {});
    api.get('/products/tags').then(r => setAvailTags(r.data)).catch(() => {});
  }, []);

  // Sync when URL search changes externally (browser back/forward)
  useEffect(() => { setSearchInput(search); setDebouncedSearch(search); }, [search]);

  // Debounce: fire search 350ms after user stops typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setProducts(null);
    const cat = category === 'Toate' ? '' : category;
    listProducts({
      category: cat,
      search:  debouncedSearch,
      sort,
      tag:     activeTags.length ? activeTags : undefined,
      inStock: inStock ? 'true' : undefined,
    }).then(setProducts).catch(() => setProducts([]));
  }, [category, debouncedSearch, sort, params.get('tags'), inStock]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v && v !== 'Toate') next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  const toggleTag = (tag) => {
    const next = activeTags.includes(tag)
      ? activeTags.filter(t => t !== tag)
      : [...activeTags, tag];
    const p = new URLSearchParams(params);
    if (next.length) p.set('tags', next.join(',')); else p.delete('tags');
    setParams(p, { replace: true });
  };

  const toggleInStock = () => {
    const p = new URLSearchParams(params);
    if (!inStock) p.set('inStock', '1'); else p.delete('inStock');
    setParams(p, { replace: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setParam('q', searchInput.trim());
  };

  const clearSearch = () => { setSearchInput(''); setDebouncedSearch(''); setParam('q', ''); };

  const activeFilterCount = activeTags.length + (inStock ? 1 : 0);
  const hasFilters = search || activeFilterCount > 0 || category !== 'Toate';

  const resetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setParams({}, { replace: true });
  };

  return (
    <div className={styles.page}>
      <div className="container">

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{category === 'Toate' ? 'Catalog' : category}</h1>
            {products !== null && (
              <p className={styles.count}>
                {products.length} produse {hasFilters ? 'găsite' : 'disponibile'}
              </p>
            )}
          </div>
          {hasFilters && (
            <button className={styles.resetBtn} onClick={resetFilters}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Resetează filtrele
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className={styles.catPills}>
          {cats.map((c) => (
            <button key={c} onClick={() => setParam('cat', c)}
              className={`${styles.pill} ${category === c ? styles.pillActive : ''}`}>
              {c}
            </button>
          ))}
        </div>

        <div className={styles.layout}>

          {/* Sidebar */}
          <aside className={`${styles.sidebar} ${showFilters ? styles.sidebarOpen : ''}`}>
            <button className={styles.sidebarClose} onClick={() => setShowFilters(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Închide
            </button>

            <div className={styles.filterSection}>
              <div className={styles.filterLabel}>FILTRE</div>
              <label className={styles.checkLabel}>
                <input type="checkbox" className={styles.check} checked={inStock} onChange={toggleInStock} />
                <span>Doar în stoc</span>
              </label>
            </div>

            {availTags.length > 0 && (
              <div className={styles.filterSection}>
                <div className={styles.filterLabel}>ETICHETE</div>
                {availTags.map((tag) => (
                  <label key={tag} className={styles.checkLabel}>
                    <input type="checkbox" className={styles.check}
                      checked={activeTags.includes(tag)} onChange={() => toggleTag(tag)} />
                    <span>{tag}</span>
                  </label>
                ))}
              </div>
            )}
          </aside>

          {/* Main */}
          <div className={styles.main}>

            {/* Toolbar */}
            <div className={styles.toolbar}>
              <button
                className={`${styles.filterToggleBtn} ${activeFilterCount > 0 ? styles.filterToggleBtnActive : ''}`}
                onClick={() => setShowFilters(v => !v)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
                Filtre
                {activeFilterCount > 0 && <span className={styles.filterBadge}>{activeFilterCount}</span>}
              </button>

              <form onSubmit={handleSearch} className={styles.searchForm}>
                <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  className={styles.searchInput}
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Caută produse…"
                />
                {searchInput && (
                  <button type="button" className={styles.searchClear} onClick={clearSearch}>×</button>
                )}
              </form>

              <select className={styles.sort} value={sort} onChange={(e) => setParam('sort', e.target.value)}>
                <option value="popular">Cele mai populare</option>
                <option value="newest">Cele mai noi</option>
                <option value="price-asc">Preț crescător</option>
                <option value="price-desc">Preț descrescător</option>
                <option value="rating">Rating</option>
              </select>
            </div>

            {/* Active filter chips */}
            {(search || activeTags.length > 0 || inStock) && (
              <div className={styles.chips}>
                {search && (
                  <span className={styles.chip}>
                    „{search}" <button type="button" onClick={clearSearch}>×</button>
                  </span>
                )}
                {inStock && (
                  <span className={styles.chip}>
                    Doar în stoc <button type="button" onClick={toggleInStock}>×</button>
                  </span>
                )}
                {activeTags.map(tag => (
                  <span key={tag} className={styles.chip}>
                    {tag} <button type="button" onClick={() => toggleTag(tag)}>×</button>
                  </span>
                ))}
              </div>
            )}

            {/* Grid */}
            {!products ? (
              <SkeletonGrid count={8} />
            ) : products.length === 0 ? (
              <Empty title="Niciun produs găsit" body="Modifică filtrele și încearcă din nou." />
            ) : (
              <div className={styles.grid}>
                {products.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
