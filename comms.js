// Hero "Comms Link": a cockpit radar of the five projects plus a question console.
// Each question types its answer out, counts up the matching numbers, and locks the
// radar onto the related project. All figures mirror what the case studies already claim.
(function () {
  var logEl = document.getElementById("comms-log");
  var canvas = document.getElementById("comms-radar");
  if (!logEl || !canvas) return;

  var chipsEl = document.getElementById("comms-chips");
  var statsEl = document.getElementById("comms-stats");
  var voiceEl = document.getElementById("comms-voice");
  var labelEl = document.getElementById("comms-radar-label");
  var syncEl = document.getElementById("comms-sync");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // angle in radians from 12 o'clock, r = fraction of radar radius
  var CONTACTS = [
    { tag: "BAY-01", name: "SALES AUTOMATION", ang: 0.55, r: 0.66, qa: "result" },
    { tag: "BAY-02", name: "INVENTORY SOLVER", ang: 1.75, r: 0.62, qa: "inventory" },
    { tag: "BAY-03", name: "ERP RECEIPTS", ang: 3.05, r: 0.5, qa: "trust" },
    { tag: "BAY-04", name: "AGENT OPS", ang: 4.15, r: 0.74, qa: "ops" },
    { tag: "LAB", name: "BIOMEDICAL DSP", ang: 5.3, r: 0.58, qa: "signal" },
  ];

  // stats: [label, number, suffix, decimals] or [label, "text"]
  var QA = {
    build: {
      chip: "What do you build?", focus: -1,
      a: "Multi-agent workflows that run real operations: B2B sales, inventory, ERP receipts, event and HR flows. Python owns the logic, strict schemas and review gates keep the LLM honest.",
      stats: [["Production systems", 4, ""], ["Agents, biggest pipeline", 7, ""], ["LLM does the math", "never"]],
    },
    result: {
      chip: "Biggest result?", focus: 0,
      a: "A 7-agent B2B sales pipeline. Research-to-proposal dropped from 2-3 hours to 3 minutes, scored against 700+ CRM records by an 11-metric Python model.",
      stats: [["Faster", 95, "%+"], ["Records scored", 700, "+"], ["Turnaround", "3 min"]],
    },
    inventory: {
      chip: null, focus: 1,
      a: "Inventory allocation: Python computes days-of-inventory, demand velocity and transfers. Every recommendation carries a deterministic reason code; the LLM only summarizes verified JSON.",
      stats: [["Auditable", 100, "%"], ["Arithmetic by LLM", "zero"]],
    },
    trust: {
      chip: "Why trust the output?", focus: 2,
      a: "Scoring, arithmetic and state transitions live in Python. Pydantic gates, human review and read-after-write checks sit between the model and anything that writes to SAP.",
      stats: [["Tests passed", 88, "/88"], ["SAP read-backs matched", "5/5"], ["Corrupt writes", "zero"]],
    },
    ops: {
      chip: null, focus: 3,
      a: "Enterprise agent operations: a 12-table relational core, three specialist agents, and a Playwright end-to-end harness that tests the platform automatically.",
      stats: [["SQL tables", 12, ""], ["Specialist agents", 3, ""], ["QA", "Playwright E2E"]],
    },
    signal: {
      chip: "Beyond LLMs?", focus: 4,
      a: "Biomedical signal research: cuffless blood pressure from PPG on MIMIC-III, plus an STM32 + MAX30102 hardware prototype with Bluetooth streaming.",
      stats: [["SBP MAE, mmHg", 9.76, "", 2], ["Sensor rate, Hz", 125, ""], ["Std dev, mmHg", 8.99, "", 2]],
    },
    available: {
      chip: "Are you available?", focus: -1,
      a: "Open to remote roles in AI systems engineering, ML systems and applied AI backend. Based in Ho Chi Minh City, async-first.",
      stats: [["Timezone", "UTC+7"], ["Mode", "Remote"], ["Reply", "async-first"]],
      link: { href: "mailto:trantrungduc313@gmail.com", text: "trantrungduc313@gmail.com" },
    },
  };
  var ORDER = ["build", "result", "trust", "signal", "available"];

  var selected = -1;       // radar lock: contact index, -1 = all
  var token = 0;           // cancels an answer that is still typing

  // ---------- voice bars ----------
  for (var i = 0; i < 28; i++) {
    var bar = document.createElement("i");
    bar.style.animationDelay = (-Math.random() * 1.2).toFixed(2) + "s";
    bar.style.animationDuration = (0.5 + Math.random() * 0.7).toFixed(2) + "s";
    voiceEl.appendChild(bar);
  }

  // ---------- chips ----------
  var chipBtns = {};
  ORDER.forEach(function (key) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "comms__chip mono";
    b.textContent = QA[key].chip;
    b.addEventListener("click", function () { ask(key); });
    chipsEl.appendChild(b);
    chipBtns[key] = b;
  });

  // ---------- stats ----------
  function renderStats(list, myToken) {
    statsEl.textContent = "";
    list.forEach(function (s) {
      var wrap = document.createElement("div");
      var dt = document.createElement("dt");
      var dd = document.createElement("dd");
      dt.textContent = s[0];
      wrap.appendChild(dt);
      wrap.appendChild(dd);
      statsEl.appendChild(wrap);
      if (typeof s[1] !== "number") { dd.textContent = s[1]; return; }
      var to = s[1], suffix = s[2] || "", dec = s[3] || 0, t0 = performance.now(), dur = reduce ? 0 : 900;
      (function tick(now) {
        if (myToken !== token) return;
        var k = dur ? Math.min(1, (now - t0) / dur) : 1;
        var v = to * (1 - Math.pow(1 - k, 3));
        dd.textContent = v.toFixed(dec) + suffix;
        if (k < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }

  // ---------- typing ----------
  function ask(key) {
    var qa = QA[key];
    var my = ++token;
    selected = qa.focus;
    labelEl.textContent = selected < 0 ? "SCANNING · 5 CONTACTS" : "LOCKED · " + CONTACTS[selected].tag + " · " + CONTACTS[selected].name;
    Object.keys(chipBtns).forEach(function (k) { chipBtns[k].classList.toggle("is-active", k === key); });

    logEl.textContent = "";
    var q = document.createElement("p");
    q.className = "comms__q mono";
    q.textContent = "> " + (qa.chip || CONTACTS[qa.focus].tag + " status?");
    var a = document.createElement("p");
    a.className = "comms__a";
    logEl.appendChild(q);
    logEl.appendChild(a);
    renderStats(qa.stats, my);

    voiceEl.classList.add("is-talking");
    if (reduce) { finish(); return; }
    var n = 0, text = qa.a;
    (function step() {
      if (my !== token) return;
      n = Math.min(text.length, n + 2);
      a.textContent = text.slice(0, n);
      if (n < text.length) setTimeout(step, 16); else finish();
    })();

    function finish() {
      if (my !== token) return;
      a.textContent = qa.a;
      voiceEl.classList.remove("is-talking");
      if (qa.link) {
        var l = document.createElement("a");
        l.href = qa.link.href;
        l.className = "comms__link mono";
        l.textContent = qa.link.text + " →";
        logEl.appendChild(l);
      }
    }
  }

  // ---------- radar ----------
  var ctx = canvas.getContext("2d");
  var size = canvas.width, R = size / 2 - 24, C = size / 2;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = canvas.height = size * dpr;
  canvas.style.width = canvas.style.height = "100%";
  ctx.scale(dpr, dpr);

  var TEAL = "46,232,210", ORANGE = "255,122,47";
  var visible = true;

  function pos(c) {
    return { x: C + Math.sin(c.ang) * c.r * R, y: C - Math.cos(c.ang) * c.r * R };
  }

  function draw(t) {
    ctx.clearRect(0, 0, size, size);
    // rings + ticks
    ctx.lineWidth = 1;
    for (var r = 1; r <= 4; r++) {
      ctx.strokeStyle = "rgba(" + TEAL + "," + (r === 4 ? 0.5 : 0.18) + ")";
      ctx.beginPath(); ctx.arc(C, C, (R * r) / 4, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(" + TEAL + ",0.18)";
    ctx.beginPath(); ctx.moveTo(C - R, C); ctx.lineTo(C + R, C); ctx.moveTo(C, C - R); ctx.lineTo(C, C + R); ctx.stroke();
    for (var d = 0; d < 360; d += 10) {
      var a = (d * Math.PI) / 180, l = d % 30 === 0 ? 10 : 5;
      ctx.beginPath();
      ctx.moveTo(C + Math.sin(a) * R, C - Math.cos(a) * R);
      ctx.lineTo(C + Math.sin(a) * (R + l), C - Math.cos(a) * (R + l));
      ctx.stroke();
    }

    // sweep wedge
    var sw = reduce ? 0 : (t / 1000) * 1.3;
    for (var s = 0; s < 36; s++) {
      var a0 = sw - s * 0.02;
      ctx.strokeStyle = "rgba(" + TEAL + "," + (0.28 * (1 - s / 36)).toFixed(3) + ")";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(C, C); ctx.lineTo(C + Math.sin(a0) * R, C - Math.cos(a0) * R); ctx.stroke();
    }
    ctx.lineWidth = 1;

    // contacts
    CONTACTS.forEach(function (c, i) {
      var p = pos(c);
      var diff = (((sw - c.ang) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      var glow = reduce ? 0.6 : Math.max(0.18, 1 - diff / 3.2);
      var on = i === selected;
      var col = on ? ORANGE : TEAL;
      ctx.fillStyle = "rgba(" + col + "," + (on ? 1 : glow).toFixed(2) + ")";
      ctx.beginPath(); ctx.arc(p.x, p.y, on ? 6 : 4, 0, Math.PI * 2); ctx.fill();
      if (on) {
        var pulse = reduce ? 0 : (t / 600) % 1;
        ctx.strokeStyle = "rgba(" + ORANGE + "," + (1 - pulse).toFixed(2) + ")";
        ctx.beginPath(); ctx.arc(p.x, p.y, 8 + pulse * 18, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = "rgba(" + ORANGE + ",0.5)";
        ctx.beginPath(); ctx.moveTo(C, C); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      ctx.font = "11px 'IBM Plex Mono', monospace";
      ctx.fillStyle = "rgba(" + (on ? ORANGE : "230,226,255") + "," + (on ? 1 : 0.35 + glow * 0.5).toFixed(2) + ")";
      ctx.textAlign = p.x > C ? "left" : "right";
      ctx.fillText(c.tag, p.x + (p.x > C ? 10 : -10), p.y + 4);
    });

    // centre mark
    ctx.fillStyle = "rgba(" + ORANGE + ",0.9)";
    ctx.beginPath(); ctx.arc(C, C, 3, 0, Math.PI * 2); ctx.fill();
  }

  function frame(t) {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    draw(t);
    if (syncEl && !reduce) syncEl.textContent = (98.4 + Math.sin(t / 900) * 0.4).toFixed(1);
  }
  requestAnimationFrame(frame);

  canvas.addEventListener("click", function (e) {
    var rect = canvas.getBoundingClientRect();
    var k = size / rect.width;
    var x = (e.clientX - rect.left) * k, y = (e.clientY - rect.top) * k;
    var best = -1, bd = 28 * 28;
    CONTACTS.forEach(function (c, i) {
      var p = pos(c), dd = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
      if (dd < bd) { bd = dd; best = i; }
    });
    if (best >= 0) ask(CONTACTS[best].qa);
  });
  canvas.style.cursor = "crosshair";

  // run the first answer when the panel scrolls into view; pause the radar when it leaves
  var started = false;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && !started) { started = true; setTimeout(function () { ask("build"); }, 400); }
    }, { threshold: 0.35 }).observe(document.getElementById("comms"));
  } else {
    ask("build");
  }
})();
