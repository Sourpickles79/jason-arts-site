const contentUrl = "assets/data/content.json";
const fallbackContent = {
  profile: {
    email: "hello@jasonarts.com",
    resumeUrl: "#",
    metrics: [
      { value: "10+", label: "years of experience" },
      { value: "300+", label: "projects completed" },
      { value: "1M+", label: "views across platforms" },
      { value: "50+", label: "world-building works" }
    ]
  },
  links: {
    youtubeMusic: "https://www.youtube.com/@JasonArtsRecords",
    amazonStore: "https://www.amazon.com/stores/Jason-Arts-Johnson/author/B0CVW3PXGW?ref=ap_rdr&shoppingPortalEnabled=true&ccs_id=03cdfd36-a8eb-487a-addf-548214bb01b7",
    artstation: "https://www.artstation.com/jasonartsjohnson"
  },
  portfolio: [
    { title: "Interior Visualization", category: "Architecture", image: "assets/images/hero-kitchen-living.webp", description: "Clean residential interiors with balanced lighting, staging, and camera composition." },
    { title: "Gaming Workspace", category: "Product Visualization", image: "assets/images/genesis-gaming-desk.webp", description: "Color-forward lifestyle rendering for gaming furniture and consumer product storytelling." },
    { title: "Community Site Plan", category: "Planning", image: "assets/images/eagle-landing-map.webp", description: "Illustrated community planning visuals built for clarity and presentation." }
  ],
  books: [
    {"title": "I Spy with Corgo: A Pawsome Adventure", "type": "Picture Book", "cover": "assets/images/cover-ispy-corgo-pawsome.webp", "accent": "#f4b24d", "description": "Follow Corgo the Corgi through 37 pages of vivid search-and-find scenes, from the zoo to outer space to the Wild West. Built for ages 3-6 to sharpen observation skills and spark imagination. Book 1 of The Adventures of Corgo.", "age": "Ages 3-7", "pages": "Book 1 of 2: The Adventures of Corgo", "format": "Kindle Edition & Paperback", "rating": 5.0, "reviewCount": 7, "buyUrl": "https://www.amazon.com/Spy-Corgo-Pawsome-Adventure-Treasures-ebook/dp/B0CXX3B2XN"},
    {"title": "I Spy with Corgo: The Big Toy Hunt", "type": "Picture Book", "cover": "assets/images/cover-ispy-corgo-toy-hunt.webp", "accent": "#7fb15d", "description": "Book 2 of The Adventures of Corgo. Join Corgo from his cozy home to the bustling park on a search-and-find toy hunt built for young explorers ages 3-6.", "age": "Ages 3-7", "pages": "Book 2 of 2: The Adventures of Corgo", "format": "Kindle Edition & Paperback", "rating": 5.0, "reviewCount": 2, "buyUrl": "https://www.amazon.com/Spy-Corgo-Search-Find-Explorers-ebook/dp/B0DJTXL96Q"},
    {"title": "Dazzling Dachshunds: A Delightful Coloring Collection", "type": "Coloring Book", "cover": "assets/images/cover-dazzling-dachshunds.webp", "accent": "#c97b3d", "description": "Over 40 intricately designed dachshund illustrations, from playful puppies to regal adults, for a relaxing coloring escape. Part of the Whimsical World Coloring Adventures series.", "age": "Teens & Adults", "pages": "Paperback", "format": "Coloring Book", "rating": 5.0, "reviewCount": 1, "buyUrl": "https://www.amazon.com/Dazzling-Dachshunds-Delightful-Coloring-Collection/dp/B0CW2231JW"},
    {"title": "Super Ultra Kawaii Coloring Book", "type": "Coloring Book", "cover": "assets/images/cover-super-ultra-kawaii.webp", "accent": "#d94f7c", "description": "Explore enchanting kawaii worlds across 48 pages of cute, detailed scenes built for creative downtime.", "age": "Teens & Adults", "pages": "48 pages", "format": "Paperback", "rating": null, "reviewCount": null, "buyUrl": "https://www.amazon.com/Super-Ultra-Kawaii-Paperback-Coloring/dp/B0D4QW5D9G"},
    {"title": "Whisker Wonderland: A Cat Coloring Book", "type": "Coloring Book", "cover": "assets/images/cover-whisker-wonderland.webp", "accent": "#59c4d8", "description": "48 unique, relaxing cat illustrations designed for stress-free, detailed coloring sessions.", "age": "Teens & Adults", "pages": "48 pages", "format": "Paperback", "rating": 5.0, "reviewCount": 2, "buyUrl": "https://www.amazon.com/Whisker-Wonderland-Creativity-Whimsical-Adventures/dp/B0CWHDC5B9"},
    {"title": "Serene Scenes: Beauty Landscapes Coloring Collection", "type": "Coloring Book", "cover": "assets/images/cover-serene-scenes.webp", "accent": "#345c95", "description": "Find peace and inspiration through richly detailed landscape scenes built for a calm, meditative coloring experience.", "age": "Teens & Adults", "pages": "Paperback", "format": "Coloring Book", "rating": 2.5, "reviewCount": 2, "buyUrl": "https://www.amazon.com/Serene-Scenes-Landscapes-Inspiration-Captivating/dp/B0CVNFPY1P"},
    {"title": "Tranquil Corgi Patterns: Coloring Book", "type": "Coloring Book", "cover": "assets/images/cover-tranquil-corgi-patterns.webp", "accent": "#e85d46", "description": "Over 45 intricately illustrated corgi patterns for a relaxing, therapeutic coloring experience. Single-sided pages prevent bleed-through. Part of the Whimsical World Coloring Adventures series.", "age": "Teens & Adults", "pages": "Paperback", "format": "Coloring Book", "rating": 5.0, "reviewCount": 6, "buyUrl": "https://www.amazon.com/Tranquil-Corgi-Patterns-Whimsical-Adventures/dp/B0CSZB8B9C"},
    {"title": "Sudoku Easy to Hard Puzzles for Adults: Travel Edition", "type": "Puzzle Book", "cover": "assets/images/cover-sudoku-travel.webp", "accent": "#3d7a4a", "description": "300 on-the-go sudoku puzzles ranging from easy to hard, sized for travel.", "age": "Adults", "pages": "Paperback", "format": "Puzzle Book", "rating": null, "reviewCount": null, "buyUrl": "https://www.amazon.com/Sudoku-Easy-Puzzles-Adults-Travel/dp/B0D17HNNG2"},
    {"title": "Sudoku Puzzle Book: Easy to Hard, Second Edition", "type": "Puzzle Book", "cover": "assets/images/cover-sudoku-888.webp", "accent": "#2f4f8a", "description": "888 challenging sudoku puzzles spanning every difficulty level, for every kind of solver.", "age": "Adults", "pages": "Paperback", "format": "Puzzle Book", "rating": null, "reviewCount": null, "buyUrl": "https://www.amazon.com/Sudoku-Puzzle-Book-Challenging-Paperback/dp/B0CXNW6MML"},
    {"title": "Variety Puzzle Book for Adults", "type": "Puzzle Book", "cover": "assets/images/cover-variety-puzzle.webp", "accent": "#a13d5c", "description": "300+ puzzles across word search, crossword, sudoku, Nurikabe, mazes, and more in one collection.", "age": "Adults", "pages": "Hardcover & Paperback", "format": "Puzzle Book", "rating": 5.0, "reviewCount": 1, "buyUrl": "https://www.amazon.com/Variety-Puzzle-Book-Adults-Relaxation/dp/B0CR2VXDQR"}
  ],
  videos: [
    { title: "The Orb Story", channel: "Animated Shorts", image: "assets/images/orb-thumb.webp", url: "https://www.youtube.com/channel/UCkhYfwqh5-iq7z4yEAvUYjw", date: "2026-06-20", description: "A new animated short channel built around story, atmosphere, and world-building." },
    { title: "Sleep Zen", channel: "ASMR / Sleep", image: "assets/images/sleepzen-thumb.webp", url: "https://www.youtube.com/channel/UCccuNXRd1dJkBvxIFXrgFuw", date: "2026-06-05", description: "Long-form calming scenes, ambient rooms, and restful environments." },
    { title: "Original Music", channel: "Music", image: "assets/images/music-band-thumb.webp", url: "https://www.youtube.com/@JasonArtsRecords", date: "2026-05-18", description: "Original tracks and visual music experiences." }
  ]
};

