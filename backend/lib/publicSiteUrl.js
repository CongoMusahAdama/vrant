const DEFAULT_PUBLIC_SITE = 'https://vrant.com';

function isLocalUrl(url) {
  if (!url) return true;
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return true;
  }
}

/**
 * Customer-facing site URL for SMS and email links.
 * Uses PUBLIC_SITE_URL when set; otherwise FRONTEND_URL unless it is localhost.
 */
function publicSiteUrl() {
  const explicit = process.env.PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const frontend = process.env.FRONTEND_URL?.trim();
  if (frontend && !isLocalUrl(frontend)) {
    return frontend.replace(/\/$/, '');
  }

  return DEFAULT_PUBLIC_SITE;
}

module.exports = { publicSiteUrl, DEFAULT_PUBLIC_SITE };
