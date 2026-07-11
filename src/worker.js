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

    // Not an API route - serve the normal static site.
    return env.ASSETS.fetch(request);
  },
};

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
            filter: { AND: [{ datetime_geq: $since, datetime_leq: $until }, { requestSource: "eyeball" }] }
            limit: 1
          ) {
            count
            sum { visits }
          }
          topPages: httpRequestsAdaptiveGroups(
            filter: { AND: [{ datetime_geq: $since, datetime_leq: $until }, { requestSource: "eyeball" }] }
            limit: 10
            orderBy: [count_DESC]
          ) {
            count
            sum { visits }
            dimensions { clientRequestPath }
          }
          topCountries: httpRequestsAdaptiveGroups(
            filter: { AND: [{ datetime_geq: $since, datetime_leq: $until }, { requestSource: "eyeball" }] }
            limit: 10
            orderBy: [count_DESC]
          ) {
            count
            sum { visits }
            dimensions { clientCountryName }
          }
        }
      }
    }
  `;

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
          since: since.toISOString(),
          until: now.toISOString(),
        },
      }),
    });
  } catch (e) {
    return json({ error: `Fetch to Cloudflare API failed: ${e.message}` }, 502, corsHeaders);
  }

  if (!resp.ok) {
    const bodyText = await resp.text();
    return json({ error: `Cloudflare API error: ${resp.status}`, detail: bodyText.slice(0, 500) }, 502, corsHeaders);
  }

  const data = await resp.json();

  if (data.errors) {
    return json({ error: data.errors[0]?.message || "Unknown GraphQL error" }, 502, corsHeaders);
  }

  const zone = data?.data?.viewer?.zones?.[0];
  const totals = zone?.totals?.[0];
  const topPages = (zone?.topPages || []).map((p) => ({
    path: p.dimensions.clientRequestPath,
    requests: p.count,
    visits: p.sum.visits,
  }));
  const topCountries = (zone?.topCountries || []).map((c) => ({
    country: c.dimensions.clientCountryName,
    requests: c.count,
    visits: c.sum.visits,
  }));

  return json(
    {
      range,
      requests: totals?.count || 0,
      visits: totals?.sum?.visits || 0,
      topPages,
      topCountries,
      generatedAt: now.toISOString(),
    },
    200,
    corsHeaders
  );
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
