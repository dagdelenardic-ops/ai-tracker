import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import CategoryFilter from '../components/CategoryFilter';
import SortControls from '../components/SortControls';
import ToolCard from '../components/ToolCard';
import TimelineItem from '../components/TimelineItem';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import FavoritesSidebar from '../components/FavoritesSidebar';
import ApiStatus from '../components/ApiStatus';
import { useState } from 'react';
import { LayoutGrid, List, Clock, Zap, Database } from 'lucide-react';

export default function HomePage() {
  const { tools, timeline, loading, dataSource } = useApp();
  const [viewMode, setViewMode] = useState('grid');

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900">
        <Header />
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Header />
      <CategoryFilter />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* API Status */}
        <div className="pt-6">
          <ApiStatus />
        </div>

        {/* Data Source Badge */}
        <div className="flex justify-end mb-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            dataSource === 'mock'
              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
              : 'bg-green-500/10 text-green-400 border border-green-500/30'
          }`}>
            <Database className="w-4 h-4" />
            {dataSource === 'rapidapi' ? '🚀 Gerçek X Verileri' :
             dataSource === 'x_api' ? '🐦 X API' :
             '🎭 Demo Veri'}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {viewMode === 'grid' ? (
                <><Zap className="w-5 h-5 text-yellow-400" /> AI Araçları</>
              ) : (
                <><Clock className="w-5 h-5 text-indigo-400" /> Zaman Çizelgesi</>
              )}
            </h2>
            
            {/* View Mode Toggle */}
            <div className="flex items-center bg-dark-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
                  viewMode === 'grid'
                    ? 'bg-dark-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Kartlar
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-dark-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <List className="w-4 h-4" />
                Zaman Çizelgesi
              </button>
            </div>
          </div>

          {viewMode === 'grid' && <SortControls />}
        </div>

        {/* Content */}
        {viewMode === 'grid' ? (
          <>
            {tools.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map(tool => (
                  <ToolCard key={tool.tool} tool={tool} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {timeline.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto">
                {timeline.map((item, index) => (
                  <TimelineItem key={`${item.id}-${index}`} item={item} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Stats Footer */}
        <div className="mt-12 pt-8 border-t border-dark-600/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl bg-dark-800/50">
              <div className="text-2xl font-bold gradient-text">35+</div>
              <div className="text-sm text-gray-500">AI Aracı</div>
            </div>
            <div className="p-4 rounded-xl bg-dark-800/50">
              <div className="text-2xl font-bold gradient-text">6</div>
              <div className="text-sm text-gray-500">Kategori</div>
            </div>
            <div className="p-4 rounded-xl bg-dark-800/50">
              <div className="text-2xl font-bold gradient-text">90</div>
              <div className="text-sm text-gray-500">Gün Geriye Dönük</div>
            </div>
            <div className="p-4 rounded-xl bg-dark-800/50">
              <div className="text-2xl font-bold gradient-text">∞</div>
              <div className="text-sm text-gray-500">X Paylaşımı</div>
            </div>
          </div>
        </div>
      </main>

      {/* Favorites Sidebar */}
      <FavoritesSidebar />
    </div>
  );
}
