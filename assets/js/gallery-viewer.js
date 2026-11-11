(() => {
  'use strict';
  const grid = document.querySelector('#portfolioGrid, #aiGrid');
  if (!grid || !HTMLDialogElement.prototype.showModal) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'gallery-viewer';
  dialog.setAttribute('aria-labelledby', 'gallery-viewer-title');
  dialog.innerHTML = `<div class="gallery-viewer-panel">
    <div class="gallery-viewer-top"><span class="gallery-viewer-count" aria-live="polite"></span><button class="gallery-viewer-close" type="button" aria-label="Close image viewer">×</button></div>
    <div class="gallery-viewer-stage"><button class="gallery-viewer-prev" type="button" aria-label="Previous image">‹</button><img class="gallery-viewer-image" alt=""><button class="gallery-viewer-next" type="button" aria-label="Next image">›</button></div>
    <div class="gallery-viewer-caption"><h2 id="gallery-viewer-title"></h2><p></p></div>
  </div>`;
  document.body.append(dialog);
  const image = dialog.querySelector('.gallery-viewer-image');
  const title = dialog.querySelector('h2');
  const description = dialog.querySelector('.gallery-viewer-caption p');
  const count = dialog.querySelector('.gallery-viewer-count');
  const previous = dialog.querySelector('.gallery-viewer-prev');
  const next = dialog.querySelector('.gallery-viewer-next');
  const close = dialog.querySelector('.gallery-viewer-close');
  let visibleImages = [];
  let index = 0;
  let opener = null;

  function enhance() {
    for (const img of grid.querySelectorAll('.card > img, .ai-media > img')) {
      const card = img.closest('article');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'gallery-image-open';
      button.setAttribute('aria-label', `View larger: ${card.querySelector('h3')?.textContent || img.alt}`);
      img.before(button);
      button.append(img);
    }
  }
  function show() {
    const selected = visibleImages[index];
    if (!selected) return;
    const source = selected.querySelector('img');
    const card = selected.closest('article');
    image.src = source.currentSrc || source.src;
    image.alt = source.alt;
    title.textContent = card.querySelector('h3')?.textContent || source.alt;
    description.textContent = card.querySelector('.card-body p, .ai-card-body p')?.textContent || '';
    count.textContent = `${index + 1} / ${visibleImages.length}`;
    previous.disabled = index === 0;
    next.disabled = index === visibleImages.length - 1;
  }
  grid.addEventListener('click', event => {
    const button = event.target.closest('.gallery-image-open');
    if (!button || !grid.contains(button)) return;
    visibleImages = [...grid.querySelectorAll('.gallery-image-open')].filter(el => !el.closest('article').hidden);
    index = visibleImages.indexOf(button);
    if (index < 0) return;
    opener = button;
    show();
    dialog.showModal();
    close.focus();
  });
  previous.addEventListener('click', () => { if (index > 0) { index--; show(); } });
  next.addEventListener('click', () => { if (index < visibleImages.length - 1) { index++; show(); } });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); index--; show(); }
    if (event.key === 'ArrowRight' && index < visibleImages.length - 1) { event.preventDefault(); index++; show(); }
  });
  dialog.addEventListener('close', () => { image.removeAttribute('src'); if (opener?.isConnected) opener.focus(); });
  enhance();
  new MutationObserver(enhance).observe(grid, { childList: true, subtree: true });
})();

