DONE

# Mobile Suit Gundam Hathaway — Key-Art Parallax Layers & Seamless Hero Loop (`assets/hw/`)

Original anime cel-shaded illustrations and effects layers inspired by *Mobile Suit Gundam Hathaway* (*Hathaway's Flash* / *The Sorcery of Nymph Circe*), built for Three.js / WebGL / CSS parallax compositing on branch `hathaway-redesign`.

---

## 1. File Manifest & Dimensions

All raster layers share the exact same **`2400 × 1350` (16:9)** canvas coordinate space so they can be stacked 1:1 in DOM/CSS or mapped onto aligned Three.js planes without manual offset calibration. Both `.png` and `.webp` (`q=90, alpha_q=95`) versions are provided.

| File | Format / Channels | Dimensions | Size | Description & Recommended Parallax Role |
| :--- | :--- | :--- | :--- | :--- |
| `sky.png` / `sky.webp` | Opaque `RGB` | `2400 × 1350` | `2.8 MB` / `163 KB` | Deep dusk sky backdrop (`#0d0a1a` indigo zenith to `#e85d24` volcanic horizon clouds, atmospherically softened lower half). Depth `z = -0.50`. |
| `ground.png` / `ground.webp` | Opaque `RGB` | `2400 × 1350` | `3.0 MB` / `205 KB` | Full volcanic dusk environment plate with erupting Davao/island calderas, lava veins, and dark ocean surface reflections. Depth `z = -0.35`. |
| `ground_parallax.png` / `ground_parallax.webp` | Transparent `RGBA` | `2400 × 1350` | `3.3 MB` / `147 KB` | Optional transparent-top foreground volcanic ridge & ocean plate (smooth alpha fade across `y = 660..910`) for multi-plane sky+ground split parallax. |
| `xi.png` / `xi.webp` | Transparent `RGBA` | `2400 × 1350` | `1.1 MB` / `203 KB` | **RX-105 Ξ (Xi) Gundam** (Mafty / Hathaway Noa) airborne on the left, aiming its beam rifle right. Clean alpha cutout with dusk rim-lighting and emerald sensor glow. Depth `z = -0.05`. |
| `penelope.png` / `penelope.webp` | Transparent `RGBA` | `2400 × 1350` | `1.2 MB` / `223 KB` | **RX-104FF Penelope** (Circe Unit / Kenneth Sleg) airborne on the right with Fixed Flight Module wyvern binders, facing left. Clean alpha cutout with warm thruster & teal barrier glow. Depth `z = +0.05`. |
| `beam_glow.png` / `beam_glow.webp` | Transparent `RGBA` (Straight-Alpha Luminous) | `2400 × 1350` | `688 KB` / `268 KB` | Teal mega-particle beam clash (`#35f0dc` to `#ffffff` core), Penelope counter-volley, crimson/amber funnel-missile cross-slash, plasma arcs, and anamorphic lens streak. Zero dark fringe on any blending mode (`NormalBlending` or `AdditiveBlending`). Depth `z = +0.12`. |
| `smoke_debris.png` / `smoke_debris.webp` | Transparent `RGBA` | `2400 × 1350` | `759 KB` / `331 KB` | Foreground volcanic smoke plumes, streaking magma embers, teal Minovsky sparks, and cel-shaded armor/rock debris. Depth `z = +0.25`. |
| `duel_composite.png` / `duel_composite.webp` | Opaque `RGB` | `2400 × 1350` | `4.0 MB` / `469 KB` | Complete flattened master key-art composite (`ground` + `xi` + `penelope` + `beam_glow` + `smoke_debris`) for `<video poster="...">`, fallback, or OG preview. |
| `hero_loop.mp4` | H.264 `yuv420p`, muted (`-an`), `+faststart` | `1920 × 1080` (30 fps, `8.0s`) | `4.1 MB` | Seamless 240-frame looping video of the duel with slow orbital camera drift, multi-layer parallax, hovering mecha oscillation, pulsing mega-particle beam clash, and subtle 35mm film grain. |
| `hero_loop.webm` | VP9 `yuv420p`, muted (`-an`) | `1920 × 1080` (30 fps, `8.0s`) | `4.4 MB` | Companion WebM stream of the exact same 8.0s seamless duel loop. |

---

## 2. Pixel & Normalized UV Anchor Coordinates (`2400 × 1350` Canvas)

Origin `(0, 0)` is **top-left**. Normalized `(u, v)` is `(x / 2400, y / 1350)`. Three.js centered plane coordinates `(nx, ny)` in `[-1, +1]` are `(2*u - 1, 1 - 2*v)`.

| Anchor Name | Key ID | Pixel `(x, y)` | Normalized `(u, v)` | NDC `(nx, ny)` | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Xi Beam Rifle Muzzle** | `xi_muzzle` | `(965, 499)` | `(0.4021, 0.3696)` | `(-0.1958, +0.2607)` | Exact barrel tip of Xi Gundam's beam rifle; primary teal beam origin. |
| **Central Beam Clash Nexus** | `clash_nexus` | `(1240, 505)` | `(0.5167, 0.3741)` | `(+0.0333, +0.2519)` | Main mega-particle beam & funnel-missile X-clash focal point (ideal point-light / bloom / HUD reticle target). |
| **Penelope Shoulder Cannon / Barrier Impact** | `pen_cannon` | `(1625, 515)` | `(0.6771, 0.3815)` | `(+0.3542, +0.2370)` | Penelope forward shoulder mega-particle emitter & Minovsky barrier impact point. |
| **Penelope Beam Rifle Muzzle** | `pen_muzzle` | `(1442, 1084)` | `(0.6008, 0.8030)` | `(+0.2017, -0.6059)` | Lower-left tip of Penelope's handheld beam rifle barrel (fires counter-volley through `clash_nexus`). |
| **Xi Shield Center / Deflection Point** | `xi_shield` | `(885, 540)` | `(0.3688, 0.4000)` | `(-0.2625, +0.2000)` | Forward face of Xi Gundam's forearm shield. |
| **Xi Twin-Eye Sensor** | `xi_eye` | `(632, 335)` | `(0.2633, 0.2481)` | `(-0.4733, +0.5037)` | Xi Gundam head camera sensor (emerald green `#00ffbe`). |
| **Xi Rifle Scope Sensor** | `xi_scope` | `(718, 418)` | `(0.2992, 0.3096)` | `(-0.4017, +0.3807)` | Secondary emerald optical sensor on Xi's beam rifle. |
| **Xi Center of Mass** | `xi_center` | `(535, 615)` | `(0.2229, 0.4556)` | `(-0.5542, +0.0889)` | Bounding box `[85..966, 65..1238]`. |
| **Penelope Twin-Eye Sensor** | `pen_eye` | `(1765, 415)` | `(0.7354, 0.3074)` | `(+0.4708, +0.3852)` | Penelope head camera sensor under the wyvern cowl. |
| **Penelope Leg Flight Thruster** | `pen_thruster` | `(2130, 920)` | `(0.8875, 0.6815)` | `(+0.7750, -0.3630)` | Magma-orange Minovsky flight unit exhaust flare. |
| **Penelope Center of Mass** | `pen_center` | `(1820, 650)` | `(0.7583, 0.4815)` | `(+0.5167, +0.0370)` | Bounding box `[1310..2335, 35..1295]`. |

---

## 3. Recommended Layer Stacking Order (Back to Front)

1. `sky.webp` (or `ground.webp` alone as a single environment plate)
2. `ground_parallax.webp` (if splitting sky & volcanic ocean/caldera into two depth planes)
3. `xi.webp` (`NormalBlending`, `transparent: true`)
4. `penelope.webp` (`NormalBlending`, `transparent: true`)
5. `beam_glow.webp` (`AdditiveBlending` or `NormalBlending`, `transparent: true` — pulse opacity between `0.82` and `1.0` at `~2.5 Hz` + `~7 Hz` for authentic Minovsky beam throb)
6. `smoke_debris.webp` (`NormalBlending`, `transparent: true` — widest foreground parallax multiplier)
