import { useSingleTweet } from '../hooks/useTwitterEmbed';
import { Loader2, ExternalLink } from 'lucide-react';

export default function TweetEmbed({ xHandle, tweetUrl }) {
  const { containerRef, isLoading } = useSingleTweet(tweetUrl);

  return (
    <div className="relative">
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-800/80 backdrop-blur-sm rounded-lg z-10 min-h-[200px]">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
          <span className="text-sm text-gray-400">X gönderisi yükleniyor...</span>
        </div>
      )}
      
      {/* Tweet container */}
      <div 
        ref={containerRef}
        className="tweet-embed-container min-h-[200px] flex items-center justify-center"
      >
        {/* Fallback link if embed fails */}
        <a 
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          X'te görüntüle
        </a>
      </div>
    </div>
  );
}
