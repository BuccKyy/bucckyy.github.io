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

  /* ============ BACKGROUND AMBIENT CANVAS ============ */
  (function initBgCanvas() {
    var canvas = document.getElementById("bg-field");
    if (!canvas || !canvas.getContext || reduceMotion) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var w = 0, h = 0;
    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize, { passive: true });
    resize();

    var nodes = [];
    var count = 28;
    for (var i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.32,
        vy: (Math.random() - 0.5) * 0.32,
        r: 1.2 + Math.random() * 1.4
      });
    }

    var rafId = 0;
    var running = true;

    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(148, 157, 178, 0.38)";
      ctx.strokeStyle = "rgba(148, 157, 178, 0.07)";
      ctx.lineWidth = 1;

      for (var i = 0; i < count; i++) {
        var n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0) n.x = w;
        if (n.x > w) n.x = 0;
        if (n.y < 0) n.y = h;
        if (n.y > h) n.y = 0;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();

        for (var j = i + 1; j < count; j++) {
          var m = nodes[j];
          var dx = n.x - m.x;
          var dy = n.y - m.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 115) {
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        }
      }
      rafId = requestAnimationFrame(draw);
    }

    draw();

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(rafId);
      } else {
        running = true;
        draw();
      }
    });
  })();

  /* ============ HERO ENGINEERING INSTRUMENT ============ */
  var instrumentApi = {};

  (function initInstrument() {
    var instrument = document.getElementById("hero-instrument");
    if (!instrument) return;

    var tabs = instrument.querySelectorAll(".instrument__tab");
    var panelSignal = document.getElementById("panel-signal");
    var panelAgent = document.getElementById("panel-agent");
    var tacticalAlert = document.getElementById("tactical-alert");
    var tacticalAlertCode = document.getElementById("tactical-alert-code");
    var tacticalAlertMsg = document.getElementById("tactical-alert-msg");
    var statusTagEl = document.getElementById("instrument-status-tag");

    var activeMode = "signal";

    function updateTacticalAlert() {
      if (!tacticalAlert) return;
      if (activeMode === "signal" && motionArtifact && currentStage === "raw") {
        tacticalAlert.removeAttribute("hidden");
        if (tacticalAlertCode) tacticalAlertCode.textContent = "⚠ MAGI CAUTION // 信号異常検知 · ARTIFACT";
        if (tacticalAlertMsg) tacticalAlertMsg.textContent = "HIGH-AMPLITUDE MOTION BURST ON 125Hz STREAM (SQI 61.2%) — SWITCH TO STAGE 02 BUTTERWORTH TO CLEAN";
        if (statusTagEl) statusTagEl.innerHTML = '<span class="instrument__status-dot"></span> 同期率 61.2% // ARTIFACT WARNING';
      } else if (activeMode === "agent" && faultMode) {
        tacticalAlert.removeAttribute("hidden");
        if (tacticalAlertCode) tacticalAlertCode.textContent = "⛔ MAGI GATE REJECT // 算術不整合検知 · FAULT";
        if (tacticalAlertMsg) tacticalAlertMsg.textContent = "NODE 05 PYDANTIC GATE BLOCKED LLM PRICING DRIFT (€14,200 vs €15,840) — SAP ERP WRITE PREVENTED";
        if (statusTagEl) statusTagEl.innerHTML = '<span class="instrument__status-dot"></span> 防御隔壁作動 // GATE INTERCEPT ACTIVE';
      } else {
        tacticalAlert.setAttribute("hidden", "");
        if (statusTagEl) statusTagEl.innerHTML = '<span class="instrument__status-dot"></span> 同期率 98.4% // TELEMETRY LOCKED · 125 Hz';
      }
    }

    function switchInstrumentMode(mode) {
      if (mode === activeMode) return;
      activeMode = mode;

      tabs.forEach(function (t) {
        var sel = t.getAttribute("data-mode") === mode;
        t.classList.toggle("active", sel);
        t.setAttribute("aria-selected", String(sel));
      });

      if (mode === "signal") {
        panelSignal.classList.add("active");
        panelAgent.classList.remove("active");
        if (dagModule && dagModule.stop) dagModule.stop();
        if (dspModule) {
          dspModule.resize();
          dspModule.start();
        }
      } else {
        panelSignal.classList.remove("active");
        panelAgent.classList.add("active");
        if (dspModule && dspModule.stop) dspModule.stop();
        if (dagModule) {
          dagModule.resize();
          dagModule.start();
        }
      }
      updateTacticalAlert();
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        switchInstrumentMode(tab.getAttribute("data-mode"));
      });
    });

    /* ---------- MODULE 1: BIOMEDICAL DSP OSCILLOSCOPE ---------- */
    var dspCanvas = document.getElementById("dsp-canvas");
    var stageDesc = document.getElementById("dsp-stage-desc");
    var dspProbe = document.getElementById("dsp-probe");
    var dspHrEl = document.getElementById("dsp-hr");
    var dspBpEl = document.getElementById("dsp-bp");
    var artifactBtn = document.getElementById("dsp-artifact-btn");
    var bpmBtn = document.getElementById("dsp-bpm-btn");
    var stageBtns = instrument.querySelectorAll(".stage-btn");

    var currentStage = "raw";
    var motionArtifact = false;
    var currentBpm = 72;

    var stageDescriptions = {
      raw: "Raw 125Hz PPG optical sensor stream showing respiratory baseline wander (0.4Hz) and motion artifacts before filtering.",
      bandpass: "0.5–8Hz Zero-phase Butterworth filter: motion noise and baseline wander stripped, isolating clean systolic & dicrotic morphology.",
      vpg: "VPG (Velocity Plethysmogram): First numerical derivative (ΔV/Δt) isolating maximum systolic ejection velocity.",
      peaks: "Systolic Peak Detection & SBP Model: feature extraction coordinates computed for MIMIC-III cuffless BP regression."
    };

    function syncDspHud() {
      if (dspHrEl) {
        dspHrEl.innerHTML = currentBpm + " <small>BPM · 125 Hz</small>";
      }
      if (dspBpEl) {
        var bpStr = currentBpm === 96 ? "126.8 / 81.4" : "118.4 / 76.2";
        dspBpEl.innerHTML = bpStr + " <small>mmHg</small>";
      }
      if (dspProbe) {
        if (motionArtifact && currentStage === "raw") {
          dspProbe.innerHTML = "SQI 61.2% <small>ARTIFACT DETECTED — switch to Stage 2</small>";
        } else {
          dspProbe.innerHTML = "SQI 98.4% <small>move cursor on wave</small>";
        }
      }
      updateTacticalAlert();
    }

    stageBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        currentStage = btn.getAttribute("data-stage");
        stageBtns.forEach(function (b) { b.classList.toggle("active", b === btn); });
        if (stageDesc) stageDesc.textContent = stageDescriptions[currentStage] || "";
        syncDspHud();
      });
    });

    function toggleDspArtifact() {
      switchInstrumentMode("signal");
      motionArtifact = !motionArtifact;
      if (artifactBtn) {
        artifactBtn.classList.toggle("is-active", motionArtifact);
        artifactBtn.setAttribute("aria-pressed", String(motionArtifact));
        artifactBtn.textContent = motionArtifact ? "⚡ Motion Artifact: ACTIVE" : "⚡ Inject Motion Artifact";
      }
      syncDspHud();
      showToast(motionArtifact
        ? "⚡ MOTION ARTIFACT INJECTED // Switch to Stage 2 Butterworth to clean"
        : "✓ MOTION ARTIFACT CLEARED // Normal 125Hz sensor stream");
    }

    if (artifactBtn) {
      artifactBtn.addEventListener("click", toggleDspArtifact);
    }

    if (bpmBtn) {
      bpmBtn.addEventListener("click", function () {
        currentBpm = currentBpm === 72 ? 96 : 72;
        bpmBtn.setAttribute("data-bpm", String(currentBpm));
        bpmBtn.classList.toggle("is-active", currentBpm === 96);
        bpmBtn.textContent = "♥ HR: " + currentBpm + " BPM";
        syncDspHud();
      });
    }

    var dspModule = (function () {
      if (!dspCanvas || !dspCanvas.getContext) return null;
      var ctx = dspCanvas.getContext("2d");
      var animId = 0;
      var running = false;
      var width = 0, height = 0;
      var dpr = window.devicePixelRatio || 1;
      var tOffset = 0;
      var hoverRatio = null;

      function resize() {
        var rect = dspCanvas.getBoundingClientRect();
        width = rect.width || 600;
        height = rect.height || 240;
        dspCanvas.width = width * dpr;
        dspCanvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      window.addEventListener("resize", resize, { passive: true });
      resize();

      dspCanvas.addEventListener("mousemove", function (evt) {
        var rect = dspCanvas.getBoundingClientRect();
        if (!rect.width) return;
        hoverRatio = Math.max(0, Math.min(1, (evt.clientX - rect.left) / rect.width));
      });
      dspCanvas.addEventListener("mouseleave", function () {
        hoverRatio = null;
        syncDspHud();
      });

      function pulseWave(t) {
        var period = 60 / currentBpm;
        var cycle = t % period;
        var scaleT = cycle / 0.833;
        var s1 = Math.exp(-Math.pow(scaleT - 0.18, 2) / (2 * 0.0022));
        var s2 = 0.42 * Math.exp(-Math.pow(scaleT - 0.38, 2) / (2 * 0.0045));
        var base = s1 + s2;

        if (currentStage === "raw") {
          var drift = 0.22 * Math.sin(t * 1.5) + 0.08 * Math.cos(t * 3.7);
          var noise = (Math.sin(t * 85) + Math.cos(t * 140)) * 0.04;
          if (motionArtifact) {
            drift += 0.38 * Math.sin(t * 4.8) + 0.22 * Math.cos(t * 19.0);
            noise += (Math.sin(t * 62) - Math.cos(t * 113)) * 0.16;
          }
          return base + drift + noise;
        } else if (currentStage === "vpg") {
          var dt = 0.005;
          var c1 = ((t + dt) % period) / 0.833;
          var c0 = ((t - dt) % period) / 0.833;
          var v1 = Math.exp(-Math.pow(c1 - 0.18, 2) / 0.0044) + 0.42 * Math.exp(-Math.pow(c1 - 0.38, 2) / 0.009);
          var v0 = Math.exp(-Math.pow(c0 - 0.18, 2) / 0.0044) + 0.42 * Math.exp(-Math.pow(c0 - 0.38, 2) / 0.009);
          return (v1 - v0) / (2 * dt) * 0.28 + 0.4;
        } else {
          return base;
        }
      }

      function draw() {
        if (!running) return;
        tOffset += 0.011;

        ctx.clearRect(0, 0, width, height);

        // Oscilloscope Grid Lines
        ctx.strokeStyle = "rgba(148, 157, 178, 0.08)";
        ctx.lineWidth = 1;
        var stepX = 40, stepY = 32;
        ctx.beginPath();
        for (var x = 0; x < width; x += stepX) {
          ctx.moveTo(x, 0); ctx.lineTo(x, height);
        }
        for (var y = 0; y < height; y += stepY) {
          ctx.moveTo(0, y); ctx.lineTo(width, y);
        }
        ctx.stroke();

        // Waveform plot
        ctx.beginPath();
        var pts = [];
        var totalSecs = 3.2;
        var numSamples = 240;
        var midY = height * 0.68;
        var scaleY = height * 0.46;

        for (var i = 0; i < numSamples; i++) {
          var px = (i / (numSamples - 1)) * width;
          var t = tOffset + (i / numSamples) * totalSecs;
          var val = pulseWave(t);
          var py = midY - val * scaleY;
          pts.push({ x: px, y: py, t: t, val: val });
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }

        ctx.strokeStyle = (currentStage === "vpg")
          ? "#ff6b9d"
          : (currentStage === "raw" ? (motionArtifact ? "#ff6b9d" : "#ffb454") : "#4fd6be");
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Highlight Peaks in "peaks" stage
        if (currentStage === "peaks") {
          ctx.fillStyle = "#ffb454";
          ctx.strokeStyle = "rgba(255, 180, 84, 0.4)";
          ctx.font = "11px " + getComputedStyle(root).getPropertyValue("--font-mono");
          for (var p = 1; p < pts.length - 1; p++) {
            if (pts[p].val > pts[p - 1].val && pts[p].val > pts[p + 1].val && pts[p].val > 0.85) {
              var pk = pts[p];
              ctx.beginPath();
              ctx.arc(pk.x, pk.y, 4, 0, Math.PI * 2);
              ctx.fill();

              ctx.beginPath();
              ctx.setLineDash([3, 3]);
              ctx.moveTo(pk.x, pk.y);
              ctx.lineTo(pk.x, height);
              ctx.stroke();
              ctx.setLineDash([]);

              ctx.fillText("P_sys", pk.x - 14, pk.y - 10);
            }
          }
        }

        // Interactive Hover Probe Crosshair
        if (hoverRatio !== null && pts.length > 0) {
          var sampleIdx = Math.min(pts.length - 1, Math.max(0, Math.round(hoverRatio * (pts.length - 1))));
          var sp = pts[sampleIdx];
          ctx.strokeStyle = "rgba(79, 214, 190, 0.55)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(sp.x, 0);
          ctx.lineTo(sp.x, height);
          ctx.stroke();

          ctx.fillStyle = "#4fd6be";
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, 4.5, 0, Math.PI * 2);
          ctx.fill();

          if (dspProbe) {
            var mv = (sp.val * 1.85).toFixed(2);
            var sqi = (currentStage === "raw" && motionArtifact) ? "0.61" : (currentStage === "raw" ? "0.84" : "0.98");
            dspProbe.textContent = "t=" + sp.t.toFixed(2) + "s · " + mv + " mV · SQI " + sqi;
          }
        }

        // Oscilloscope Sweep Line
        var sweepX = ((tOffset * 95) % width);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sweepX, 0);
        ctx.lineTo(sweepX, height);
        ctx.stroke();

        // Tactical Anime HUD Callout Watermark inside Oscilloscope Stage
        ctx.fillStyle = "rgba(148, 157, 178, 0.42)";
        ctx.font = "10.5px " + getComputedStyle(root).getPropertyValue("--font-mono");
        ctx.fillText("[ CH-01 // 光学脈波センサ · 125Hz STREAM ]", 12, 18);
        ctx.fillText("[ TARGET // MIMIC-III SBP REGRESSION ]", width - 265, height - 10);

        animId = requestAnimationFrame(draw);
      }

      return {
        resize: resize,
        start: function () {
          resize();
          if (!running) { running = true; draw(); }
        },
        stop: function () {
          running = false;
          cancelAnimationFrame(animId);
        }
      };
    })();

    /* ---------- MODULE 2: ENTERPRISE AGENT DAG ---------- */
    var dagCanvas = document.getElementById("dag-canvas");
    var dagRunBtn = document.getElementById("dag-run-btn");
    var dagFaultBtn = document.getElementById("dag-fault-btn");
    var dagStepLabel = document.getElementById("dag-step-label");
    var dagPills = instrument.querySelectorAll(".dag-pill");
    var inspectorTitle = document.getElementById("inspector-title");
    var inspectorBadge = document.getElementById("inspector-badge");
    var inspectorCode = document.getElementById("inspector-code");

    var faultMode = false;

    var dagNodes = [
      {
        id: 0,
        code: "01",
        label: "CRM Webhook",
        type: "trigger",
        color: "#949db2",
        badge: "INPUT TRIGGER",
        contract: {
          event: "prospect.created",
          source: "HubSpot CRM",
          correlation_id: "corr_9f81a7b2",
          company_domain: "enterprise-logistics.de"
        }
      },
      {
        id: 1,
        code: "02",
        label: "FastAPI Router",
        type: "deterministic",
        color: "#4fd6be",
        badge: "DETERMINISTIC PYTHON",
        contract: {
          router: "SalesWorkflowOrchestrator",
          route_key: "b2b_proposal_gen",
          runtime: "FastAPI async def",
          policy: "Deterministic rule precedence"
        }
      },
      {
        id: 2,
        code: "03",
        label: "BM25 Retrieval",
        type: "deterministic",
        color: "#4fd6be",
        badge: "DETERMINISTIC RETRIEVAL",
        contract: {
          retrieval: "BM25Okapi",
          index: "pricing_contracts_2026",
          top_k: 3,
          grounding_citations: ["sec_4.2_sla", "sec_9_volume_rebate"],
          abstention_flag: false
        }
      },
      {
        id: 3,
        code: "04",
        label: "Claude Sonnet",
        type: "llm",
        color: "#818cf8",
        badge: "LLM INTERPRETATION",
        contract: {
          model: "claude-3-5-sonnet-20241022",
          task: "Synthesize structured executive proposal",
          system_prompt: "Ground solely on retrieved JSON facts",
          temperature: 0.1
        }
      },
      {
        id: 4,
        code: "05",
        label: "Pydantic Gate",
        type: "gate",
        color: "#ffb454",
        badge: "EVALUATION GATE",
        contract: {
          validator: "PydanticV2",
          model: "ProposalDraftPayload",
          arithmetic_guard: "VERIFIED_EXTERNAL_PYTHON",
          checks: { status_enum: "VALID", score_range: [0, 100], read_back: "MATCHED" },
          result: "PASS (88/88 test suite)"
        },
        faultContract: {
          validator: "PydanticV2 · DeterministicPythonGate",
          status: "BLOCKED_BY_PYTHON_GATE",
          reason_code: "LLM_ARITHMETIC_DRIFT_DETECTED",
          discrepancy: {
            llm_claimed_total_eur: 14200.00,
            python_verified_total_eur: 15840.00,
            rebate_tier_violation: "Applied 18% discount instead of 10% tier"
          },
          erp_write_blocked: true,
          fallback_action: "REROUTED_TO_PYTHON_PRICING_SOLVER"
        }
      },
      {
        id: 5,
        code: "06",
        label: "HITL Approval",
        type: "gate",
        color: "#ffb454",
        badge: "HITL APPROVAL GATE",
        contract: {
          action: "human_confirmation_gate",
          operator: "Sales Operations Lead",
          inspection_view: "side-by-side evidence diff",
          decision: "APPROVED_FOR_ERP_POST"
        }
      },
      {
        id: 6,
        code: "07",
        label: "SAP ERP Post",
        type: "erp",
        color: "#ff6b9d",
        badge: "ERP WRITE TRANSACTION",
        contract: {
          transaction: "SAP InventoryGenEntries POST",
          correlation_id: "corr_9f81a7b2",
          status_code: 201,
          read_after_write_check: "MATCHED (5/5 fields)",
          committed: true
        }
      }
    ];

    var selectedNode = 4;

    function selectDagNode(index) {
      var n = dagNodes[index];
      if (!n) return;
      selectedNode = index;
      var showFault = (faultMode && index === 4 && n.faultContract);
      if (inspectorTitle) {
        inspectorTitle.textContent = "NODE " + n.code + " CONTRACT // " + n.label;
      }
      if (inspectorBadge) {
        inspectorBadge.textContent = showFault
          ? "BLOCKED · LLM MATH REJECTED BY PYTHON GATE"
          : n.badge;
        inspectorBadge.style.color = showFault ? "#ff6b9d" : "";
      }
      if (inspectorCode) {
        var payload = showFault ? n.faultContract : n.contract;
        inspectorCode.innerHTML = "<code>" + JSON.stringify(payload, null, 2) + "</code>";
      }
      dagPills.forEach(function (pill) {
        var pIdx = Number(pill.getAttribute("data-node"));
        pill.classList.toggle("active", pIdx === index);
        pill.classList.toggle("is-selected", pIdx === index);
      });
    }

    dagPills.forEach(function (pill) {
      pill.addEventListener("click", function () {
        var idx = Number(pill.getAttribute("data-node"));
        selectDagNode(idx);
        if (dagStepLabel) {
          dagStepLabel.textContent = "Selected Node " + dagNodes[idx].code + ": " + dagNodes[idx].label + " (" + dagNodes[idx].badge + ")";
        }
      });
    });

    var dagModule = (function () {
      if (!dagCanvas || !dagCanvas.getContext) return null;
      var ctx = dagCanvas.getContext("2d");
      var animId = 0;
      var running = false;
      var width = 0, height = 0;
      var dpr = window.devicePixelRatio || 1;
      var activePacket = null;

      function resize() {
        var rect = dagCanvas.getBoundingClientRect();
        width = rect.width || 600;
        height = rect.height || 240;
        dagCanvas.width = width * dpr;
        dagCanvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      window.addEventListener("resize", resize, { passive: true });
      resize();

      function getNodeMetrics() {
        var n = dagNodes.length;
        if (width < 720) {
          var nodeW = Math.min(130, Math.floor((width - 48) / 4));
          return { twoRows: true, nodeW: nodeW, nodeH: 46 };
        }
        var padX = 68;
        var stepX = (width - padX * 2) / (n - 1);
        var wCard = Math.min(124, Math.max(92, Math.floor(stepX * 0.84)));
        return { twoRows: false, nodeW: wCard, nodeH: 48, padX: padX, stepX: stepX };
      }

      function getNodeCoords(i) {
        var m = getNodeMetrics();
        if (m.twoRows) {
          if (i < 4) {
            var colW = width / 4;
            return { x: colW * (i + 0.5), y: height * 0.3 };
          } else {
            var colW2 = width / 3;
            return { x: colW2 * ((i - 4) + 0.5), y: height * 0.72 };
          }
        }
        var x = m.padX + i * m.stepX;
        var y = height * 0.5 + (i % 2 === 0 ? -24 : 24);
        return { x: x, y: y };
      }

      function triggerRun() {
        activePacket = { currentStep: 0, progress: 0 };
        selectDagNode(0);
        if (dagStepLabel) {
          dagStepLabel.textContent = faultMode
            ? "Executing Fault-Injection Trace (Simulating LLM pricing hallucination)..."
            : "Executing pipeline from Event Trigger...";
        }
      }

      function draw() {
        if (!running) return;
        ctx.clearRect(0, 0, width, height);

        var m = getNodeMetrics();
        var nodeW = m.nodeW;
        var nodeH = m.nodeH;

        // Draw connecting directed edges
        ctx.lineWidth = 2;
        for (var i = 0; i < dagNodes.length - 1; i++) {
          var p1 = getNodeCoords(i);
          var p2 = getNodeCoords(i + 1);
          var blockedEdge = (faultMode && i >= 4);
          ctx.strokeStyle = blockedEdge ? "rgba(255, 107, 157, 0.18)" : "rgba(148, 157, 178, 0.28)";
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.bezierCurveTo(p1.x + 28, p1.y, p2.x - 28, p2.y, p2.x, p2.y);
          ctx.stroke();
        }

        // Draw packet animation if active
        if (activePacket) {
          activePacket.progress += 0.032;
          var fromIdx = activePacket.currentStep;
          var toIdx = fromIdx + 1;
          if (toIdx < dagNodes.length) {
            var c1 = getNodeCoords(fromIdx);
            var c2 = getNodeCoords(toIdx);
            var t = activePacket.progress;
            var px = (1 - t) * c1.x + t * c2.x;
            var py = (1 - t) * c1.y + t * c2.y;

            ctx.fillStyle = dagNodes[toIdx].color;
            ctx.shadowColor = dagNodes[toIdx].color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            if (t >= 1) {
              activePacket.progress = 0;
              activePacket.currentStep++;
              selectDagNode(activePacket.currentStep);

              // Stop at Node 05 (idx 4) if Fault-Injection Mode is enabled!
              if (faultMode && activePacket.currentStep === 4) {
                activePacket = null;
                if (dagStepLabel) {
                  dagStepLabel.textContent = "⛔ BLOCKED AT NODE 05: Pydantic Gate caught LLM arithmetic drift (€14,200 vs €15,840). SAP ERP write prevented.";
                }
                showToast("⛔ PYTHON GATE BLOCKED LLM HALLUCINATION // 0 corrupt ERP writes");
              } else {
                if (dagStepLabel) {
                  var cur = dagNodes[activePacket.currentStep];
                  dagStepLabel.textContent = "Step " + (activePacket.currentStep + 1) + "/7: " + cur.label + " executed (" + cur.badge + ")";
                }
                if (activePacket.currentStep >= dagNodes.length - 1) {
                  activePacket = null;
                  if (dagStepLabel) dagStepLabel.textContent = "Pipeline execution complete · 88/88 checks passed · SAP read-back verified.";
                }
              }
            }
          }
        }

        // Draw nodes
        var monoFont = getComputedStyle(root).getPropertyValue("--font-mono");
        for (var k = 0; k < dagNodes.length; k++) {
          var node = dagNodes[k];
          var pt = getNodeCoords(k);
          var isSel = (k === selectedNode);
          var isFaultNode = (faultMode && k === 4);

          ctx.fillStyle = isFaultNode
            ? "rgba(255, 107, 157, 0.18)"
            : (isSel ? "rgba(255, 180, 84, 0.14)" : "rgba(17, 21, 31, 0.94)");
          ctx.strokeStyle = isFaultNode
            ? "#ff6b9d"
            : (isSel ? node.color : "rgba(255, 255, 255, 0.15)");
          ctx.lineWidth = (isSel || isFaultNode) ? 2 : 1;

          ctx.beginPath();
          var rx = pt.x - nodeW / 2, ry = pt.y - nodeH / 2;
          var cut = 8;
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx + nodeW - cut, ry);
          ctx.lineTo(rx + nodeW, ry + cut);
          ctx.lineTo(rx + nodeW, ry + nodeH);
          ctx.lineTo(rx + cut, ry + nodeH);
          ctx.lineTo(rx, ry + nodeH - cut);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = isFaultNode ? "#ff6b9d" : node.color;
          ctx.beginPath();
          ctx.arc(rx + 11, ry + 14, 3.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = isFaultNode ? "#ff6b9d" : (isSel ? "#ffb454" : "#e8eaf0");
          ctx.font = "500 10.5px " + monoFont;
          ctx.fillText(node.label.slice(0, 14), rx + 20, ry + 18);
          ctx.fillStyle = "#949db2";
          ctx.font = "9.5px " + monoFont;
          ctx.fillText(isFaultNode ? "GATE BLOCKED" : ("NODE " + node.code), rx + 10, ry + 35);
        }

        // Tactical Anime HUD Callout Watermark inside DAG Stage
        ctx.fillStyle = "rgba(148, 157, 178, 0.42)";
        ctx.font = "10.5px " + monoFont;
        ctx.fillText("[ MAGI-DAG // 決定論的制御回路 · 7-NODE PIPELINE ]", 12, 18);

        animId = requestAnimationFrame(draw);
      }

      dagCanvas.addEventListener("click", function (evt) {
        var rect = dagCanvas.getBoundingClientRect();
        var mx = evt.clientX - rect.left;
        var my = evt.clientY - rect.top;
        var m = getNodeMetrics();

        for (var i = 0; i < dagNodes.length; i++) {
          var pt = getNodeCoords(i);
          if (mx >= pt.x - m.nodeW / 2 && mx <= pt.x + m.nodeW / 2 &&
              my >= pt.y - m.nodeH / 2 && my <= pt.y + m.nodeH / 2) {
            selectDagNode(i);
            if (dagStepLabel) dagStepLabel.textContent = "Selected Node " + dagNodes[i].code + ": " + dagNodes[i].label + " (" + dagNodes[i].badge + ")";
            break;
          }
        }
      });

      if (dagRunBtn) {
        dagRunBtn.addEventListener("click", triggerRun);
      }

      function toggleFaultSimulation() {
        switchInstrumentMode("agent");
        faultMode = !faultMode;
        if (dagFaultBtn) {
          dagFaultBtn.classList.toggle("is-fault-active", faultMode);
          dagFaultBtn.setAttribute("aria-pressed", String(faultMode));
          dagFaultBtn.textContent = faultMode ? "⚠ Simulate Bad Math: ON" : "⚠ Simulate Bad Math: OFF";
        }
        updateTacticalAlert();
        if (faultMode) {
          triggerRun();
        } else {
          selectDagNode(4);
          if (dagStepLabel) dagStepLabel.textContent = "Normal mode restored · All 88/88 contract checks passing.";
        }
      }

      if (dagFaultBtn) {
        dagFaultBtn.addEventListener("click", toggleFaultSimulation);
      }

      instrumentApi.toggleDspArtifact = toggleDspArtifact;
      instrumentApi.runDagFault = function () {
        switchInstrumentMode("agent");
        if (!faultMode) {
          faultMode = true;
          if (dagFaultBtn) {
            dagFaultBtn.classList.add("is-fault-active");
            dagFaultBtn.setAttribute("aria-pressed", "true");
            dagFaultBtn.textContent = "⚠ Simulate Bad Math: ON";
          }
        }
        updateTacticalAlert();
        triggerRun();
      };

      return {
        resize: resize,
        start: function () {
          resize();
          if (!running) { running = true; draw(); }
        },
        stop: function () {
          running = false;
          cancelAnimationFrame(animId);
        }
      };
    })();

    if (dspModule) dspModule.start();
  })();

  /* ============ CASE STUDY PIPELINE TRACE INSPECTOR ============ */
  (function initCaseInspectors() {
    var cases = document.querySelectorAll(".case");
    cases.forEach(function (card) {
      var tabs = Array.prototype.slice.call(card.querySelectorAll(".pipeline-tab"));
      var panes = Array.prototype.slice.call(card.querySelectorAll(".case__code"));
      var stageLabel = card.querySelector("[data-stage-label]");
      if (!tabs.length || !panes.length) return;

      function activateStage(stage) {
        tabs.forEach(function (tab) {
          var active = tab.getAttribute("data-stage") === stage;
          tab.classList.toggle("active", active);
          tab.classList.toggle("is-active", active);
          tab.setAttribute("aria-selected", String(active));
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
    if (!palette || !input) return;

    function openPalette() {
      palette.removeAttribute("hidden");
      input.value = "";
      items.forEach(function (it) { it.removeAttribute("hidden"); });
      window.setTimeout(function () { input.focus(); }, 20);
    }

    function closePalette() {
      palette.setAttribute("hidden", "");
    }

    if (openBtn) openBtn.addEventListener("click", openPalette);
    if (closeBtn) closeBtn.addEventListener("click", closePalette);

    palette.addEventListener("click", function (evt) {
      if (evt.target === palette) closePalette();
    });

    document.addEventListener("keydown", function (evt) {
      var tag = (evt.target && evt.target.tagName) ? evt.target.tagName.toLowerCase() : "";
      var isInput = (tag === "input" || tag === "textarea");
      if ((evt.metaKey || evt.ctrlKey) && evt.key.toLowerCase() === "k") {
        evt.preventDefault();
        if (palette.hasAttribute("hidden")) openPalette();
        else closePalette();
      } else if (evt.key === "/" && !isInput && palette.hasAttribute("hidden")) {
        evt.preventDefault();
        openPalette();
      } else if (evt.key === "Escape" && !palette.hasAttribute("hidden")) {
        evt.preventDefault();
        closePalette();
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
      it.addEventListener("click", function () {
        var cmd = it.getAttribute("data-cmd");
        closePalette();
        var cases = document.querySelectorAll(".case");

        if (cmd === "dsp-artifact") {
          var inst = document.getElementById("hero-instrument");
          if (inst) inst.scrollIntoView({ behavior: "smooth", block: "center" });
          if (instrumentApi.toggleDspArtifact) instrumentApi.toggleDspArtifact();
        } else if (cmd === "dag-fault") {
          var inst2 = document.getElementById("hero-instrument");
          if (inst2) inst2.scrollIntoView({ behavior: "smooth", block: "center" });
          if (instrumentApi.runDagFault) instrumentApi.runDagFault();
        } else if (cmd === "goto-cs01" && cases[0]) {
          cases[0].scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (cmd === "goto-cs02" && cases[1]) {
          cases[1].scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (cmd === "goto-cs03" && cases[2]) {
          cases[2].scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (cmd === "goto-cs04" && cases[3]) {
          cases[3].scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (cmd === "copy-email") {
          copyEmailToClipboard();
        } else if (cmd === "toggle-theme") {
          toggleTheme();
        }
      });
    });
  })();

})();
