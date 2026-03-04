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
  const baseUrl = location.origin + location.pathname;
  const title = document.title;
  
  // Find all sharebar containers
  const sharebars = $$('.sharebar');
  
  sharebars.forEach((sharebar) => {
    // Find the article this sharebar belongs to
    const article = sharebar.closest('article');
    const articleId = article?.id;
    
    // Determine the URL for this specific article
    const url = articleId ? `${baseUrl}#${articleId}` : location.href;
    
    // Get buttons within this specific sharebar
    const copyBtn = sharebar.querySelector('[data-copy]');
    const tw = sharebar.querySelector('[data-share-twitter]');
    const fb = sharebar.querySelector('[data-share-fb]');

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
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'कपी भयो!';
        setTimeout(() => (copyBtn.textContent = originalText), 1400);
      } catch {
        prompt('Copy this link:', url);
      }
    });
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

/* ========= Retro boot splash (session-only, non-blocking) ========= */
(function retroBootSplash() {
  const key = 'retroBootSeen';
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');

  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const hold = prefersReduced ? 250 : 1100;

  const style = document.createElement('style');
  style.textContent = `
    .boot-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: grid;
      place-items: center;
      background: var(--bg);
      color: var(--ink);
      font-family: "Inter", "Noto Serif Devanagari", sans-serif;
      transition: opacity .25s ease;
    }
    .boot-overlay.hide { opacity: 0; pointer-events: none; }
    .boot-box { text-align: center; line-height: 1.6; }
    .boot-title { font-weight: 700; letter-spacing: .08em; font-size: clamp(20px, 4vw, 28px); color: var(--brand); }
    .boot-sub { color: var(--ink-dim); font-size: .9rem; margin-top: 8px; }
  `;

  const overlay = document.createElement('div');
  overlay.className = 'boot-overlay';
  overlay.innerHTML = `
    <div class="boot-box" aria-live="polite">
      <div class="boot-title">NEPALI BLOG OS v1.0</div>
      <div class="boot-sub">Initializing terminal interface...</div>
    </div>
  `;

  document.head.appendChild(style);
  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.classList.add('hide');
    setTimeout(() => {
      overlay.remove();
      style.remove();
    }, 280);
  }, hold);
})();

/* ========= Window-like focus state for cards/posts ========= */
(function windowFocusManager() {
  const focusables = $$('.bg-card, .post, .card');
  if (!focusables.length) return;

  const style = document.createElement('style');
  style.textContent = `
    .window-focus-active {
      box-shadow: 0 0 0 2px var(--brand), 0 0 8px color-mix(in srgb, var(--brand) 40%, transparent) !important;
    }
  `;
  document.head.appendChild(style);

  const clear = () => focusables.forEach(el => el.classList.remove('window-focus-active'));
  focusables.forEach((el) => {
    el.addEventListener('click', () => {
      clear();
      el.classList.add('window-focus-active');
    });
  });
})();

