(function () {
  'use strict';
  const root = document.getElementById('blogCollection');
  if (!root) return;
  const search = document.getElementById('blogSearch');
  const topic = document.getElementById('blogTopic');
  const reset = document.getElementById('blogReset');
  const latest = document.getElementById('blogLatest');
  const archive = document.getElementById('blogArchive');
  const scroller = document.getElementById('blogArchiveScroll');
  const shell = document.getElementById('blogArchiveShell');
  const hint = document.getElementById('blogArchiveHint');
  const normalize = value => String(value || '').normalize('NFKD').toLowerCase().replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const items = [...root.querySelectorAll('[data-blog-item]')].map(element => ({element, text:normalize(element.dataset.blogSearch), topic:element.dataset.blogTopic, recent:element.classList.contains('blog-card')}));
  const countLabel = n => `${n} article${n === 1 ? '' : 's'}`;
  function scrollState() {
    const atStart = scroller.scrollTop <= 2;
    const atEnd = scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop <= 2;
    shell.toggleAttribute('data-at-start', atStart);
    shell.toggleAttribute('data-at-end', atEnd);
    hint.hidden = archive.hidden || scroller.scrollHeight <= scroller.clientHeight + 2 || atEnd;
  }
  function filter() {
    const terms = normalize(search.value).split(' ').filter(Boolean);
    let recent = 0, older = 0;
    for (const item of items) {
      const show = (!topic.value || item.topic === topic.value) && terms.every(term => item.text.includes(term));
      item.element.hidden = !show;
      if (show) { if (item.recent) recent++; else older++; }
    }
    const active = terms.length > 0 || Boolean(topic.value);
    latest.hidden = recent === 0;
    archive.hidden = older === 0;
    reset.hidden = !active;
    document.getElementById('blogEmpty').hidden = recent + older > 0;
    document.getElementById('blogLatestHeading').textContent = active ? 'Recent matches' : 'Latest articles';
    document.getElementById('blogArchiveHeading').textContent = active ? 'More matches' : 'More articles';
    document.getElementById('blogArchiveCount').textContent = countLabel(older);
    document.getElementById('blogResultCount').textContent = active ? `${countLabel(recent + older)} found across all ${items.length}` : countLabel(items.length);
    scroller.scrollTop = 0;
    requestAnimationFrame(scrollState);
  }
  search.addEventListener('input', filter);
  topic.addEventListener('change', filter);
  reset.addEventListener('click', () => { search.value = ''; topic.value = ''; filter(); search.focus(); });
  scroller.addEventListener('scroll', scrollState, {passive:true});
  window.addEventListener('resize', scrollState, {passive:true});
  // No fetched catalog or visitor search logging: filter only published HTML links.
  document.getElementById('blogTools').hidden = false;
  filter();
})();
