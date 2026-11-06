export const format = (value: number, digits = 2) =>
  Number.isFinite(value) ? value.toLocaleString('en-US', { maximumFractionDigits: digits }) : '—';
export const portColors = { exhaust: '#ff9138', transfer: '#39bddc', boost: '#36cda5' } as const;
