/* ========= Utilities ========= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/* ========= Theme toggle (persisted, respects system preference) ========= */
(function themeManager() {
  const toggle = $('#themeToggle');
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
  const stored = localStorage.getItem('theme'); // 'dark' | 'light' | null

  const apply = (mode) => {
    document.documentElement.dataset.theme = mode;
    toggle?.setAttribute('aria-pressed', String(mode === 'dark'));
  };

  if (stored) apply(stored);
  else if (mq?.matches) apply('dark'); else apply('light');

  toggle?.addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme;
    const next = cur === 'dark' ? 'light' : 'dark';
    apply(next);
    localStorage.setItem('theme', next);
  });

  // If user changes OS theme and no manual override is set
  mq?.addEventListener?.('change', (e) => {
    if (!localStorage.getItem('theme')) apply(e.matches ? 'dark' : 'light');
  });
})();

/* ========= Share buttons + Copy link ========= */
(function shareManager() {
  const url = location.href;
  const title = document.title;
  const copyBtn = document.querySelector('[data-copy]');
  const tw = document.querySelector('[data-share-twitter]');
  const fb = document.querySelector('[data-share-fb]');

  // Fill share URLs
  if (tw) tw.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  if (fb) fb.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  // Native share if available (clicking any share link on small screens)
  const tryNativeShare = async (e) => {
    if (navigator.share) {
      e.preventDefault();
      try { await navigator.share({ title, url }); } catch (_) {}
    }
  };
  tw?.addEventListener('click', tryNativeShare);
  fb?.addEventListener('click', tryNativeShare);

  // Copy link fallback
  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      copyBtn.textContent = 'कपी भयो!';
      setTimeout(() => (copyBtn.textContent = 'लिंक कपी'), 1400);
    } catch {
      prompt('Copy this link:', url);
    }
  });
})();

/* ========= Back-to-top button ========= */
(function toTopManager() {
  const btn = $('#toTop');
  if (!btn) return;

  const showAt = 600;
  let ticking = false;

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        (window.scrollY > showAt) ? btn.classList.add('show') : btn.classList.remove('show');
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ========= Smooth in-page navigation (respects reduced motion) ========= */
(function smoothAnchors() {
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  $$('.site-nav a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')?.slice(1);
      const target = id && document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      history.pushState(null, '', `#${id}`);
    });
  });
})();

/* ========= Active section highlighting in nav ========= */
(function activeSection() {
  const links = $$('.site-nav a[href^="#"]');
  const map = new Map(); // id -> link
  links.forEach(a => {
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) map.set(id, a);
  });
  if (!map.size || !('IntersectionObserver' in window)) return;

  const clear = () => links.forEach(a => a.classList.remove('active'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        clear();
        const link = map.get(entry.target.id);
        link?.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0.01 });

  map.forEach((_, id) => {
    const el = document.getElementById(id);
    el && io.observe(el);
  });
})();

/* ========= Subscribe form (basic UX; replace with your backend later) ========= */
(function subscribeForm() {
  const form = $('#subscribeForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#email', form)?.value?.trim();
    if (!email) return alert('इमेल लेख्नुहोस्।');
    // TODO: POST email to your service (Buttondown, Mailchimp, etc.)
    alert('धन्यवाद! तपाईंको इमेल सुरक्षित गरियो।');
    form.reset();
  });
})();

/* ========= External link safety (open new tab + noopener) ========= */
(function externalLinks() {
  $$('a[href^="http"]').forEach(a => {
    const same = a.host === location.host;
    if (!same) { a.target = '_blank'; a.rel = 'noopener'; }
  });
})();
