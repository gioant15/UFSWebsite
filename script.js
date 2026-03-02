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

function buildParticlePool(canvas, ctaRect) {
  const particles = [];

  const DENSITY_NORMAL = 0.00014;
  const DENSITY_CTA    = 0.00030;

  const totalArea  = canvas.width * canvas.height;
  const ctaArea    = ctaRect.width * ctaRect.height;
  const normalArea = Math.max(0, totalArea - ctaArea);

  const normalCount = Math.floor(normalArea * DENSITY_NORMAL);
  const ctaCount    = Math.floor(ctaArea    * DENSITY_CTA);

  function makeParticle(x, y, isCta) {
    const alphaMax = isCta ? 0.92 : 0.65;
    const alphaMin = 0.04;
    return {
      x,
      y,
      size: Math.random() * 2 + 4, // 4–6px
      // Approx 70% white, 30% grey
      color: Math.random() > 0.3
        ? 'rgba(255,255,255,'
        : 'rgba(175,185,198,',
      alpha:       Math.random() * (alphaMax - alphaMin) + alphaMin,
      alphaTarget: Math.random() * (alphaMax - alphaMin) + alphaMin,
      alphaMin,
      alphaMax,
      speed:    Math.random() * 0.009 + 0.003,
      isCtaZone: isCta,
    };
  }

  // Normal scatter across the full canvas
  for (let i = 0; i < normalCount; i++) {
    particles.push(makeParticle(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      false
    ));
  }

  // CTA zone — denser scatter within the CTA rect
  for (let i = 0; i < ctaCount; i++) {
    particles.push(makeParticle(
      ctaRect.left + Math.random() * ctaRect.width,
      ctaRect.top  + Math.random() * ctaRect.height,
      true
    ));
  }

  // Cluster seeds — organic groupings (like star clusters)
  const clusterCount = 10;
  for (let c = 0; c < clusterCount; c++) {
    const cx = Math.random() * canvas.width;
    const cy = Math.random() * canvas.height;
    const clusterSize = Math.floor(Math.random() * 20) + 8;
    const spread = 75;
    for (let p = 0; p < clusterSize; p++) {
      // Triangular distribution for natural cluster falloff
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

    if (Math.abs(diff) < 0.006) {
      // Pick a new alpha target
      p.alphaTarget = p.alphaMin + Math.random() * (p.alphaMax - p.alphaMin);
      // CTA particles occasionally flash very bright
      if (p.isCtaZone && Math.random() > 0.65) {
        p.alphaTarget = 0.80 + Math.random() * 0.18;
      }
    } else {
      p.alpha += diff * p.speed * 60;
    }

    if (p.alpha < p.alphaMin) p.alpha = p.alphaMin;
    if (p.alpha > p.alphaMax) p.alpha = p.alphaMax;
  }
}

function drawFrame(ctx, particles) {
  // Semi-transparent fill instead of clear → short motion-blur trail
  ctx.fillStyle = 'rgba(46,99,224,0.38)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

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
  let rafId;

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
    particles = buildParticlePool(canvas, getCtaRect());
  }

  function loop() {
    tickParticles(particles);
    drawFrame(ctx, particles);
    rafId = requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', debounce(resize, 220));
  loop();
}

/* =================================================
   NAVBAR
   ================================================= */

function initNavbar() {
  const navbar   = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('#nav-links a:not(.btn)');
  const sections = document.querySelectorAll('main section[id]');

  if (!navbar) return;

  // Scroll → .scrolled class
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  // Active link highlighting
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
  if (closeBtn)  closeBtn.addEventListener('click', closeMenu);
  if (overlay)   overlay.addEventListener('click', closeMenu);

  // Close on any menu link tap
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

  // Escape key
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
      card.dataset.expanded   = isOpen ? 'false' : 'true';
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
  initNavbar();
  initMobileMenu();
  initValueCards();
  initScrollReveal();
});
