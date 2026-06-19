(() => {
  const qs  = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];

  /* ================================================
     ANO NO FOOTER
  ================================================ */
  const yearEl = qs("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ================================================
     MENU MOBILE
  ================================================ */
  const toggle = qs(".nav__toggle");
  const menu   = qs("#menu");

  const setMenuOpen = (open) => {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", String(open));
    menu.style.display = open ? "block" : "";
    requestAnimationFrame(() => menu.classList.toggle("open", open));
  };

  if (toggle && menu) {
    // Abre / fecha ao clicar no botão
    toggle.addEventListener("click", () => {
      setMenuOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    // Fecha ao clicar em um link (mobile)
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a") && window.matchMedia("(max-width:899px)").matches)
        setMenuOpen(false);
    });

    // Fecha com ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    });

    // Fecha ao clicar fora
    document.addEventListener("click", (e) => {
      if (!window.matchMedia("(max-width:899px)").matches) return;
      if (!menu.contains(e.target) && !toggle.contains(e.target))
        setMenuOpen(false);
    });
  }

  /* ================================================
     SMOOTH SCROLL COM OFFSET DO HEADER
  ================================================ */
  const header  = qs(".header");
  const headerH = () => header ? header.getBoundingClientRect().height : 0;

  const scrollTo = (hash) => {
    if (!hash || hash === "#") return;
    const target = qs(hash);
    if (!target) return;
    const y = window.scrollY + target.getBoundingClientRect().top - (headerH() + 16);
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  // Intercepta todos os links de âncora
  qsa('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href   = a.getAttribute("href");
      const target = qs(href);
      if (!target) return;
      e.preventDefault();
      history.pushState(null, "", href);
      scrollTo(href);
    });
  });

  // Rola corretamente ao carregar a página com #hash
  window.addEventListener("load", () => {
    if (location.hash) scrollTo(location.hash);
  });

  /* ================================================
     HEADER INTELIGENTE — shrink + hide ao rolar
  ================================================ */
  let lastY   = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y        = window.scrollY;
    const goingDown = y > lastY + 4;
    const menuOpen  = toggle?.getAttribute("aria-expanded") === "true";

    if (header) {
      header.classList.toggle("is-scrolled", y > 8);
      header.classList.toggle("is-hidden", goingDown && y > 200 && !menuOpen);
    }

    lastY   = y;
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  /* ================================================
     REVEAL ON SCROLL — IntersectionObserver
  ================================================ */
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealEls    = qsa("[data-reveal]");

  if (!reduceMotion && "IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    revealEls.forEach((el) => io.observe(el));
  } else {
    // Sem animação para quem prefere movimento reduzido
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* ================================================
     BRILHO QUE SEGUE O CURSOR — botões primários
  ================================================ */
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (canHover) {
    qsa(".btn--primary").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty("--mx", `${((e.clientX - r.left) / r.width)  * 100}%`);
        btn.style.setProperty("--my", `${((e.clientY - r.top)  / r.height) * 100}%`);
      });
    });
  }

  /* ================================================
     VALIDAÇÃO DO FORMULÁRIO
  ================================================ */
  const form = qs("#leadForm");
  if (form) {
    const showError = (input, msg) => {
      input.classList.add("is-error");
      const err = input.parentElement.querySelector(".error");
      if (err) err.textContent = msg;
    };

    const clearError = (input) => {
      input.classList.remove("is-error");
      const err = input.parentElement.querySelector(".error");
      if (err) err.textContent = "";
    };

    // Limpa erro ao digitar
    qsa("input", form).forEach((input) => {
      input.addEventListener("input", () => clearError(input));
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;

      const nome     = qs("#nome",     form);
      const email    = qs("#email",    form);
      const whatsapp = qs("#whatsapp", form);

      if (!nome.value.trim()) {
        showError(nome, "Informe seu nome.");
        valid = false;
      }
      if (!email.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        showError(email, "E-mail inválido.");
        valid = false;
      }
      if (!whatsapp.value.replace(/\D/g, "").match(/^\d{10,11}$/)) {
        showError(whatsapp, "WhatsApp inválido.");
        valid = false;
      }

      if (!valid) return;

      // Estado de carregamento
      const btn = form.querySelector("[type=submit]");
      btn.textContent = "Enviando…";
      btn.disabled    = true;

      // Simula envio — substitua pelo seu endpoint real
      setTimeout(() => {
        const success = form.querySelector(".form__success");
        if (success) success.hidden = false;
        form.reset();
        btn.textContent = "Quero agendar online";
        btn.disabled    = false;
      }, 1400);
    });
  }
})();
