// Randomly picks one hero scene + matching interactive effect on load.
// Add more entries to HERO_VARIANTS as new scenes are built.
(function () {
  const HERO_VARIANTS = [
    {
      image: "assets/images/hero-mountain.webp",
      alt: "Cinematic mountain world used as Jason Arts portfolio hero art",
      effect: "rain"
    },
    {
      image: "assets/images/hero-gaming-tv.webp",
      alt: "Cinematic gaming room with glowing TV, used as Jason Arts portfolio hero art",
      effect: "tv-glow"
    },
    {
      image: "assets/images/hero-dusk-house.webp",
      alt: "Warm dusk exterior house render used as Jason Arts portfolio hero art",
      effect: "dusk-glow"
    }
  ];

  function applyVariant() {
    const hero = document.querySelector(".hero");
    if (!hero) return;
    const variant = HERO_VARIANTS[Math.floor(Math.random() * HERO_VARIANTS.length)];

    const img = hero.querySelector("picture img") || hero.querySelector("img");
    const source = hero.querySelector("picture source");
    if (img) {
      img.src = variant.image;
      img.alt = variant.alt;
    }
    if (source) {
      source.srcset = variant.image;
    }
    hero.dataset.heroEffect = variant.effect;
  }

  applyVariant();
})();
