(() => {
  'use strict';
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
