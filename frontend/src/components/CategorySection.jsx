import { useTheme } from '../context/useTheme';
import { t } from '../i18n';
import CategoryButton from './CategoryButton';

export default function CategorySection({ categories, selectedCategory, onSelectCategory }) {
  const { language } = useTheme();
  const validCategories = categories.filter(c => c !== 'Unspecified');

  if (validCategories.length === 0) return null;

  return (
    <div className="px-3">
      <div className="text-yt-text-muted text-[11px] font-semibold uppercase tracking-wider px-3 py-2">
        {t(language, 'categories')}
      </div>
      <div className="flex flex-col gap-0.5">
        <CategoryButton
          cat={t(language, 'allCategories')}
          isSelected={!selectedCategory}
          onClick={() => onSelectCategory(null)}
        />
        {validCategories.map(cat => (
          <CategoryButton
            key={cat}
            cat={cat}
            isSelected={selectedCategory === cat}
            onClick={() => onSelectCategory(cat)}
          />
        ))}
      </div>
    </div>
  );
}
