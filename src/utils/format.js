export const fmt = (n) => new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
export const fmtDate = (d) => new Date(d).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' });
export const fmtDateTime = (d) => new Date(d).toLocaleString('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
export const STATUS_LABEL = {
  noua: 'Nouă',
  in_pregatire: 'În pregătire',
  gata: 'Gata',
  livrata: 'Livrată',
  anulata: 'Anulată',
};
export const NEXT_STATUS = {
  noua: 'in_pregatire',
  in_pregatire: 'gata',
  gata: 'livrata',
};
