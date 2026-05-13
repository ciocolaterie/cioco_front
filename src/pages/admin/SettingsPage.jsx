import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { clearStoreCache } from '../../hooks/useStoreInfo.js';
import styles from './SettingsPage.module.css';

const NOTIFS = [
  { label: 'Email la comenzi noi', key: 'emailOrders' },
  { label: 'Push notification clienți la schimbare status', key: 'pushStatus' },
  { label: 'SMS confirmare automată', key: 'smsConfirm' },
  { label: 'Email weekly recap', key: 'emailRecap' },
];

export default function SettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data)).catch(() => toast({ title: 'Eroare la încărcarea setărilor' }));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.put('/settings', settings);
      setSettings(r.data);
      clearStoreCache();
      toast({ title: 'Setări salvate' });
    } catch {
      toast({ title: 'Eroare la salvare' });
    } finally { setSaving(false); }
  };

  const set = (k) => (e) => setSettings(s => ({ ...s, [k]: e.target.value }));
  const setNotif = (k) => setSettings(s => ({ ...s, notifications: { ...s.notifications, [k]: !s.notifications[k] } }));

  if (!settings) return <Spinner />;

  return (
    <div>
      <header className={styles.head}>
        <div>
          <h1>Setări</h1>
          <p>Configurează magazinul, livrarea, notificările</p>
        </div>
        <button className={styles.saveBtn} onClick={save} disabled={saving}>
          {saving ? '…' : 'Salvează modificările'}
        </button>
      </header>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h3>Date magazin</h3>
          <div className={styles.fields}>
            <Field label="Nume" value={settings.storeName} onChange={set('storeName')} />
            <Field label="Telefon" value={settings.storePhone} onChange={set('storePhone')} />
            <Field label="Email" value={settings.storeEmail} onChange={set('storeEmail')} />
            <Field label="Adresă magazin" value={settings.storeAddress} onChange={set('storeAddress')} />
            <div className={styles.latLng}>
              <Field label="Latitudine (hartă)" value={settings.storeLat ?? ''} onChange={e => setSettings(s => ({ ...s, storeLat: e.target.value ? Number(e.target.value) : null }))} type="number" step="any" placeholder="ex: 47.6573" />
              <Field label="Longitudine (hartă)" value={settings.storeLng ?? ''} onChange={e => setSettings(s => ({ ...s, storeLng: e.target.value ? Number(e.target.value) : null }))} type="number" step="any" placeholder="ex: 26.2649" />
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h3>Categorii produse</h3>
          <div className={styles.tagList}>
            {settings.categories.map((cat, i) => (
              <div key={i} className={styles.tagItem}>
                <span>{cat}</span>
                <button
                  type="button"
                  className={styles.tagRemove}
                  onClick={() => setSettings(s => ({ ...s, categories: s.categories.filter((_, k) => k !== i) }))}
                >×</button>
              </div>
            ))}
          </div>
          <form
            className={styles.addTagRow}
            onSubmit={(e) => {
              e.preventDefault();
              const val = e.target.cat.value.trim();
              if (!val || settings.categories.includes(val)) return;
              setSettings(s => ({ ...s, categories: [...s.categories, val] }));
              e.target.reset();
            }}
          >
            <input name="cat" className={styles.addTagInput} placeholder="Nume categorie nouă" />
            <button type="submit" className={styles.addTagBtn}>Adaugă</button>
          </form>
        </section>

        <section className={styles.card}>
          <h3>Zone de livrare</h3>
          <div className={styles.zoneList}>
            {settings.zones.length === 0 && (
              <p className={styles.emptyNote}>Nicio zonă adăugată. Adaugă mai jos.</p>
            )}
            {settings.zones.map((z, i) => (
              <div key={z.id} className={styles.zone}>
                <input
                  className={styles.zoneNameInput}
                  value={z.name}
                  placeholder="Nume zonă"
                  onChange={(e) => {
                    const zones = [...settings.zones];
                    zones[i] = { ...zones[i], name: e.target.value };
                    setSettings(s => ({ ...s, zones }));
                  }}
                />
                <div className={styles.zoneRight}>
                  <input
                    type="number"
                    className={styles.zonePrice}
                    value={z.price}
                    min="0"
                    onChange={(e) => {
                      const zones = [...settings.zones];
                      zones[i] = { ...zones[i], price: Number(e.target.value) };
                      setSettings(s => ({ ...s, zones }));
                    }}
                  />
                  <span className={styles.zoneCurrency}>RON</span>
                  <button
                    type="button"
                    className={styles.zoneDelete}
                    onClick={() => setSettings(s => ({ ...s, zones: s.zones.filter((_, k) => k !== i) }))}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <form
            className={styles.addZoneRow}
            onSubmit={(e) => {
              e.preventDefault();
              const name = e.target.zoneName.value.trim();
              const price = Number(e.target.zonePrice.value) || 0;
              if (!name) return;
              const id = Date.now().toString(36);
              setSettings(s => ({ ...s, zones: [...s.zones, { id, name, price }] }));
              e.target.reset();
            }}
          >
            <input name="zoneName" className={styles.addZoneNameInput} placeholder="Nume (ex: Suceava)" required />
            <input name="zonePrice" type="number" min="0" className={styles.addZonePriceInput} placeholder="RON" defaultValue="0" />
            <button type="submit" className={styles.addTagBtn}>Adaugă</button>
          </form>
        </section>

        <section className={styles.card}>
          <h3>Notificări</h3>
          <p className={styles.notifNote}>Aceste setări sunt salvate, dar necesită configurarea unui serviciu extern (SMTP, SMS, push) pentru a funcționa efectiv.</p>
          <div className={styles.notifList}>
            {NOTIFS.map((n) => (
              <div key={n.key} className={styles.notif}>
                <span>{n.label}</span>
                <button
                  className={`${styles.toggle} ${settings.notifications[n.key] ? styles.toggleOn : ''}`}
                  onClick={() => setNotif(n.key)}
                  type="button"
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.card}>
          <h3>Program de lucru</h3>
          <div className={styles.scheduleList}>
            {settings.schedule.map((s, i) => (
              <div key={s.day} className={styles.scheduleRow}>
                <span className={styles.scheduleDay}>{s.day}</span>
                <div className={styles.scheduleRight}>
                  <input
                    className={`${styles.scheduleInput} ${s.closed ? styles.closed : ''}`}
                    value={s.hours}
                    disabled={s.closed}
                    onChange={(e) => {
                      const schedule = [...settings.schedule];
                      schedule[i] = { ...schedule[i], hours: e.target.value };
                      setSettings(st => ({ ...st, schedule }));
                    }}
                  />
                  <label className={styles.scheduleCheck}>
                    <input type="checkbox" checked={!!s.closed}
                      onChange={(e) => {
                        const schedule = [...settings.schedule];
                        schedule[i] = { ...schedule[i], closed: e.target.checked, hours: e.target.checked ? 'Închis' : '' };
                        setSettings(st => ({ ...st, schedule }));
                      }}
                    />
                    Închis
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', step, placeholder }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <input className={styles.fieldInput} value={value} onChange={onChange} type={type} step={step} placeholder={placeholder} />
    </div>
  );
}
