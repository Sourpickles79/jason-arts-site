const ORIGIN = 'https://jasonarts.com';
const MAIN_PAGES = ['/', '/portfolio', '/books', '/channels', '/blog', '/apps', '/ai', '/music', '/cozy', '/orb', '/about', '/creative-services', '/corgo/'];

export function canonicalSiteUrl(value) {
  const url = new URL(value, ORIGIN + '/');
  if (!['jasonarts.com', 'www.jasonarts.com'].includes(url.hostname)) throw new Error('Not a JasonArts URL');
  url.protocol = 'https:'; url.hostname = 'jasonarts.com'; url.port = '';
  url.pathname = url.pathname.replace(/index\.html?$/i, '').replace(/\.html?$/i, '');
  if (url.pathname === '/corgo' || /^\/demos\/(bookstore|home-renovation|law-office|pizzeria)$/.test(url.pathname)) url.pathname += '/';
  return url.href;
}

export function publishedPosts(content, now = Date.now()) {
  return (content.blogPosts || []).filter(post => {
    if (!post.url || post.status === 'draft') return false;
    if (!post.publishAt) return post.status !== 'scheduled';
    const release = Date.parse(post.publishAt);
    return Number.isFinite(release) && release <= now;
  }).sort((a,b) => (Date.parse(b.publishAt || b.date || '') || 0) - (Date.parse(a.publishAt || a.date || '') || 0));
}

async function readContent(request, env) {
  const response = await env.ASSETS.fetch(new Request(new URL('/assets/data/content.js', request.url)));
  if (!response.ok) throw new Error('Site content unavailable');
  const source = await response.text();
  return JSON.parse(source.replace(/^\s*window\.SITE_CONTENT\s*=\s*/, '').replace(/;\s*$/, ''));
}

function escape(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

export function renderBlogCards(posts) {
  return posts.map(post => {
    let href;
    try { href = new URL(canonicalSiteUrl(post.url)).pathname; } catch (_) { return ''; }
    const release = post.publishAt || post.date;
    const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(release || '') ? release + 'T12:00:00Z' : release);
    const label = Number.isFinite(date.getTime()) ? date.toLocaleDateString('en-US', { timeZone:'America/Chicago',year:'numeric',month:'long',day:'numeric' }) : '';
    const cover = String(post.cover || '');
    // Site content uses relative asset paths; avoid unsafe attribute schemes.
    const image = /^\/?assets\/[a-zA-Z0-9/_.-]+$/.test(cover) ? '/' + cover.replace(/^\//,'') : '/assets/images/hero-mountain.webp';
    return `<a class="blog-card" href="${escape(href)}"><img src="${escape(image)}" alt="${escape(post.title)}" loading="lazy"><div class="blog-card-body"><div class="blog-meta"><span>${escape(post.category)}</span><span class="dot">&middot;</span><span>${escape(label)}</span></div><h3>${escape(post.title)}</h3><p>${escape(post.excerpt)}</p></div></a>`;
  }).join('\n');
}

export async function handleBlogIndex(request, env) {
  const headers = new Headers(request.headers);
  headers.delete('If-None-Match'); headers.delete('If-Modified-Since');
  const asset = await env.ASSETS.fetch(new Request(request.url, { method:'GET',headers }));
  if (!asset.ok || asset.status !== 200) return asset;
  let html = await asset.text();
  try {
    const content = await readContent(request, env);
    const posts = publishedPosts(content);
    html = html.replace(/<div class="blog-grid" id="blogGrid">[\s\S]*?<\/div><!-- blog-index-end -->/, `<div class="blog-grid" id="blogGrid">${renderBlogCards(posts)}</div><!-- blog-index-end -->`);
  } catch (error) {
    // Retain the complete static listing if the content request fails.
    console.warn('Serving fallback blog index:', error.message);
  }
  const output = new Headers(asset.headers);
  for (const name of ['Content-Length','Content-Encoding','ETag','Last-Modified']) output.delete(name);
  output.set('Content-Type','text/html; charset=utf-8');
  output.set('Cache-Control','public, max-age=300');
  return new Response(request.method === 'HEAD' ? null : html, { status:200,headers:output });
}

export async function handleSearchSitemap(request, env) {
  try {
    const content = await readContent(request, env);
    const urls = new Map(MAIN_PAGES.map(path => [canonicalSiteUrl(path), null]));
    for (const post of publishedPosts(content)) {
      let url;
      try { url = canonicalSiteUrl(post.url); } catch (_) { continue; }
      const timestamp = Date.parse(post.publishAt || post.date || '');
      urls.set(url, Number.isFinite(timestamp) ? new Date(timestamp).toISOString().slice(0,10) : null);
    }
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...urls].map(([url,date]) => `  <url><loc>${escape(url)}</loc>${date ? `<lastmod>${date}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`;
    return new Response(request.method === 'HEAD' ? null : xml, {headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300'}});
  } catch (_) {
    return env.ASSETS.fetch(request);
  }
}
