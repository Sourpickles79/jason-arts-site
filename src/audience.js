// First-party, aggregate analytics. No cookies, IP addresses or visitor profiles.
const SITE_HOSTS = new Set(['jasonarts.com', 'www.jasonarts.com']);
const BOT = /bot|crawler|spider|headless|lighthouse|pagespeed|preview|facebookexternalhit|slurp|curl|wget|python|monitor|uptime/i;
const LIMIT = 5000;
const DAY = 86400000;
const CORS = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' };
const reply = (data, status = 200) => Response.json(data, { status, headers: CORS });

export function pagePath(value) {
  if (typeof value !== 'string' || value.length > 180 || !value.startsWith('/')) return null;
  let path = value.split(/[?#]/)[0].toLowerCase().replace(/\/+/g, '/').replace(/\/index\.html?$/, '').replace(/\.html?$/, '').replace(/\/$/, '') || '/';
  if (/^\/(?:|about|ai|apps|blog|books|channels|cozy|creative-services|game|music|orb|portfolio|corgo)$/.test(path)) return path;
  if (/^\/blog-[a-z0-9-]{1,120}$/.test(path)) return path;
  if (/^\/demos\/(bookstore|home-renovation|law-office|pizzeria)(\/(events|projects|practice-areas|menu))?$/.test(path)) return path;
  return null;
}

export function sourceFor(referrer, campaign) {
  let source = 'Direct / unknown';
  if (typeof referrer === 'string' && referrer.length <= 500) {
    try {
      const u = new URL(referrer);
      if (/^https?:$/.test(u.protocol)) {
        const host = u.hostname.toLowerCase().replace(/^www\./, '');
        source = SITE_HOSTS.has(u.hostname) ? `Internal: ${pagePath(u.pathname) || 'other page'}` : `Referral: ${host.slice(0, 100)}`;
      }
    } catch (_) {}
  }
  // Explicit campaign labels are opt-in; never collect arbitrary query strings.
  if (typeof campaign === 'string' && /^[a-zA-Z0-9_-]{1,48}$/.test(campaign)) source = `Campaign: ${campaign.toLowerCase()}`;
  return source;
}

export function destinationFor(value) {
  if (typeof value !== 'string' || value.length > 500) return null;
  try {
    const u = new URL(value, 'https://jasonarts.com');
    if (u.protocol === 'mailto:') return 'Contact email';
    if (!/^https?:$/.test(u.protocol)) return null;
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    if (SITE_HOSTS.has(u.hostname)) {
      if (u.pathname.includes('/download/') || /\.(zip|pdf)$/i.test(u.pathname)) return 'Download';
      if (u.pathname.includes('/play/') || pagePath(u.pathname) === '/corgo' || pagePath(u.pathname) === '/game') return 'Game';
      if (u.hash === '#contact') return 'Contact';
      const path = pagePath(u.pathname);
      return path ? `Site: ${path}` : null;
    }
    if (/(^|\.)youtu\.be$|(^|\.)youtube\.com$/.test(host)) return 'YouTube';
    if (/(^|\.)amazon\.[a-z.]+$|^amzn\.to$/.test(host)) return 'Amazon / books';
    if (/(^|\.)spotify\.com$/.test(host)) return 'Spotify';
    if (/(^|\.)(artstation\.com|linkedin\.com|instagram\.com|facebook\.com|x\.com|twitter\.com)$/.test(host)) return `Social: ${host}`;
    return 'Other external link';
  } catch (_) { return null; }
}

export async function handleAudience(request, env) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
  if (!env.BLOG_LIKES) return reply({ error: 'Audience storage is unavailable.' }, 503);
  const stub = env.BLOG_LIKES.get(env.BLOG_LIKES.idFromName('audience-analytics-v1'));
  if (request.method === 'GET') {
    const range = ['24h', '7d', '30d'].includes(url.searchParams.get('range')) ? url.searchParams.get('range') : '7d';
    const selected = url.searchParams.get('page') || '';
    if (selected && !pagePath(selected)) return reply({ error: 'Invalid page.' }, 400);
    const result = await stub.fetch(new Request(`https://audience.internal/summary?range=${range}&page=${encodeURIComponent(selected ? pagePath(selected) : '')}`));
    return new Response(result.body, { status: result.status, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
  if (request.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405);
  const origin = request.headers.get('Origin');
  try { if (!origin || !SITE_HOSTS.has(new URL(origin).hostname) || new URL(origin).protocol !== 'https:') return reply({ error: 'Origin not allowed.' }, 403); }
  catch (_) { return reply({ error: 'Origin not allowed.' }, 403); }
  if (BOT.test(request.headers.get('User-Agent') || '') || request.cf?.botManagement?.verifiedBot || request.cf?.client?.bot) return new Response(null, { status: 204, headers: CORS });
  if (Number(request.headers.get('Content-Length')) > 2048) return reply({ error: 'Payload too large.' }, 413);
  let body;
  try {
    const text = await request.text();
    if (text.length > 2048) return reply({ error: 'Payload too large.' }, 413);
    body = JSON.parse(text);
  } catch (_) { return reply({ error: 'Invalid event.' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return reply({ error: 'Invalid event.' }, 400);
  const page = pagePath(body.page);
  const event = body.event;
  if (!page || !['view', 'engaged', 'click'].includes(event) || typeof body.id !== 'string' || !/^[a-zA-Z0-9_-]{16,80}$/.test(body.id)) return reply({ error: 'Invalid event.' }, 400);
  const target = event === 'click' ? destinationFor(body.target) : '';
  if (event === 'click' && !target) return reply({ error: 'Invalid destination.' }, 400);
  const ua = request.headers.get('User-Agent') || '';
  const data = { id: body.id, page, event, target, source: sourceFor(body.referrer, body.campaign), country: /^[A-Z]{2}$/.test(request.cf?.country || '') ? request.cf.country : 'Unknown', device: /ipad|tablet/i.test(ua) ? 'Tablet' : /mobile|android|iphone/i.test(ua) ? 'Mobile' : 'Desktop' };
  const result = await stub.fetch(new Request('https://audience.internal/event', { method: 'POST', body: JSON.stringify(data) }));
  return new Response(result.body, { status: result.status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

export function initAudience(storage) {
  storage.sql.exec(`CREATE TABLE IF NOT EXISTS audience_counts (
    hour TEXT NOT NULL, page TEXT NOT NULL, source TEXT NOT NULL, country TEXT NOT NULL,
    device TEXT NOT NULL, event TEXT NOT NULL, target TEXT NOT NULL, n INTEGER NOT NULL,
    PRIMARY KEY(hour,page,source,country,device,event,target)
  );
  CREATE TABLE IF NOT EXISTS audience_seen (id TEXT PRIMARY KEY, at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS audience_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
}

export async function audienceStore(request, storage, state) {
  if (!state.audienceReady) { initAudience(storage); state.audienceReady = true; }
  const sql = storage.sql;
  const now = Date.now();
  const today = new Date(now).toISOString().slice(0, 10);
  const cleanupHour = new Date(now).toISOString().slice(0, 13);
  if (state.audienceCleanup !== cleanupHour) {
    const cutoff = new Date(now - 90 * DAY).toISOString().slice(0, 13);
    // Bounded cleanup avoids a large write burst if the dashboard is dormant.
    sql.exec('DELETE FROM audience_counts WHERE rowid IN (SELECT rowid FROM audience_counts WHERE hour < ? LIMIT 500)', cutoff);
    sql.exec('DELETE FROM audience_seen WHERE rowid IN (SELECT rowid FROM audience_seen WHERE at < ? LIMIT 500)', now - DAY);
    state.audienceCleanup = cleanupHour;
  }
  const url = new URL(request.url);
  if (url.pathname === '/event') {
    const event = await request.json();
    const hour = new Date(now).toISOString().slice(0, 13);
    const key = `${event.id}:${event.event}:${event.target}`;
    let accepted = false;
    let limited = false;
    storage.transactionSync(() => {
      const rows = sql.exec('SELECT value FROM audience_meta WHERE key = ?', 'daily').toArray();
      const daily = rows.length ? JSON.parse(rows[0].value) : { day: today, n: 0 };
      if (daily.day !== today) { daily.day = today; daily.n = 0; daily.sources = []; daily.pages = []; }
      if (daily.n >= LIMIT) { limited = true; return; }
      if (sql.exec('SELECT id FROM audience_seen WHERE id = ?', key).toArray().length) return;
      // Referrer cardinality is bounded to keep storage and queries small under abuse.
      daily.sources ||= [];
      daily.pages ||= [];
      if (!daily.pages.includes(event.page)) {
        if (daily.pages.length >= 150) { limited = true; return; }
        daily.pages.push(event.page);
      }
      let source = event.source;
      if (!daily.sources.includes(source)) {
        if (daily.sources.length >= 100) source = 'Other / source limit';
        else daily.sources.push(source);
      }
      sql.exec('INSERT INTO audience_seen(id,at) VALUES (?,?)', key, now);
      sql.exec(`INSERT INTO audience_counts(hour,page,source,country,device,event,target,n) VALUES(?,?,?,?,?,?,?,1)
        ON CONFLICT(hour,page,source,country,device,event,target) DO UPDATE SET n=n+1`, hour, event.page, source, event.country, event.device, event.event, event.target);
      sql.exec('INSERT INTO audience_meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', 'daily', JSON.stringify({ day: today, n: daily.n + 1, sources: daily.sources, pages: daily.pages }));
      sql.exec('INSERT OR IGNORE INTO audience_meta(key,value) VALUES(?,?)', 'started', new Date(now).toISOString());
      accepted = true;
    });
    return reply({ accepted, limited }, limited ? 429 : 200);
  }
  const range = url.searchParams.get('range') || '7d';
  const hours = { '24h': 24, '7d': 168, '30d': 720 }[range] || 168;
  const since = new Date(now - (hours - 1) * 3600000).toISOString().slice(0, 13);
  const page = url.searchParams.get('page') || '';
  const cacheKey = range + page;
  state.audienceCache ||= new Map();
  const cached = state.audienceCache.get(cacheKey);
  if (cached && now - cached.at < 60000) return reply(cached.data);
  const where = 'hour >= ?' + (page ? ' AND page = ?' : '');
  const args = page ? [since, page] : [since];
  const query = (text, params = args) => sql.exec(text, ...params).toArray();
  const totals = query(`SELECT event, SUM(n) AS count FROM audience_counts WHERE ${where} GROUP BY event`);
  const daily = query(`SELECT substr(hour,1,10) AS day, page, SUM(n) AS views FROM audience_counts WHERE hour >= ? AND event='view' GROUP BY day,page`, [since]);
  const pages = query(`SELECT page, SUM(CASE WHEN event='view' THEN n ELSE 0 END) AS views, SUM(CASE WHEN event='engaged' THEN n ELSE 0 END) AS engaged, SUM(CASE WHEN event='click' THEN n ELSE 0 END) AS clicks FROM audience_counts WHERE hour >= ? GROUP BY page ORDER BY views DESC LIMIT 150`, [since]);
  const data = {
    version: 1, range, page, startedAt: query('SELECT value FROM audience_meta WHERE key=?', ['started'])[0]?.value || null,
    generatedAt: new Date(now).toISOString(), since: since + ':00:00.000Z', retentionDays: 90, dailyEventLimit: LIMIT,
    totals: Object.fromEntries(totals.map(r => [r.event, r.count])), pages, daily,
    sources: query(`SELECT source, SUM(n) AS views FROM audience_counts WHERE ${where} AND event='view' GROUP BY source ORDER BY views DESC LIMIT 30`),
    clicks: query(`SELECT page, target, SUM(n) AS clicks FROM audience_counts WHERE ${where} AND event='click' GROUP BY page,target ORDER BY clicks DESC LIMIT 50`),
    countries: query(`SELECT country, SUM(n) AS views FROM audience_counts WHERE ${where} AND event='view' GROUP BY country ORDER BY views DESC LIMIT 20`),
    devices: query(`SELECT device, SUM(n) AS views FROM audience_counts WHERE ${where} AND event='view' GROUP BY device ORDER BY views DESC`),
    series: query(`SELECT hour, SUM(CASE WHEN event='view' THEN n ELSE 0 END) AS views, SUM(CASE WHEN event='engaged' THEN n ELSE 0 END) AS engaged, SUM(CASE WHEN event='click' THEN n ELSE 0 END) AS clicks FROM audience_counts WHERE ${where} GROUP BY hour ORDER BY hour`),
    limitedToday: (() => { const r = query('SELECT value FROM audience_meta WHERE key=?', ['daily']); const v = r.length ? JSON.parse(r[0].value) : {}; return v.day === today && v.n >= LIMIT; })(),
    notes: ['Browser-measured page loads, not unique people. Known bot user agents and available Cloudflare verified-bot signals are excluded; sophisticated automation can remain.', 'Engaged means at least 10 seconds visible plus scroll, pointer, or keyboard interaction. It does not prove the article was read.', 'Direct / unknown includes hidden referrers, bookmarks, email and some apps. Clicks do not prove a sale or video playback.', 'New measurements only; hourly UTC buckets, approximate rolling ranges, 60-second refresh cache. No cookies, IP addresses or persistent visitor IDs stored.']
  };
  if (state.audienceCache.size >= 100) state.audienceCache.clear();
  state.audienceCache.set(cacheKey, { at: now, data });
  return reply(data);
}
