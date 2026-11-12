// The Worker uses YouTube's regular-upload feeds; no duration-based Shorts guess.
const CHANNEL_META={music:{tag:'Music'},cozy:{tag:'ASMR / Sleep'},orb:{tag:'The Orb'}};
const channelEscape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function channelExcerpt(value){
 const text=String(value||'').replace(/\*\*/g,'').replace(/\*(?=\S)|(?<=\S)\*/g,'').trim();
 if(!text||/[.!?…]["”’\)]?$/.test(text))return text;
 const last=text.lastIndexOf(' ');return(last>40?text.slice(0,last):text).trimEnd()+'…';
}
function videoFeatureRow(video,index,tag){
 const e=channelEscape,orb=tag==='The Orb'||tag==='Music'||tag==='ASMR / Sleep',url=`https://www.youtube.com/watch?v=${e(video.id)}`,title=e(video.title),image=`<img src="https://i.ytimg.com/vi/${e(video.id)}/hqdefault.jpg" alt="${title}" loading="lazy">`;
 return `<article class="book-feature${index%2?' flipped':''}"><div class="book-mockup large" style="--book-accent:#1c242a"><div class="book-cover video-thumb">${orb?`<a class="orb-feed-thumb" href="${url}" target="_blank" rel="noopener" aria-label="Watch ${title} on YouTube">${image}<span aria-hidden="true">▶</span></a>`:image}</div></div><div class="book-feature-copy"><span class="category">${e(tag)}</span><h2>${title}</h2><p>${e(tag==='The Orb' && video.id==='u7fONBIl0mo' ? 'The official trailer for The Orb: The Story So Far introduces the Traveler, his horse and the mysterious power at the heart of their journey.' : orb?channelExcerpt(video.description):video.description)}</p><p class="rating-line">${e(new Date(video.date).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}))}</p><a class="button primary" href="${url}" target="_blank" rel="noopener">Watch on YouTube</a></div></article>`;
}
async function renderChannelPage(key){
 document.getElementById('year').textContent=new Date().getFullYear();
 const list=document.getElementById('channelVideoList'),notice=document.getElementById('liveNotice');
 try{
  const response=await fetch('/api/channel-videos?channel='+encodeURIComponent(key));
  if(!response.ok)throw new Error('Feed unavailable');
  const data=await response.json();
  const videos=data.videos.filter(v=>/^[a-zA-Z0-9_-]{11}$/.test(v.id)).slice(0,8);
  if(videos.length)list.innerHTML=videos.map((v,i)=>videoFeatureRow(v,i,key==='orb'?'The Orb':data.tag)).join('');
  notice.textContent=data.fresh?`The ${videos.length} most recent regular uploads from YouTube. Shorts are excluded.`:'A saved selection of regular YouTube uploads. Open the channel for the latest releases.';
 }catch(_){
  // Keep the complete listing already delivered in HTML, rather than clearing it.
  notice.textContent='A selection of regular uploads. Open the channel on YouTube for the latest releases.';
 }
}
