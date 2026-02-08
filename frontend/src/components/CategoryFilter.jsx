import { useApp } from '../context/AppContext';

export default function CategoryFilter() {
  const { categories, activeCategory, setActiveCategory } = useApp();

  return (
    <div className="sticky top-16 lg:top-20 z-40 bg-dark-900/90 backdrop-blur-sm py-4 border-b border-dark-600/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`category-pill whitespace-nowrap flex items-center gap-2 ${
                activeCategory === category.id
                  ? 'category-pill-active'
                  : 'category-pill-inactive'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
