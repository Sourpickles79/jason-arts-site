// Worker entry point for jason-arts-site.
//
// This runs on EVERY request. For "/api/*" paths it handles them directly
// (right now: /api/stats, which securely fetches visit/page-view numbers
// from Cloudflare's Analytics API). For everything else, it hands the
// request off to the normal static site files via the ASSETS binding.
//
// Requires two environment variables, set in:
// Cloudflare dashboard -> Workers & Pages -> jason-arts-site -> Settings
// -> Variables and Secrets
//   CF_API_TOKEN  (secret) - a Cloudflare API token scoped to
//                             "Zone -> Analytics -> Read" for jasonarts.com
//   CF_ZONE_ID    (text)   - the Zone ID for jasonarts.com, found on the
//                             zone's Overview page in the right sidebar

const RANGE_HOURS = {
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/stats") {
      return handleStats(request, env);
    }

    if (url.pathname === "/sitemap.xml" && request.method === "GET") {
      return handleSitemap(request, env);
    }

    if (/^\/blog-[^/]+\.html$/i.test(url.pathname) && (request.method === "GET" || request.method === "HEAD")) {
      return handleBlogPost(request, env);
    }

    // Not an API route - serve the normal static site.
    return env.ASSETS.fetch(request);
  },
};

async function handleBlogPost(request, env) {
  const asset = await env.ASSETS.fetch(request);
  if (!asset.ok) return asset;

  const html = await asset.text();
  const status = html.match(/<meta\s+name=["']publish-status["']\s+content=["']([^"']*)["']/i)?.[1];
  const publishAt = html.match(/<meta\s+name=["']publish-at["']\s+content=["']([^"']*)["']/i)?.[1];
  const releaseTime = publishAt ? Date.parse(publishAt) : NaN;
  const isFuture = Number.isFinite(releaseTime) && releaseTime > Date.now();
  const invalidSchedule = status === "scheduled" && !Number.isFinite(releaseTime);

  if (status === "draft" || isFuture || invalidSchedule) {
    const notFoundUrl = new URL("/404.html", request.url);
    const notFound = await env.ASSETS.fetch(new Request(notFoundUrl, { method: request.method }));
    const headers = new Headers(notFound.headers);
    headers.set("Cache-Control", "no-store, max-age=0");
    headers.set("X-Robots-Tag", "noindex, nofollow");
    headers.delete("Content-Length");
    headers.delete("Content-Encoding");
    return new Response(request.method === "HEAD" ? null : notFound.body, { status: 404, headers });
  }

  const headers = new Headers(asset.headers);
  headers.delete("Content-Length");
  headers.delete("Content-Encoding");
  return new Response(request.method === "HEAD" ? null : html, { status: asset.status, headers });
}

async function handleSitemap(request, env) {
  const sitemapResponse = await env.ASSETS.fetch(request);
  if (!sitemapResponse.ok) return sitemapResponse;
  let sitemap = await sitemapResponse.text();

  try {
    const dataUrl = new URL("/assets/data/content.js", request.url);
    const dataResponse = await env.ASSETS.fetch(new Request(dataUrl));
    const source = await dataResponse.text();
    const jsonText = source.replace(/^\s*window\.SITE_CONTENT\s*=\s*/, "").replace(/;\s*$/, "");
    const content = JSON.parse(jsonText);
    const now = Date.now();
    const livePosts = (content.blogPosts || []).filter((post) => {
      if (post.status === "draft") return false;
      if (!post.publishAt) return true;
      const release = Date.parse(post.publishAt);
      return Number.isFinite(release) && release <= now;
    });

    const additions = livePosts.filter((post) => post.url && !sitemap.includes(`https://jasonarts.com/${post.url}`)).map((post) => {
      const parsedRelease = post.publishAt ? Date.parse(post.publishAt) : NaN;
      const lastmodValue = post.date || (Number.isFinite(parsedRelease) ? new Date(parsedRelease).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
      const lastmod = escapeXml(lastmodValue);
      return `  <url>\n    <loc>https://jasonarts.com/${escapeXml(post.url)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
    }).join("\n");

    if (additions) sitemap = sitemap.replace("</urlset>", `${additions}\n</urlset>`);
  } catch (error) {
    console.warn("Serving the static sitemap because blog data could not be parsed:", error.message);
  }

  return new Response(sitemap, {
    status: 200,
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300" }
  });
}

function escapeXml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

async function handleStats(request, env) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!env.CF_API_TOKEN || !env.CF_ZONE_ID) {
    return json(
      { error: "Missing CF_API_TOKEN or CF_ZONE_ID environment variable." },
      500,
      corsHeaders
    );
  }

  const url = new URL(request.url);
  const requestedRange = url.searchParams.get("range");
  const range = RANGE_HOURS[requestedRange] ? requestedRange : "24h";
  const hours = RANGE_HOURS[range];

  const now = new Date();
  const since = new Date(now.getTime() - hours * 60 * 60 * 1000);

  const query = `
    query Stats($zoneTag: String!, $since: Time!, $until: Time!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          totals: httpRequestsAdaptiveGroups(
            filter: { AND: [{ datetime_geq: $since, datetime_lt: $until }, { requestSource: "eyeball" }] }
            limit: 1
          ) {
            count
            sum { visits }
          }
          topPages: httpRequestsAdaptiveGroups(
            filter: { AND: [{ datetime_geq: $since, datetime_lt: $until }, { requestSource: "eyeball" }] }
            limit: 10
            orderBy: [count_DESC]
          ) {
            count
            sum { visits }
            dimensions { clientRequestPath }
          }
          topCountries: httpRequestsAdaptiveGroups(
            filter: { AND: [{ datetime_geq: $since, datetime_lt: $until }, { requestSource: "eyeball" }] }
            limit: 10
            orderBy: [count_DESC]
          ) {
            count
            sum { visits }
            dimensions { clientCountryName }
          }
          series: httpRequestsAdaptiveGroups(
            filter: { AND: [{ datetime_geq: $since, datetime_lt: $until }, { requestSource: "eyeball" }] }
            limit: 1000
            orderBy: [datetimeHour_ASC]
          ) {
            count
            sum { visits }
            dimensions { datetimeHour }
          }
        }
      }
    }
  `;

  // Cloudflare Free allows a maximum 24-hour window for this dataset.
  // Split longer ranges into daily requests, then combine them here.
  const dayMs = 24 * 60 * 60 * 1000;
  const intervals = [];
  for (let start = since.getTime(); start < now.getTime(); start += dayMs) {
    intervals.push({
      since: new Date(start),
      until: new Date(Math.min(start + dayMs, now.getTime())),
    });
  }

  const settled = await Promise.allSettled(
    intervals.map((interval) =>
      fetchStatsWindow(env, query, interval).then((zone) => ({ zone, interval }))
    )
  );
  const loaded = settled.filter((result) => result.status === "fulfilled").map((result) => result.value);
  const failed = settled.filter((result) => result.status === "rejected");

  if (!loaded.length) {
    return json(
      { error: failed[0]?.reason?.message || "Cloudflare Analytics returned no available windows." },
      502,
      corsHeaders
    );
  }

  let requests = 0;
  let visits = 0;
  let loadedMs = 0;
  const pages = new Map();
  const countries = new Map();
  const activity = new Map();

  for (const { zone, interval } of loaded) {
    const totals = zone?.totals?.[0];
    requests += totals?.count || 0;
    visits += totals?.sum?.visits || 0;
    loadedMs += interval.until.getTime() - interval.since.getTime();

    for (const page of zone?.topPages || []) {
      const key = page.dimensions.clientRequestPath || "/";
      const current = pages.get(key) || { path: key, requests: 0, visits: 0 };
      current.requests += page.count || 0;
      current.visits += page.sum?.visits || 0;
      pages.set(key, current);
    }
    for (const country of zone?.topCountries || []) {
      const key = country.dimensions.clientCountryName || "Unknown";
      const current = countries.get(key) || { country: key, requests: 0, visits: 0 };
      current.requests += country.count || 0;
      current.visits += country.sum?.visits || 0;
      countries.set(key, current);
    }
    for (const point of zone?.series || []) {
      const key = point.dimensions.datetimeHour;
      const current = activity.get(key) || { time: key, requests: 0, visits: 0 };
      current.requests += point.count || 0;
      current.visits += point.sum?.visits || 0;
      activity.set(key, current);
    }
  }

  const topPages = [...pages.values()].sort((a, b) => b.requests - a.requests).slice(0, 10);
  const topCountries = [...countries.values()].sort((a, b) => b.requests - a.requests).slice(0, 10);
  const series = [...activity.values()].sort((a, b) => new Date(a.time) - new Date(b.time));
  const loadedDays = Math.round((loadedMs / dayMs) * 10) / 10;

  return json(
    {
      range,
      requests,
      visits,
      topPages,
      topCountries,
      series,
      partial: failed.length > 0,
      requestedDays: hours / 24,
      loadedDays,
      generatedAt: now.toISOString(),
    },
    200,
    corsHeaders
  );
}

async function fetchStatsWindow(env, query, interval) {
  let resp;
  try {
    resp = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: {
          zoneTag: env.CF_ZONE_ID,
          since: interval.since.toISOString(),
          until: interval.until.toISOString(),
        },
      }),
    });
  } catch (error) {
    throw new Error(`Fetch to Cloudflare API failed: ${error.message}`);
  }

  if (!resp.ok) throw new Error(`Cloudflare API error: ${resp.status}`);
  const data = await resp.json();
  if (data.errors) throw new Error(data.errors[0]?.message || "Unknown GraphQL error");
  return data?.data?.viewer?.zones?.[0] || {};
}

function json(obj, status, extraHeaders) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}
