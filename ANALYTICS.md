# Audience analytics

The `/api/audience` endpoint collects anonymous browser page-load, engagement, and destination-click events in a dedicated SQLite-backed object in the existing `BLOG_LIKES` binding. Existing likes/download/play counters use other objects and are unchanged. No new paid service, binding, migration, account token, or subscription is needed.

The collector is loaded by `assets/js/header.js`, and explicitly on the Corgo game and demo pages. Future blog posts using the shared header script inherit collection.

- Known automated user agents, available Cloudflare verified-bot signals, and browser automation are filtered. These are estimates, not guaranteed human counts.
- Engagement means ten visible seconds plus a trusted pointer, keyboard or scroll interaction. It does not prove reading completion.
- Clicks are attributed to the page that contains the link. Public Amazon ASINs and YouTube video IDs distinguish individual destinations. Other query data is discarded. One click per destination per page load is accepted. Older grouped counts remain grouped; clicks do not prove purchases or playback.
- Contact form confirmations are counted once per homepage load, only after the existing Formspree request succeeds. This is a browser-reported service response, not proof of a qualified inquiry or delivery into an inbox. Names, emails and messages are never sent to analytics. Existing active-day information remains in the page table and chart.
- External referral hosts, canonical internal paths and explicit `utm_source` labels are supported. Missing referrals remain direct/unknown. No search phrases, complete query strings or email addresses are collected.
- No cookies, IP addresses, fingerprints or persistent visitor identifiers are stored. Random per-page event IDs deduplicate events temporarily. GPC, DNT and owner browser exclusions are respected.
- Country and broad device category are aggregate dimensions. There are no individual visitor reports.
- Reports use UTC hourly buckets, approximate rolling date ranges and a 60-second cache. New measurements are not backfilled from HTTP request counts. Event IDs older than 24 hours and aggregates older than 90 days are removed in bounded hourly batches on access.
- Collection stops at 5,000 accepted events or 150 distinct pages per UTC day; source cardinality is limited to 100 labels per day. Cloudflare's own account-wide free quotas still apply. Exceeding a free quota can interrupt collection; this implementation does not upgrade a plan or enable overage billing.
- The summary API exposes aggregate counts only, similar to the site's existing `/api/stats` endpoint. Never add personal data, per-visitor trails or credentials to its responses.

The private desktop admin is kept outside this public repository. Its updated copy is under the parent workspace's `private-admin/` folder. It must not be uploaded with the public website.

Exclude an owner's browser from the new measurements using `https://jasonarts.com/?analytics=off`; resume using `?analytics=on`. This affects the new audience collector, not Cloudflare's independent request analytics. The two hostnames have separate browser storage; use the corresponding URL if browsing `www.jasonarts.com`.
