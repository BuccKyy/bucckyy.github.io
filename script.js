(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Shared palette, read from CSS custom properties so every scene
     follows the active theme. */
  var palette = {
    a: '#ffb454',
    b: '#4fd6be',
    c: '#ff6b9d',
    muted: '#8b93a7',
    bg: '#0b0e14'
  };

  function readPalette() {
    var cs = getComputedStyle(root);
    palette.a = cs.getPropertyValue('--accent').trim() || palette.a;
    palette.b = cs.getPropertyValue('--accent2').trim() || palette.b;
    palette.c = cs.getPropertyValue('--accent3').trim() || palette.c;
    palette.muted = cs.getPropertyValue('--ink-muted').trim() || palette.muted;
    palette.bg = cs.getPropertyValue('--bg').trim() || palette.bg;
  }

  /* Hex -> rgba() with an alpha channel. */
  function rgba(color, value) {
    var hex = String(color).trim().replace('#', '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) return color;
    var n = parseInt(hex, 16);
    if (isNaN(n)) return color;
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + value + ')';
  }

  readPalette();

  /* ============ THEME TOGGLE ============ */

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

  /* ============ REVEAL ON SCROLL ============ */

  var reveals = document.querySelectorAll('.reveal');
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

  /* ============ SCROLLSPY ============ */

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

  /* ============ CURSOR SPOTLIGHT ============ */

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

  /* ============================================================
     3D BACKGROUND FIELD
     A fixed, full-viewport canvas behind the whole page: three
     depth tiers of drifting points on a slowly rotating sphere,
     a sparse neural lattice, and large soft glow orbs. The camera
     responds to the pointer and to scrolling. Dimmed toward the
     viewport centre so text stays readable. No library, no extra
     request. Paused while the tab is hidden.
     ============================================================ */
  (function initBackgroundField() {
    var canvas = document.getElementById('bg-field');
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var finePointer = window.matchMedia('(pointer: fine)').matches;
    var w = 0;
    var h = 0;
    var rafId = 0;
    var running = false;
    var last = 0;
    var time = 0;
    var scroll = 0;
    var pointerX = 0;
    var pointerY = 0;
    var rotY = 0.7;
    var rotX = -0.14;
    var sprites = {};

    var TAU = Math.PI * 2;
    var RADIUS = 2.35;
    var golden = Math.PI * (3 - Math.sqrt(5));

    // Dust: a deep shell of faint drifting points.
    var dust = [];
    var DUST = 96;
    for (var i = 0; i < DUST; i++) {
      var dy = 1 - (i / (DUST - 1)) * 2;
      var dr = Math.sqrt(Math.max(0, 1 - dy * dy));
      var dth = i * golden + (i % 3) * 0.19;
      var drad = RADIUS * (0.6 + ((i * 7) % 10) / 10 * 0.4);
      dust.push({
        x: Math.cos(dth) * dr * drad,
        y: dy * drad,
        z: Math.sin(dth) * dr * drad,
        size: 0.6 + ((i * 37) % 11) / 8,
        tone: i % 6 === 0 ? 'a' : (i % 6 === 3 ? 'b' : 'muted')
      });
    }

    // Mesh: a sparse neural lattice between the dust shells.
    var mesh = [];
    var MESH = 26;
    var linkList = [];
    for (var m = 0; m < MESH; m++) {
      var my = 1 - (m / (MESH - 1)) * 2;
      var mr = Math.sqrt(Math.max(0, 1 - my * my));
      var mth = m * golden + 0.5;
      var mrad = RADIUS * 0.86;
      mesh.push({
        x: Math.cos(mth) * mr * mrad,
        y: my * mrad,
        z: Math.sin(mth) * mr * mrad
      });
    }
    for (var a = 0; a < MESH; a++) {
      var ranked = [];
      for (var b = 0; b < MESH; b++) {
        if (a === b) continue;
        var dx = mesh[a].x - mesh[b].x;
        var dyy = mesh[a].y - mesh[b].y;
        var dz = mesh[a].z - mesh[b].z;
        ranked.push({ id: b, d: dx * dx + dyy * dyy + dz * dz });
      }
      ranked.sort(function (p, q) { return p.d - q.d; });
      for (var k = 0; k < 2; k++) {
        if (a < ranked[k].id) linkList.push({ a: a, b: ranked[k].id });
      }
    }

    // Glow orbs: large soft light sources orbiting at their own pace.
    var orbs = [
      { x: -0.85, y: 0.5, z: 0.3, r: 0.3, tone: 'a', sp: 0.55, ph: 0.2 },
      { x: 0.95, y: -0.4, z: 0.2, r: 0.26, tone: 'b', sp: 0.8, ph: 2.1 },
      { x: 0.12, y: 0.9, z: -0.45, r: 0.34, tone: 'c', sp: 0.65, ph: 4.0 },
      { x: -0.55, y: -0.85, z: 0.55, r: 0.24, tone: 'b', sp: 1.05, ph: 1.2 },
      { x: 0.7, y: 0.7, z: 0.65, r: 0.27, tone: 'a', sp: 0.72, ph: 5.2 }
    ];
    orbs.forEach(function (o) {
      var len = Math.sqrt(o.x * o.x + o.y * o.y + o.z * o.z) || 1;
      var t = RADIUS * 0.78 / len;
      o.x *= t;
      o.y *= t;
      o.z *= t;
    });

    // Cached radial-gradient sprites keep the glow orbs cheap.
    function makeSprite(color) {
      var s = document.createElement('canvas');
      s.width = s.height = 256;
      var g = s.getContext('2d');
      if (!g) return s;
      var grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, rgba(color, 0.55));
      grad.addColorStop(0.45, rgba(color, 0.18));
      grad.addColorStop(1, rgba(color, 0));
      g.fillStyle = grad;
      g.fillRect(0, 0, 256, 256);
      return s;
    }

    function buildSprites() {
      sprites = {
        a: makeSprite(palette.a),
        b: makeSprite(palette.b),
        c: makeSprite(palette.c)
      };
    }

    function project(p) {
      var cy = Math.cos(rotY);
      var sy = Math.sin(rotY);
      var x1 = p.x * cy - p.z * sy;
      var z1 = p.x * sy + p.z * cy;
      var cx = Math.cos(rotX);
      var sx = Math.sin(rotX);
      var y1 = p.y * cx - z1 * sx;
      var z2 = p.y * sx + z1 * cx;
      var persp = 1 / (2.25 - z2 * 0.4);
      var scale = Math.max(w, h) * 0.46;
      return {
        x: w * 0.5 + x1 * scale * persp,
        y: h * 0.5 + y1 * scale * persp,
        z: z2
      };
    }

    // Dim toward the viewport centre so text stays readable.
    function shade(x, y) {
      var d = Math.sqrt(
        (x - w * 0.5) * (x - w * 0.5) + (y - h * 0.5) * (y - h * 0.5)
      ) / (Math.sqrt(w * w + h * h) * 0.5);
      return 0.22 + 0.78 * Math.min(1, d * 1.6);
    }

    function draw() {
      if (!w || !h) return;
      ctx.clearRect(0, 0, w, h);

      // Glow orbs first: they read as the deepest light layer.
      orbs.forEach(function (o) {
        var yaw = time * 0.05 * o.sp + o.ph;
        var c = Math.cos(yaw);
        var s = Math.sin(yaw);
        var pt = project({ x: o.x * c - o.z * s, y: o.y, z: o.x * s + o.z * c });
        var rad = o.r * Math.min(w, h) * 1.15;
        if (pt.x < -rad || pt.x > w + rad || pt.y < -rad || pt.y > h + rad) return;
        ctx.globalAlpha = 0.17 * shade(pt.x, pt.y);
        ctx.drawImage(sprites[o.tone], pt.x - rad, pt.y - rad, rad * 2, rad * 2);
      });
      ctx.globalAlpha = 1;

      // Neural lattice.
      var mpts = mesh.map(function (node) { return project(node); });
      linkList.forEach(function (l) {
        var pa = mpts[l.a];
        var pb = mpts[l.b];
        var depth = (pa.z + pb.z) * 0.5;
        var fade = shade((pa.x + pb.x) * 0.5, (pa.y + pb.y) * 0.5);
        ctx.strokeStyle = rgba(palette[l.a % 2 === 0 ? 'b' : 'a'], (0.03 + (depth + 1) * 0.035) * fade);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      });
      mpts.forEach(function (pt, index) {
        var tone = index % 3 === 0 ? 'a' : (index % 3 === 1 ? 'b' : 'c');
        ctx.fillStyle = rgba(palette[tone], (0.1 + (pt.z + 1) * 0.12) * shade(pt.x, pt.y));
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.1, 0, TAU);
        ctx.fill();
      });

      // Dust, painted far to near.
      dust.map(function (node) {
        var pt = project(node);
        pt.tone = node.tone;
        pt.size = node.size;
        return pt;
      }).sort(function (p, q) { return p.z - q.z; }).forEach(function (pt) {
        if (pt.x < -4 || pt.x > w + 4 || pt.y < -4 || pt.y > h + 4) return;
        var base = pt.tone === 'muted'
          ? 0.07 + (pt.z + 1) * 0.1
          : 0.12 + (pt.z + 1) * 0.14;
        ctx.fillStyle = rgba(palette[pt.tone], base * shade(pt.x, pt.y));
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, TAU);
        ctx.fill();
      });
    }

    function update(dt) {
      time += dt;
      var targetY = time * 0.05 + scroll * 0.00013 + pointerX * 0.3;
      var targetX = -0.14 + Math.sin(time * 0.11) * 0.05 + pointerY * 0.15;
      rotY += (targetY - rotY) * 0.05;
      rotX += (targetX - rotX) * 0.05;
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    }

    function frame(now) {
      if (!running) return;
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      update(dt);
      draw();
      rafId = window.requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduceMotion) return;
      running = true;
      last = (window.performance || Date).now();
      rafId = window.requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
    }

    buildSprites();
    if (resize()) {
      if (reduceMotion) {
        rotY = 0.7;
        rotX = -0.14;
        time = 3;
        draw();
      } else {
        start();
      }
      canvas.classList.add('is-ready');
    }

    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(function () {
        if (resize() && !running) draw();
      });
      ro.observe(canvas);
    } else {
      window.addEventListener('resize', function () {
        if (resize() && !running) draw();
      });
    }

    window.addEventListener('resize', function () {
      scroll = window.scrollY;
    });
    window.addEventListener('scroll', function () {
      scroll = window.scrollY;
    }, { passive: true });

    if ('MutationObserver' in window) {
      new MutationObserver(function () {
        readPalette();
        buildSprites();
        if (!running) draw();
      }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else start();
    });

    if (finePointer && !reduceMotion) {
      window.addEventListener('pointermove', function (event) {
        pointerX = event.clientX / window.innerWidth - 0.5;
        pointerY = event.clientY / window.innerHeight - 0.5;
      }, { passive: true });
      window.addEventListener('pointerleave', function () {
        pointerX = 0;
        pointerY = 0;
      });
    }
  })();

  /* ============================================================
     3D SIGNAL FIELD (hero banner)
     A rotating neural constellation drawn on a 2D canvas with a
     hand-rolled perspective projection: nodes, edges, orbit rings,
     a counter-rotating inner shell, a travelling signal ribbon and
     pulses along the links. Paused when off-screen or hidden.
     ============================================================ */
  (function initSignalField() {
    var canvas = document.getElementById('signal-orb');
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var host = canvas.closest ? canvas.closest('.hero__orb') : null;
    var finePointer = window.matchMedia('(pointer: fine)').matches;
    var w = 0;
    var h = 0;
    var baseScale = 0;
    var span = 3.4;
    var kScale = 1;
    var samples = 96;
    var rafId = 0;
    var running = false;
    var onscreen = true;
    var last = 0;
    var time = 0;
    var pointerX = 0;
    var pointerY = 0;
    var rotY = 0.45;
    var rotX = -0.16;
    var shellRotY = -0.6;
    var shellRotX = 0.38;

    var TAU = Math.PI * 2;

    // Fibonacci sphere: an even, non-polar node distribution.
    var nodes = [];
    var COUNT = 56;
    var golden = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < COUNT; i++) {
      var ny = 1 - (i / (COUNT - 1)) * 2;
      var nr = Math.sqrt(Math.max(0, 1 - ny * ny));
      var theta = i * golden;
      nodes.push({
        x: Math.cos(theta) * nr,
        y: ny,
        z: Math.sin(theta) * nr,
        size: 0.7 + ((i * 37) % 11) / 11
      });
    }

    // Link each node to its nearest neighbours.
    var edges = [];
    var seen = {};
    for (var a = 0; a < COUNT; a++) {
      var ranked = [];
      for (var b = 0; b < COUNT; b++) {
        if (a === b) continue;
        var dx = nodes[a].x - nodes[b].x;
        var dyy = nodes[a].y - nodes[b].y;
        var dz = nodes[a].z - nodes[b].z;
        ranked.push({ id: b, d: dx * dx + dyy * dyy + dz * dz });
      }
      ranked.sort(function (p, q) { return p.d - q.d; });
      for (var k = 0; k < 3; k++) {
        var other = ranked[k].id;
        var key = a < other ? a + '-' + other : other + '-' + a;
        if (seen[key]) continue;
        seen[key] = true;
        edges.push({ a: a, b: other, tone: (a + other) % 3 });
      }
    }

    // Inner shell: a smaller lattice counter-rotating inside the core.
    var shell = [];
    var SHELL = 14;
    for (var sh = 0; sh < SHELL; sh++) {
      var shy = 1 - (sh / (SHELL - 1)) * 2;
      var shr = Math.sqrt(Math.max(0, 1 - shy * shy));
      var sTheta = sh * golden + 0.45;
      shell.push({
        x: Math.cos(sTheta) * shr * 0.48,
        y: shy * 0.48,
        z: Math.sin(sTheta) * shr * 0.48
      });
    }

    // Orbit rings around the core: one equatorial, one meridional.
    var ring = [];
    var ring2 = [];
    for (var r = 0; r < 84; r++) {
      var ang = (r / 84) * TAU;
      ring.push({
        x: Math.cos(ang) * 1.16,
        y: Math.sin(ang * 2) * 0.06,
        z: Math.sin(ang) * 1.16
      });
      ring2.push({
        x: Math.sin(ang) * 0.05,
        y: Math.cos(ang) * 1.16,
        z: Math.sin(ang) * 1.16
      });
    }

    // Pulses travelling along the links.
    var pulses = [];
    for (var p = 0; p < 8; p++) {
      pulses.push({
        edge: edges[(p * 11) % edges.length],
        t: p / 8,
        speed: 0.08 + ((p * 17) % 7) / 45,
        tone: p % 3
      });
    }

    function project(x, y, z) {
      var cy = Math.cos(rotY);
      var sy = Math.sin(rotY);
      var x1 = x * cy - z * sy;
      var z1 = x * sy + z * cy;
      var cx = Math.cos(rotX);
      var sx = Math.sin(rotX);
      var y1 = y * cx - z1 * sx;
      var z2 = y * sx + z1 * cx;
      var persp = 1 / (1.85 - z2 * 0.55);
      return {
        x: w * 0.5 + x1 * baseScale * persp,
        y: h * 0.44 + y1 * baseScale * persp,
        z: z2
      };
    }

    // The inner shell turns the other way, so the core reads as a
    // gyroscope rather than a flat point cloud.
    function projectShell(x, y, z) {
      var cy = Math.cos(shellRotY);
      var sy = Math.sin(shellRotY);
      var x1 = x * cy - z * sy;
      var z1 = x * sy + z * cy;
      var cx = Math.cos(shellRotX);
      var sx = Math.sin(shellRotX);
      var y1 = y * cx - z1 * sx;
      var z2 = y * sx + z1 * cx;
      var persp = 1 / (1.85 - z2 * 0.55);
      return {
        x: w * 0.5 + x1 * baseScale * persp,
        y: h * 0.44 + y1 * baseScale * persp,
        z: z2
      };
    }

    // The signal ribbon keeps its own gentle orientation so it never
    // collapses edge-on while the core rotates.
    function projectRibbon(x, y, z) {
      var yaw = Math.sin(time * 0.32) * 0.14;
      var pitch = -0.2 + Math.sin(time * 0.24) * 0.05;
      var cy = Math.cos(yaw);
      var sy = Math.sin(yaw);
      var x1 = x * cy - z * sy;
      var z1 = x * sy + z * cy;
      var cx = Math.cos(pitch);
      var sx = Math.sin(pitch);
      var y1 = y * cx - z1 * sx;
      var z2 = y * sx + z1 * cx;
      var persp = 1 / (1.9 - z2 * 0.5);
      return {
        x: w * 0.5 + x1 * baseScale * persp,
        y: h * 0.46 + y1 * baseScale * persp,
        z: z2
      };
    }

    // A pulse of signal travels along the ribbon, bump first.
    function pulseHead(phase) {
      var progress = (phase * (1.05 / 6.8)) % 1;
      return -span + progress * 2 * span;
    }

    function wavePoint(t, phase) {
      var x = -span + t * 2 * span;
      var u = t * 2 - 1;
      var env = 0.45 + 0.55 * Math.sin(Math.PI * t);
      var y = Math.sin(u * Math.PI * 1.25 + phase * 1.5) * 0.17 * env
            + Math.sin(u * Math.PI * 3.4 - phase * 2.1) * 0.022;
      var z = Math.cos(u * Math.PI * 0.8 + phase * 0.6) * 0.55;
      var k = span / 3.4;
      var d = x - pulseHead(phase);
      y += Math.exp(-(d * d * 30) / k) * 0.42
         - Math.exp(-Math.pow(d - 0.24 * k, 2) * 90 / k) * 0.17;
      return projectRibbon(x, y, z);
    }

    function draw() {
      if (!w || !h) return;
      ctx.clearRect(0, 0, w, h);

      var cx = w * 0.5;
      var cy = h * 0.44;

      var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseScale * 1.35);
      glow.addColorStop(0, rgba(palette.b, 0.15));
      glow.addColorStop(0.5, rgba(palette.b, 0.045));
      glow.addColorStop(1, rgba(palette.b, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Instrument reticle around the core.
      ctx.save();
      ctx.setLineDash([2, 6]);
      ctx.strokeStyle = rgba(palette.muted, 0.22);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, baseScale * 0.87, 0, TAU);
      ctx.stroke();
      ctx.restore();

      // Orbit rings.
      [ring, ring2].forEach(function (points, index) {
        ctx.beginPath();
        for (var i = 0; i < points.length; i++) {
          var rp = project(points[i].x, points[i].y, points[i].z);
          if (i === 0) ctx.moveTo(rp.x, rp.y);
          else ctx.lineTo(rp.x, rp.y);
        }
        ctx.closePath();
        ctx.strokeStyle = rgba(index === 0 ? palette.c : palette.b, index === 0 ? 0.3 : 0.16);
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      var drawn = edges.map(function (edge) {
        var na = nodes[edge.a];
        var nb = nodes[edge.b];
        var pa = project(na.x, na.y, na.z);
        var pb = project(nb.x, nb.y, nb.z);
        edge.pa = pa;
        edge.pb = pb;
        return { edge: edge, depth: (pa.z + pb.z) * 0.5 };
      }).sort(function (p, q) { return p.depth - q.depth; });

      drawn.forEach(function (item) {
        var tone = item.edge.tone === 0 ? palette.a : (item.edge.tone === 1 ? palette.b : palette.c);
        ctx.strokeStyle = rgba(tone, 0.06 + (item.depth + 1) * 0.07);
        ctx.lineWidth = 0.9 * kScale;
        ctx.beginPath();
        ctx.moveTo(item.edge.pa.x, item.edge.pa.y);
        ctx.lineTo(item.edge.pb.x, item.edge.pb.y);
        ctx.stroke();
      });

      // Inner shell, counter-rotating inside the core.
      var shellPoints = shell.map(function (node) {
        return projectShell(node.x, node.y, node.z);
      });
      ctx.strokeStyle = rgba(palette.b, 0.42);
      ctx.lineWidth = 0.9 * kScale;
      ctx.beginPath();
      for (var sp = 0; sp < shellPoints.length; sp++) {
        var next = shellPoints[(sp + 1) % shellPoints.length];
        ctx.moveTo(shellPoints[sp].x, shellPoints[sp].y);
        ctx.lineTo(next.x, next.y);
      }
      ctx.stroke();
      shellPoints.forEach(function (pt) {
        ctx.fillStyle = rgba(palette.a, 0.55);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.5 * kScale, 0, TAU);
        ctx.fill();
      });

      nodes.map(function (node) {
        var pt = project(node.x, node.y, node.z);
        pt.size = (0.9 + node.size * 1.2 + pt.z * 0.4) * kScale;
        return pt;
      }).sort(function (p, q) { return p.z - q.z; }).forEach(function (pt) {
        var tone = pt.z > 0.3 ? palette.a : (pt.z < -0.3 ? palette.c : palette.b);
        ctx.fillStyle = rgba(tone, 0.32 + (pt.z + 1) * 0.28);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, TAU);
        ctx.fill();
      });

      // Signal ribbon crossing the core.
      var grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, rgba(palette.a, 0.15));
      grad.addColorStop(0.22, rgba(palette.a, 0.9));
      grad.addColorStop(0.5, rgba(palette.b, 0.95));
      grad.addColorStop(0.78, rgba(palette.c, 0.9));
      grad.addColorStop(1, rgba(palette.c, 0.15));
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.8 * kScale;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowColor = rgba(palette.b, 0.5);
      ctx.shadowBlur = 12;
      ctx.beginPath();
      for (var s = 0; s <= samples; s++) {
        var wp = wavePoint(s / samples, time);
        if (s === 0) ctx.moveTo(wp.x, wp.y);
        else ctx.lineTo(wp.x, wp.y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Head of the travelling signal pulse.
      var head = wavePoint(((pulseHead(time) + span) / (2 * span)), time);
      ctx.fillStyle = rgba(palette.b, 0.95);
      ctx.shadowColor = rgba(palette.b, 0.9);
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 2.2 * kScale, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Travelling pulses along the links.
      pulses.forEach(function (pl) {
        var edge = pl.edge;
        if (!edge.pa) return;
        var px = edge.pa.x + (edge.pb.x - edge.pa.x) * pl.t;
        var py = edge.pa.y + (edge.pb.y - edge.pa.y) * pl.t;
        var tone = pl.tone === 0 ? palette.a : (pl.tone === 1 ? palette.b : palette.c);
        ctx.fillStyle = rgba(tone, 0.95);
        ctx.shadowColor = rgba(tone, 0.75);
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ctx.arc(px, py, 1.8 * kScale, 0, TAU);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    }

    function update(dt) {
      time += dt;
      var autoY = 0.45 + time * 0.16;
      var autoX = -0.16 + Math.sin(time * 0.22) * 0.05;
      if (finePointer) {
        autoY += pointerX * 0.9;
        autoX += pointerY * 0.42;
      }
      rotY += (autoY - rotY) * 0.08;
      rotX += (autoX - rotX) * 0.08;
      shellRotY = -0.6 - time * 0.27;
      shellRotX = 0.38 + Math.sin(time * 0.31) * 0.16;
      pulses.forEach(function (pl) {
        pl.t += pl.speed * dt;
        if (pl.t > 1) {
          pl.t = 0;
          pl.edge = edges[Math.floor(Math.random() * edges.length)];
        }
      });
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      baseScale = Math.min(h * 0.46, w * 0.22);
      span = (w * 0.5) / (baseScale * 0.53) * 0.94;
      kScale = Math.max(1, Math.sqrt(baseScale / 77));
      samples = Math.max(72, Math.min(150, Math.round(w / 7)));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    }

    function frame(now) {
      if (!running) return;
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      update(dt);
      draw();
      rafId = window.requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduceMotion) return;
      running = true;
      last = (window.performance || Date).now();
      rafId = window.requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
    }

    if (resize()) {
      if (reduceMotion) {
        rotY = 0.55;
        rotX = -0.12;
        shellRotY = -0.9;
        shellRotX = 0.42;
        time = 1.2;
        draw();
      } else {
        start();
      }
      if (host) host.classList.add('is-ready');
    }

    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(function () {
        if (resize() && !running) draw();
      });
      ro.observe(canvas);
    } else {
      window.addEventListener('resize', function () {
        if (resize() && !running) draw();
      });
    }

    if ('MutationObserver' in window) {
      new MutationObserver(function () {
        readPalette();
        if (!running) draw();
      }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        onscreen = entries[0].isIntersecting;
        if (onscreen) start();
        else stop();
      }, { threshold: 0.02 }).observe(canvas);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else if (onscreen) start();
    });

    if (finePointer && !reduceMotion) {
      canvas.addEventListener('pointermove', function (event) {
        var rect = canvas.getBoundingClientRect();
        pointerX = (event.clientX - rect.left) / rect.width - 0.5;
        pointerY = (event.clientY - rect.top) / rect.height - 0.5;
      }, { passive: true });
      canvas.addEventListener('pointerleave', function () {
        pointerX = 0;
        pointerY = 0;
      });
    }
  })();

  /* ============ 3D TILT ON CARDS ============ */

  // Subtle 3D tilt for cards on pointer devices.
  if (window.matchMedia('(pointer: fine)').matches && !reduceMotion) {
    var tiltCards = document.querySelectorAll('.case, .capability, .repo');
    Array.prototype.forEach.call(tiltCards, function (card) {
      var pending = 0;
      card.addEventListener('pointermove', function (event) {
        var x = event.clientX;
        var y = event.clientY;
        if (pending) return;
        pending = window.requestAnimationFrame(function () {
          pending = 0;
          var rect = card.getBoundingClientRect();
          var px = (x - rect.left) / rect.width - 0.5;
          var py = (y - rect.top) / rect.height - 0.5;
          card.style.setProperty('--rx', (-py * 3.2).toFixed(2) + 'deg');
          card.style.setProperty('--ry', (px * 3.2).toFixed(2) + 'deg');
        });
      }, { passive: true });
      card.addEventListener('pointerleave', function () {
        card.style.removeProperty('--rx');
        card.style.removeProperty('--ry');
      });
    });
  }
})();
