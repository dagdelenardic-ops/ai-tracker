import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { fetchCategories, fetchToolsWithTweets } from '../utils/api';

const AppContext = createContext();

function buildTimeline(tools = []) {
  const items = [];

  tools.forEach(tool => {
    (tool.tweets || []).forEach(tweet => {
      items.push({
        ...tweet,
        toolId: tool.tool,
        toolName: tool.name,
        xHandle: tool.xHandle,
        category: tool.category,
        brandColor: tool.brandColor,
        logo: tool.logo
      });
    });
  });

  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return items;
}

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
  const [dataSource, setDataSource] = useState('unavailable'); // 'rapidapi' | 'rapidapi+deepseek' | 'x_api' | 'mock' | 'unavailable'

  // Load initial data - snapshot üzerinden
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [cats, toolsData] = await Promise.all([
          fetchCategories(),
          fetchToolsWithTweets()
        ]);

        const loadedTools = toolsData.data || [];
        setCategories(cats.data || []);
        setTools(loadedTools);
        setTimeline(buildTimeline(loadedTools));
        setDataSource(toolsData.source || 'unavailable');

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

  // Refresh data - runtime API çağrısı zorlamadan snapshot'ı yeniden yükler
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const toolsData = await fetchToolsWithTweets('all', 50, false);
      const loadedTools = toolsData.data || [];

      setTools(loadedTools);
      setTimeline(buildTimeline(loadedTools));
      setDataSource(toolsData.source || 'unavailable');
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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
