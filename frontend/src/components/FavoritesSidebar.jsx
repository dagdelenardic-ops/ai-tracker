import { Heart, X, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useState } from 'react';

export default function FavoritesSidebar() {
  const { favorites, allTools, toggleFavorite } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const favoriteTools = allTools.filter(tool => favorites.includes(tool.id));

  if (favorites.length === 0) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-4 bottom-4 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 
                   shadow-lg shadow-pink-500/30 flex items-center justify-center text-white
                   hover:scale-110 transition-transform duration-200"
      >
        <Heart className="w-6 h-6 fill-white" />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-pink-600 text-xs font-bold 
                         rounded-full flex items-center justify-center">
          {favorites.length}
        </span>
      </button>

      {/* Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="relative w-full max-w-md bg-dark-800 border-l border-dark-600 h-full overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-dark-800/95 backdrop-blur-sm border-b border-dark-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                <h2 className="text-lg font-bold text-white">Favorilerim</h2>
                <span className="px-2 py-0.5 bg-dark-700 rounded-full text-sm text-gray-400">
                  {favorites.length}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {favoriteTools.map(tool => (
                <div 
                  key={tool.id}
                  className="card-glass p-4 flex items-center gap-3 group"
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ 
                      backgroundColor: `${tool.brandColor}20`,
                      border: `2px solid ${tool.brandColor}40`
                    }}
                  >
                    {tool.logo}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white truncate">{tool.name}</h4>
                    <p className="text-sm text-gray-500">{tool.company}</p>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={`https://x.com/${tool.xHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-dark-600 transition-colors"
                      title="X Profili"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>
                    <button
                      onClick={() => toggleFavorite(tool.id)}
                      className="p-2 rounded-lg hover:bg-dark-600 transition-colors"
                      title="Favorilerden Çıkar"
                    >
                      <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
