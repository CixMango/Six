// Read-only proxy to HeXO's API (it has no CORS) for game imports, and the feedback form's relay to Discord.
// Everything else is static assets.
const HEXO = 'https://hexo.did.science';

// Feedback: at most this many messages per address in the window (per worker instance; enough to stop a runaway form).
const FEEDBACK_LIMIT = 5;
const FEEDBACK_WINDOW_MS = 10 * 60_000;
const recent = new Map();

function tooMany(address) {
  const now = Date.now();
  const times = (recent.get(address) ?? []).filter((t) => now - t < FEEDBACK_WINDOW_MS);
  if (times.length >= FEEDBACK_LIMIT) return true;
  times.push(now);
  recent.set(address, times);
  if (recent.size > 5000) recent.clear();
  return false;
}

const clip = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

/** Posts to the Discord webhook kept in the FEEDBACK_WEBHOOK secret (never in the code or the app). */
async function feedback(request, env) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!env.FEEDBACK_WEBHOOK) return Response.json({ error: "Feedback isn't set up yet." }, { status: 503 });
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Send JSON.' }, { status: 400 });
  }
  const message = clip(body.message, 1500);
  if (!message) return Response.json({ error: 'Write something first.' }, { status: 400 });
  if (tooMany(request.headers.get('cf-connecting-ip') ?? 'unknown')) {
    return Response.json({ error: 'Too many messages; try again in a few minutes.' }, { status: 429 });
  }
  const contact = clip(body.contact, 100);
  const source = body.source === 'app' ? 'App' : 'Website';
  const details = [`${source}${clip(body.version, 20) ? ` ${clip(body.version, 20)}` : ''}`, clip(body.page, 80)].filter(Boolean).join(' · ');
  const upstream = await fetch(env.FEEDBACK_WEBHOOK, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      username: 'Six feedback',
      // No @everyone, role or user pings from a feedback message.
      allowed_mentions: { parse: [] },
      embeds: [
        {
          description: message,
          color: 0xf7cf45,
          fields: contact ? [{ name: 'Contact', value: contact }] : [],
          footer: { text: details },
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });
  if (!upstream.ok) return Response.json({ error: "Couldn't deliver it right now." }, { status: 502 });
  return new Response(null, { status: 204 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/feedback') return feedback(request, env);
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
