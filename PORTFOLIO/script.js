/* =========================================================
   Shared JavaScript – runs on every page
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  /* ---------- Safe localStorage helpers ---------- */
  function store(key, value) {
    try { if (value === undefined) return localStorage.getItem(key); localStorage.setItem(key, value); } catch (e) { return null; }
  }

  /* ---------- 1. Theme toggle (saved in localStorage) ---------- */
  var themeBtn = document.getElementById("theme-toggle");
  function currentTheme() {
    return root.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (themeBtn) {
      themeBtn.innerHTML = theme === "dark" ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
      themeBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }
  }
  applyTheme(currentTheme());
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      applyTheme(next);
      store("theme", next);
    });
  }

  /* ---------- 2. Mobile menu ---------- */
  var menuBtn = document.getElementById("menu-btn");
  var navLinks = document.getElementById("nav-links");
  function setMenu(open) {
    navLinks.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menuBtn.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
  }
  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", function () { setMenu(!navLinks.classList.contains("open")); });
    navLinks.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 820) setMenu(false); });
  }

  /* ---------- 3. Navbar style + back-to-top on scroll ---------- */
  var navbar = document.getElementById("navbar");
  var toTop = document.getElementById("to-top");
  function onScroll() {
    var y = window.scrollY;
    if (navbar) navbar.classList.toggle("scrolled", y > 20);
    if (toTop) toTop.classList.toggle("show", y > 500);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  function scrollTop(e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }
  if (toTop) toTop.addEventListener("click", scrollTop);
  var toTopLink = document.getElementById("to-top-link");
  if (toTopLink) toTopLink.addEventListener("click", scrollTop);

  /* ---------- 4. Footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- 5. Scroll reveal + animated skill bars ---------- */
  var reveals = document.querySelectorAll(".reveal");
  var bars = document.querySelectorAll(".bar-fill");

  function fillBars() {
    bars.forEach(function (b) { b.style.width = b.getAttribute("data-level") + "%"; });
  }

  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        if (entry.target.querySelector(".bar-fill")) fillBars();
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 80 + "ms";
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add("visible"); });
    fillBars();
  }

  /* ---------- 6. Typing effect (home page) ---------- */
  var typing = document.getElementById("typing");
  if (typing) {
    var words = ["Web Developer", "UI Designer", "Problem Solver", "Accessibility Advocate"];
    if (reduceMotion) {
      typing.textContent = words[0] + " & Designer";
    } else {
      var w = 0, c = 0, deleting = false;
      (function tick() {
        var word = words[w];
        typing.textContent = word.slice(0, c);
        var delay = deleting ? 45 : 95;
        if (!deleting && c === word.length) { deleting = true; delay = 1500; }
        else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 400; }
        else { c += deleting ? -1 : 1; }
        setTimeout(tick, delay);
      })();
    }
  }

  /* ---------- 7. Accordion (contact page) ---------- */
  document.querySelectorAll(".acc-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      panel.classList.toggle("open", !open);
    });
  });

  /* ---------- 8. Contact form validation ---------- */
  var form = document.getElementById("contact-form");
  if (form) {
    var rules = {
      name: function (v) { return v.trim().length >= 2 ? "" : "Enter your name (at least 2 characters)."; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Enter a valid email, like name@example.com."; },
      subject: function (v) { return v.trim().length >= 3 ? "" : "Add a subject (at least 3 characters)."; },
      message: function (v) { return v.trim().length >= 10 ? "" : "Write a message of at least 10 characters."; }
    };
    var success = document.getElementById("form-success");

    function validate(field) {
      var input = form.elements[field];
      var msg = rules[field](input.value);
      var wrap = input.closest(".field");
      wrap.classList.toggle("invalid", !!msg);
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      document.getElementById(field + "-err").textContent = msg;
      return !msg;
    }

    Object.keys(rules).forEach(function (field) {
      form.elements[field].addEventListener("blur", function () { validate(field); });
      form.elements[field].addEventListener("input", function () {
        if (form.elements[field].closest(".field").classList.contains("invalid")) validate(field);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      success.hidden = true;
      var firstInvalid = null;
      Object.keys(rules).forEach(function (field) {
        if (!validate(field) && !firstInvalid) firstInvalid = form.elements[field];
      });
      if (firstInvalid) { firstInvalid.focus(); return; }
      // Replace this with a real fetch() to your form backend (Formspree, Netlify, etc.)
      form.reset();
      success.hidden = false;
    });
  }
})();
