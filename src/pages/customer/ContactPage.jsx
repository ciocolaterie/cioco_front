import { useState } from 'react';
import api from '../../services/api.js';
import usePageTitle from '../../hooks/usePageTitle.js';
import useStoreInfo from '../../hooks/useStoreInfo.js';
import styles from './ContactPage.module.css';

export default function ContactPage() {
  usePageTitle('Contact');
  const store = useStoreInfo();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await api.post('/contact', form);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'A apărut o eroare. Încearcă din nou.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.intro}>
          <h1 className={styles.title}>Hai să vorbim</h1>
          <p className={styles.lead}>
            Întrebări, comenzi corporate, parteneriate sau pur și simplu vrei să spui un „bună".
          </p>
        </div>

        <div className={styles.grid}>
          <div className={styles.left}>
            <div className={styles.contactList}>
              <div className={styles.contactItem}>
                <div className={styles.contactIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                  <div className={styles.contactTag}>ATELIER & MAGAZIN</div>
                  <div className={styles.contactValue}>{store.storeAddress}</div>
                  <div className={styles.contactDetail}>
                    {(() => {
                      const open = store.schedule.filter(s => !s.closed);
                      const closed = store.schedule.filter(s => s.closed);
                      if (!open.length) return 'Temporar închis';
                      const hrs = [...new Set(open.map(s => s.hours))];
                      if (hrs.length === 1) {
                        const f = open[0].day.slice(0, 2);
                        const l = open[open.length - 1].day.slice(0, 2);
                        const range = f === l ? f : `${f}–${l}`;
                        return `${range}, ${hrs[0]}${closed.length ? ` · ${closed.map(s => s.day.slice(0, 2)).join(', ')} închis` : ''}`;
                      }
                      return open.map(s => `${s.day.slice(0, 3)}: ${s.hours}`).join(' · ');
                    })()}
                  </div>
                </div>
              </div>
              {store.storePhone && (
              <div className={styles.contactItem}>
                <div className={styles.contactIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>
                </div>
                <div>
                  <div className={styles.contactTag}>TELEFON</div>
                  <a href={`tel:${store.storePhone.replace(/\s/g,'')}`} className={styles.contactValue}>{store.storePhone}</a>
                  <div className={styles.contactDetail}>Răspundem L–S, 9:00–21:00</div>
                </div>
              </div>
              )}
              {store.storePhone && (
              <div className={styles.contactItem}>
                <div className={styles.contactIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                </div>
                <div>
                  <div className={styles.contactTag}>WHATSAPP</div>
                  <a href={`https://wa.me/${store.storePhone.replace(/\D/g,'')}`} className={styles.contactValue} target="_blank" rel="noreferrer">{store.storePhone}</a>
                  <div className={styles.contactDetail}>Cel mai rapid răspuns</div>
                </div>
              </div>
              )}
              {store.storeEmail && (
              <div className={styles.contactItem}>
                <div className={styles.contactIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </div>
                <div>
                  <div className={styles.contactTag}>EMAIL</div>
                  <a href={`mailto:${store.storeEmail}`} className={styles.contactValue}>{store.storeEmail}</a>
                  <div className={styles.contactDetail}>Răspundem în max 24h</div>
                </div>
              </div>
              )}
            </div>
            {store.storeLat && store.storeLng ? (
              <div className={styles.mapWrap}>
                <iframe
                  className={styles.map}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${store.storeLng - 0.007}%2C${store.storeLat - 0.003}%2C${store.storeLng + 0.007}%2C${store.storeLat + 0.003}&layer=mapnik&marker=${store.storeLat}%2C${store.storeLng}`}
                  title="Locație magazin"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <a
                  href={`https://www.openstreetmap.org/?mlat=${store.storeLat}&mlon=${store.storeLng}#map=16/${store.storeLat}/${store.storeLng}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.mapCaption}
                >
                  HARTĂ — {store.storeAddress || 'Deschide în hartă'} ↗
                </a>
              </div>
            ) : store.storeAddress ? (
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(store.storeAddress)}`}
                target="_blank"
                rel="noreferrer"
                className={styles.mapLink}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Deschide în Google Maps ↗
              </a>
            ) : null}
          </div>

          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>Trimite-ne un mesaj</h2>
            {sent ? (
              <div className={styles.sent}>
                <div className={styles.sentIcon}>✓</div>
                <p>Mesajul a fost trimis! Te contactăm în cel mai scurt timp.</p>
              </div>
            ) : (
              <form onSubmit={submit} className={styles.form}>
                <div className={styles.field}>
                  <label className={styles.label}>Nume</label>
                  <input
                    className={styles.input}
                    value={form.name}
                    onChange={set('name')}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Email</label>
                  <input
                    type="email"
                    className={styles.input}
                    value={form.email}
                    onChange={set('email')}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Mesaj</label>
                  <textarea
                    className={styles.textarea}
                    rows={6}
                    value={form.message}
                    onChange={set('message')}
                    required
                  />
                </div>
                {error && <p style={{ color: '#DC2626', fontSize: 13, margin: 0 }}>{error}</p>}
                <button type="submit" className={styles.btn} disabled={sending}>
                  {sending ? 'Se trimite…' : 'Trimite mesajul'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
