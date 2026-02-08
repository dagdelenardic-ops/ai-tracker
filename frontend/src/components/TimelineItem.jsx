import { useState, useRef, useEffect } from 'react';
import { Twitter, Heart, Repeat2, MessageCircle, Eye, ChevronDown, ChevronUp, Image as ImageIcon, Play, ExternalLink, Quote } from 'lucide-react';
import { formatDate, formatFullDate, isRecent } from '../utils/dateUtils';
import { getValidXUrl } from '../utils/xUrl';

// URL'leri tıklanabilir linklere dönüştür
function LinkifyText({ text }) {
  if (!text) return null;
  
  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          // URL'yi kısalt göster
          const displayUrl = part.length > 40 ? part.substring(0, 40) + '...' : part;
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 hover:underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {displayUrl}
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

// Alıntı Tweet (Quote Tweet) Gösterimi
function QuoteTweet({ quote, parentTweetUrl }) {
  if (!quote) return null;
  
  const quoteUrl = quote.url || parentTweetUrl;
  
  return (
    <a
      href={quoteUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-3 mb-3 p-3 rounded-xl border border-dark-600/50 bg-dark-800/30 hover:bg-dark-800/50 hover:border-indigo-500/30 transition-all"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 mb-2">
        <Quote className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-400">
          {quote.author?.name || 'Alıntılanan Tweet'}
        </span>
        <span className="text-sm text-gray-500">
          @{quote.author?.handle || ''}
        </span>
      </div>
      <p className="text-sm text-gray-300 line-clamp-3">
        <LinkifyText text={quote.text} />
      </p>
      {quote.media && quote.media.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <ImageIcon className="w-3 h-3" />
          {quote.media.length} görsel
        </div>
      )}
    </a>
  );
}

// Medya Galerisi Bileşeni
function MediaGallery({ media, tweetUrl }) {
  if (!media || media.length === 0) return null;

  const gridClass = media.length === 1 
    ? 'grid-cols-1' 
    : media.length === 2 
      ? 'grid-cols-2' 
      : 'grid-cols-2';

  return (
    <div className={`grid ${gridClass} gap-2 mb-3 mt-2`}>
      {media.map((item, index) => (
        <MediaItem key={index} item={item} index={index} total={media.length} tweetUrl={tweetUrl} />
      ))}
    </div>
  );
}

// Tek Medya Öğesi
function MediaItem({ item, index, total, tweetUrl }) {
  const [error, setError] = useState(false);

  // Video gösterimi
  if (item.type === 'video' || item.type === 'animated_gif') {
    return (
      <a 
        href={tweetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`relative rounded-xl overflow-hidden bg-dark-800 block ${
          total === 1 ? 'aspect-video' : 'aspect-square'
        }`}
      >
        <img
          src={item.url}
          alt="Video thumbnail"
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setError(true)}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <Play className="w-8 h-8 text-white fill-white" />
          </div>
        </div>
        {total > 1 && (
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/60 text-xs text-white">
            +{total - 1}
          </div>
        )}
      </a>
    );
  }

  // Fotoğraf gösterimi
  return (
    <a 
      href={tweetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative rounded-xl overflow-hidden bg-dark-800 block ${
        total === 1 ? 'max-h-96' : 'aspect-square'
      }`}
    >
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-800 text-gray-500">
          <ImageIcon className="w-8 h-8 mb-2" />
          <span className="text-xs">X'te Gör</span>
        </div>
      ) : (
        <>
          <img
            src={item.url}
            alt={`Görsel ${index + 1}`}
            className="w-full h-full object-cover hover:opacity-90 transition-opacity"
            loading="lazy"
            onError={() => setError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
            <span className="text-white text-sm flex items-center gap-1">
              <ExternalLink className="w-4 h-4" /> X'te Aç
            </span>
          </div>
        </>
      )}
      {total > 1 && (
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/60 text-xs text-white">
          +{total - 1}
        </div>
      )}
    </a>
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

          {/* Tweet Text - Linkify edilmiş */}
          <p 
            ref={textRef}
            className={`text-gray-200 mb-3 leading-relaxed whitespace-pre-line ${expanded ? '' : 'line-clamp-8'}`}
          >
            <LinkifyText text={item.text} />
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

          {/* Alıntı Tweet */}
          {item.quotedTweet && (
            <QuoteTweet quote={item.quotedTweet} parentTweetUrl={tweetUrl} />
          )}

          {/* Medya Galerisi */}
          {item.media && item.media.length > 0 && (
            <MediaGallery media={item.media} tweetUrl={tweetUrl} />
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
