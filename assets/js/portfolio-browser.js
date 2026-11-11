(() => {
  'use strict';
  const tools = document.getElementById('portfolioTools');
  const grid = document.getElementById('portfolioGrid');
  if (!tools || !grid) return;
  const search = document.getElementById('portfolioSearch');
  const reset = document.getElementById('portfolioReset');
  const count = document.getElementById('portfolioResultCount');
  const empty = document.getElementById('portfolioEmpty');
  const buttons = [...document.querySelectorAll('.filter-bar .filter')];
  const normalize = value => String(value || '').normalize('NFKD').toLowerCase().replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  let category = 'all';
  function update() {
    const terms = normalize(search.value).split(' ').filter(Boolean);
    const cards = [...grid.querySelectorAll('article.card')];
    let shown = 0;
    for (const card of cards) {
      const matchesCategory = category === 'all' || (category === '__videos__' ? card.dataset.hasVideo === 'true' : category === '__modeled__' ? card.dataset.modeled === 'true' : card.dataset.category === category);
      const text = normalize([card.querySelector('h3')?.textContent, card.querySelector('.card-body p')?.textContent, card.dataset.category].join(' '));
      const show = matchesCategory && terms.every(term => text.includes(term));
      card.hidden = !show;
      if (show) shown++;
    }
    for (const button of buttons) {
      const active = button.dataset.filter === category;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    }
    count.textContent = `Showing ${shown} of ${cards.length} ${cards.length === 1 ? 'piece' : 'pieces'}`;
    empty.hidden = shown > 0;
    reset.hidden = category === 'all' && !search.value;
  }
  for (const button of buttons) button.addEventListener('click', () => { category = button.dataset.filter; update(); });
  search.addEventListener('input', update);
  reset.addEventListener('click', () => { category = 'all'; search.value = ''; update(); search.focus(); });
  tools.hidden = false;
  count.hidden = false;
  update();
  // Query stays in the browser; no searches are sent or recorded.
  new MutationObserver(update).observe(grid, {childList: true});
})();
