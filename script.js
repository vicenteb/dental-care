/* Dental Care landing — lightweight JS for menu, FAQ behavior, form validation and tracking.
   Keeps CWV in mind: defer script, minimal DOM work, no heavy libs. */

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // Year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Premium header state
  const header = $(".header");
  if (header) {
    let scrollTicking = false;
    const updateHeader = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    const requestHeaderUpdate = () => {
      if (scrollTicking) return;
      scrollTicking = true;
      window.requestAnimationFrame(() => {
        updateHeader();
        scrollTicking = false;
      });
    };

    updateHeader();
    window.addEventListener("scroll", requestHeaderUpdate, { passive: true });
  }

  // Mobile menu
  const toggle = $(".nav__toggle");
  const menu = $("#menu");
  if (toggle && menu) {
    const setExpanded = (expanded) => {
      toggle.setAttribute("aria-expanded", String(expanded));
      menu.classList.toggle("open", expanded);
    };

    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      setExpanded(!expanded);
    });

    document.addEventListener("click", (e) => {
      if (!menu.classList.contains("open")) return;
      const within = menu.contains(e.target) || toggle.contains(e.target);
      if (!within) setExpanded(false);
    });

    $$("#menu a").forEach((a) =>
      a.addEventListener("click", () => setExpanded(false))
    );
  }

  // Scroll reveal motion
  const setupRevealMotion = () => {
    if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) return;

    const mark = (el, type, delay = 0) => {
      if (!el || el.dataset.reveal) return;
      el.dataset.reveal = type;
      el.style.setProperty("--reveal-delay", `${delay}ms`);
    };

    const markAll = (selector, type, { delay = 0, stagger = 80, root = document } = {}) => {
      $$(selector, root).forEach((el, index) => mark(el, type, delay + index * stagger));
    };

    mark($(".hero .eyebrow"), "badge", 60);
    mark($(".hero h1"), "heading", 150);
    mark($(".hero .lead"), "text", 240);
    mark($(".hero__ctas"), "text", 330);
    mark($(".trust-row"), "text", 420);
    mark($(".hero__visual"), "media", 300);

    $$(".section__head").forEach((head) => {
      mark($(".label-tag", head), "badge", 0);
      mark($("h2", head), "heading", 90);
      mark($(".subtitle", head), "text", 170);
    });

    markAll(".service-grid .service", "card", { stagger: 90 });
    markAll(".values .value", "card", { stagger: 100 });
    markAll(".cards .card", "card", { stagger: 100 });
    markAll(".faq .faq__item", "card", { stagger: 70 });
    markAll(".seals .seal", "text", { delay: 80, stagger: 50 });

    const capture = $("#agendar .capture");
    if (capture) {
      mark($(".capture__copy .label-tag", capture), "badge", 0);
      mark($(".capture__copy h2", capture), "heading", 90);
      mark($(".capture__copy .subtitle", capture), "text", 170);
      markAll(".capture__benefits .chip", "text", { delay: 250, stagger: 60, root: capture });
      mark($(".form", capture), "form", 170);
    }

    markAll(".footer__grid > *", "text", { stagger: 80 });
    mark($(".footer__bottom"), "text", 120);

    document.documentElement.classList.add("motion-ready");

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        window.setTimeout(() => {
          entry.target.classList.add("reveal-complete");
        }, 1400);
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.12,
    });

    $$("[data-reveal]").forEach((el) => revealObserver.observe(el));
  };

  setupRevealMotion();

  // Accordion: allow only one open (optional)
  const acc = document.querySelector("[data-accordion]");
  if (acc) {
    acc.addEventListener("toggle", (e) => {
      if (!(e.target instanceof HTMLDetailsElement)) return;
      if (!e.target.open) return;
      // Close others
      $$(".faq__item", acc).forEach((d) => {
        if (d !== e.target) d.open = false;
      });
    }, true);
  }

  // Form validation + tracking
  const form = $("#leadForm");
  if (form) {
    const nome = $("#nome");
    const email = $("#email");
    const whatsapp = $("#whatsapp");
    const success = $(".form__success", form);

    const setError = (input, msg) => {
      const field = input.closest(".field");
      const err = field ? $(".error", field) : null;
      if (err) err.textContent = msg || "";
      input.setAttribute("aria-invalid", msg ? "true" : "false");
    };

    const isEmailValid = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    const digits = (v) => (v || "").replace(/\D/g, "");

    const validate = () => {
      let ok = true;

      if (!nome.value.trim() || nome.value.trim().length < 2) {
        setError(nome, "Informe seu nome.");
        ok = false;
      } else setError(nome, "");

      if (!email.value.trim() || !isEmailValid(email.value.trim())) {
        setError(email, "Informe um e-mail válido.");
        ok = false;
      } else setError(email, "");

      const w = digits(whatsapp.value);
      if (w.length < 10 || w.length > 13) {
        setError(whatsapp, "Informe um WhatsApp com DDD (ex.: 51...).");
        ok = false;
      } else setError(whatsapp, "");

      return ok;
    };

    // Soft mask (lightweight)
    whatsapp?.addEventListener("input", () => {
      const w = digits(whatsapp.value).slice(0, 11);
      // Basic BR format: (DD) 9XXXX-XXXX
      let out = w;
      if (w.length >= 2) out = `(${w.slice(0, 2)}) ${w.slice(2)}`;
      if (w.length >= 7) out = `(${w.slice(0, 2)}) ${w.slice(2, 7)}-${w.slice(7)}`;
      whatsapp.value = out;
    });

    [nome, email, whatsapp].forEach((el) => {
      el?.addEventListener("blur", validate);
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (success) success.hidden = true;

      if (!validate()) return;

      // Track: Meta Pixel Lead
      try {
        if (typeof window.fbq === "function") {
          window.fbq("track", "Lead", { content_name: "Agendamento Dental Care" });
        }
      } catch (_) {}

      // Optional: send to backend (replace with your endpoint)
      // await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({...}) });

      // UX success
      form.reset();
      if (success) {
        success.hidden = false;
        success.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }

  // Simple CTA click tracking (Meta Pixel)
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-track]");
    if (!a) return;
    const name = a.getAttribute("data-track") || "cta_click";

    try {
      if (typeof window.fbq === "function") {
        window.fbq("trackCustom", "CTA_Click", { name });
      }
    } catch (_) {}
  });
})();
