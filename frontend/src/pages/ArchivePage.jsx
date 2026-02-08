import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import CategoryFilter from '../components/CategoryFilter';
import TimelineItem from '../components/TimelineItem';
import LoadingState from '../components/LoadingState';
import { fetchArchive, fetchArchiveStats } from '../utils/api';
import { Archive, Calendar, BarChart3, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export default function ArchivePage() {
  const { activeCategory, setActiveCategory, categories } = useApp();
  const [archive, setArchive] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [expandedDates, setExpandedDates] = useState({});

  useEffect(() => {
    async function loadArchive() {
      try {
        setLoading(true);
        const [archiveData, statsData] = await Promise.all([
          fetchArchive(activeCategory, days, 500),
          fetchArchiveStats()
        ]);

        if (archiveData.success) {
          setArchive(archiveData.data || []);
        }
        if (statsData.success) {
          setStats(statsData.data);
        }
      } catch (error) {
        console.error('Error loading archive:', error);
      } finally {
        setLoading(false);
      }
    }

    loadArchive();
  }, [activeCategory, days]);

  // Tarihe göre grupla
  const groupedByDate = archive.reduce((acc, item) => {
    const date = new Date(item.createdAt).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  const toggleDate = (date) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Header */}
        <div className="pt-8 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-indigo-500/20">
              <Archive className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Arşiv</h1>
              <p className="text-gray-400">Tüm geçmiş X paylaşımları zaman çizelgesi</p>
            </div>
          </div>

          {/* Stats & Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {/* Stats */}
            <div className="md:col-span-2 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-800/50 border border-dark-600/30">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{archive.length}</div>
                  <div className="text-xs text-gray-500">Toplam Tweet</div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-800/50 border border-dark-600/30">
                <Calendar className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{Object.keys(groupedByDate).length}</div>
                  <div className="text-xs text-gray-500">Gün</div>
                </div>
              </div>
              {stats && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-800/50 border border-dark-600/30">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <div>
                    <div className="text-sm font-bold text-white">
                      {new Date(stats.updatedAt).toLocaleDateString('tr-TR')}
                    </div>
                    <div className="text-xs text-gray-500">Son Güncelleme</div>
                  </div>
                </div>
              )}
            </div>

            {/* Days Filter */}
            <div className="flex items-center justify-end">
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="bg-dark-800 border border-dark-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value={7}>Son 7 gün</option>
                <option value={30}>Son 30 gün</option>
                <option value={60}>Son 60 gün</option>
                <option value={90}>Son 90 gün</option>
              </select>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {archive.length === 0 ? (
          <div className="text-center py-20">
            <Archive className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-bold text-white mb-2">Arşiv Boş</h3>
            <p className="text-gray-500">
              Seçili zaman aralığında ve kategoride tweet bulunamadı.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByDate).map(([date, tweets]) => (
              <div key={date} className="relative">
                {/* Date Header */}
                <button
                  onClick={() => toggleDate(date)}
                  className="flex items-center gap-2 mb-4 group"
                >
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-dark-800 border border-dark-600 group-hover:border-indigo-500/50 transition-colors">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-white">{date}</span>
                    <span className="text-sm text-gray-500">({tweets.length})</span>
                    {expandedDates[date] ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Tweets for this date */}
                <div className={`space-y-3 pl-4 border-l-2 border-dark-600/50 ml-4 ${expandedDates[date] ? 'hidden' : ''}`}>
                  {tweets.map((item, index) => (
                    <TimelineItem key={`${item.id}-${index}`} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