const qs = (selector) => document.querySelector(selector);

function fallbackImage(index) {
  const images = [
    "assets/images/hero-bedroom.webp",
    "assets/images/genesis-gaming-desk.webp",
    "assets/images/chapel-collection.webp"
  ];
  return images[index % images.length];
}

function cardTemplate(item, index) {
  const media = item.video
    ? `<video controls preload="none" poster="${item.image || fallbackImage(index)}"><source src="${item.video}" type="video/mp4"></video>`
    : `<img src="${item.image || fallbackImage(index)}" alt="${item.title} - ${item.category} by Jason Arts" loading="lazy">`;
  return `
    <article class="card" data-category="${item.category}" data-has-video="${item.video ? "true" : "false"}" data-modeled="${item.modeled ? "true" : "false"}">
      ${media}
      <div class="card-body">
        <span class="category">${item.category}</span>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
      </div>
    </article>
  `;
}

function channelRowTemplate(item, index) {
  const internalPage = { "Music": "music.html", "ASMR / Sleep": "cozy.html", "Animated Shorts": "orb.html" }[item.channel] || item.url;
  return `
    <article class="music-row">
      <img src="${item.image || fallbackImage(index)}" alt="${item.title}" loading="lazy">
      <div>
        <span class="category">${item.channel}</span>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <a class="button secondary" href="${internalPage}">See Full Channel Page</a>
      </div>
    </article>
  `;
}

