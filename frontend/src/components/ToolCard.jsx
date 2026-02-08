import { useState, useRef, useEffect } from 'react';
import { Heart, Twitter, Calendar, TrendingUp, ChevronDown, ChevronUp, Image as ImageIcon, Play, Quote } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate, isRecent } from '../utils/dateUtils';
import { getValidXUrl, getXProfileUrl } from '../utils/xUrl';

// URL'leri tıklanabilir linklere dönüştür
function LinkifyText({ text }) {
  if (!text) return null;
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
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

// Alıntı Tweet Gösterimi
function QuoteTweet({ quote, parentTweetUrl }) {
  if (!quote) return null;
  
  const quoteUrl = quote.url || parentTweetUrl;
  
  return (
    <a
      href={quoteUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-3 mb-2 p-3 rounded-xl border border-dark-600/50 bg-dark-800/30 hover:bg-dark-800/50 hover:border-indigo-500/30 transition-all"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 mb-2">
        <Quote className="w-3 h-3 text-gray-500" />
        <span className="text-xs font-medium text-gray-400">
          {quote.author?.name || 'Alıntı'}
        </span>
        <span className="text-xs text-gray-500">
          @{quote.author?.handle || ''}
        </span>
      </div>
      <p className="text-xs text-gray-300 line-clamp-2">
        <LinkifyText text={quote.text} />
      </p>
    </a>
  );
}

// Medya Önizleme
function TweetMediaPreview({ media }) {
  if (!media || media.length === 0) return null;

  const [isLoaded, setIsLoaded] = useState(false);
  const firstMedia = media[0];

  if (firstMedia.type === 'video' || firstMedia.type === 'animated_gif') {
    return (
      <div className="relative rounded-lg overflow-hidden bg-dark-800 aspect-video mb-3 mt-2">
        <img
          src={firstMedia.url}
          alt="Video thumbnail"
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="p-2.5 rounded-full bg-white/20">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </div>
        {media.length > 1 && (
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/60 text-xs text-white">
            +{media.length - 1}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden bg-dark-800 aspect-video mb-3 mt-2">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-gray-600 animate-pulse" />
        </div>
      )}
      <img
        src={firstMedia.url}
        alt="Tweet media"
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsLoaded(true)}
      />
      {media.length > 1 && (
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/60 text-xs text-white">
          +{media.length - 1}
        </div>
      )}
    </div>
  );
}

export default function ToolCard({ tool }) {
  const { toggleFavorite, isFavorite } = useApp();
  const favorite = isFavorite(tool.tool);
  const latestTweet = tool.latestTweet;
  const isNew = latestTweet && isRecent(latestTweet.createdAt, 24);
  const tweetUrl = getValidXUrl(latestTweet?.url, tool.xHandle);
  const profileUrl = getXProfileUrl(tool.xHandle);
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (textRef.current) {
      setIsClamped(textRef.current.scrollHeight > textRef.current.clientHeight);
    }
  }, [latestTweet?.text]);

  return (
    <div className="relative overflow-hidden rounded-xl bg-dark-700/50 border border-dark-600/50 animate-fade-in">
      {/* Brand color accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 z-10"
        style={{ backgroundColor: tool.brandColor }}
      />

      {/* New badge */}
      {isNew && (
        <div className="absolute top-3 right-3 z-10">
          <span className="badge-new">YENİ</span>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-lg"
            style={{
              backgroundColor: `${tool.brandColor}20`,
              border: `2px solid ${tool.brandColor}40`
            }}
          >
            {tool.logo}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white truncate">
                {tool.name}
              </h3>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite(tool.tool);
                }}
                className="p-1 rounded-lg hover:bg-dark-600 transition-colors relative z-20"
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    favorite
                      ? 'text-pink-500 fill-pink-500'
                      : 'text-gray-500 hover:text-pink-400'
                  }`}
                />
              </button>
            </div>
            <p className="text-sm text-gray-400">{tool.company}</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${tool.brandColor}20`,
                  color: tool.brandColor
                }}
              >
                {tool.categoryLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Latest Tweet */}
        {latestTweet ? (
          <div className="rounded-lg p-3 border border-dark-600/50 bg-dark-800/50">
            <p
              ref={textRef}
              className={`text-sm text-gray-300 whitespace-pre-line ${expanded ? '' : 'line-clamp-8'}`}
            >
              <LinkifyText text={latestTweet.text} />
            </p>

            {isClamped && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-2 transition-colors"
              >
                {expanded ? (
                  <><ChevronUp className="w-3.5 h-3.5" /> Daralt</>
                ) : (
                  <><ChevronDown className="w-3.5 h-3.5" /> Devamını oku</>
                )}
              </button>
            )}

            {/* Alıntı Tweet */}
            {latestTweet.quotedTweet && (
              <QuoteTweet quote={latestTweet.quotedTweet} parentTweetUrl={tweetUrl} />
            )}

            {/* Medya Önizleme */}
            {latestTweet.media && latestTweet.media.length > 0 && (
              <TweetMediaPreview media={latestTweet.media} />
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-600/50">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(latestTweet.createdAt)}
                </span>
                {latestTweet.metrics?.like_count > 0 && (
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {latestTweet.metrics.like_count.toLocaleString()}
                  </span>
                )}
              </div>

              <a
                href={tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Twitter className="w-3.5 h-3.5" />
                X'te Gör →
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Twitter className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Son 24 saatte paylaşım yok</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dark-600/30">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 btn-secondary text-sm flex items-center justify-center gap-2"
          >
            <Twitter className="w-4 h-4" />
            X Profili
          </a>
        </div>
      </div>
    </div>
  );
}
