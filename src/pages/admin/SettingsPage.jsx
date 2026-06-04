import { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { clearStoreCache } from '../../hooks/useStoreInfo.js';
import styles from './SettingsPage.module.css';

const STATUS_LABELS = {
  noua: 'Comandă nouă', in_pregatire: 'În pregătire',
  gata: 'Gata', livrata: 'Livrată', anulata: 'Anulată',
};
const BANNER_BG = { accent: 'var(--accent)', dark: 'var(--ink)', green: '#059669', red: '#DC2626' };
const NOTIFS = [
  { label: 'Email la comenzi noi',                 key: 'emailOrders' },
  { label: 'Push notification la schimbare status', key: 'pushStatus'  },
  { label: 'SMS confirmare automată',               key: 'smsConfirm'  },
  { label: 'Email weekly recap',                    key: 'emailRecap'  },
];

/* ── Icons ── */
const Ico = {
  store:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  zone:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  bell:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  banner:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>,
  clock:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  book:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  star:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  mail:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  check:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  spin:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>,
  trash:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  plus:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
};

/* ── Card section header ── */
function CardHead({ icon, title, desc }) {
  return (
    <div className={styles.cardHead}>
      <div className={styles.cardIcon}>{icon}</div>
      <div>
        <h3 className={styles.cardTitle}>{title}</h3>
        {desc && <p className={styles.cardDesc}>{desc}</p>}
      </div>
    </div>
  );
}

/* ── Toggle switch ── */
function Toggle({ on, onChange }) {
  return (
    <button className={`${styles.toggle} ${on ? styles.toggleOn : ''}`} onClick={onChange} type="button">
      <span className={styles.toggleThumb} />
    </button>
  );
}

/* ── Simple input field ── */
function Field({ label, value, onChange, type = 'text', step, placeholder }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <input className={styles.fieldInput} value={value} onChange={onChange} type={type} step={step} placeholder={placeholder} />
    </div>
  );
}

