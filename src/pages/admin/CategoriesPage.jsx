import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import styles from './CategoriesPage.module.css';

const IcPlus    = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcUp      = <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>;
const IcDown    = <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>;
const IcEdit    = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcTrash   = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IcFolders = <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;

export default function CategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [newName, setNewName]       = useState('');
  const [editIdx, setEditIdx]       = useState(null);
  const [editName, setEditName]     = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () =>
    api.get('/settings').then(r => {
      const cats = (r.data.categories || []).map(c =>
        typeof c === 'string' ? c : (c.name || c)
      ).filter(Boolean);
      setCategories(cats);
    }).catch(() => toast({ title: 'Eroare la încărcare' }));

  useEffect(() => { load(); }, []);

  const persist = async (cats) => {
    setSaving(true);
    try {
      await api.put('/settings', { categories: cats.map(name => ({ name, image: '' })) });
      toast({ title: 'Categorii salvate' });
    } catch { toast({ title: 'Eroare la salvare' }); }
    finally { setSaving(false); }
  };

  const addCategory = async () => {
    const name = newName.trim();
    if (!name) return;
    if (categories.some(c => c.toLowerCase() === name.toLowerCase()))
      return toast({ title: 'Categorie existentă' });
    const next = [...categories, name];
    setCategories(next);
    setNewName('');
    await persist(next);
  };

  const deleteCategory = async () => {
    const next = categories.filter(c => c !== deleteTarget);
    setCategories(next);
    setDeleteTarget(null);
    await persist(next);
  };

  const startEdit = (idx) => { setEditIdx(idx); setEditName(categories[idx]); };

  const saveEdit = async () => {
    const name = editName.trim();
    if (!name) return;
    const next = categories.map((c, i) => i === editIdx ? name : c);
    setCategories(next);
    setEditIdx(null);
    await persist(next);
  };

  const move = async (idx, dir) => {
    const next = [...categories];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setCategories(next);
    await persist(next);
  };

  if (!categories) return <Spinner />;

  return (
    <div className={styles.page}>
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Ștergi categoria "${deleteTarget}"?`}
        body="Produsele din această categorie nu vor fi șterse, dar vor rămâne fără categorie."
        danger
        confirmLabel="Șterge"
        onConfirm={deleteCategory}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ── Header ── */}
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Categorii</h1>
          <p className={styles.sub}>
            {categories.length > 0
              ? `${categories.length} categorii · reordonează cu săgețile`
              : 'Nicio categorie adăugată încă'}
          </p>
        </div>
      </header>

      {/* ── Add new category ── */}
      <div className={styles.addCard}>
        <p className={styles.addCardLabel}>Adaugă categorie</p>
        <div className={styles.addRow}>
          <input
            className={styles.addInput}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCategory()}
            placeholder="ex: Praline, Trufe, Cadouri…"
          />
          <button
            className={styles.addBtn}
            onClick={addCategory}
            disabled={!newName.trim() || saving}
          >
            {IcPlus}
            <span className={styles.addBtnText}>Adaugă</span>
          </button>
        </div>
      </div>

      {/* ── Category list ── */}
      {categories.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>{IcFolders}</span>
          <p>Nicio categorie. Adaugă una mai sus.</p>
        </div>
      ) : (
        <div className={styles.listCard}>
          {categories.map((cat, idx) => (
            <div key={cat} className={styles.catRow}>

              {/* Index */}
              <span className={styles.catIdx}>{String(idx + 1).padStart(2, '0')}</span>

              {/* Name / edit inline */}
              <div className={styles.catName}>
                {editIdx === idx ? (
                  <div className={styles.editRow}>
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditIdx(null); }}
                      className={styles.editInput}
                    />
                    <button className={styles.saveEditBtn} onClick={saveEdit}>Salvează</button>
                    <button className={styles.cancelEditBtn} onClick={() => setEditIdx(null)}>Anulează</button>
                  </div>
                ) : (
                  <span className={styles.catNameText}>{cat}</span>
                )}
              </div>

              {/* Reorder */}
              <div className={styles.catOrder}>
                <button
                  className={styles.orderBtn}
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0 || saving}
                  title="Mută sus"
                >
                  {IcUp}
                </button>
                <button
                  className={styles.orderBtn}
                  onClick={() => move(idx, 1)}
                  disabled={idx === categories.length - 1 || saving}
                  title="Mută jos"
                >
                  {IcDown}
                </button>
              </div>

              {/* Actions */}
              <div className={styles.catActions}>
                <button className={styles.iconBtn} onClick={() => startEdit(idx)} title="Editează">
                  {IcEdit}
                </button>
                <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => setDeleteTarget(cat)} title="Șterge">
                  {IcTrash}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
