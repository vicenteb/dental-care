/* Dental Care landing — lightweight JS for menu, FAQ behavior, form validation and tracking.
   Keeps CWV in mind: defer script, minimal DOM work, no heavy libs. */

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // Year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

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
