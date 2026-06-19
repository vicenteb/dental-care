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

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$
(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); } /* ── Year ── */ var yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear(); /* ── Refs ── */ var header      = $('.header'); var toggle      = $('.nav__toggle'); var menu        = document.getElementById('menu'); var progressBar = document.getElementById('scrollProgressBar'); /* ── Scroll: header state + progress bar (rAF throttled) ── */ var ticking = false; function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(function () { var y = window.scrollY || window.pageYOffset || 0; if (header) { if (y > 8) { header.classList.add('is-scrolled'); } else { header.classList.remove('is-scrolled'); } } if (progressBar) { var doc = document.documentElement; var max = Math.max(1, doc.scrollHeight - doc.clientHeight); var pct = Math.min(100, (y / max) * 100); progressBar.style.width = pct.toFixed(2) + '%'; } ticking = false; }); } window.addEventListener('scroll', onScroll, { passive: true }); onScroll(); /* ── Mobile menu ── */ if (toggle && menu) { function setExpanded(expanded) { toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false'); if (expanded) { menu.style.display = 'block'; menu.getBoundingClientRect(); // force reflow menu.classList.add('open'); } else { menu.classList.remove('open'); menu.addEventListener('animationend', function handler() { if (!menu.classList.contains('open')) { menu.style.display = ''; } menu.removeEventListener('animationend', handler); }); } } toggle.addEventListener('click', function () { var expanded = toggle.getAttribute('aria-expanded') === 'true'; setExpanded(!expanded); }); document.addEventListener('click', function (e) { if (!menu.classList.contains('open')) return; var withinMenu   = menu.contains(e.target); var withinToggle = toggle.contains(e.target); if (!withinMenu && !withinToggle) setExpanded(false); }); var menuLinks =
$$('#menu a');
    menuLinks.forEach(function (a) {
      a.addEventListener('click', function () { setExpanded(false); });
    });
  }

  /* ── Accordion: allow only one open ── */
  var acc = $('[data-accordion]');
  if (acc) {
    acc.addEventListener('toggle', function (e) {
      var target = e.target;
      if (!(target instanceof HTMLDetailsElement)) return;
      if (!target.open) return;
      var items = $$
('.faq__item', acc); items.forEach(function (d) { if (d !== target) d.open = false; }); }, true); } /* ── Smooth anchor scroll with sticky offset ── */ function getHeaderH() { if (!header) return 80; return Math.round(header.getBoundingClientRect().height + 12); } var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; function scrollToTarget(hash) { if (!hash || hash === '#') return; var id = hash.replace('#', ''); var el = document.getElementById(id); if (!el) return; var top = window.pageYOffset + el.getBoundingClientRect().top - getHeaderH(); window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' }); } document.addEventListener('click', function (e) { var a = e.target.closest('a[href^="#"]'); if (!a) return; var href = a.getAttribute('href'); if (!href || href === '#') return; e.preventDefault(); scrollToTarget(href); history.pushState(null, '', href); }); if (window.location.hash) { setTimeout(function () { scrollToTarget(window.location.hash); }, 80); } /* ── Reveal on scroll (IntersectionObserver) ── */ if (!reduceMotion && 'IntersectionObserver' in window) { var io = new IntersectionObserver( function (entries) { entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add('is-inview'); io.unobserve(entry.target); } }); }, { threshold: 0.10, rootMargin: '0px 0px -6% 0px' } );
$$('.reveal').forEach(function (el) { io.observe(el); });

  } else {
    $$
('.reveal').forEach(function (el) { el.classList.add('is-inview'); }); } /* ── Active nav link (section highlight) ── */ var sectionIds = ['servicos', 'tecnologias', 'depoimentos', 'faq', 'agendar']; var navLinks   =
$$('#menu a[href^="#"]');

  function linkFor(id) {
    var found = null;
    navLinks.forEach(function (a) {
      if (a.getAttribute('href') === '#' + id) found = a;
    });
    return found;
  }

  if (!reduceMotion && 'IntersectionObserver' in window) {
    var so = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var link = linkFor(entry.target.id);
          if (!link) return;
          if (entry.isIntersecting) {
            navLinks.forEach(function (a) { a.classList.remove('is-active'); });
            link.classList.add('is-active');
          }
        });
      },
      { threshold: 0.4 }
    );

    sectionIds.forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) so.observe(sec);
    });
  }

  /* ── Form validation + tracking ── */
  var form = document.getElementById('leadForm');
  if (form) {
    var nomeInput     = document.getElementById('nome');
    var emailInput    = document.getElementById('email');
    var whatsappInput = document.getElementById('whatsapp');
    var successEl     = $('.form__success', form);

    function setError(input, msg) {
      if (!input) return;
      var field = input.closest('.field');
      var err   = field ? $('.error', field) : null;
      if (err) err.textContent = msg || '';
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }

    function isEmailValid(v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }

    function digits(v) {
      return (v || '').replace(/\D/g, '');
    }

    function validate() {
      var ok = true;

      if (!nomeInput.value.trim() || nomeInput.value.trim().length < 2) {
        setError(nomeInput, 'Informe seu nome.');
        ok = false;
      } else {
        setError(nomeInput, '');
      }

      if (!emailInput.value.trim() || !isEmailValid(emailInput.value.trim())) {
        setError(emailInput, 'Informe um e-mail válido.');
        ok = false;
      } else {
        setError(emailInput, '');
      }

      var w = digits(whatsappInput.value);
      if (w.length < 10 || w.length > 13) {
        setError(whatsappInput, 'Informe um WhatsApp com DDD (ex.: 51...).');
        ok = false;
      } else {
        setError(whatsappInput, '');
      }

      return ok;
    }

    if (whatsappInput) {
      whatsappInput.addEventListener('input', function () {
        var w = digits(whatsappInput.value).slice(0, 11);
        var out = w;
        if (w.length >= 2)  out = '(' + w.slice(0, 2) + ') ' + w.slice(2);
        if (w.length >= 7)  out = '(' + w.slice(0, 2) + ') ' + w.slice(2, 7) + '-' + w.slice(7);
        whatsappInput.value = out;
      });
    }

    [nomeInput, emailInput, whatsappInput].forEach(function (el) {
      if (el) el.addEventListener('blur', validate);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (successEl) successEl.hidden = true;
      if (!validate()) return;

      try {
        if (typeof window.fbq === 'function') {
          window.fbq('track', 'Lead', { content_name: 'Agendamento Dental Care' });
        }
      } catch (err) {}

      form.reset();

      if (successEl) {
        successEl.hidden = false;
        successEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  /* ── CTA click tracking (Meta Pixel) ── */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-track]');
    if (!a) return;
    var name = a.getAttribute('data-track') || 'cta_click';
    try {
      if (typeof window.fbq === 'function') {
        window.fbq('trackCustom', 'CTA_Click', { name: name });
      }
    } catch (err) {}
  });

})();
