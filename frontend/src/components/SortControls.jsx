import { ArrowUpDown, Calendar, Type, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SortControls() {
  const { sortBy, setSortBy, tools, timeline } = useApp();

  const sortOptions = [
    { id: 'date', label: 'Tarih', icon: Calendar },
    { id: 'name', label: 'İsim', icon: Type },
    { id: 'popular', label: 'Popülerlik', icon: TrendingUp },
  ];

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-2">
        <ArrowUpDown className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-400">Sırala:</span>
        <div className="flex items-center gap-1">
          {sortOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => setSortBy(option.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                  sortBy === option.id
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-dark-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-sm text-gray-500">
        <span className="font-medium text-gray-300">{tools.length}</span> araç gösteriliyor
      </div>
    </div>
  );
}
