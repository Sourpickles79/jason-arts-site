// Randomly picks one of the hero scene images for .subhero sections on
// secondary pages - image variety only, no canvas animation (that stays
// exclusive to the homepage hero for performance).
(function () {
  const SUBHERO_IMAGES = [
    { src: "assets/images/hero-mountain.webp", alt: "Cinematic mountain landscape by Jason Arts" },
    { src: "assets/images/hero-gaming-tv.webp", alt: "Cinematic gaming room with glowing TV by Jason Arts" },
    { src: "assets/images/hero-dusk-house.webp", alt: "Warm dusk exterior house render by Jason Arts" }
  ];

  const subhero = document.querySelector(".subhero");
  if (!subhero) return;
  const img = subhero.querySelector("img");
  if (!img) return;

  const pick = SUBHERO_IMAGES[Math.floor(Math.random() * SUBHERO_IMAGES.length)];
  img.src = pick.src;
  img.alt = pick.alt;
})();
