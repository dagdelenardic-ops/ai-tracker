import { useState, useRef, useEffect } from 'react';
import { Twitter, Heart, Repeat2, MessageCircle, Eye, ChevronDown, ChevronUp, Image as ImageIcon, Play } from 'lucide-react';
import { formatDate, formatFullDate, isRecent } from '../utils/dateUtils';
import { getValidXUrl } from '../utils/xUrl';

// Medya Galerisi Bileşeni
function MediaGallery({ media }) {
  if (!media || media.length === 0) return null;

  const gridClass = media.length === 1 
    ? 'grid-cols-1' 
    : media.length === 2 
      ? 'grid-cols-2' 
      : 'grid-cols-2';

  return (
    <div className={`grid ${gridClass} gap-2 mb-3 mt-2`}>
      {media.map((item, index) => (
        <MediaItem key={index} item={item} index={index} total={media.length} />
      ))}
    </div>
  );
}

// Tek Medya Öğesi
function MediaItem({ item, index, total }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Video gösterimi
  if (item.type === 'video' || item.type === 'animated_gif') {
    return (
      <div className={`relative rounded-xl overflow-hidden bg-dark-800 ${
        total === 1 ? 'aspect-video' : 'aspect-square'
      }`}>
        {item.video_url ? (
          <video
            src={item.video_url}
            poster={item.url}
            controls
            className="w-full h-full object-cover"
            preload="metadata"
          />
        ) : (
          <>
            <img
              src={item.url}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
              loading="lazy"
              onLoad={() => setIsLoaded(true)}
              onError={() => setError(true)}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <a
                href={item.expanded_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <Play className="w-8 h-8 text-white fill-white" />
              </a>
            </div>
          </>
        )}
      </div>
    );
  }

  // Fotoğraf gösterimi
  return (
    <div className={`relative rounded-xl overflow-hidden bg-dark-800 ${
      total === 1 ? 'max-h-96' : 'aspect-square'
    }`}>
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-gray-600 animate-pulse" />
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-gray-600" />
        </div>
      ) : (
        <a
          href={item.expanded_url || item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full"
        >
          <img
            src={item.url}
            alt={`Media ${index + 1}`}
            className={`w-full h-full object-cover transition-opacity duration-300 hover:opacity-90 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            onError={() => setError(true)}
          />
        </a>
      )}
    </div>
  );
}

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

          {/* Medya Galerisi */}
          {item.media && item.media.length > 0 && (
            <MediaGallery media={item.media} />
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