function renderStars(rating, reviewCount) {
  if (!rating) return "";
  const full = Math.round(rating);
  const stars = "★".repeat(full) + "☆".repeat(5 - full);
  const count = reviewCount ? ` (${reviewCount})` : "";
  return `<p class="rating-line"><span class="stars">${stars}</span> ${rating.toFixed(1)}${count}</p>`;
}

function bookTemplate(item, index) {
  const cover = item.cover || "";
  const accent = item.accent || "#d8903c";
  return `
    <article class="book-card">
      <div class="book-mockup" style="--book-accent:${accent}">
        <div class="book-cover">
          ${cover ? `<img src="${cover}" alt="${item.title} cover" loading="lazy">` : `<div><span>${item.type}</span><strong>${item.title}</strong><small>Jason Arts Johnson</small></div>`}
        </div>
      </div>
      <div class="book-body">
        <span class="category">${item.type}</span>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        ${renderStars(item.rating, item.reviewCount)}
        <a class="button primary" href="${item.buyUrl}" target="_blank" rel="noopener">Buy Now</a>
      </div>
    </article>
  `;
}

function renderSocials(links) {
  const labels = {
    youtubeMusic: "YouTube Music",
    youtubeCozy: "Sleep Zen Channel",
    youtubeOrb: "The Orb Story",
    amazonStore: "Amazon",
    artstation: "ArtStation",
    linkedin: "LinkedIn",
    instagram: "Instagram"
  };
  const excluded = new Set(["youtubeMusicId", "youtubeCozyId", "youtubeOrbId", "youtubeApiKey"]);
  return Object.entries(links)
    .filter(([key, url]) => url && url !== "#" && !excluded.has(key))
    .map(([key, url]) => `<a href="${url}" target="_blank" rel="noopener">${labels[key] || key}</a>`)
    .join("");
}

async function init() {
  let data = window.SITE_CONTENT || fallbackContent;
  if (!window.SITE_CONTENT) {
    try {
      const response = await fetch(contentUrl);
      data = await response.json();
    } catch {
      data = fallbackContent;
    }
  }

  if (qs("#metrics")) {
    qs("#metrics").innerHTML = data.profile.metrics.map(metric => `
      <div class="metric">
        <strong>${metric.value}</strong>
        <span>${metric.label}</span>
      </div>
    `).join("");
  }

  if (qs("#portfolioGrid")) qs("#portfolioGrid").innerHTML = data.portfolio.map(cardTemplate).join("");
  if (qs("#filmsFeed")) qs("#filmsFeed").innerHTML = data.videos.filter(v => v.channel !== "Music").map(channelRowTemplate).join("");
  if (qs("#bookGrid")) qs("#bookGrid").innerHTML = data.books.map(bookTemplate).join("");
  if (qs("#resumeLink")) qs("#resumeLink").href = data.links.artstation || "#";
  if (qs("#socialLinks")) qs("#socialLinks").innerHTML = renderSocials(data.links);
  if (qs("#year")) qs("#year").textContent = new Date().getFullYear();

  document.querySelectorAll(".filter").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".filter").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      const filter = button.dataset.filter;
      document.querySelectorAll(".card").forEach(card => {
        if (filter === "all") {
          card.hidden = false;
        } else if (filter === "__videos__") {
          card.hidden = card.dataset.hasVideo !== "true";
        } else if (filter === "__modeled__") {
          card.hidden = card.dataset.modeled !== "true";
        } else {
          card.hidden = card.dataset.category !== filter;
        }
      });
    });
  });

  realignToHash();
}

function realignToHash() {
  if (!window.location.hash) return;
  const target = document.querySelector(window.location.hash);
  if (!target) return;
  const jump = () => target.scrollIntoView({ block: "start" });
  requestAnimationFrame(jump);
  window.addEventListener("load", jump);
  setTimeout(jump, 400);
}

init().catch(error => {
  console.error("Unable to load site content", error);
});
