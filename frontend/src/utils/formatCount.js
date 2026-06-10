export default function formatCount(raw) {
  if (!raw || raw === '0') return '';
  return raw;
}

export function formatViews(raw) {
  if (!raw || raw === '0') return '';
  const n = parseInt(raw, 10);
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
  return n.toLocaleString();
}
