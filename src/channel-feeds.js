import { videoCards, replaceShowcase, videoStructuredData } from './showcase.js';
const CHANNELS={music:{tag:'Music'},cozy:{tag:'ASMR / Sleep'},orb:{tag:'The Orb'}};
const inflight=new Map();
function decode(value) {
 return String(value||'').replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/,'$1').replace(/&#(x[0-9a-f]+|\d+);|&(amp|lt|gt|quot|apos);/gi,(_,n,entity)=>n?String.fromCodePoint(Math.min(0x10ffff,parseInt(n[0].toLowerCase()==='x'?n.slice(1):n,n[0].toLowerCase()==='x'?16:10))):({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[entity.toLowerCase()]));
}
export function parseRegularFeed(xml) {
 return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m=>{
  const pick=tag=>decode((m[1].match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))||[])[1]);
  const id=pick('yt:videoId');
  return {id,title:pick('title'),description:pick('media:description').replace(/\s+/g,' ').slice(0,320),date:pick('published'),image:`https://i.ytimg.com/vi/${id}/hqdefault.jpg`,url:`https://www.youtube.com/watch?v=${id}`};
 }).filter(v=>/^[a-zA-Z0-9_-]{11}$/.test(v.id)&&v.title&&Number.isFinite(Date.parse(v.date))).slice(0,8);
}
export async function channelData(key,request,env) {
 if(!CHANNELS[key])throw new Error('Unknown channel');
 const cache=typeof caches!=='undefined'?caches.default:null;
 const cacheKey=new Request('https://jasonarts.com/__channel-cache/v2/'+key);
 if(cache){const saved=await cache.match(cacheKey);if(saved)return saved.json();}
 if(inflight.has(key))return inflight.get(key);
 const load=(async()=>{
  const r=await env.ASSETS.fetch(new Request(new URL('/assets/data/channel-snapshots.json',request.url)));
  if(!r.ok)throw new Error('Saved channel selection unavailable');
  const snapshots=await r.json();const saved=snapshots[key];
  let videos=saved.videos;let fresh=false;
  try {
   // YouTube's regular-upload playlist, not a duration-based Shorts guess.
   const response=await fetch('https://www.youtube.com/feeds/videos.xml?playlist_id='+encodeURIComponent(saved.playlist),{signal:AbortSignal.timeout(5000)});
   if(!response.ok)throw new Error('Feed unavailable');
   const parsed=parseRegularFeed(await response.text());
   if(!parsed.length)throw new Error('Feed empty');
   videos=parsed;fresh=true;
  }catch(_){/* The verified regular-video snapshot remains usable. */}
  const data={channel:key,tag:CHANNELS[key].tag,videos:videos.slice(0,8),fresh,updatedAt:fresh?new Date().toISOString():saved.checkedAt};
  if(cache)await cache.put(cacheKey,Response.json(data,{headers:{'Cache-Control':`public, max-age=${fresh?1800:300}`}}));
  return data;
 })();
 inflight.set(key,load);try{return await load;}finally{inflight.delete(key);}
}
export async function handleChannelApi(request,env) {
 if(!['GET','HEAD'].includes(request.method))return Response.json({error:'Method not allowed'},{status:405});
 const key=new URL(request.url).searchParams.get('channel');
 if(!CHANNELS[key])return Response.json({error:'Unknown channel'},{status:400});
 try {const data=await channelData(key,request,env);return new Response(request.method==='HEAD'?null:JSON.stringify(data),{headers:{'Content-Type':'application/json','Cache-Control':'public, max-age=300','Access-Control-Allow-Origin':'*'}});}
 catch(_){return Response.json({error:'Channel selection temporarily unavailable'},{status:503});}
}
export async function handleChannelPage(request,env,key) {
 const headers=new Headers(request.headers);headers.delete('If-None-Match');headers.delete('If-Modified-Since');
 const r=await env.ASSETS.fetch(new Request(request.url,{method:'GET',headers}));
 if(!r.ok||r.status!==200)return r;
 let html=await r.text();
 try {
  const data=await channelData(key,request,env);
  html=replaceShowcase(html,'channelVideoList',videoCards(data.videos,data.tag));
  html=html.replace(/<script id="video-jsonld" type="application\/ld\+json">[\s\S]*?<\/script>/g,'');
  html=html.replace('</head>',videoStructuredData(data.videos)+'\n</head>');
  const notice=data.fresh?`The ${data.videos.length} most recent regular uploads from YouTube. Shorts are excluded.`:'A saved selection of regular YouTube uploads. Open the channel for the latest releases.';
  html=html.replace(/(<p class="notice" id="liveNotice"[^>]*>)[\s\S]*?<\/p>/,'$1'+notice+'</p>');
 }
 catch(_){/* Complete saved HTML is the fallback. */}
 const output=new Headers(r.headers);for(const h of ['Content-Length','Content-Encoding','ETag','Last-Modified'])output.delete(h);
 output.set('Content-Type','text/html; charset=utf-8');output.set('Cache-Control','public, max-age=300');
 return new Response(request.method==='HEAD'?null:html,{headers:output});
}