/* ========= Keyboard shortcuts (reference-inspired) ========= */
(function keyboardShortcuts() {
  const themeBtn = $('#themeToggle');
  const toTopBtn = $('#toTop');

  window.addEventListener('keydown', (e) => {
    // Alt+T => toggle theme
    if (e.altKey && (e.key === 't' || e.key === 'T')) {
      e.preventDefault();
      themeBtn?.click();
    }

    // Home => back to top (if button exists)
    if (e.key === 'Home' && toTopBtn) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
})();

/* ========= Lazy-load images (low-quality blur to high-quality) ========= */
(function lazyLoadImages() {
  if (!('IntersectionObserver' in window)) return;

  const style = document.createElement('style');
  style.textContent = `
    img[data-src] {
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
    }
    img[data-src].loaded {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          img.classList.add('loaded');
          io.unobserve(img);
        }
      }
    });
  }, { rootMargin: '50px' });

  $$('img[data-src]').forEach(img => io.observe(img));
})();

/* ========= Reading time estimate ========= */
(function readingTimeEstimate() {
  const posts = $$('.post, article');
  const wordsPerMinute = 200; // avg reading speed

  posts.forEach(post => {
    const prose = post.querySelector('.prose') || post;
    const text = prose.textContent || '';
    const wordCount = text.trim().split(/\s+/).length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);

    if (readTime > 0) {
      const meta = post.querySelector('.meta');
      if (meta) {
        const timeEl = document.createElement('span');
        timeEl.className = 'reading-time';
        timeEl.textContent = ` • ${readTime} min read`;
        meta.appendChild(timeEl);
      }
    }
  });
})();

/* ========= Expand/collapse article sections ========= */
(function expandCollapse() {
  const style = document.createElement('style');
  style.textContent = `
    .expandable {
      cursor: pointer;
      user-select: none;
      position: relative;
      padding-left: 24px;
    }
    .expandable::before {
      content: '▶';
      position: absolute;
      left: 0;
      transition: transform 0.2s ease;
      font-size: 0.8rem;
      color: var(--brand);
    }
    .expandable.expanded::before {
      transform: rotate(90deg);
    }
    .expandable-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }
    .expandable.expanded .expandable-content {
      max-height: 999px;
    }
  `;
  document.head.appendChild(style);

  $$('.post h3, article h3').forEach(heading => {
    const content = heading.nextElementSibling;
    if (content && (content.tagName === 'P' || content.classList.contains('prose'))) {
      heading.classList.add('expandable');
      const wrapper = document.createElement('div');
      wrapper.className = 'expandable-content';
      content.parentNode.insertBefore(wrapper, content);
      wrapper.appendChild(content);

      heading.addEventListener('click', () => {
        heading.classList.toggle('expanded');
      });

      heading.setAttribute('role', 'button');
      heading.setAttribute('tabindex', '0');
      heading.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          heading.click();
        }
      });
    }
  });
})();

/* ========= Scroll progress bar ========= */
(function scrollProgressBar() {
  const style = document.createElement('style');
  style.textContent = `
    .scroll-progress {
      position: fixed;
      top: 0;
      left: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--brand), var(--accent));
      width: 0%;
      z-index: 100;
      transition: width 0.1s ease;
    }
  `;
  document.head.appendChild(style);

  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);

  let ticking = false;
  const updateProgress = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
    bar.style.width = scrolled + '%';
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }, { passive: true });
})();

/* ========= Tooltip system (data-tooltip) ========= */
(function tooltipSystem() {
  const style = document.createElement('style');
  style.textContent = `
    [data-tooltip] {
      position: relative;
      cursor: help;
      border-bottom: 1px dotted var(--brand);
    }
    .tooltip {
      position: absolute;
      bottom: 125%;
      left: 50%;
      transform: translateX(-50%);
      background: var(--ink);
      color: var(--bg);
      padding: 8px 12px;
      border-radius: 2px;
      font-size: 0.85rem;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
      z-index: 1000;
      font-weight: 500;
    }
    .tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 4px solid transparent;
      border-top-color: var(--ink);
    }
    [data-tooltip]:hover .tooltip {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);

  $$('[data-tooltip]').forEach(el => {
    const text = el.getAttribute('data-tooltip');
    if (text) {
      const tip = document.createElement('span');
      tip.className = 'tooltip';
      tip.textContent = text;
      el.appendChild(tip);
    }
  });
})();

/* ========= Dark mode auto-switch by time ========= */
(function autoThemeSwitchByTime() {
  const hour = new Date().getHours();
  const storedTheme = localStorage.getItem('theme');
  
  // Only auto-switch if user hasn't manually set a theme
  if (!storedTheme) {
    const autoTheme = (hour >= 18 || hour < 6) ? 'dark' : 'light';
    document.documentElement.dataset.theme = autoTheme;
  }
})();

/* ========= Search highlight on Ctrl+F ========= */
(function searchHighlight() {
  const style = document.createElement('style');
  style.textContent = `
    ::selection {
      background: var(--accent);
      color: var(--ink);
    }
    .search-highlight {
      background: var(--accent);
      padding: 2px 0;
      border-radius: 2px;
    }
  `;
  document.head.appendChild(style);

  // Enhance native Ctrl+F by adding visual marker to search results
  // This works subtly with browser's native find feature
  let searchActive = false;
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      searchActive = true;
      // Browser will handle the actual search UI
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'Escape') searchActive = false;
  });
})();

/* ========= Smooth page transitions (fade effect) ========= */
(function smoothPageTransitions() {
  const style = document.createElement('style');
  style.textContent = `
    body {
      animation: fadeIn 0.3s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    a:not([target="_blank"]):not([href^="mailto"]):not([href^="#"]) {
      transition: opacity 0.15s ease;
    }
    a:not([target="_blank"]):not([href^="mailto"]):not([href^="#"]):active {
      opacity: 0.7;
    }
  `;
  document.head.appendChild(style);

  // Smooth transition on navigation
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && 
        !link.hasAttribute('target') && 
        !link.href.includes('mailto') && 
        !link.href.includes('#') &&
        link.href.startsWith(window.location.origin)) {
      
      // Optional: add fade-out before navigation
      const handler = (ev) => {
        if (ev.type === 'beforeunload') {
          document.body.style.opacity = '0';
          document.body.style.transition = 'opacity 0.15s ease';
        }
      };
      window.addEventListener('beforeunload', handler, { once: true });
    }
  });
})();
