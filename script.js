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

  // Hero carousel
  const carousel = $("[data-hero-carousel]");
  if (carousel) {
    const slides = $$("[data-hero-slide]", carousel);
    const dots = $$("[data-hero-dot]", carousel);
    const prev = $("[data-hero-prev]", carousel);
    const next = $("[data-hero-next]", carousel);
    const currentEl = $("[data-hero-current]", carousel);
    const autoplayMs = 5000;
    let activeIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-active")));
    let autoplayTimer = null;
    let swipeStartX = 0;
    let swipeStartY = 0;

    const formatIndex = (index) => String(index + 1).padStart(2, "0");

    const setActiveSlide = (index, shouldResetTimer = true) => {
      const nextIndex = (index + slides.length) % slides.length;
      if (nextIndex === activeIndex && shouldResetTimer) {
        restartAutoplay();
        return;
      }

      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === nextIndex;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
        $$("a, button, input, textarea, select, [tabindex]", slide).forEach((control) => {
          control.tabIndex = active ? 0 : -1;
        });
      });

      dots.forEach((dot, dotIndex) => {
        const active = dotIndex === nextIndex;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-selected", String(active));
        dot.tabIndex = active ? 0 : -1;
      });

      activeIndex = nextIndex;
      if (currentEl) currentEl.textContent = formatIndex(activeIndex);
      if (shouldResetTimer) restartAutoplay();
    };

    const showNext = (shouldResetTimer = true) => setActiveSlide(activeIndex + 1, shouldResetTimer);
    const showPrev = (shouldResetTimer = true) => setActiveSlide(activeIndex - 1, shouldResetTimer);

    function stopAutoplay() {
      if (!autoplayTimer) return;
      window.clearTimeout(autoplayTimer);
      autoplayTimer = null;
    }

    function startAutoplay() {
      if (prefersReducedMotion.matches || autoplayTimer) return;
      autoplayTimer = window.setTimeout(() => {
        autoplayTimer = null;
        showNext(false);
        startAutoplay();
      }, autoplayMs);
    }

    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    prev?.addEventListener("click", () => showPrev());
    next?.addEventListener("click", () => showNext());
    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => setActiveSlide(index));
    });

    carousel.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        showNext();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        showPrev();
      }
      if (e.key === "Home") {
        e.preventDefault();
        setActiveSlide(0);
      }
      if (e.key === "End") {
        e.preventDefault();
        setActiveSlide(slides.length - 1);
      }
    });

    carousel.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") return;
      swipeStartX = e.clientX;
      swipeStartY = e.clientY;
    }, { passive: true });

    carousel.addEventListener("pointerup", (e) => {
      if (e.pointerType === "mouse" || !swipeStartX) return;
      const deltaX = e.clientX - swipeStartX;
      const deltaY = Math.abs(e.clientY - swipeStartY);
      swipeStartX = 0;
      swipeStartY = 0;
      if (Math.abs(deltaX) < 44 || deltaY > 70) return;
      if (deltaX < 0) showNext();
      else showPrev();
    }, { passive: true });

    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
    carousel.addEventListener("focusin", stopAutoplay);
    carousel.addEventListener("focusout", (e) => {
      if (carousel.contains(e.relatedTarget)) return;
      startAutoplay();
    });

    setActiveSlide(activeIndex, false);
    startAutoplay();
  }

  // Before/after comparison slider
  $$("[data-before-after]").forEach((comparison) => {
    const range = $("[data-before-after-range]", comparison);
    if (!range) return;

    let isSliding = false;

    const updateComparison = () => {
      const value = Number(range.value);
      const clampedValue = Math.min(100, Math.max(0, value));
      comparison.style.setProperty("--position", `${clampedValue}%`);
      range.setAttribute("aria-valuetext", `${clampedValue}% depois`);
    };

    const updateFromPointer = (clientX) => {
      const rect = comparison.getBoundingClientRect();
      const percent = ((clientX - rect.left) / rect.width) * 100;
      range.value = String(Math.round(Math.min(100, Math.max(0, percent))));
      updateComparison();
    };

    range.addEventListener("input", updateComparison);
    range.addEventListener("change", updateComparison);
    range.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 10 : 2;
      const keys = {
        ArrowLeft: -step,
        ArrowDown: -step,
        ArrowRight: step,
        ArrowUp: step,
        Home: -100,
        End: 100,
      };
      if (!(e.key in keys)) return;
      e.preventDefault();
      const nextValue = e.key === "Home" || e.key === "End"
        ? (e.key === "Home" ? 0 : 100)
        : Number(range.value) + keys[e.key];
      range.value = String(Math.min(100, Math.max(0, nextValue)));
      updateComparison();
    });

    comparison.addEventListener("pointerdown", (e) => {
      if (e.button && e.button !== 0) return;
      isSliding = true;
      comparison.setPointerCapture?.(e.pointerId);
      range.focus({ preventScroll: true });
      updateFromPointer(e.clientX);
      e.preventDefault();
    });
    comparison.addEventListener("pointermove", (e) => {
      if (!isSliding) return;
      updateFromPointer(e.clientX);
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((eventName) => {
      comparison.addEventListener(eventName, () => {
        isSliding = false;
      });
    });

    updateComparison();
  });

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

    $$(".section__head").forEach((head) => {
      mark($(".label-tag", head), "badge", 0);
      mark($("h2", head), "heading", 90);
      mark($(".subtitle", head), "text", 170);
    });

    markAll(".service-grid .service", "card", { stagger: 90 });

    const results = $("#resultados .results-showcase");
    if (results) {
      mark($(".results-showcase__media", results), "media", 0);
      mark($(".results-showcase__content .label-tag", results), "badge", 90);
      mark($(".results-showcase__content h2", results), "heading", 170);
      mark($(".results-showcase__content .subtitle", results), "text", 250);
      markAll(".results-showcase__chips span", "text", { delay: 320, stagger: 60, root: results });
      mark($(".results-showcase__cta", results), "text", 480);
    }

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
