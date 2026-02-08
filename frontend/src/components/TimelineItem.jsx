import { Twitter, Heart, Repeat2, MessageCircle, Eye } from 'lucide-react';
import { formatDate, formatFullDate, isRecent } from '../utils/dateUtils';

export default function TimelineItem({ item }) {
  const isNew = isRecent(item.createdAt, 48);
  const metrics = item.metrics || {};
  const tweetUrl = item.url || `https://x.com/${item.xHandle}`;

  return (
    <a
      href={tweetUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
      className="rounded-xl bg-dark-700/50 border border-dark-600/50 p-4 hover:bg-dark-700/70 hover:border-indigo-500/40 transition-all"
    >
      <div className="flex gap-4">
        {/* Tool Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{
            backgroundColor: `${item.brandColor}20`,
            border: `2px solid ${item.brandColor}40`
          }}
        >
          {item.logo}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-white">{item.toolName}</span>
            <span className="text-gray-500">@{item.xHandle}</span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-500 text-sm" title={formatFullDate(item.createdAt)}>
              {formatDate(item.createdAt)}
            </span>
            {isNew && (
              <span className="badge-new text-xs">YENİ</span>
            )}
          </div>

          {/* Tweet Text */}
          <p className="text-gray-200 mb-3 leading-relaxed">
            {item.text}
          </p>

          {/* Metrics */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {metrics.reply_count > 0 && (
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {metrics.reply_count.toLocaleString()}
              </span>
            )}
            {metrics.retweet_count > 0 && (
              <span className="flex items-center gap-1">
                <Repeat2 className="w-4 h-4" />
                {metrics.retweet_count.toLocaleString()}
              </span>
            )}
            {metrics.like_count > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {metrics.like_count.toLocaleString()}
              </span>
            )}
            {metrics.impression_count > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {metrics.impression_count.toLocaleString()}
              </span>
            )}

            <span className="ml-auto flex items-center gap-1 text-indigo-400 font-medium">
              <Twitter className="w-4 h-4" />
              X'te Gör →
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
