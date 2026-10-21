(function () {
  'use strict';

  var root = document.documentElement;
  var themeToggle = document.getElementById('theme-toggle');

  function saveTheme(theme) {
    try {
      localStorage.setItem('theme', theme);
    } catch (err) {
      // Storage can be unavailable in private or sandboxed contexts.
    }
  }

  function syncThemeButton() {
    if (!themeToggle) return;
    var isDark = root.getAttribute('data-theme') === 'dark';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#0b0e14' : '#f6f3ec');
  }

  if (themeToggle) {
    syncThemeButton();
    themeToggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      saveTheme(next);
      syncThemeButton();
    });
  }

  var reveals = document.querySelectorAll('.reveal');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var supportsIO = 'IntersectionObserver' in window;

  if (supportsIO && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('visible'); });
  }

  // Highlight the section currently in view. A scroll-position calculation
  // is more reliable than a center-band observer for short final sections.
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
  var sections = links.map(function (link) {
    return document.getElementById(link.getAttribute('href').slice(1));
  }).filter(Boolean);

  function setActive(id) {
    links.forEach(function (link) {
      var active = link.getAttribute('href') === '#' + id;
      link.classList.toggle('active', active);
      if (active) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function updateActiveSection() {
    if (!sections.length) return;
    var target = window.scrollY + window.innerHeight * 0.33;
    var current = sections[0].id;

    sections.forEach(function (section) {
      if (section.getBoundingClientRect().top + window.scrollY <= target) {
        current = section.id;
      }
    });

    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      current = sections[sections.length - 1].id;
    }

    setActive(current);
  }

  var navTicking = false;
  var navRaf = window.requestAnimationFrame || function (fn) { fn(); };

  function onNavScroll() {
    if (navTicking) return;
    navTicking = true;
    navRaf(function () {
      updateActiveSection();
      navTicking = false;
    });
  }

  window.addEventListener('scroll', onNavScroll, { passive: true });
  window.addEventListener('resize', onNavScroll);
  updateActiveSection();

  // Cursor spotlight, skipped on touch devices and for reduced motion.
  // Reads are batched into a single animation frame to avoid layout churn.
  if (window.matchMedia('(pointer: fine)').matches && !reduceMotion) {
    var spot = document.querySelector('.spotlight');
    if (spot) {
      var pending = false;
      var mx = 0;
      var my = 0;
      var raf = window.requestAnimationFrame || function (fn) { fn(); };

      document.addEventListener('mousemove', function (event) {
        mx = event.clientX;
        my = event.clientY;
        if (pending) return;
        pending = true;
        raf(function () {
          spot.style.setProperty('--mx', mx + 'px');
          spot.style.setProperty('--my', my + 'px');
          pending = false;
        });
      }, { passive: true });
    }
  }
})();
