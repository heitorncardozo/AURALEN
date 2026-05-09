/* ============================================
   AURALEN — Landing Page Interactions
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  initSmoothScroll();
  initScrollReveal();
  initFAQ();
  initVideoModal();
  initTestimonialsDots();
  initForm();
  initActiveNav();
  initStars();
});

/* ---- Header Scroll ---- */
function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;
  const update = () => header.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ---- Mobile Menu ---- */
function initMobileMenu() {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('mobileNav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    nav.classList.toggle('active');
    document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    toggle.classList.remove('active');
    nav.classList.remove('active');
    document.body.style.overflow = '';
  }));
}

/* ---- Smooth Scroll ---- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e) {
      const id = this.getAttribute('href');
      if (id === '#') return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      const offset = document.getElementById('header')?.offsetHeight || 80;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    });
  });
}

/* ---- Scroll Reveal ---- */
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => obs.observe(el));
}

/* ---- FAQ Accordion ---- */
function initFAQ() {
  const items = document.querySelectorAll('.faq__item');
  items.forEach(item => {
    const q = item.querySelector('.faq__question');
    if (!q) return;
    q.addEventListener('click', () => {
      const active = item.classList.contains('active');
      items.forEach(i => i.classList.remove('active'));
      if (!active) item.classList.add('active');
    });
  });
}

/* ---- Video Modal ---- */
function initVideoModal() {
  const modal = document.getElementById('videoModal');
  const close = document.getElementById('videoModalClose');
  const name = document.getElementById('videoModalName');
  const detail = document.getElementById('videoModalDetail');
  if (!modal) return;

  document.querySelectorAll('.testimonial__card').forEach(card => {
    card.addEventListener('click', () => {
      if (name) name.textContent = card.querySelector('.testimonial__name')?.textContent || '';
      if (detail) detail.textContent = card.querySelector('.testimonial__company')?.textContent || '';
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  const closeModal = () => { modal.classList.remove('active'); document.body.style.overflow = ''; };
  if (close) close.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('active')) closeModal(); });
}

/* ---- Testimonials Dots ---- */
function initTestimonialsDots() {
  const carousel = document.getElementById('testimonialsCarousel');
  const dots = document.querySelectorAll('.testimonials__dot');
  if (!carousel || !dots.length) return;

  carousel.addEventListener('scroll', () => {
    const card = carousel.querySelector('.testimonial__card');
    const w = card ? card.offsetWidth + 24 : 344;
    const idx = Math.round(carousel.scrollLeft / w);
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }, { passive: true });

  dots.forEach((d, i) => d.addEventListener('click', () => {
    const card = carousel.querySelector('.testimonial__card');
    const w = card ? card.offsetWidth + 24 : 344;
    carousel.scrollTo({ left: i * w, behavior: 'smooth' });
  }));
}

/* ---- Form ---- */
function initForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const required = ['nome', 'empresa', 'whatsapp', 'email'];
    let ok = true;
    required.forEach(f => {
      const inp = form.querySelector(`[name="${f}"]`);
      if (!inp) return;
      if (!inp.value.trim()) { inp.style.borderColor = '#c0392b'; ok = false; }
      else inp.style.borderColor = '';
    });
    if (!ok) return;

    let msg = `*Novo Lead — AURALEN*\n\n*Nome:* ${data.nome}\n*Empresa:* ${data.empresa}\n*WhatsApp:* ${data.whatsapp}\n*Email:* ${data.email}\n`;
    if (data.cidade) msg += `*Cidade:* ${data.cidade}\n`;
    if (data.instagram) msg += `*Instagram/Site:* ${data.instagram}\n`;
    if (data.segmento) msg += `*Segmento:* ${data.segmento}\n`;
    if (data.servico) msg += `*Serviço:* ${data.servico}\n`;
    if (data.momento) msg += `*Momento:* ${data.momento}\n`;
    if (data.prazo) msg += `*Prazo:* ${data.prazo}\n`;
    if (data.investimento) msg += `*Investimento:* ${data.investimento}\n`;
    if (data.origem) msg += `*Origem:* ${data.origem}\n`;
    if (data.descricao) msg += `\n*Descrição:*\n${data.descricao}\n`;

    const btn = document.getElementById('form-submit-btn');
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = 'Enviando...'; btn.style.opacity = '0.7'; btn.disabled = true;

      // === INTEGRAÇÃO COM O NOTION (API VERCEL) ===
      const webhookUrl = '/api/submit'; 

      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } catch (error) {
        console.error('Erro ao salvar no Notion:', error);
      }

      setTimeout(() => {
        btn.innerHTML = 'Diagnóstico solicitado! ✓'; 
        btn.style.background = '#25D366'; // Cor de sucesso (verde)
        btn.style.color = '#FFFFFF';
        btn.style.opacity = '1';
        form.reset();
        
        // Retorna o botão ao estado original após 4 segundos
        setTimeout(() => {
          btn.innerHTML = orig;
          btn.style.background = '';
          btn.style.color = '';
          btn.disabled = false;
        }, 4000);
      }, 400);
    }
  });

  form.querySelectorAll('input,select,textarea').forEach(inp =>
    inp.addEventListener('focus', () => { inp.style.borderColor = ''; })
  );
}

