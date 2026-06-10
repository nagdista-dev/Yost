export default function timeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const week = Math.floor(day / 7);
  if (week < 5) return `${week}w ago`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}mo ago`;
  const year = Math.floor(day / 365);
  return `${year}y ago`;
}

export function engagementRate(likes, views) {
  const l = parseInt(likes, 10);
  const v = parseInt(views, 10);
  if (!v || !l) return null;
  return ((l / v) * 100).toFixed(1);
}

export function dislikePercentage(likes, dislikes) {
  const l = parseInt(likes, 10);
  const d = parseInt(dislikes, 10);
  if (!l && !d) return null;
  const total = l + d;
  if (!total) return null;
  return ((d / total) * 100).toFixed(1);
}
