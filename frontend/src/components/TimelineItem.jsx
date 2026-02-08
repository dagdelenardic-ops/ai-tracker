import { useState, useRef, useEffect } from 'react';
import { Twitter, Heart, Repeat2, MessageCircle, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate, formatFullDate, isRecent } from '../utils/dateUtils';
import { getValidXUrl } from '../utils/xUrl';

export default function TimelineItem({ item }) {
  const isNew = isRecent(item.createdAt, 24);
  const metrics = item.metrics || {};
  const tweetUrl = getValidXUrl(item.url, item.xHandle);
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (textRef.current) {
      setIsClamped(textRef.current.scrollHeight > textRef.current.clientHeight);
    }
  }, [item.text]);

  return (
    <div className="rounded-xl bg-dark-700/50 border border-dark-600/50 p-4 hover:bg-dark-700/70 hover:border-indigo-500/40 transition-all">
      <div className="flex gap-4">
        {/* Tool Icon */}
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{
            backgroundColor: `${item.brandColor}20`,
            border: `2px solid ${item.brandColor}40`
          }}
        >
          {item.logo}
        </a>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
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
          <p 
            ref={textRef}
            className={`text-gray-200 mb-3 leading-relaxed whitespace-pre-line ${expanded ? '' : 'line-clamp-8'}`}
          >
            {item.text}
          </p>

          {/* Devamını Oku */}
          {isClamped && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mb-3 transition-colors"
            >
              {expanded ? (
                <><ChevronUp className="w-3.5 h-3.5" /> Daralt</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" /> Devamını oku</>
              )}
            </button>
          )}

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

            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Twitter className="w-4 h-4" />
              X'te Gör →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