/* ---- Active Nav ---- */
function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.header__menu a');
  if (!sections.length || !links.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.getAttribute('id');
        links.forEach(l => {
          l.classList.toggle('active', l.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' });
  sections.forEach(s => obs.observe(s));
}

/* ============================================
   STARRY SKY ANIMATION
   ============================================ */
function initStars() {
  const isMobile = window.innerWidth <= 768;
  const f = isMobile ? 0.25 : 1; // Reduces stars to 25% on mobile for performance

  // Hero — dense starry sky
  createStarField('heroStars', {
    dim: Math.floor(120 * f),    // Many small dim white/blue stars
    mid: Math.floor(50 * f),     // Gold-tinted mid stars
    bright: Math.floor(15 * f),  // Bright glowing stars
    accent: Math.floor(5 * f),   // Extra bright accent stars
    shooting: true
  });
  // Reinforcement section
  createStarField('reinforcementStars', {
    dim: Math.floor(40 * f), mid: Math.floor(15 * f), bright: Math.floor(5 * f), accent: Math.floor(2 * f), shooting: false
  });
  // Global subtle background
  createStarField('globalStars', {
    dim: Math.floor(30 * f), mid: Math.floor(10 * f), bright: Math.floor(3 * f), accent: 0, shooting: false
  });
}

function createStarField(containerId, config) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Dim stars — small, white/blueish, barely visible
  for (let i = 0; i < config.dim; i++) {
    createStar(container, 'star--dim', 0.5 + Math.random() * 1.5, 3 + Math.random() * 6);
  }
  // Mid stars — gold tint, moderate glow
  for (let i = 0; i < config.mid; i++) {
    createStar(container, 'star--mid', 1 + Math.random() * 2, 2 + Math.random() * 5);
  }
  // Bright stars — strong glow
  for (let i = 0; i < config.bright; i++) {
    createStar(container, 'star--bright', 2 + Math.random() * 2.5, 2 + Math.random() * 4);
  }
  // Accent stars — very bright, rare
  for (let i = 0; i < (config.accent || 0); i++) {
    createStar(container, 'star--accent', 2.5 + Math.random() * 2, 1.5 + Math.random() * 3);
  }

  // Shooting stars
  if (config.shooting) {
    // Launch first quickly
    setTimeout(() => launchShootingStar(container), 1500);
    setTimeout(() => launchShootingStar(container), 4000);
    // Then periodic
    setInterval(() => launchShootingStar(container), 3000 + Math.random() * 5000);
  }
}

function createStar(container, className, size, duration) {
  const star = document.createElement('div');
  star.className = `star ${className}`;
  star.style.cssText = `
    left:${Math.random() * 100}%;
    top:${Math.random() * 100}%;
    width:${size}px;
    height:${size}px;
    animation-delay:${Math.random() * 6}s;
    animation-duration:${duration}s;
  `;
  container.appendChild(star);
}

function launchShootingStar(container) {
  const star = document.createElement('div');
  star.className = 'shooting-star';
  const duration = 1.2 + Math.random() * 1.5;
  star.style.cssText = `
    top:${3 + Math.random() * 45}%;
    left:${Math.random() * 25}%;
    animation-duration:${duration}s;
    transform:rotate(${12 + Math.random() * 25}deg);
  `;
  container.appendChild(star);
  setTimeout(() => star.remove(), duration * 1000 + 300);
}
