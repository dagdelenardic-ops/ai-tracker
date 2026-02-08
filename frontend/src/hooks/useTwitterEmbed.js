import { useEffect, useRef, useState } from 'react';

export function useTwitterEmbed() {
  const [isLoaded, setIsLoaded] = useState(false);
  const scriptRef = useRef(null);

  useEffect(() => {
    // Check if script already exists
    if (document.getElementById('twitter-widget-script')) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'twitter-widget-script';
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.charset = 'utf-8';
    
    script.onload = () => {
      setIsLoaded(true);
      if (window.twttr) {
        window.twttr.widgets.load();
      }
    };

    document.body.appendChild(script);
    scriptRef.current = script;

    return () => {
      // Don't remove script on unmount to avoid reloading
    };
  }, []);

  const loadTweet = (containerRef) => {
    if (window.twttr && containerRef.current) {
      window.twttr.widgets.load(containerRef.current);
    }
  };

  return { isLoaded, loadTweet };
}

// Hook to load a single tweet embed
export function useSingleTweet(tweetUrl) {
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isLoaded } = useTwitterEmbed();

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !tweetUrl) return;

    setIsLoading(true);
    
    // Clear previous content
    containerRef.current.innerHTML = '';
    
    // Create blockquote element
    const blockquote = document.createElement('blockquote');
    blockquote.className = 'twitter-tweet';
    blockquote.setAttribute('data-theme', 'dark');
    blockquote.setAttribute('data-lang', 'tr');
    blockquote.setAttribute('data-align', 'center');
    
    const link = document.createElement('a');
    link.href = tweetUrl;
    blockquote.appendChild(link);
    
    containerRef.current.appendChild(blockquote);
    
    // Load tweet
    if (window.twttr) {
      window.twttr.widgets.load(containerRef.current).then(() => {
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
      
      // Fallback timeout
      setTimeout(() => setIsLoading(false), 3000);
    }
  }, [tweetUrl, isLoaded]);

  return { containerRef, isLoading };
}
