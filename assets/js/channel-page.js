// Renders a single channel's newest-first video list.
// If a YouTube Data API key is set in content.js (links.youtubeApiKey),
// this pulls the channel's real uploads live. Otherwise it falls back
// to the manual "videos" list in content.js, filtered to this channel.

const CHANNEL_META = {
  music:  { linkKey: "youtubeMusic", idKey: "youtubeMusicId", tag: "Music" },
  cozy:   { linkKey: "youtubeCozy",  idKey: "youtubeCozyId",  tag: "ASMR / Sleep" },
  orb:    { linkKey: "youtubeOrb",   idKey: "youtubeOrbId",   tag: "Animated Shorts" }
};

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d)) return value;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function videoFeatureRow(video, index) {
  const flipped = index % 2 ? " flipped" : "";
  return `
    <article class="book-feature${flipped}">
      <div class="book-mockup large" style="--book-accent:#1c242a">
        <div class="book-cover video-thumb">
          <img src="${video.image}" alt="${video.title}" loading="lazy">
        </div>
      </div>
      <div class="book-feature-copy">
        <span class="category">${video.channel}</span>
        <h2>${video.title}</h2>
        <p>${video.description}</p>
        ${video.date ? `<p class="rating-line">${formatDate(video.date)}</p>` : ""}
        <a class="button primary" href="${video.url}" target="_blank" rel="noopener">Watch on YouTube</a>
      </div>
    </article>
  `;
}

async function fetchLiveVideos(channelId, apiKey, tag) {
  const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet&order=date&maxResults=12&type=video`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("YouTube API request failed");
  const data = await response.json();
  return (data.items || []).map(item => ({
    title: item.snippet.title,
    channel: tag,
    image: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    date: item.snippet.publishedAt,
    description: item.snippet.description || ""
  }));
}

function manualVideos(data, tag) {
  const list = (data.videos || []).filter(v => v.channel === tag);
  return [...list].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

function injectVideoStructuredData(videos, channelTitle) {
  const existing = document.getElementById("video-jsonld");
  if (existing) existing.remove();
  if (!videos.length) return;

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": videos.map((v, i) => ({
      "@type": "VideoObject",
      "position": i + 1,
      "name": v.title,
      "description": v.description || v.title,
      "thumbnailUrl": v.image,
      "uploadDate": v.date || undefined,
      "embedUrl": v.url
    }))
  };

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "video-jsonld";
  script.textContent = JSON.stringify(itemList);
  document.head.appendChild(script);

  // Freshen the meta description with the newest real video title, so
  // any crawler or share preview that reads the tag (even without running
  // JS-rendered content) reflects what's actually newest right now.
  const desc = document.querySelector('meta[name="description"]');
  if (desc && videos[0]) {
    desc.setAttribute("content", `${channelTitle}: recent release "${videos[0].title}" and more from the channel.`);
  }
}

async function renderChannelPage(channelKey) {
  document.getElementById("year").textContent = new Date().getFullYear();
  const meta = CHANNEL_META[channelKey];
  const data = window.SITE_CONTENT || {};
  const links = data.links || {};
  const apiKey = links.youtubeApiKey;
  const channelId = links[meta.idKey];
  const listEl = document.getElementById("channelVideoList");
  const noticeEl = document.getElementById("liveNotice");

  let videos = manualVideos(data, meta.tag);
  let isLive = false;

  if (apiKey && channelId) {
    try {
      const live = await fetchLiveVideos(channelId, apiKey, meta.tag);
      if (live.length) {
        videos = live;
        isLive = true;
      }
    } catch (err) {
      console.warn("Falling back to manual video list:", err);
    }
  }

  if (noticeEl) {
    noticeEl.textContent = isLive
      ? `Showing the ${Math.min(videos.length, 12)} most recent releases from YouTube.`
      : "A featured selection from the channel.";
  }

  if (listEl) {
    listEl.innerHTML = videos.length
      ? videos.map(videoFeatureRow).join("")
      : `<p class="notice">No releases are available here yet. Visit the channel on YouTube to explore more.</p>`;
  }

  injectVideoStructuredData(videos, document.title.split(" | ")[0]);
}
