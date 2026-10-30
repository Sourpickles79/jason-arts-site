(function () {
  'use strict';
  if (window.__jaAudience || !/^https:$/.test(location.protocol) || !/^(www\.)?jasonarts\.com$/.test(location.hostname)) return;
  window.__jaAudience = true;
  const params = new URLSearchParams(location.search);
  try {
    if (params.get('analytics') === 'off') localStorage.setItem('ja-audience-exclude', '1');
    if (params.get('analytics') === 'on') localStorage.removeItem('ja-audience-exclude');
    if (localStorage.getItem('ja-audience-exclude') === '1') return;
  } catch (_) {}
  if (navigator.globalPrivacyControl || navigator.doNotTrack === '1' || navigator.webdriver || /bot|crawler|spider|headless|lighthouse|pagespeed|preview/i.test(navigator.userAgent)) return;
  const path = location.pathname.replace(/\/index\.html?$/, '').replace(/\.html?$/, '').replace(/\/$/, '') || '/';
  if (path === '/404' || path.includes('admin')) return;
  const id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), v => v.toString(16).padStart(2, '0')).join('');
  let referrer = '';
  try { const u = new URL(document.referrer); referrer = u.origin + u.pathname; } catch (_) {}
  const campaign = params.get('utm_source') || '';
  const base = { id, page: path, referrer, campaign: /^[a-zA-Z0-9_-]{1,48}$/.test(campaign) ? campaign : '' };
  let viewed = false;
  let engaged = false;
  let interacted = false;
  let visibleMs = 0;
  let visibleSince = document.visibilityState === 'visible' ? performance.now() : null;
  const sentTargets = new Set();
  function send(event, target) {
    const body = JSON.stringify({ ...base, event, ...(target ? { target } : {}) });
    // keepalive continues through ordinary link navigation without delaying it.
    fetch('/api/audience', { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body, keepalive: true, credentials: 'omit' }).catch(() => {});
  }
  function view() {
    if (!viewed && document.visibilityState === 'visible' && !document.prerendering) { viewed = true; send('view'); }
  }
  function checkEngaged() {
    const elapsed = visibleMs + (visibleSince === null ? 0 : performance.now() - visibleSince);
    if (viewed && !engaged && interacted && elapsed >= 10000 && document.visibilityState === 'visible') { engaged = true; send('engaged'); clearInterval(timer); }
  }
  function interaction(event) { if (event.isTrusted) { interacted = true; checkEngaged(); } }
  for (const name of ['pointerdown', 'keydown', 'scroll']) addEventListener(name, interaction, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (visibleSince !== null) visibleMs += performance.now() - visibleSince;
    visibleSince = document.visibilityState === 'visible' ? performance.now() : null;
    view(); checkEngaged();
  });
  document.addEventListener('prerenderingchange', view);
  document.addEventListener('click', event => {
    if (!event.isTrusted || document.visibilityState !== 'visible' || !viewed) return;
    const a = event.target.closest && event.target.closest('a[href]');
    if (!a) return;
    let u;
    try { u = new URL(a.href, location.href); } catch (_) { return; }
    if (!['https:', 'http:', 'mailto:'].includes(u.protocol)) return;
    if (u.protocol !== 'mailto:' && /^(www\.)?jasonarts\.com$/.test(u.hostname) && u.pathname === location.pathname && u.hash !== '#contact') return;
    const target = u.protocol === 'mailto:' ? 'mailto:contact' : u.origin + u.pathname + (u.hash === '#contact' ? '#contact' : '');
    if (sentTargets.has(target) || sentTargets.size >= 10) return;
    sentTargets.add(target); send('click', target);
  }, { capture: true });
  const timer = setInterval(checkEngaged, 1000);
  addEventListener('pagehide', () => clearInterval(timer), { once: true });
  view();
})();
