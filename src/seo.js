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

export function blogTopic(category) {
  if (/3d|max tips/i.test(category || '')) return '3D & Max Tips';
  if (/ai video|shorts/i.test(category || '')) return 'AI Video & Shorts';
  if (/ai tips/i.test(category || '')) return 'AI Tools';
  return String(category || 'Other');
}

function blogDetails(post) {
  let href;
  try { href = new URL(canonicalSiteUrl(post.url)).pathname; } catch (_) { return null; }
  const release = post.publishAt || post.date || '';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(release) ? release + 'T12:00:00Z' : release);
  const valid = Number.isFinite(date.getTime());
  const format = month => valid ? date.toLocaleDateString('en-US', {timeZone:'America/Chicago',year:'numeric',month,day:'numeric'}) : '';
  const cover = String(post.cover || '');
  const image = /^\/?assets\/[a-zA-Z0-9/_.-]+$/.test(cover) ? '/' + cover.replace(/^\//,'') : '/assets/images/hero-mountain.webp';
  return {href,image,release:valid ? date.toISOString() : '',date:format('long'),shortDate:format('short'),topic:blogTopic(post.category),search:[post.title,post.excerpt,post.category,blogTopic(post.category)].filter(Boolean).join(' ')};
}

function blogAttributes(info) {
  return `data-blog-item data-blog-topic="${escape(info.topic)}" data-blog-search="${escape(info.search)}"`;
}

export function renderBlogCards(posts) {
  return posts.map(post => {
    const info = blogDetails(post);
    if (!info) return '';
    return `<a class="blog-card" href="${escape(info.href)}" ${blogAttributes(info)}><img src="${escape(info.image)}" alt="${escape(post.seo?.coverAlt || post.title)}" loading="lazy"><div class="blog-card-body"><div class="blog-meta"><span>${escape(post.category)}</span><span class="dot">&middot;</span><span>${escape(info.date)}</span></div><h3>${escape(post.title)}</h3><p>${escape(post.excerpt)}</p></div></a>`;
  }).join('\n');
}

export function renderBlogRows(posts) {
  return posts.map(post => {
    const info = blogDetails(post);
    if (!info) return '';
    return `<a class="blog-archive-row" href="${escape(info.href)}" ${blogAttributes(info)}><img src="${escape(info.image)}" alt="" loading="lazy" width="88" height="50"><h3>${escape(post.title)}</h3><span class="blog-row-topic">${escape(info.topic)}</span><time datetime="${escape(info.release)}">${escape(info.shortDate)}</time></a>`;
  }).join('\n');
}

export function renderBlogCollection(posts) {
  const topics = [...new Set(posts.map(post => blogTopic(post.category)))].sort();
  const older = posts.slice(6);
  return `<div id="blogCollection">
      <div class="blog-tools" id="blogTools" hidden>
        <div class="blog-search-field"><label for="blogSearch">Find an article</label><input id="blogSearch" type="search" placeholder="Search all articles…" autocomplete="off" maxlength="160"></div>
        <div class="blog-topic-field"><label for="blogTopic">Topic</label><select id="blogTopic"><option value="">All topics</option>${topics.map(topic=>`<option value="${escape(topic)}">${escape(topic)}</option>`).join('')}</select></div>
        <button type="button" class="button secondary blog-reset" id="blogReset" hidden>Clear filters</button>
      </div>
      <p class="blog-result-count" id="blogResultCount" role="status" aria-live="polite" aria-atomic="true">${posts.length} articles</p>
      <section class="blog-latest" id="blogLatest" aria-labelledby="blogLatestHeading">
        <div class="blog-section-heading"><h2 id="blogLatestHeading">Latest articles</h2><span>The six most recent posts</span></div>
        <div class="blog-grid" id="blogGrid">${renderBlogCards(posts.slice(0,6))}</div>
      </section>
      <section class="blog-archive" id="blogArchive" aria-labelledby="blogArchiveHeading"${older.length?'':' hidden'}>
        <div class="blog-section-heading"><h2 id="blogArchiveHeading">More articles</h2><span id="blogArchiveCount">${older.length} articles</span></div>
        <div class="blog-archive-shell" id="blogArchiveShell" data-at-start>
          <div class="blog-archive-scroll" id="blogArchiveScroll" role="region" aria-label="Older articles" aria-describedby="blogArchiveHint" tabindex="0">${renderBlogRows(older)}</div>
        </div>
        <p class="blog-scroll-hint" id="blogArchiveHint">Scroll for more articles <span aria-hidden="true">↓</span></p>
      </section>
      <p class="blog-empty" id="blogEmpty" hidden>No articles match. Try another search or clear the filters.</p>
    </div><!-- blog-collection-end -->`;
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
    const marker = /<div id="blogCollection">[\s\S]*?<\/div><!-- blog-collection-end -->/;
    html = marker.test(html) ? html.replace(marker, () => renderBlogCollection(posts)) : html.replace(/<div class="blog-grid" id="blogGrid">[\s\S]*?<\/div><!-- blog-index-end -->/, () => renderBlogCollection(posts));
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
