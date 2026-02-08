function sanitizeHandle(xHandle = '') {
  return String(xHandle || '').trim().replace(/^@+/, '');
}

export function getXProfileUrl(xHandle = '') {
  const handle = sanitizeHandle(xHandle);
  return handle ? `https://twitter.com/${encodeURIComponent(handle)}` : 'https://twitter.com';
}

export function getValidXUrl(url, xHandle = '') {
  const profileUrl = getXProfileUrl(xHandle);
  if (!url || typeof url !== 'string') {
    return profileUrl;
  }

  let candidate = url.trim();
  if (!candidate) {
    return profileUrl;
  }

  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate.replace(/^\/+/, '')}`;
  }

  try {
    const parsed = new URL(candidate);
    const host = parsed.hostname.toLowerCase();
    const isXHost = host === 'x.com' || host.endsWith('.x.com') || host === 'twitter.com' || host.endsWith('.twitter.com');
    const hasInvalidStatus = /\/status\/(undefined|null|nan)(\/|$)/i.test(parsed.pathname);

    if (!isXHost || hasInvalidStatus) {
      return profileUrl;
    }

    // URL'nin geçerli olduğundan emin ol (twitter.com kullan - daha stabil)
    let finalUrl = parsed.toString();
    
    // x.com yerine twitter.com kullan (daha geniş uyumluluk)
    finalUrl = finalUrl.replace('https://x.com/', 'https://twitter.com/');
    
    return finalUrl;
  } catch (err) {
    console.error('[X URL Error]:', err.message, 'URL:', url);
    return profileUrl;
  }
}
