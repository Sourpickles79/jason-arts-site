// Solidifies the fixed header background once the page is scrolled,
// so nav text stays readable over any content (not just the hero image).
(function () {
  function init() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    const nav = header.querySelector(".nav");
    if (nav && !nav.querySelector('a[href="apps.html"]')) {
      const appsLink = document.createElement("a");
      appsLink.href = "apps.html";
      appsLink.textContent = "Apps";
      const aboutLink = nav.querySelector('a[href="about.html"]');
      nav.insertBefore(appsLink, aboutLink || null);
    }

    const update = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
    update();
    window.addEventListener("scroll", update, { passive: true });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
