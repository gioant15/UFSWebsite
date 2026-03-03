/* ===================================================
   UvA Founder Space — script.js
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
   PIXEL SKY CANVAS
   ================================================= */

/* Draw a charming retro pixel moon (blocky 8-bit style) */
function drawMoon(ctx, originX, originY) {
  const S = 9; // size of each moon "pixel"

  // Moon body rows: [startCol, width] in moon-pixel units
  const bodyRows = [
    [2, 4],  // row 0
    [1, 6],  // row 1
    [0, 8],  // row 2
    [0, 8],  // row 3
    [0, 8],  // row 4
    [0, 8],  // row 5
    [1, 6],  // row 6
    [2, 4],  // row 7
  ];

  // Crater positions [col, row] in moon-pixel units
  const craters = [
    [2, 2], [5, 4], [3, 6],
  ];
  const craterSet = new Set(craters.map(([c, r]) => `${c},${r}`));

  // Draw moon body (warm white)
  ctx.fillStyle = 'rgba(238, 238, 210, 0.90)';
  bodyRows.forEach(([startCol, width], row) => {
    for (let col = startCol; col < startCol + width; col++) {
      if (!craterSet.has(`${col},${row}`)) {
        ctx.fillRect(
          originX + col * S,
          originY + row * S,
          S - 1, // 1px gap between moon pixels
          S - 1
        );
      }
    }
  });

  // Draw craters (darker tone)
  ctx.fillStyle = 'rgba(170, 170, 140, 0.75)';
  craters.forEach(([col, row]) => {
    ctx.fillRect(originX + col * S, originY + row * S, S - 1, S - 1);
  });
}

function buildParticlePool(canvas, ctaRect) {
  const particles = [];

  const DENSITY_NORMAL = 0.00016;
  const DENSITY_CTA    = 0.00032;

  const totalArea  = canvas.width * canvas.height;
  const ctaArea    = ctaRect.width * ctaRect.height;
  const normalArea = Math.max(0, totalArea - ctaArea);

  const normalCount = Math.floor(normalArea * DENSITY_NORMAL);
  const ctaCount    = Math.floor(ctaArea    * DENSITY_CTA);

  function makeParticle(x, y, isCta) {
    const alphaMax = isCta ? 0.95 : 0.72;
    const alphaMin = 0.06;
    return {
      x,
      y,
      size: Math.round(Math.random() * 2) + 4, // 4, 5, or 6px — crisp integer sizes
      // 70% white stars, 30% grey (distant) stars
      color: Math.random() > 0.3
        ? 'rgba(255,255,255,'
        : 'rgba(165,178,195,',
      alpha:       Math.random() * (alphaMax - alphaMin) + alphaMin,
      alphaTarget: Math.random() * (alphaMax - alphaMin) + alphaMin,
      alphaMin,
      alphaMax,
      speed:     Math.random() * 0.008 + 0.002,
      isCtaZone: isCta,
    };
  }

  // Scatter stars across the whole canvas
  for (let i = 0; i < normalCount; i++) {
    particles.push(makeParticle(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      false
    ));
  }

  // Denser star field in the CTA zone
  for (let i = 0; i < ctaCount; i++) {
    particles.push(makeParticle(
      ctaRect.left + Math.random() * ctaRect.width,
      ctaRect.top  + Math.random() * ctaRect.height,
      true
    ));
  }

  // Cluster seeds — organic groupings like a real starfield
  const clusterCount = 12;
  for (let c = 0; c < clusterCount; c++) {
    const cx = Math.random() * canvas.width;
    const cy = Math.random() * canvas.height;
    const clusterSize = Math.floor(Math.random() * 22) + 8; // 8–29 stars per cluster
    const spread = 80;
    for (let p = 0; p < clusterSize; p++) {
      // Triangular distribution → natural cluster falloff at edges
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
      // Reached target — pick a new random opacity target (twinkle)
      p.alphaTarget = p.alphaMin + Math.random() * (p.alphaMax - p.alphaMin);
      // CTA stars occasionally flash very bright
      if (p.isCtaZone && Math.random() > 0.60) {
        p.alphaTarget = 0.82 + Math.random() * 0.18;
      }
    } else {
      p.alpha += diff * p.speed * 60;
    }

    if (p.alpha < p.alphaMin) p.alpha = p.alphaMin;
    if (p.alpha > p.alphaMax) p.alpha = p.alphaMax;
  }
}

function drawFrame(ctx, particles, moonX, moonY) {
  // Solid clear — crisp pixel squares, no motion blur
  ctx.fillStyle = '#2E63E0';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Moon (always drawn, fixed position on canvas)
  drawMoon(ctx, moonX, moonY);

  // Stars — drawn as crisp integer-aligned squares
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
  let moonX = 0;
  let moonY = 0;

  function getCtaRect() {
    const ctaEl = document.getElementById('join');
    if (!ctaEl) return { left: 0, top: 0, width: 0, height: 0 };
    return {
      left:   0,
      top:    ctaEl.offsetTop,
      width:  canvas.width,
      height: ctaEl.offsetHeight,
    };
  }

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    // Moon: upper-right area, clear of the navbar (~70px) and edge
    moonX = canvas.width - 180;
    moonY = 90;
    particles = buildParticlePool(canvas, getCtaRect());
  }

  function loop() {
    tickParticles(particles);
    drawFrame(ctx, particles, moonX, moonY);
    requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', debounce(resize, 220));
  loop();
}

/* =================================================
   HERO VIDEO SCROLL FADE
   Ties video + overlay opacity to scroll position.
   As the user scrolls through the hero, the video
   dissolves into the pixel sky underneath.
   ================================================= */

function initHeroScrollFade() {
  const hero    = document.getElementById('hero');
  const video   = document.querySelector('.hero-video');
  const overlay = document.querySelector('.hero-overlay');

  if (!hero || !video) return;

  function onScroll() {
    const heroH   = hero.offsetHeight;
    const scrollY = window.scrollY;

    // Progress 0 (top of hero) → 1 (bottom of hero)
    const progress = Math.min(Math.max(scrollY / heroH, 0), 1);

    // Fade video out over the first 75% of the hero scroll
    const fade = 1 - Math.min(progress / 0.75, 1);

    video.style.opacity   = fade;
    overlay.style.opacity = fade;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  // Run once on load to set initial state
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

  // Scroll → .scrolled class for increased opacity
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  // Active link highlighting via IntersectionObserver
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

  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) closeMenu();
  });
}

/* =================================================
   VALUE CARDS — EXPAND / COLLAPSE
   ================================================= */

function initValueCards() {
  const cards = document.querySelectorAll('.value-card');

  cards.forEach(card => {
    function toggle() {
      const isOpen = card.dataset.expanded === 'true';
      card.dataset.expanded = isOpen ? 'false' : 'true';
      card.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    }

    card.addEventListener('click', toggle);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
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
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -32px 0px',
  });

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
