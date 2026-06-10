import { t } from '../i18n';

export default function formatAge(fetchedAt, language) {
  if (!fetchedAt) return null;
  const diffMs = Date.now() - fetchedAt;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t(language, 'justNow');
  if (diffMin < 60) return t(language, 'minAgo', diffMin);
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return t(language, 'hrAgo', diffHr);
  return t(language, 'dAgo', Math.floor(diffHr / 24));
}
