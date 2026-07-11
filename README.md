# Jason Arts Portfolio Site

This is a static website for `jasonarts.com`. It can be hosted free on GitHub Pages, Cloudflare Pages, or Netlify.

## Edit Content

Most text, metrics, links, portfolio cards, books, and channel cards live in:

`assets/data/content.json`

You can edit that file directly, or open `admin.html`, make changes, download the edited JSON, and replace `assets/data/content.json`.

## Add Links

Replace the `#` placeholders in `assets/data/content.json` with:

- YouTube music channel URL
- Cozy ASMR / sleep channel URL
- The Orb Story channel URL
- Amazon author/store URLs
- ArtStation, LinkedIn, Instagram, email, and resume links

## Hosting

GitHub Pages is fine for a free professional portfolio. Netlify or Cloudflare Pages are also free and easier if you later want a private editing dashboard.

For GitHub Pages:

1. Create a GitHub repository.
2. Upload these files.
3. In repository settings, enable Pages from the main branch.
4. Point `jasonarts.com` DNS to GitHub Pages.

## Image Protection

No public website can fully prevent image copying. This build reduces risk by using optimized web images instead of your full-resolution originals. For stronger protection, use visible watermarking, lower-resolution previews, licensing text, and keep master files offline.
