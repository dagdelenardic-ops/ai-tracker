import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { fetchCategories, fetchToolsWithTweets, fetchTimeline } from '../utils/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [tools, setTools] = useState([]);
  const [categories, setCategories] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('ai-tracker-favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [sortBy, setSortBy] = useState('date');
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('mock'); // 'mock' | 'x_api'

  // Load initial data - sıralı (önce tools cache'e yazılsın, sonra timeline cache'den gelsin)
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // 1. Kategorileri çek (hızlı, static veri)
        const cats = await fetchCategories();
        setCategories(cats.data || []);

        // 2. Tools'u çek (ilk seferde RapidAPI ~60sn sürer, cache'e yazılır)
        const toolsData = await fetchToolsWithTweets();
        setTools(toolsData.data || []);
        setDataSource(toolsData.source || 'mock');

        // 3. Timeline'ı çek (cache'den gelir, çok hızlı)
        const timelineData = await fetchTimeline();
        setTimeline(timelineData.data || []);

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter tools by category
  const filteredTools = tools.filter(tool => {
    if (activeCategory !== 'all' && tool.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.company.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sort tools
  const sortedTools = [...filteredTools].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = a.latestTweet ? new Date(a.latestTweet.createdAt) : new Date(0);
      const dateB = b.latestTweet ? new Date(b.latestTweet.createdAt) : new Date(0);
      return dateB - dateA;
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'popular' && a.latestTweet && b.latestTweet) {
      return (b.latestTweet.metrics?.like_count || 0) - (a.latestTweet.metrics?.like_count || 0);
    }
    return 0;
  });

  // Filter timeline
  const filteredTimeline = timeline.filter(item => {
    if (activeCategory !== 'all' && item.category !== activeCategory) return false;
    return true;
  });

  // Favorites toggle
  const toggleFavorite = useCallback((toolId) => {
    setFavorites(prev => {
      const next = prev.includes(toolId)
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId];
      localStorage.setItem('ai-tracker-favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((toolId) => favorites.includes(toolId), [favorites]);

  // Refresh data - sıralı
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const toolsData = await fetchToolsWithTweets(activeCategory, 50, true);
      setTools(toolsData.data || []);
      setDataSource(toolsData.source || 'mock');

      const timelineData = await fetchTimeline(activeCategory, 100, true);
      setTimeline(timelineData.data || []);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  const value = {
    tools: sortedTools,
    allTools: tools,
    categories,
    timeline: filteredTimeline,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    favorites,
    toggleFavorite,
    isFavorite,
    sortBy,
    setSortBy,
    loading,
    refreshData,
    dataSource
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
