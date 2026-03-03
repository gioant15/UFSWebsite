/* ===================================================
   UvA Founder Space — script.js
   Retro 8-bit pixel sky: stars, drifting clouds, moon
   =================================================== */

/* --- Utility --- */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* =================================================
   8-BIT PIXEL ART DEFINITIONS
   Each pattern is a 2D grid of 0 (empty) / 1 (filled).
   Drawn at `cellSize` px per cell — integer aligned,
   no anti-aliasing.
   ================================================= */

// --- Cloud sprite A: wide 3-bump Mario cloud (15 × 6) ---
const CLOUD_A = [
  [0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// --- Cloud sprite B: compact 2-bump cloud (10 × 5) ---
const CLOUD_B = [
  [0,0,1,1,1,0,0,1,1,0],
  [0,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1],
];

// --- Cloud sprite C: small single-bump cloud (8 × 4) ---
const CLOUD_C = [
  [0,0,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1],
];

const CLOUD_SPRITES = [CLOUD_A, CLOUD_B, CLOUD_C];

/* =================================================
   CLOUD SYSTEM
   Clouds drift slowly left. When a cloud exits the
   left edge it wraps back to the right side.
   ================================================= */

function makeCloud(canvasW, canvasH, x) {
  const spriteIndex = Math.floor(Math.random() * CLOUD_SPRITES.length);
  const pattern = CLOUD_SPRITES[spriteIndex];
  // Larger cell = bigger cloud; vary for depth illusion
  const cell  = spriteIndex === 0 ? (Math.random() > 0.5 ? 9 : 7)
               : spriteIndex === 1 ? (Math.random() > 0.5 ? 8 : 6)
               : (Math.random() > 0.5 ? 7 : 5);
  const cols   = pattern[0].length;
  const rows   = pattern.length;
  const w      = cols * cell;
  const h      = rows * cell;
  // Clouds float in upper 45% of canvas, below navbar
  const yMin   = 85;
  const yMax   = Math.floor(canvasH * 0.45);
  const y      = yMin + Math.random() * Math.max(0, yMax - yMin - h);
  // Closer clouds (larger) drift faster
  const speed  = cell >= 8 ? (Math.random() * 0.25 + 0.18)
                            : (Math.random() * 0.14 + 0.08);
  // Closer = more opaque; distant = faint
  const alpha  = cell >= 8 ? (Math.random() * 0.25 + 0.55)
                            : (Math.random() * 0.20 + 0.28);
  return { x: x ?? Math.random() * canvasW, y, pattern, cell, w, h, speed, alpha };
}

function initClouds(canvasW, canvasH, count) {
  const clouds = [];
  for (let i = 0; i < count; i++) {
    // Scatter initial positions across the full canvas width
    const x = Math.random() * canvasW;
    clouds.push(makeCloud(canvasW, canvasH, x));
  }
  return clouds;
}

function tickClouds(clouds, canvasW, canvasH) {
  clouds.forEach(c => {
    c.x -= c.speed;
    // Wrap: when fully off left edge, respawn at right
    if (c.x + c.w < 0) {
      const fresh = makeCloud(canvasW, canvasH, canvasW + 20);
      Object.assign(c, fresh);
      c.x = canvasW + 20;
    }
  });
}

function drawCloud(ctx, cloud) {
  const { x, y, pattern, cell, alpha } = cloud;
  // White cloud body
  ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
  pattern.forEach((row, ri) => {
    row.forEach((cell_val, ci) => {
      if (cell_val) {
        // Integer-align each cell for crisp pixel edges
        ctx.fillRect(
          Math.round(x + ci * cell),
          Math.round(y + ri * cell),
          cell,
          cell
        );
      }
    });
  });
}

/* =================================================
   PIXEL MOON
   8-bit style: warm white body with crater marks.
   ================================================= */

function drawMoon(ctx, originX, originY) {
  const S = 11; // each "moon pixel" = 11 screen pixels

  // Moon body rows: [startCol, numberOfCols]
  const bodyRows = [
    [3, 6],   // row 0
    [1, 9],   // row 1
    [0, 11],  // row 2
    [0, 11],  // row 3
    [0, 11],  // row 4
    [0, 11],  // row 5
    [0, 11],  // row 6
    [1, 9],   // row 7
    [3, 6],   // row 8
  ];

  // Craters [col, row]
  const craters = [[2,2],[7,4],[4,6],[8,2]];
  const craterSet = new Set(craters.map(([c,r]) => `${c},${r}`));

  // Moon body — warm off-white
  ctx.fillStyle = 'rgba(235, 235, 205, 0.92)';
  bodyRows.forEach(([startCol, count], ri) => {
    for (let ci = startCol; ci < startCol + count; ci++) {
      if (!craterSet.has(`${ci},${ri}`)) {
        ctx.fillRect(
          Math.round(originX + ci * S),
          Math.round(originY + ri * S),
          S - 1,
          S - 1
        );
      }
    }
  });

  // Craters — darker tone
  ctx.fillStyle = 'rgba(168, 165, 135, 0.78)';
  craters.forEach(([ci, ri]) => {
    // Only draw crater if within the body shape
    const row = bodyRows[ri];
    if (row && ci >= row[0] && ci < row[0] + row[1]) {
      ctx.fillRect(
        Math.round(originX + ci * S),
        Math.round(originY + ri * S),
        S - 1,
        S - 1
      );
    }
  });
}

/* =================================================
   STAR PARTICLE SYSTEM
   ================================================= */

function buildParticlePool(canvas, ctaRect) {
  const particles = [];

  const DENSITY_NORMAL = 0.00015;
  const DENSITY_CTA    = 0.00032;

  const totalArea  = canvas.width * canvas.height;
  const ctaArea    = ctaRect.width * ctaRect.height;
  const normalArea = Math.max(0, totalArea - ctaArea);

  function makeParticle(x, y, isCta) {
    const alphaMax = isCta ? 0.95 : 0.75;
    const alphaMin = 0.08;
    return {
      x,
      y,
      // Sizes are always exact integers — crisp pixel squares
      size: [4, 4, 4, 5, 6][Math.floor(Math.random() * 5)],
      // 68% white (bright stars), 32% grey (distant stars)
      color: Math.random() > 0.32
        ? 'rgba(255,255,255,'
        : 'rgba(162,175,195,',
      alpha:       Math.random() * (alphaMax - alphaMin) + alphaMin,
      alphaTarget: Math.random() * (alphaMax - alphaMin) + alphaMin,
      alphaMin,
      alphaMax,
      speed:     Math.random() * 0.007 + 0.002,
      isCtaZone: isCta,
    };
  }

  const normalCount = Math.floor(normalArea * DENSITY_NORMAL);
  const ctaCount    = Math.floor(ctaArea    * DENSITY_CTA);

  for (let i = 0; i < normalCount; i++) {
    particles.push(makeParticle(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      false
    ));
  }

  for (let i = 0; i < ctaCount; i++) {
    particles.push(makeParticle(
      ctaRect.left + Math.random() * ctaRect.width,
      ctaRect.top  + Math.random() * ctaRect.height,
      true
    ));
  }

  // Cluster seeds — organic star groupings
  for (let c = 0; c < 14; c++) {
    const cx = Math.random() * canvas.width;
    const cy = Math.random() * canvas.height;
    const count = Math.floor(Math.random() * 22) + 6;
    const spread = 85;
    for (let p = 0; p < count; p++) {
      const dx = (Math.random() + Math.random() - 1) * spread;
      const dy = (Math.random() + Math.random() - 1) * spread;
      particles.push(makeParticle(cx + dx, cy + dy, false));
    }
  }

  return particles;
}

function tickParticles(particles) {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const diff = p.alphaTarget - p.alpha;
    if (Math.abs(diff) < 0.007) {
      p.alphaTarget = p.alphaMin + Math.random() * (p.alphaMax - p.alphaMin);
      if (p.isCtaZone && Math.random() > 0.58) {
        p.alphaTarget = 0.82 + Math.random() * 0.18;
      }
    } else {
      p.alpha += diff * p.speed * 60;
    }
    if (p.alpha < p.alphaMin) p.alpha = p.alphaMin;
    if (p.alpha > p.alphaMax) p.alpha = p.alphaMax;
  }
}

/* =================================================
   MAIN DRAW LOOP
   Layer order (back to front):
   1. Solid blue background
   2. Pixel moon
   3. Drifting pixel clouds
   4. Twinkling pixel stars
   ================================================= */

function drawFrame(ctx, particles, clouds, moonX, moonY) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  // 1. Solid blue — no motion blur, keeps pixels crisp
  ctx.fillStyle = '#2E63E0';
  ctx.fillRect(0, 0, W, H);

  // 2. Moon (static, upper-right area)
  drawMoon(ctx, moonX, moonY);

  // 3. Clouds (drifting left, behind stars so stars twinkle in front)
  clouds.forEach(c => drawCloud(ctx, c));

  // 4. Stars (pixel squares, integer-aligned)
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    ctx.fillStyle = p.color + p.alpha.toFixed(3) + ')';
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
  }
}

