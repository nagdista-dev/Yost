export function watchScore(video) {
  const views = parseInt(video.views, 10) || 0;
  const likes = parseInt(video.likes, 10) || 0;
  const dislikes = parseInt(video.dislikes, 10) || 0;

  if (views === 0 || likes === 0) return null;

  if (dislikes > 0) {
    return Math.round((likes / (likes + dislikes)) * 100);
  }

  const engagement = likes / views;
  return Math.min(Math.round(engagement * 10000), 100);
}

export function watchScoreColor(score) {
  if (score == null) return 'var(--text-muted)';
  if (score >= 85) return '#22c55e';
  if (score >= 70) return '#84cc16';
  if (score >= 50) return '#eab308';
  return '#ef4444';
}
