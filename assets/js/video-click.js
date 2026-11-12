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
