import { Search, Sparkles, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function EmptyState() {
  const { searchQuery, activeCategory, setSearchQuery, setActiveCategory } = useApp();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-2xl bg-dark-800 flex items-center justify-center mb-4">
        {searchQuery ? (
          <Search className="w-10 h-10 text-gray-600" />
        ) : activeCategory !== 'all' ? (
          <Filter className="w-10 h-10 text-gray-600" />
        ) : (
          <Sparkles className="w-10 h-10 text-gray-600" />
        )}
      </div>
      
      <h3 className="text-xl font-semibold text-gray-300 mb-2">
        {searchQuery 
          ? 'Sonuç bulunamadı' 
          : activeCategory !== 'all'
            ? 'Bu kategoride henüz veri yok'
            : 'Henüz veri yok'
        }
      </h3>
      
      <p className="text-gray-500 max-w-md mb-6">
        {searchQuery 
          ? `"${searchQuery}" araması için sonuç bulunamadı. Farklı bir arama terimi deneyin.`
          : activeCategory !== 'all'
            ? 'Bu kategoride henüz paylaşım yapılmamış. Diğer kategorileri kontrol edin.'
            : 'Veriler yükleniyor veya henüz mevcut değil.'
        }
      </p>
      
      {(searchQuery || activeCategory !== 'all') && (
        <div className="flex gap-3">
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="btn-secondary text-sm"
            >
              Aramayı Temizle
            </button>
          )}
          {activeCategory !== 'all' && (
            <button
              onClick={() => setActiveCategory('all')}
              className="btn-primary text-sm"
            >
              Tümünü Göster
            </button>
          )}
        </div>
      )}
    </div>
  );
}
