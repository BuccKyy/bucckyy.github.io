(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============ TELEMETRY TOAST ============ */
  var toastEl = document.getElementById("telemetry-toast");
  var toastTimer = 0;

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.removeAttribute("hidden");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.setAttribute("hidden", "");
    }, 3200);
  }

  /* ============ THEME TOGGLE ============ */
  var themeToggle = document.getElementById("theme-toggle");

  function saveTheme(theme) {
    try {
      localStorage.setItem("theme", theme);
    } catch (err) {}
  }

  function syncThemeButton() {
    if (!themeToggle) return;
    var isDark = root.getAttribute("data-theme") === "dark";
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
    var label = themeToggle.querySelector(".theme-toggle__label");
    if (label) label.textContent = isDark ? "light" : "dark";
    var meta = document.querySelector("meta[name='theme-color']");
    if (meta) meta.setAttribute("content", isDark ? "#0b0e14" : "#f6f3ec");
  }

  function toggleTheme() {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    saveTheme(next);
    syncThemeButton();
    showToast("✓ THEME SWITCHED // " + next.toUpperCase() + " MODE");
  }

  if (themeToggle) {
    syncThemeButton();
    themeToggle.addEventListener("click", toggleTheme);
  }

  /* ============ COPY EMAIL BUTTON ============ */
  var copyEmailBtn = document.getElementById("copy-email-btn");

  function copyEmailToClipboard() {
    var email = "trantrungduc313@gmail.com";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(function () {
        showToast("✓ COPIED TO CLIPBOARD // " + email);
      }).catch(function () {
        showToast("✓ EMAIL // " + email);
      });
    } else {
      showToast("✓ EMAIL // " + email);
    }
  }

  if (copyEmailBtn) {
    copyEmailBtn.addEventListener("click", copyEmailToClipboard);
  }

  /* ============ LIVE CLOCK (HO CHI MINH CITY) ============ */
  (function initClock() {
    var el = document.getElementById("clock");
    if (!el || typeof Intl === "undefined" || !Intl.DateTimeFormat) return;
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Ho_Chi_Minh",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
    } catch (err) {
      return;
    }
    var timer = 0;
    function tick() { el.textContent = fmt.format(new Date()); }
    function start() {
      if (timer) return;
      tick();
      timer = window.setInterval(tick, 1000);
    }
    function stop() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = 0;
    }
    start();
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });
  })();

  /* ============ REVEAL ON SCROLL ============ */
  var reveals = document.querySelectorAll(".reveal");
  reveals.forEach(function (el) { el.classList.add("visible"); });

  /* ============ SCROLLSPY & PROGRESS ============ */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));
  var sections = navLinks.map(function (link) {
    var id = link.getAttribute("href").slice(1);
    return document.getElementById(id);
  }).filter(Boolean);
  var progressBar = document.querySelector(".topnav__progress");

  function onScroll() {
    var scrollY = window.pageYOffset || document.documentElement.scrollTop;
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar && maxScroll > 0) {
      var pct = Math.min(100, Math.max(0, (scrollY / maxScroll) * 100));
      progressBar.style.width = pct + "%";
    }

    var current = "";
    for (var i = 0; i < sections.length; i++) {
      var top = sections[i].offsetTop - 130;
      if (scrollY >= top) {
        current = sections[i].id;
      }
    }
    if (maxScroll > 0 && scrollY >= maxScroll - 32 && sections.length > 0) {
      current = sections[sections.length - 1].id;
    }
    navLinks.forEach(function (link) {
      var active = link.getAttribute("href") === "#" + current;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();



  /* ============ CASE STUDY PIPELINE TRACE INSPECTOR ============ */
  (function initCaseInspectors() {
    var cases = document.querySelectorAll(".case");
    cases.forEach(function (card) {
      var tabs = Array.prototype.slice.call(card.querySelectorAll(".pipeline-tab"));
      var panes = Array.prototype.slice.call(card.querySelectorAll(".case__code"));
      var stageLabel = card.querySelector("[data-stage-label]");
      if (!tabs.length || !panes.length) return;

      var uid = "case-" + Math.random().toString(36).slice(2, 7);
      tabs.forEach(function (tab, i) {
        var stage = tab.getAttribute("data-stage");
        var pane = panes.filter(function (p) { return p.getAttribute("data-pane") === stage; })[0];
        tab.id = uid + "-tab-" + i;
        if (pane) {
          pane.id = uid + "-pane-" + i;
          pane.setAttribute("role", "tabpanel");
          pane.setAttribute("aria-labelledby", tab.id);
          tab.setAttribute("aria-controls", pane.id);
        }
      });

      tabs.forEach(function (tab) { tab.tabIndex = tab.classList.contains("active") ? 0 : -1; });

      function activateStage(stage) {
        tabs.forEach(function (tab) {
          var active = tab.getAttribute("data-stage") === stage;
          tab.classList.toggle("active", active);
          tab.classList.toggle("is-active", active);
          tab.setAttribute("aria-selected", String(active));
          tab.tabIndex = active ? 0 : -1;
          if (active && stageLabel && tab.getAttribute("data-label")) {
            stageLabel.textContent = tab.getAttribute("data-label");
          }
        });
        panes.forEach(function (pane) {
          var active = pane.getAttribute("data-pane") === stage;
          pane.classList.toggle("is-active", active);
        });
      }

      tabs.forEach(function (tab, idx) {
        tab.addEventListener("click", function () {
          activateStage(tab.getAttribute("data-stage"));
        });
        tab.addEventListener("keydown", function (evt) {
          if (evt.key === "ArrowRight" || evt.key === "ArrowLeft") {
            evt.preventDefault();
            var dir = evt.key === "ArrowRight" ? 1 : -1;
            var nextIdx = (idx + dir + tabs.length) % tabs.length;
            tabs[nextIdx].focus();
            activateStage(tabs[nextIdx].getAttribute("data-stage"));
          }
        });
      });
    });
  })();

  /* ============ OPEN SOURCE REPOSITORY DOMAIN FILTER ============ */
  (function initRepoFilters() {
    var filterBtns = Array.prototype.slice.call(document.querySelectorAll(".repo-filter"));
    var repoCards = Array.prototype.slice.call(document.querySelectorAll(".repos .repo"));
    if (!filterBtns.length || !repoCards.length) return;

    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var filter = btn.getAttribute("data-filter");
        filterBtns.forEach(function (b) {
          var active = (b === btn);
          b.classList.toggle("active", active);
          b.classList.toggle("is-active", active);
        });
        repoCards.forEach(function (card) {
          if (card.classList.contains("repo--more") || filter === "all") {
            card.removeAttribute("hidden");
          } else {
            var domain = card.getAttribute("data-domain");
            if (domain === filter) card.removeAttribute("hidden");
            else card.setAttribute("hidden", "");
          }
        });
      });
    });
  })();

  /* ============ QUICK COMMAND PALETTE (⌘K / /) ============ */
  (function initCommandPalette() {
    var palette = document.getElementById("cmd-palette");
    var openBtn = document.getElementById("cmd-open-btn");
    var closeBtn = document.getElementById("cmd-close-btn");
    var input = document.getElementById("cmd-input");
    var items = Array.prototype.slice.call(document.querySelectorAll(".cmd-item"));
    var page = document.querySelector(".layout");
    if (!palette || !input) return;
    var lastFocus = null;

    function visibleItems() {
      return items.filter(function (it) { return !it.hasAttribute("hidden"); });
    }

    function openPalette() {
      lastFocus = document.activeElement;
      palette.removeAttribute("hidden");
      if (page) page.inert = true;
      input.value = "";
      items.forEach(function (it) { it.removeAttribute("hidden"); });
      window.setTimeout(function () { input.focus(); }, 20);
    }

    function closePalette() {
      palette.setAttribute("hidden", "");
      if (page) page.inert = false;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function run(it) {
      var cmd = it.getAttribute("data-cmd");
      closePalette();
      var cases = document.querySelectorAll(".case");
      var m = /^goto-cs0([1-4])$/.exec(cmd || "");
      if (m && cases[m[1] - 1]) cases[m[1] - 1].scrollIntoView({ behavior: "smooth", block: "center" });
      else if (cmd === "copy-email") copyEmailToClipboard();
    }

    if (openBtn) openBtn.addEventListener("click", openPalette);
    if (closeBtn) closeBtn.addEventListener("click", closePalette);

    palette.addEventListener("click", function (evt) {
      if (evt.target === palette) closePalette();
    });

    document.addEventListener("keydown", function (evt) {
      var tag = (evt.target && evt.target.tagName) ? evt.target.tagName.toLowerCase() : "";
      var isInput = (tag === "input" || tag === "textarea");
      var isOpen = !palette.hasAttribute("hidden");
      if ((evt.metaKey || evt.ctrlKey) && evt.key.toLowerCase() === "k") {
        evt.preventDefault();
        if (isOpen) closePalette(); else openPalette();
      } else if (evt.key === "/" && !isInput && !isOpen) {
        evt.preventDefault();
        openPalette();
      } else if (isOpen && evt.key === "Escape") {
        evt.preventDefault();
        closePalette();
      } else if (isOpen && (evt.key === "ArrowDown" || evt.key === "ArrowUp")) {
        evt.preventDefault();
        var vis = visibleItems();
        if (!vis.length) return;
        var i = vis.indexOf(document.activeElement);
        i = evt.key === "ArrowDown" ? (i + 1) % vis.length : (i <= 0 ? vis.length - 1 : i - 1);
        vis[i].focus();
      } else if (isOpen && evt.key === "Enter" && document.activeElement === input) {
        var first = visibleItems()[0];
        if (first) { evt.preventDefault(); run(first); }
      } else if (isOpen && evt.key === "Tab") {
        // keep focus inside the dialog
        var focusables = Array.prototype.slice.call(palette.querySelectorAll("button, input")).filter(function (el) {
          return !el.disabled && el.tabIndex >= 0 && el.getClientRects().length > 0 && !el.closest("[hidden]");
        });
        if (!focusables.length) return;
        var idx = focusables.indexOf(document.activeElement);
        if (evt.shiftKey && idx <= 0) { evt.preventDefault(); focusables[focusables.length - 1].focus(); }
        else if (!evt.shiftKey && idx === focusables.length - 1) { evt.preventDefault(); focusables[0].focus(); }
      }
    });

    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      items.forEach(function (it) {
        var text = it.textContent.toLowerCase();
        if (!q || text.indexOf(q) !== -1) it.removeAttribute("hidden");
        else it.setAttribute("hidden", "");
      });
    });

    items.forEach(function (it) {
      it.addEventListener("click", function () { run(it); });
    });
  })();

})();
