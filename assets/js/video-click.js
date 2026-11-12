(() => {
  'use strict';
  const grid = document.getElementById('portfolioGrid');
  function enhancePortfolioVideos() {
    if (!grid) return;
    for (const video of grid.querySelectorAll('article.card > video')) {
      const frame = document.createElement('div');
      frame.className = 'portfolio-video';
      const badge = document.createElement('span');
      badge.className = 'play-badge';
      badge.setAttribute('aria-hidden', 'true');
      badge.textContent = '▶';
      video.before(frame);
      frame.append(video, badge);
      const sync = () => frame.classList.toggle('is-playing', !video.paused);
      video.addEventListener('play', sync);
      video.addEventListener('pause', sync);
      sync();
    }
  }
  if (grid) {
    enhancePortfolioVideos();
    new MutationObserver(enhancePortfolioVideos).observe(grid, {childList:true});
  }
  // Give each native player the title of its surrounding work for assistive technology.
  for (const container of document.querySelectorAll('#portfolioGrid, #aiGrid')) {
    const labelVideos = () => {
      for (const video of container.querySelectorAll('article video')) {
        const title = video.closest('article')?.querySelector('h3')?.textContent.trim();
        if (title && !video.hasAttribute('aria-label')) video.setAttribute('aria-label', title);
      }
    };
    labelVideos();
    new MutationObserver(labelVideos).observe(container, {childList: true, subtree: true});
  }
  // Let the picture itself start or pause a video while leaving native controls alone.
  document.addEventListener('click', event => {
    const video = event.target;
    if (!(video instanceof HTMLVideoElement) || !video.controls || !video.closest('#portfolioGrid, #aiGrid')) return;
    const rect = video.getBoundingClientRect();
    if (event.clientY >= rect.bottom - 52) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  });
})();
