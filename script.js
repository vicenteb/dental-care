/* Dental Care landing — premium motion (lightweight)
   - Menu mobile com animação hamburger → X
   - Accordion (one open)
   - Smooth anchor scroll com offset do header sticky
   - Reveal on scroll (IntersectionObserver)
   - Scroll progress bar (rAF throttled)
   - Active nav link highlight
   - Form validation + Meta Pixel tracking
*/

(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$
= (sel, root = document) => [...root.querySelectorAll(sel)]; /* ── Year ── */ const yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear(); /* ── Refs ── */ const header      = $('.header'); const toggle      = $('.nav__toggle'); const menu        = $('#menu'); const progressBar = $('#scrollProgressBar'); /* ── Scroll: header state + progress bar (rAF throttled) ── */ let ticking = false; const onScroll = () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { const y = window.scrollY || 0; if (header) header.classList.toggle('is-scrolled', y > 8); if (progressBar) { const doc = document.documentElement; const max = Math.max(1, doc.scrollHeight - doc.clientHeight); const pct = Math.min(100, (y / max) * 100); progressBar.style.width = pct.toFixed(2) + '%'; } ticking = false; }); }; window.addEventListener('scroll', onScroll, { passive: true }); onScroll(); /* ── Mobile menu ── */ if (toggle && menu) { const setExpanded = (expanded) => { toggle.setAttribute('aria-expanded', String(expanded)); if (expanded) { menu.style.display = 'block'; // Force reflow then add open for animation menu.getBoundingClientRect(); menu.classList.add('open'); } else { menu.classList.remove('open'); // Wait for animation before hiding menu.addEventListener('animationend', () => { if (!menu.classList.contains('open')) menu.style.display = ''; }, { once: true }); } }; toggle.addEventListener('click', () => { const expanded = toggle.getAttribute('aria-expanded') === 'true'; setExpanded(!expanded); }); document.addEventListener('click', (e) => { if (!menu.classList.contains('open')) return; const within = menu.contains(e.target) || toggle.contains(e.target); if (!within) setExpanded(false); });
$$('#menu a').forEach((a) =>
      a.addEventListener('click', () => setExpanded(false))
    );
  }

  /* ── Accordion: allow only one open ── */
  const acc = $('[data-accordion]');
  if (acc) {
    acc.addEventListener('toggle', (e) => {
      if (!(e.target instanceof HTMLDetailsElement)) return;
      if (!e.target.open) return;
      $$
('.faq__item', acc).forEach((d) => { if (d !== e.target) d.open = false; }); }, true); } /* ── Smooth anchor scroll with sticky offset ── */ const getHeaderH = () => header ? Math.round(header.getBoundingClientRect().height + 12) : 80; const scrollToTarget = (hash) => { if (!hash || hash === '#') return; const el = document.getElementById(hash.slice(1)); if (!el) return; const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; const top = window.pageYOffset + el.getBoundingClientRect().top - getHeaderH(); window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' }); }; document.addEventListener('click', (e) => { const a = e.target.closest('a[href^="#"]'); if (!a) return; const href = a.getAttribute('href'); if (!href || href === '#') return; e.preventDefault(); scrollToTarget(href); history.pushState(null, '', href); }); if (window.location.hash) { setTimeout(() => scrollToTarget(window.location.hash), 80); } /* ── Reveal on scroll (IntersectionObserver) ── */ const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; if (!reduceMotion && 'IntersectionObserver' in window) { const io = new IntersectionObserver( (entries) => { entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-inview'); io.unobserve(entry.target); // fire once } }); }, { threshold: 0.10, rootMargin: '0px 0px -6% 0px' } );
$$('.reveal').forEach((el) => io.observe(el));
  } else {
    // Fallback: show everything immediately
    $$
('.reveal').forEach((el) => el.classList.add('is-inview')); } /* ── Active nav link (section highlight) ── */ const sectionIds = ['servicos', 'tecnologias', 'depoimentos', 'faq', 'agendar']; const navLinks   =
$$('#menu a[href^="#"]');

  const linkFor = (id) => navLinks.find(
    (a) => a.getAttribute('href') === '#' + id
  );

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const so = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = linkFor(entry.target.id);
          if (!link) return;
          if (entry.isIntersecting) {
            navLinks.forEach((a) => a.classList.remove('is-active'));
            link.classList.add('is-active');
          }
        });
      },
      { threshold: 0.4 }
    );

    sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean)
      .forEach((sec) => so.observe(sec));
  }

  /* ── Form validation + tracking ── */
  const form = $('#leadForm');
  if (form) {
    const nome      = $('#nome');
    const email     = $('#email');
    const whatsapp  = $('#whatsapp');
    const success   = $('.form__success', form);

    const setError = (input, msg) => {
      const field = input?.closest('.field');
      const err   = field ? $('.error', field) : null;
      if (err) err.textContent = msg || '';
      input?.setAttribute('aria-invalid', msg ? 'true' : 'false');
    };

    const isEmailValid = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    const digits = (v) => (v || '').replace(/\D/g, '');

    const validate = () => {
      let ok = true;

      if (!nome.value.trim() || nome.value.trim().length < 2) {
        setError(nome, 'Informe seu nome.');
        ok = false;
      } else setError(nome, '');

      if (!email.value.trim() || !isEmailValid(email.value.trim())) {
        setError(email, 'Informe um e-mail válido.');
        ok = false;
      } else setError(email, '');

      const w = digits(whatsapp.value);
      if (w.length < 10 || w.length > 13) {
        setError(whatsapp, 'Informe um WhatsApp com DDD (ex.: 51...).');
        ok = false;
      } else setError(whatsapp, '');

      return ok;
    };

    // Soft mask BR phone
    whatsapp?.addEventListener('input', () => {
      const w = digits(whatsapp.value).slice(0, 11);
      let out = w;
      if (w.length >= 2) out = `(${w.slice(0, 2)}) ${w.slice(2)}`;
      if (w.length >= 7) out = `(${w.slice(0, 2)}) ${w.slice(2, 7)}-${w.slice(7)}`;
      whatsapp.value = out;
    });

    [nome, email, whatsapp].forEach((el) =>
      el?.addEventListener('blur', validate)
    );

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (success) success.hidden = true;
      if (!validate()) return;

      // Meta Pixel Lead
      try {
        if (typeof window.fbq === 'function') {
          window.fbq('track', 'Lead', { content_name: 'Agendamento Dental Care' });
        }
      } catch (_) {}

      form.reset();
      if (success) {
        success.hidden = false;
        success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  /* ── CTA click tracking (Meta Pixel) ── */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-track]');
    if (!a) return;
    const name = a.getAttribute('data-track') || 'cta_click';
    try {
      if (typeof window.fbq === 'function') {
        window.fbq('trackCustom', 'CTA_Click', { name });
      }
    } catch (_) {}
  });

})();
