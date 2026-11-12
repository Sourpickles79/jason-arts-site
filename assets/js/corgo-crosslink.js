(() => {
  const root = document.getElementById('root');
  const link = document.getElementById('corgo-books-link');
  if (!root || !link) return;
  function update() {
    // Only the title screen carries this link; it never covers active play.
    const isHome = [...root.querySelectorAll('button')].some(button => /PLAY NOW/i.test(button.textContent));
    link.hidden = !isHome;
  }
  new MutationObserver(update).observe(root, { childList: true, subtree: true });
  update();
})();
