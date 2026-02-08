import { useState } from 'react';
import { Search, Sparkles, RefreshCw, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Header() {
  const { searchQuery, setSearchQuery, refreshData, loading, favorites } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-dark-900/80 backdrop-blur-lg border-b border-dark-600/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold gradient-text">
                AI Tracker
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                X'den AI gelişmelerini takip et
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-4 lg:mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="AI aracı ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-search pl-10"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Favorites count */}
            {favorites.length > 0 && (
              <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-dark-700 rounded-full text-sm">
                <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                <span className="text-gray-300">{favorites.length}</span>
              </div>
            )}
            
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
              className="p-2.5 rounded-xl bg-dark-700 hover:bg-dark-600 transition-all duration-200 
                         disabled:opacity-50 disabled:cursor-not-allowed group"
              title="Yenile"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 group-hover:text-white 
                                     ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