export default function SettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data)).catch(() =>
      toast({ title: 'Eroare la încărcarea setărilor' })
    );
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.put('/settings', settings);
      setSettings(r.data);
      clearStoreCache();
      toast({ title: 'Setări salvate' });
    } catch { toast({ title: 'Eroare la salvare' }); }
    finally { setSaving(false); }
  };

  const set    = (k) => (e) => setSettings(s => ({ ...s, [k]: e.target.value }));
  const setNum = (k) => (e) => setSettings(s => ({ ...s, [k]: Number(e.target.value) }));
  const setNotif = (k) => setSettings(s => ({
    ...s, notifications: { ...s.notifications, [k]: !s.notifications[k] }
  }));
  const setEmailTemplate = (status, field, value) => setSettings(s => ({
    ...s, emailTemplates: { ...s.emailTemplates, [status]: { ...s.emailTemplates?.[status], [field]: value } },
  }));
  const uploadLogo = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('image', file);
    try {
      const { data } = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSettings(s => ({ ...s, storeLogo: data.url }));
    } catch { toast({ title: 'Eroare la upload logo' }); }
  };

  if (!settings) return <Spinner />;

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Setări</h1>
          <p className={styles.sub}>Magazin, livrare, notificări și personalizare</p>
        </div>
        <button className={styles.saveBtn} onClick={save} disabled={saving}>
          <span className={saving ? styles.saveSpin : ''}>{saving ? Ico.spin : Ico.check}</span>
          {saving ? 'Se salvează…' : 'Salvează'}
        </button>
      </header>

      {/* ── Settings grid ── */}
      <div className={styles.grid}>

        {/* Date magazin */}
        <section className={styles.card}>
          <CardHead icon={Ico.store} title="Date magazin" desc="Informații afișate public pe site și în emailuri" />
          <div className={styles.fields}>
            <div className={styles.logoRow}>
              <div className={styles.logoBox}>
                {settings.storeLogo
                  ? <img src={settings.storeLogo} alt="Logo" className={styles.logoImg} />
                  : <span className={styles.logoPlaceholder}>Logo</span>
                }
              </div>
              <label className={styles.logoUploadBtn}>
                <input type="file" accept="image/*" onChange={uploadLogo} style={{ display: 'none' }} />
                {settings.storeLogo ? 'Schimbă logo' : 'Încarcă logo'}
              </label>
            </div>
            <Field label="Nume magazin"    value={settings.storeName    || ''} onChange={set('storeName')} />
            <Field label="Telefon"         value={settings.storePhone   || ''} onChange={set('storePhone')} />
            <Field label="Email"           value={settings.storeEmail   || ''} onChange={set('storeEmail')} />
            <Field label="Adresă"          value={settings.storeAddress || ''} onChange={set('storeAddress')} />
            <Field label="Instagram (URL)" value={settings.storeInstagram || ''} onChange={set('storeInstagram')} placeholder="https://instagram.com/…" />
            <Field label="Facebook (URL)"  value={settings.storeFacebook  || ''} onChange={set('storeFacebook')}  placeholder="https://facebook.com/…" />
            <div className={styles.twoCol}>
              <Field label="Latitudine"  value={settings.storeLat ?? ''} onChange={e => setSettings(s => ({ ...s, storeLat: e.target.value ? Number(e.target.value) : null }))} type="number" step="any" placeholder="ex: 47.6573" />
              <Field label="Longitudine" value={settings.storeLng ?? ''} onChange={e => setSettings(s => ({ ...s, storeLng: e.target.value ? Number(e.target.value) : null }))} type="number" step="any" placeholder="ex: 26.2649" />
            </div>
          </div>
        </section>

        {/* Zone de livrare */}
        <section className={styles.card}>
          <CardHead icon={Ico.zone} title="Zone de livrare" desc="Tarife per zonă geografică" />
          <div className={styles.zoneList}>
            {settings.zones.length === 0 && <p className={styles.emptyNote}>Nicio zonă adăugată.</p>}
            {settings.zones.map((z, i) => (
              <div key={z.id} className={styles.zoneRow}>
                <input
                  className={styles.zoneNameInput}
                  value={z.name}
                  placeholder="Nume zonă"
                  onChange={e => {
                    const zones = [...settings.zones];
                    zones[i] = { ...zones[i], name: e.target.value };
                    setSettings(s => ({ ...s, zones }));
                  }}
                />
                <input
                  type="number" min="0"
                  className={styles.zonePriceInput}
                  value={z.price}
                  onChange={e => {
                    const zones = [...settings.zones];
                    zones[i] = { ...zones[i], price: Number(e.target.value) };
                    setSettings(s => ({ ...s, zones }));
                  }}
                />
                <span className={styles.zoneCur}>RON</span>
                <button
                  type="button" className={styles.zoneDelete}
                  onClick={() => setSettings(s => ({ ...s, zones: s.zones.filter((_, k) => k !== i) }))}
                >
                  {Ico.trash}
                </button>
              </div>
            ))}
          </div>
          <form
            className={styles.addZoneRow}
            onSubmit={e => {
              e.preventDefault();
              const name  = e.target.zoneName.value.trim();
              const price = Number(e.target.zonePrice.value) || 0;
              if (!name) return;
              setSettings(s => ({ ...s, zones: [...s.zones, { id: Date.now().toString(36), name, price }] }));
              e.target.reset();
            }}
          >
            <input name="zoneName"  className={styles.addZoneInput} placeholder="Nume zonă…" required />
            <input name="zonePrice" className={styles.addZonePriceInput} type="number" min="0" placeholder="0" defaultValue="0" />
            <span className={styles.zoneCur}>RON</span>
            <button type="submit" className={styles.addZoneBtn}>{Ico.plus}</button>
          </form>
        </section>

        {/* Notificări */}
        <section className={styles.card}>
          <CardHead icon={Ico.bell} title="Notificări" desc="Necesită configurare SMTP/SMS/push" />
          <div className={styles.toggleList}>
            {NOTIFS.map(n => (
              <div key={n.key} className={styles.toggleRow}>
                <span className={styles.toggleLabel}>{n.label}</span>
                <Toggle on={!!settings.notifications[n.key]} onChange={() => setNotif(n.key)} />
              </div>
            ))}
          </div>
        </section>

        {/* Banner */}
        <section className={styles.card}>
          <CardHead icon={Ico.banner} title="Banner anunț" desc="Bandă informativă în header-ul site-ului" />
          <div className={styles.toggleRow} style={{ marginBottom: 16 }}>
            <span className={styles.toggleLabel}>Banner activ</span>
            <Toggle
              on={!!settings.banner?.active}
              onChange={() => setSettings(s => ({ ...s, banner: { ...s.banner, active: !s.banner?.active } }))}
            />
          </div>
          <Field
            label="Text banner"
            value={settings.banner?.text || ''}
            onChange={e => setSettings(s => ({ ...s, banner: { ...s.banner, text: e.target.value } }))}
            placeholder="ex: Transport gratuit pentru comenzi peste 100 lei"
          />
          <div className={styles.fieldLabel} style={{ marginTop: 14, marginBottom: 8 }}>Culoare</div>
          <div className={styles.swatches}>
            {[
              { key: 'accent', label: 'Accent' },
              { key: 'dark',   label: 'Închis'  },
              { key: 'green',  label: 'Verde'   },
              { key: 'red',    label: 'Roșu'    },
            ].map(({ key, label }) => (
              <button
                key={key} type="button" title={label}
                className={`${styles.swatch} ${settings.banner?.color === key ? styles.swatchActive : ''}`}
                style={{ background: BANNER_BG[key] }}
                onClick={() => setSettings(s => ({ ...s, banner: { ...s.banner, color: key } }))}
              />
            ))}
          </div>
          {settings.banner?.text && (
            <div className={styles.bannerPreview} style={{ background: BANNER_BG[settings.banner.color || 'accent'] }}>
              {settings.banner.text}
            </div>
          )}
        </section>

        {/* Program de lucru */}
        <section className={styles.card}>
          <CardHead icon={Ico.clock} title="Program de lucru" desc="Afișat pe pagina de contact" />
          <div className={styles.scheduleList}>
            {settings.schedule.map((s, i) => (
              <div key={s.day} className={styles.scheduleRow}>
                <span className={styles.scheduleDay}>{s.day}</span>
                <input
                  className={`${styles.scheduleInput} ${s.closed ? styles.scheduleClosed : ''}`}
                  value={s.hours}
                  disabled={s.closed}
                  placeholder="09:00 – 18:00"
                  onChange={e => {
                    const schedule = [...settings.schedule];
                    schedule[i] = { ...schedule[i], hours: e.target.value };
                    setSettings(st => ({ ...st, schedule }));
                  }}
                />
                <label className={styles.scheduleCheck}>
                  <input
                    type="checkbox"
                    checked={!!s.closed}
                    onChange={e => {
                      const schedule = [...settings.schedule];
                      schedule[i] = { ...schedule[i], closed: e.target.checked, hours: e.target.checked ? 'Închis' : '' };
                      setSettings(st => ({ ...st, schedule }));
                    }}
                  />
                  Închis
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* Badge client fidel */}
        <section className={styles.card}>
          <CardHead icon={Ico.star} title="Badge «Client fidel»" desc="Condiții pentru acordarea badge-ului automat" />
          <div className={styles.twoCol}>
            <Field
              label="Număr minim comenzi"
              value={settings.loyaltyOrders ?? 5}
              onChange={setNum('loyaltyOrders')}
              type="number"
            />
            <Field
              label="Total minim cheltuit (RON)"
              value={settings.loyaltySpent ?? 200}
              onChange={setNum('loyaltySpent')}
              type="number"
            />
          </div>
          <p className={styles.hint}>Clienții care îndeplinesc oricare dintre condiții primesc badge-ul automat.</p>
        </section>

        {/* Povestea magazinului — full width */}
        <section className={`${styles.card} ${styles.cardFull}`}>
          <CardHead icon={Ico.book} title="Povestea magazinului" desc="Afișat pe pagina Despre — suportă linii noi" />
          <textarea
            className={styles.aboutArea}
            value={settings.storeAbout || ''}
            onChange={e => setSettings(s => ({ ...s, storeAbout: e.target.value }))}
            rows={6}
            placeholder="Scrie povestea ta…"
          />
        </section>

        {/* Email templates — full width */}
        <section className={`${styles.card} ${styles.cardFull}`}>
          <CardHead icon={Ico.mail} title="Emailuri automate per status" desc="Configurează subiectul și mesajul trimis la fiecare schimbare de status" />
          <div className={styles.emailGrid}>
            {Object.entries(STATUS_LABELS).map(([status, label]) => {
              const tpl = settings.emailTemplates?.[status] || {};
              return (
                <div key={status} className={styles.emailCard}>
                  <div className={styles.emailCardHead}>
                    <span className={styles.emailCardLabel}>{label}</span>
                    <label className={styles.emailAuto}>
                      <input
                        type="checkbox"
                        checked={!!tpl.auto}
                        onChange={e => setEmailTemplate(status, 'auto', e.target.checked)}
                      />
                      Automat
                    </label>
                  </div>
                  <input
                    className={styles.fieldInput}
                    value={tpl.subject || ''}
                    onChange={e => setEmailTemplate(status, 'subject', e.target.value)}
                    placeholder="Subiect email…"
                    style={{ marginBottom: 8 }}
                  />
                  <textarea
                    className={styles.emailBody}
                    value={tpl.body || ''}
                    onChange={e => setEmailTemplate(status, 'body', e.target.value)}
                    placeholder="Mesaj personalizat — poți folosi {nume_client}, {nr_comanda}, {total}"
                    rows={3}
                  />
                </div>
              );
            })}
          </div>
        </section>

      </div>

      {/* Sticky save bar — mobile */}
      <div className={styles.stickyBar}>
        <button className={styles.saveBtnSticky} onClick={save} disabled={saving}>
          <span className={saving ? styles.saveSpin : ''}>{saving ? Ico.spin : Ico.check}</span>
          {saving ? 'Se salvează…' : 'Salvează setările'}
        </button>
      </div>
    </div>
  );
}