function initPixelSky() {
  const canvas = document.getElementById('pixel-sky');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let particles = [];
  let clouds    = [];
  let moonX     = 0;
  let moonY     = 0;

  function getCtaRect() {
    const el = document.getElementById('join');
    if (!el) return { left: 0, top: 0, width: 0, height: 0 };
    return { left: 0, top: el.offsetTop, width: canvas.width, height: el.offsetHeight };
  }

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    // Moon: upper-right, clear of navbar and content
    moonX = canvas.width - 210;
    moonY = 88;

    particles = buildParticlePool(canvas, getCtaRect());
    clouds    = initClouds(canvas.width, canvas.height, 14);
  }

  function loop() {
    tickParticles(particles);
    tickClouds(clouds, canvas.width, canvas.height);
    drawFrame(ctx, particles, clouds, moonX, moonY);
    requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', debounce(resize, 220));
  loop();
}

/* =================================================
   HERO VIDEO SCROLL FADE
   Video + overlay fade out as user scrolls through
   the hero, dissolving into the pixel sky beneath.
   ================================================= */

function initHeroScrollFade() {
  const hero    = document.getElementById('hero');
  const video   = document.querySelector('.hero-video');
  const overlay = document.querySelector('.hero-overlay');
  if (!hero || !video) return;

  function onScroll() {
    const heroH   = hero.offsetHeight;
    const scrollY = window.scrollY;
    const progress = Math.min(Math.max(scrollY / heroH, 0), 1);
    // Complete fade by 75% through the hero scroll
    const fade = 1 - Math.min(progress / 0.75, 1);
    video.style.opacity   = fade;
    overlay.style.opacity = fade;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* =================================================
   NAVBAR
   ================================================= */

function initNavbar() {
  const navbar   = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('#nav-links a:not(.btn)');
  const sections = document.querySelectorAll('main section[id]');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(s => sectionObserver.observe(s));
}

/* =================================================
   MOBILE MENU
   ================================================= */

function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const menu      = document.getElementById('mobile-menu');
  const overlay   = document.getElementById('mobile-overlay');
  const closeBtn  = document.getElementById('mobile-close');
  if (!hamburger || !menu) return;

  function openMenu() {
    menu.classList.add('open');
    overlay.classList.add('open');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    menu.classList.remove('open');
    overlay.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (overlay)  overlay.addEventListener('click', closeMenu);
  menu.querySelectorAll('a').forEach(l => l.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) closeMenu();
  });
}

/* =================================================
   VALUE CARDS — EXPAND / COLLAPSE
   ================================================= */

function initValueCards() {
  document.querySelectorAll('.value-card').forEach(card => {
    function toggle() {
      const isOpen = card.dataset.expanded === 'true';
      card.dataset.expanded = isOpen ? 'false' : 'true';
      card.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    }
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
}

/* =================================================
   SCROLL REVEAL
   ================================================= */

function initScrollReveal() {
  const targets = document.querySelectorAll('.reveal, .reveal-stagger');
  if (!targets.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });
  targets.forEach(el => observer.observe(el));
}

/* =================================================
   INIT
   ================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initPixelSky();
  initHeroScrollFade();
  initNavbar();
  initMobileMenu();
  initValueCards();
  initScrollReveal();
});
