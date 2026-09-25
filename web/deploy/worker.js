// Read-only proxy to HeXO's API (it has no CORS) for game imports. Everything else is static assets.
const HEXO = 'https://hexo.did.science';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = /^\/api\/hexo\/(sandbox|game)\/([A-Za-z0-9-]{1,64})$/.exec(url.pathname);
    if (m) {
      if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });
      const path = m[1] === 'sandbox' ? `/api/sandbox-positions/${m[2]}` : `/api/finished-games/${m[2]}`;
      const upstream = await fetch(HEXO + path, { headers: { accept: 'application/json' } });
      return new Response(upstream.body, {
        status: upstream.status,
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300' },
      });
    }
    if (url.pathname.startsWith('/api/')) return new Response('Not found', { status: 404 });
    return env.ASSETS.fetch(request);
  },
};
