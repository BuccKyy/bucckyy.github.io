// Hathaway key-art backdrop: painted anime layers composited as a parallax
// stack in WebGL. Mouse and scroll shift each layer by its own depth factor.
import * as THREE from "./vendor/three.module.min.js";

const canvas = document.getElementById("hw-scene");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const W = 2400, H = 1350;                 // shared layer canvas, see assets/hw/README.md
const CLASH = { x: 1240 - W / 2, y: H / 2 - 505 };   // beam clash nexus, centred coords

// back to front; px/py = max parallax shift in layer pixels at mouse extreme
const LAYERS = [
  { name: "sky", px: 6, py: 4 },
  { name: "ground_parallax", px: 14, py: 9 },
  { name: "xi", px: 30, py: 18, bob: [9, 0.9, 0] },
  { name: "penelope", px: 44, py: 26, bob: [7, 0.7, 1.3] },
  { name: "beam_glow", px: 36, py: 22, additive: true, pulse: true },
  { name: "smoke_debris", px: 80, py: 46, drift: true },
];

function boot() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  } catch (err) {
    document.documentElement.classList.add("no-webgl");
    return;
  }
  const small = window.innerWidth < 760;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x0d0a1a);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
  camera.position.z = 10;

  const stack = new THREE.Group();
  scene.add(stack);

  const loader = new THREE.TextureLoader();
  const planeGeo = new THREE.PlaneGeometry(W, H);
  const meshes = [];
  let pending = LAYERS.length;

  LAYERS.forEach((layer, i) => {
    loader.load(`assets/hw/${layer.name}.webp`, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: layer.name !== "sky",
        blending: layer.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false,
        depthTest: false,
      });
      const mesh = new THREE.Mesh(planeGeo, mat);
      mesh.renderOrder = i;
      mesh.userData = layer;
      stack.add(mesh);
      meshes.push(mesh);
      if (--pending === 0) document.documentElement.classList.add("hw-ready");
    }, undefined, () => {
      if (--pending === 0) document.documentElement.classList.add("hw-ready");
    });
  });

  // soft glow where the two beams meet
  const gc = document.createElement("canvas");
  gc.width = gc.height = 256;
  const g2 = gc.getContext("2d");
  const grad = g2.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(120,255,240,0.55)");
  grad.addColorStop(1, "rgba(30,200,190,0)");
  g2.fillStyle = grad;
  g2.fillRect(0, 0, 256, 256);
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 900),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false })
  );
  glow.position.set(CLASH.x, CLASH.y, 0);
  glow.renderOrder = 10;
  stack.add(glow);

  // night wash: the sky darkens as you read down the page
  const wash = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ color: 0x050414, transparent: true, opacity: 0, depthWrite: false, depthTest: false })
  );
  wash.position.z = 5;
  wash.renderOrder = 20;
  scene.add(wash);

  // embers drift up in screen space
  const N = small ? 70 : 160;
  const eGeo = new THREE.BufferGeometry();
  const eSeed = new Float32Array(N);
  eGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  const embers = new THREE.Points(eGeo, new THREE.PointsMaterial({ color: 0xffa24a, size: 3 * (renderer.getPixelRatio()), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, sizeAttenuation: false }));
  embers.renderOrder = 15;
  embers.position.z = 3;
  scene.add(embers);

  let vw = 1, vh = 1, fit = 1, portrait = false, baseY = 0;
  function seedEmbers() {
    const p = eGeo.attributes.position;
    for (let i = 0; i < N; i++) {
      eSeed[i] = Math.random();
      p.setXYZ(i, (Math.random() - 0.5) * vw, (Math.random() - 0.5) * vh, 0);
    }
    p.needsUpdate = true;
  }

  function resize() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    renderer.setSize(vw, vh, false);
    camera.left = -vw / 2; camera.right = vw / 2;
    camera.top = vh / 2; camera.bottom = -vh / 2;
    camera.updateProjectionMatrix();
    wash.scale.set(vw, vh, 1);
    portrait = vw / vh < 0.9;
    if (portrait) {
      // phones: show ~82% of the duel width, pinned under the nav; CSS fades it into the title card
      fit = vw / (W * 0.82);
      baseY = vh / 2 - (H * fit) / 2 - 64;
    } else {
      // cover the viewport; keep a little headroom for parallax travel
      fit = Math.max(vw / W, vh / H) * 1.06;
      baseY = 0;
    }
    seedEmbers();
  }
  window.addEventListener("resize", resize);
  resize();

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  let scroll = 0, scrollT = 0;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollT = max > 0 ? Math.min(1, window.scrollY / max) : 0;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // veil strength follows scroll; title card and interludes switch it off entirely
  const root = document.documentElement;
  const setVeil = () => root.style.setProperty("--veil", String(Math.min(1, Math.max(0, (window.scrollY - window.innerHeight * 0.3) / (window.innerHeight * 0.5)))));
  window.addEventListener("scroll", setVeil, { passive: true });
  setVeil();
  if ("IntersectionObserver" in window) {
    const clear = new Set();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) (e.isIntersecting ? clear.add(e.target) : clear.delete(e.target));
      if (clear.size) root.setAttribute("data-clear", "1"); else root.removeAttribute("data-clear");
    }, { threshold: 0.5 });
    document.querySelectorAll(".hw-clear").forEach((el) => io.observe(el));
  }

  const clock = new THREE.Clock();
  let visible = true;
  document.addEventListener("visibilitychange", () => { visible = !document.hidden; });

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = reduceMotion ? 0 : clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    scroll += (scrollT - scroll) * 0.06;

    // opening move: slow push-in from a wider frame, easing out over ~3s
    const intro = reduceMotion ? 0 : Math.max(0, 1 - clock.elapsedTime / 3);
    const ease = intro * intro * intro;
    // scrolling pushes the camera in and lifts it toward the sky
    stack.scale.setScalar(fit * (1 + scroll * 0.16 + ease * 0.14));
    stack.position.y = baseY + scroll * vh * 0.1;

    for (const m of meshes) {
      const L = m.userData;
      let x = -mouse.x * L.px, y = mouse.y * L.py;
      if (L.bob) y += Math.sin(t * L.bob[1] + L.bob[2]) * L.bob[0];
      if (L.drift) x += Math.sin(t * 0.25) * 22;
      m.position.set(x, y, 0);
      if (L.pulse) m.material.opacity = 0.9 + 0.1 * Math.sin(t * 15.7) * Math.sin(t * 2.5);
    }
    glow.scale.setScalar(0.9 + 0.12 * Math.sin(t * 11) + 0.06 * Math.sin(t * 2.3));
    glow.material.opacity = 0.65 + 0.2 * Math.sin(t * 7.3);

    wash.material.opacity = scroll * 0.55;

    const p = eGeo.attributes.position;
    for (let i = 0; i < N; i++) {
      let y = p.getY(i) + 0.25 + eSeed[i] * 0.9;
      if (y > vh / 2) y = -vh / 2;
      p.setY(i, y);
      p.setX(i, p.getX(i) + Math.sin(t * 0.6 + eSeed[i] * 30) * 0.25);
    }
    p.needsUpdate = true;

    renderer.render(scene, camera);
  }
  frame();
}

if (canvas) boot();
