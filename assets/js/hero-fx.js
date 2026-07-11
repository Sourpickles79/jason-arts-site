// Atmospheric hero effects for Jason Arts
// Supports multiple variant effects selected via data-hero-effect on the
// .hero element: "rain" (mountain scene) and "tv-glow" (gaming room scene).
// Shared: canvas setup, parallax, pause-when-offscreen. Respects
// prefers-reduced-motion. Canvas-based, lightweight.

(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function init() {
    const hero = document.querySelector(".hero, .subhero");
    if (!hero) return;

    const img = hero.querySelector("picture img") || hero.querySelector(":scope > img") || hero.querySelector("img");
    const effect = hero.dataset.heroEffect || "rain";

    // ---- Canvas setup (shared) ----
    const canvas = document.createElement("canvas");
    canvas.className = "hero-fx";
    canvas.setAttribute("aria-hidden", "true");
    hero.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    let W = 0, H = 0, dpr = 1;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = hero.clientWidth;
      H = hero.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    if (reduced) return; // canvas exists but stays still/empty

    // ---- Parallax (shared across all variants) ----
    let mx = 0, my = 0, tx = 0, ty = 0;
    if (img) {
      img.style.willChange = "transform";
      img.style.transition = "none";
      window.addEventListener("mousemove", (e) => {
        tx = (e.clientX / window.innerWidth - 0.5) * 14;
        ty = (e.clientY / window.innerHeight - 0.5) * 8;
      }, { passive: true });
    }
    let scrollShift = 0;
    window.addEventListener("scroll", () => {
      scrollShift = Math.min(window.scrollY * 0.12, 80);
    }, { passive: true });

    // ---- Build the chosen effect ----
    const draw = effect === "tv-glow" ? buildTvGlow() : effect === "dusk-glow" ? buildDuskGlow() : buildRain();

    // ---- Main loop (shared) ----
    let last = performance.now();
    let running = true;
    const observer = new IntersectionObserver((entries) => {
      running = entries[0].isIntersecting;
      if (running) { last = performance.now(); requestAnimationFrame(tick); }
    });
    observer.observe(hero);

    function tick(now) {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (img) {
        mx += (tx - mx) * 0.04;
        my += (ty - my) * 0.04;
        img.style.transform = `translate3d(${mx}px, ${my + scrollShift}px, 0) scale(1.06)`;
      }

      ctx.clearRect(0, 0, W, H);
      draw(ctx, dt, now, () => ({ W, H, mx, my }));

      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // ================= Rain variant (mountain/marsh scene) =================
    function buildRain() {
      const RAIN_COUNT = Math.min(140, Math.floor(W / 11));
      const WIND = 0.18;
      const drops = [];
      for (let i = 0; i < RAIN_COUNT; i++) drops.push(newDrop(true));
      function newDrop(anywhere) {
        const depth = 0.35 + Math.random() * 0.65;
        return {
          x: Math.random() * (W + 200) - 100,
          y: anywhere ? Math.random() * H : -40,
          len: 18 + depth * 34,
          speed: 900 + depth * 900,
          alpha: 0.09 + depth * 0.16,
          depth
        };
      }
      const MIST_COUNT = 7;
      const mists = [];
      for (let i = 0; i < MIST_COUNT; i++) {
        mists.push({
          x: Math.random() * W,
          y: H * (0.55 + Math.random() * 0.4),
          r: 140 + Math.random() * 260,
          speed: 6 + Math.random() * 14,
          alpha: 0.025 + Math.random() * 0.035,
          wobble: Math.random() * Math.PI * 2
        });
      }
      let flash = 0;
      let nextFlashAt = performance.now() + 2500 + Math.random() * 4000;
      let flashX = 0.5;
      let doubleStrike = false;
      function scheduleFlash(now) { nextFlashAt = now + 5000 + Math.random() * 6000; }

      return function (ctx, dt, now, dims) {
        const { W, H } = dims();
        for (const m of mists) {
          m.x += m.speed * dt;
          m.wobble += dt * 0.3;
          if (m.x - m.r > W) { m.x = -m.r; m.y = H * (0.55 + Math.random() * 0.4); }
          const g = ctx.createRadialGradient(m.x, m.y + Math.sin(m.wobble) * 8, 0, m.x, m.y, m.r);
          g.addColorStop(0, `rgba(180, 200, 210, ${m.alpha})`);
          g.addColorStop(1, "rgba(180, 200, 210, 0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
          ctx.fill();
        }
        if (now >= nextFlashAt && flash <= 0) {
          flash = 0.55 + Math.random() * 0.35;
          flashX = 0.25 + Math.random() * 0.55;
          doubleStrike = Math.random() < 0.4;
          scheduleFlash(now);
        }
        if (flash > 0) {
          const gx = flashX * W;
          const glow = ctx.createRadialGradient(gx, H * 0.12, 0, gx, H * 0.12, W * 0.5);
          glow.addColorStop(0, `rgba(200, 215, 255, ${flash * 0.34})`);
          glow.addColorStop(0.4, `rgba(170, 190, 240, ${flash * 0.12})`);
          glow.addColorStop(1, "rgba(170, 190, 240, 0)");
          ctx.fillStyle = glow;
          ctx.fillRect(0, 0, W, H * 0.7);
          flash -= dt * (flash > 0.3 ? 2.6 : 1.4);
          if (doubleStrike && flash < 0.18 && flash > 0.12 && Math.random() < 0.3) {
            flash = 0.4 + Math.random() * 0.2;
            doubleStrike = false;
          }
        }
        for (let i = 0; i < drops.length; i++) {
          const d = drops[i];
          d.y += d.speed * dt;
          d.x += d.speed * WIND * dt;
          if (d.y - d.len > H || d.x - 60 > W) { drops[i] = newDrop(false); continue; }
          const brighten = flash > 0 ? flash * 0.6 : 0;
          ctx.lineWidth = d.depth > 0.75 ? 1.5 : 1;
          ctx.strokeStyle = `rgba(190, 205, 220, ${d.alpha + brighten * d.depth})`;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - d.len * WIND, d.y - d.len);
          ctx.stroke();
        }
      };
    }

    // ================= TV-glow variant (gaming room scene) =================
    function buildTvGlow() {
      // TV screen position is approximated as a region of the frame - tuned
      // for the gaming-room hero image (screen roughly center-left, upper half).
      const screen = { xPct: 0.40, yPct: 0.34, wPct: 0.42, hPct: 0.30 };
      let flicker = 0.7;
      let flickerTarget = 0.7;
      let nextFlickerChange = 0;

      // Ambient shelf-light breathing (slow warm pulse, independent rhythm)
      let breathe = 0;

      return function (ctx, dt, now, dims) {
        const { W, H } = dims();

        // Screen flicker: subtle random-walk toward new brightness targets,
        // mimicking scene changes on a TV rather than a strobe.
        if (now >= nextFlickerChange) {
          flickerTarget = 0.55 + Math.random() * 0.5;
          nextFlickerChange = now + 180 + Math.random() * 420;
        }
        flicker += (flickerTarget - flicker) * Math.min(dt * 4, 1);

        const cx = W * (screen.xPct + screen.wPct / 2);
        const cy = H * (screen.yPct + screen.hPct / 2);
        const rx = W * screen.wPct * 0.75;

        // Cool screen glow spilling into the room
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx * 2.1);
        glow.addColorStop(0, `rgba(140, 190, 255, ${0.16 * flicker})`);
        glow.addColorStop(0.35, `rgba(110, 160, 230, ${0.08 * flicker})`);
        glow.addColorStop(1, "rgba(110, 160, 230, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);

        // Faint scanline shimmer directly over the screen area for a "live" feel
        ctx.save();
        ctx.beginPath();
        ctx.rect(W * screen.xPct, H * screen.yPct, W * screen.wPct, H * screen.hPct);
        ctx.clip();
        ctx.fillStyle = `rgba(180, 210, 255, ${0.05 * flicker})`;
        ctx.fillRect(W * screen.xPct, H * screen.yPct, W * screen.wPct, H * screen.hPct);
        ctx.restore();

        // Warm ambient shelf-light breathing, lower corners of the frame
        breathe += dt * 0.5;
        const warmth = 0.5 + Math.sin(breathe) * 0.5;
        for (const side of [0.06, 0.94]) {
          const gx = W * side;
          const gy = H * 0.82;
          const g2 = ctx.createRadialGradient(gx, gy, 0, gx, gy, W * 0.22);
          g2.addColorStop(0, `rgba(255, 170, 90, ${0.10 + warmth * 0.06})`);
          g2.addColorStop(1, "rgba(255, 170, 90, 0)");
          ctx.fillStyle = g2;
          ctx.beginPath();
          ctx.arc(gx, gy, W * 0.22, 0, Math.PI * 2);
          ctx.fill();
        }
      };
    }

    // ================= Dusk-glow variant (porch/house scene) =================
    function buildDuskGlow() {
      // Approximate warm window/porch light positions for this scene (percent of frame).
      const lights = [
        { xPct: 0.50, yPct: 0.36, r: 0.09, phase: Math.random() * Math.PI * 2, speed: 0.35 },
        { xPct: 0.44, yPct: 0.63, r: 0.07, phase: Math.random() * Math.PI * 2, speed: 0.42 },
        { xPct: 0.60, yPct: 0.60, r: 0.06, phase: Math.random() * Math.PI * 2, speed: 0.5 }
      ];

      // Fireflies drifting in the dark yard/garden area (lower half of frame).
      const FIREFLY_COUNT = 16;
      const flies = [];
      for (let i = 0; i < FIREFLY_COUNT; i++) flies.push(newFly());
      function newFly() {
        return {
          x: Math.random(),
          y: 0.55 + Math.random() * 0.42,
          driftX: (Math.random() - 0.5) * 0.012,
          bob: Math.random() * Math.PI * 2,
          bobSpeed: 0.6 + Math.random() * 0.8,
          twinkle: Math.random() * Math.PI * 2,
          size: 1.3 + Math.random() * 1.8,
          life: 0
        };
      }

      // A simple foreground foliage silhouette (soft dark blobs along the
      // bottom edge) that moves at a stronger parallax offset than the
      // background image, giving genuine layered depth from a flat photo.
      const bushes = [
        { xPct: 0.06, wPct: 0.22, h: 0.16 },
        { xPct: 0.80, wPct: 0.26, h: 0.19 },
        { xPct: 0.30, wPct: 0.14, h: 0.09 }
      ];

      return function (ctx, dt, now, dims) {
        const { W, H, mx, my } = dims();

        // Warm window/porch light breathing
        for (const l of lights) {
          l.phase += dt * l.speed;
          const warmth = 0.55 + Math.sin(l.phase) * 0.45;
          const gx = W * l.xPct;
          const gy = H * l.yPct;
          const gr = W * l.r;
          const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
          g.addColorStop(0, `rgba(255, 195, 120, ${0.16 + warmth * 0.1})`);
          g.addColorStop(1, "rgba(255, 195, 120, 0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(gx, gy, gr, 0, Math.PI * 2);
          ctx.fill();
        }

        // Fireflies
        for (const f of flies) {
          f.life += dt;
          f.bob += dt * f.bobSpeed;
          f.twinkle += dt * 2.2;
          f.x += f.driftX * dt;
          const fx = f.x * W;
          const fy = f.y * H + Math.sin(f.bob) * 10;
          const tw = 0.4 + Math.sin(f.twinkle) * 0.35;
          if (f.x < -0.05 || f.x > 1.05 || f.life > 40) {
            Object.assign(f, newFly(), { x: Math.random() < 0.5 ? -0.03 : 1.03 });
          }
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 214, 140, ${Math.max(0, tw)})`;
          ctx.arc(fx, fy, f.size, 0, Math.PI * 2);
          ctx.fill();
          if (tw > 0.5) {
            ctx.beginPath();
            ctx.fillStyle = `rgba(255, 214, 140, ${(tw - 0.5) * 0.4})`;
            ctx.arc(fx, fy, f.size * 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Foreground foliage silhouette - shifts more than the background
        // image for a cheap but effective layered-parallax feel.
        const fgShiftX = mx * 2.2;
        const fgShiftY = my * 1.4;
        ctx.fillStyle = "rgba(3, 5, 4, 0.9)";
        for (const b of bushes) {
          const bx = W * b.xPct + fgShiftX;
          const bw = W * b.wPct;
          const bh = H * b.h;
          const by = H - bh + fgShiftY * 0.4;
          ctx.beginPath();
          ctx.moveTo(bx, H + 20);
          ctx.quadraticCurveTo(bx, by, bx + bw * 0.3, by - bh * 0.15);
          ctx.quadraticCurveTo(bx + bw * 0.55, by - bh * 0.5, bx + bw * 0.5, by);
          ctx.quadraticCurveTo(bx + bw * 0.75, by - bh * 0.25, bx + bw, by + bh * 0.1);
          ctx.lineTo(bx + bw, H + 20);
          ctx.closePath();
          ctx.fill();
        }
      };
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
