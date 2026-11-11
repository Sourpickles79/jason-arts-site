const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const asset = value => /^\/?assets\/[a-zA-Z0-9/_.-]+$/.test(value || '') ? '/' + value.replace(/^\//,'') : '';
const safeLink = value => { try { const u = new URL(value,'https://jasonarts.com'); return ['http:','https:'].includes(u.protocol) ? u.href : '#'; } catch (_) { return '#'; } };

export function portfolioCards(items) {
 return items.map(item=>`<article class="card" data-category="${esc(item.category)}" data-has-video="${Boolean(item.video)}" data-modeled="${Boolean(item.modeled)}">${item.video ? `<video controls preload="none" poster="${esc(asset(item.image))}"><source src="${esc(asset(item.video))}" type="video/mp4"></video>` : `<img src="${esc(asset(item.image))}" alt="${esc(item.title)} - ${esc(item.category)} by Jason Arts" loading="lazy">`}<div class="card-body"><span class="category">${esc(item.category)}</span><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p></div></article>`).join('\n');
}
export function bookCards(items) {
 return items.map((book,index)=>`<article class="book-feature${index%2?' flipped':''}" id="book-${esc((book.buyUrl.match(/\/dp\/([a-zA-Z0-9]+)/)||[])[1] || index)}"><div class="book-mockup large" style="--book-accent:${/^#[a-fA-F0-9]{3,8}$/.test(book.accent||'')?book.accent:'#d8903c'}"><div class="book-cover"><img src="${esc(asset(book.cover))}" alt="${esc(book.title)} cover" loading="lazy"></div></div><div class="book-feature-copy"><span class="category">${esc(book.type)}</span><h2>${esc(book.title)}</h2><p>${esc(book.description)}</p><div class="book-specs"><span>${esc(book.age)}</span><span>${esc(book.pages)}</span><span>${esc(book.format)}</span></div>${book.rating?`<p class="rating-line"><span class="stars">${'★'.repeat(Math.max(0,Math.min(5,Math.round(book.rating))))}${'☆'.repeat(Math.max(0,5-Math.round(book.rating)))}</span> ${Number(book.rating).toFixed(1)}${book.reviewCount?' ('+Number(book.reviewCount)+')':''}</p>`:''}<a class="button primary" href="${esc(safeLink(book.buyUrl))}" target="_blank" rel="noopener">Buy Now</a></div></article>`).join('\n');
}
export function aiCards(items) {
 return items.map(item=>`<article class="ai-card" data-category="${esc(item.type)}"><div class="ai-media">${item.kind==='video'?`<video controls preload="none" poster="${esc(asset(item.poster))}"><source src="${esc(asset(item.src))}" type="video/mp4"></video><span class="play-badge" aria-hidden="true">&#9654;</span>`:`<img src="${esc(asset(item.src))}" alt="${esc(item.title)} — AI artwork by Jason Arts" loading="lazy">`}</div><div class="ai-card-body"><span class="category">${item.type==='Short'?'AI Short':item.type==='Frame'?'Story Frame':'Concept Art'}</span><h3>${esc(item.title)}</h3><p>${esc(item.desc)}</p></div></article>`).join('\n');
}
export function replaceShowcase(html,id,markup) {
 const regex=new RegExp(`(<div\\b[^>]*id="${id}"[^>]*>)[\\s\\S]*?<\\/div><!-- ${id}-end -->`);
 return html.replace(regex,(_,open)=>open+markup+`</div><!-- ${id}-end -->`);
}
export async function siteContent(request,env) {
 const r=await env.ASSETS.fetch(new Request(new URL('/assets/data/content.js',request.url)));
 if(!r.ok)throw new Error('Content unavailable');
 return JSON.parse((await r.text()).replace(/^\s*window\.SITE_CONTENT\s*=\s*/,'').replace(/;\s*$/,''));
}
export async function handleShowcase(request,env) {
 const headers=new Headers(request.headers);headers.delete('If-None-Match');headers.delete('If-Modified-Since');
 const response=await env.ASSETS.fetch(new Request(request.url,{method:'GET',headers}));
 if(!response.ok || response.status!==200)return response;
 let html=await response.text();
 try {
  const content=await siteContent(request,env);
  if(html.includes('id="portfolioGrid"'))html=replaceShowcase(html,'portfolioGrid',portfolioCards(content.portfolio||[]));
  if(html.includes('id="bookList"'))html=replaceShowcase(html,'bookList',bookCards(content.books||[]));
  if(html.includes('id="aiGrid"')){
   const r=await env.ASSETS.fetch(new Request(new URL('/assets/data/ai-work.json',request.url)));
   if(r.ok)html=replaceShowcase(html,'aiGrid',aiCards(await r.json()));
  }
 }catch(error){console.warn('Using saved showcase HTML:',error.message);}
 const output=new Headers(response.headers);
 for(const h of ['Content-Length','Content-Encoding','ETag','Last-Modified'])output.delete(h);
 output.set('Content-Type','text/html; charset=utf-8');output.set('Cache-Control','public, max-age=300');
 return new Response(request.method==='HEAD'?null:html,{status:200,headers:output});
}

function channelExcerpt(value) {
 const text=String(value||'').replace(/\*\*/g,'').replace(/\*(?=\S)|(?<=\S)\*/g,'').trim();
 if (!text || /[.!?…]["”’\)]?$/.test(text)) return text;
 const last=text.lastIndexOf(' ');
 return (last>40?text.slice(0,last):text).trimEnd()+'…';
}
export function videoCards(videos,tag) {
 return videos.map((v,i)=>{const orb=tag==='The Orb'||tag==='Music'||tag==='ASMR / Sleep', url=`https://www.youtube.com/watch?v=${esc(v.id)}`, title=esc(v.title), image=`<img src="${esc(v.image)}" alt="${title}" loading="lazy">`;return `<article class="book-feature${i%2?' flipped':''}"><div class="book-mockup large" style="--book-accent:#1c242a"><div class="book-cover video-thumb">${orb?`<a class="orb-feed-thumb" href="${url}" target="_blank" rel="noopener" aria-label="Watch ${title} on YouTube">${image}<span aria-hidden="true">▶</span></a>`:image}</div></div><div class="book-feature-copy"><span class="category">${esc(tag)}</span><h2>${title}</h2><p>${esc(orb?channelExcerpt(v.description):v.description)}</p>${v.date?`<p class="rating-line">${esc(new Date(v.date).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'America/Chicago'}))}</p>`:''}<a class="button primary" href="${url}" target="_blank" rel="noopener">Watch on YouTube</a></div></article>`}).join('\n');
}

export function videoStructuredData(videos) {
 const data={'@context':'https://schema.org','@type':'ItemList',itemListElement:videos.map((v,i)=>({'@type':'ListItem',position:i+1,item:{'@type':'VideoObject',name:v.title,description:v.description||v.title,thumbnailUrl:v.image,uploadDate:v.date,url:v.url}}))};
 return '<script id="video-jsonld" type="application/ld+json">'+JSON.stringify(data).replace(/</g,'\\u003c')+'</script>';
}
