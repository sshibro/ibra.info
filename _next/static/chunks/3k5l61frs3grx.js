(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,92899,e=>{"use strict";var t=e.i(43476);e.s(["SectionLabel",0,function({children:e,action:a}){return(0,t.jsxs)("header",{className:"flex items-center justify-between gap-3 pb-2 border-b border-[var(--border-line)]",children:[(0,t.jsx)("h2",{className:"font-normal text-[var(--text-primary)]",children:e}),a]})}])},265,43682,58556,75174,77029,e=>{"use strict";let t="Get Started";e.s(["LABEL",0,t,"RECIPES",0,[{id:"glossy",name:"Glossy",className:"depth-glossy",note:"A specular highlight bar over a gradient body — the classic glassy pill.",backdrop:"light"},{id:"glow",name:"Glow",className:"depth-glow",note:"A solid body lit from inside; hover turns the inner glow up, no specular.",backdrop:"dark"},{id:"metal",name:"Metal",className:"depth-metal",note:"A brushed surface with a bevel and a glint that follows the cursor.",backdrop:"light"},{id:"foil",name:"Foil",className:"depth-foil",note:"Iridescent holographic metal: stacked light layers that shift and glare under the cursor.",backdrop:"dark"},{id:"layered",name:"Layered",className:"depth-layered",note:"Soft translucent overlays over any fill: a gentle dome, a top sheen, a clean hairline rim.",backdrop:"light"},{id:"inset",name:"Inset",className:"depth-inset",note:"Recessed into the surface: the bevel is flipped and there's no drop shadow.",backdrop:"light"},{id:"glass",name:"Glass",className:"depth-glass",note:"Real refraction: an SVG displacement filter gently bends the background at its edges.",backdrop:"color"},{id:"neon",name:"Neon",className:"depth-neon",note:"A crisp lit outline: one clean bright ring with just a whisper of glow, firming on hover.",backdrop:"dark"},{id:"duotone",name:"Duotone",className:"depth-duotone",note:"A hard-bevel extruded key built from stacked 1px shadows; it slams down on press.",backdrop:"light"},{id:"satin",name:"Satin",className:"depth-satin",note:"A single flat pastel with the softest possible dome. No gradient, no specular, pure matte.",backdrop:"light"}]],265);let a=`/* The Art of Color Depth — button depth by technique, not by color.
 *
 * Six ways to give a flat button real depth. Each is a different METHOD; the
 * colors are just variables you swap. Every recipe styles the same markup:
 *
 *   <button class="depth-btn depth-<type>">
 *     <span class="depth-label">Get Started</span>
 *   </button>
 *
 * The depth never comes from one drop shadow. It is layers stacked on the same
 * element: a base gradient (the body), inset shadows (the bevel and inner glow),
 * a ::before that fades in on hover (the light turning on), and often a ::after
 * highlight (the specular sheen). Copy the shared base plus the one type you want.
 */

/* ── shared base (same for every type) ─────────────────────────────────────── */
.depth-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 22px;
  border: none;
  border-radius: 999px;
  font: 500 15px/1 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  letter-spacing: 0.01em;
  color: #fff;
  cursor: pointer;
  isolation: isolate; /* keep the ::before/::after layers under the label */
  overflow: hidden; /* clip every decoration layer to the pill */
  -webkit-tap-highlight-color: transparent;
  /* No scale/lift on the button itself — each material animates only its own
     look (a glint, a glow) on hover/press, nothing generic. */
  transition:
    filter 0.2s ease,
    box-shadow 0.2s ease;
}
.depth-label {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
}
/* icon variant: a square button (same material, different silhouette) */
.depth-btn.depth-icon {
  width: 44px;
  padding: 0;
  border-radius: 14px;
}

/* ── Toggle switch: the material is the TRACK; a solid knob slides on top ───── */
.depth-btn.depth-toggle {
  width: 76px;
  padding: 0;
  cursor: pointer;
}
/* the knob — a smaller, textured circle that rides above the material and glides.
   Texture: a soft top highlight + a faint bottom shade baked into the background,
   plus a hairline rim, so it reads as a rounded physical dot, not a flat disc. */
.depth-knob {
  position: absolute;
  z-index: 3;
  top: 7px;
  left: 7px;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background:
    radial-gradient(120% 120% at 50% 22%, rgba(255, 255, 255, var(--knob-hi, 0.55)), rgba(255, 255, 255, 0) 55%),
    radial-gradient(120% 120% at 50% 100%, rgba(0, 0, 0, var(--knob-lo, 0.22)), rgba(0, 0, 0, 0) 55%),
    var(--knob, #ffffff);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.35),
    0 2px 5px rgba(0, 0, 0, 0.22),
    inset 0 1px 1px rgba(255, 255, 255, var(--knob-hi, 0.5)),
    inset 0 0 0 1px rgba(0, 0, 0, 0.06);
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}
.depth-toggle[data-on="true"] .depth-knob {
  transform: translateX(32px);
}
/* off state reads a little dimmer, so "on" is clearly the lit one */
.depth-toggle[data-on="false"] {
  filter: saturate(0.6) brightness(0.94);
}
/* per-material knob colour: dark knob on the pale materials, white elsewhere.
   Dark knobs get much softer texture (the highlight/shade would read as heavy
   gloss on a near-black circle). */
.depth-inset,
.depth-satin,
.depth-metal,
.depth-glass {
  --knob: #2a2f3a;
  --knob-hi: 0.14;
  --knob-lo: 0.08;
}
.depth-btn::before,
.depth-btn::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: 1;
  pointer-events: none;
}
/* ::before defaults to visible now; materials that want it hidden set opacity:0
   themselves. (No generic white sheen-fade on hover.) */

/* ── Glossy — a specular highlight bar over a gradient body ──────────────────
   The classic app-button look. A bright-to-dark gradient body, faint inner rim
   light, a dark inset at the bottom for weight, and a blurred white bar that
   overhangs the top edge like studio lighting on plastic. */
.depth-glossy {
  overflow: hidden; /* clip the highlight bar to the pill */
  background: linear-gradient(180deg, #ffb347 0%, #e06c1f 100%);
  box-shadow:
    inset 0 -1px 4.1px 0.5px rgba(255, 224, 160, 0.55),
    inset 0 0 4px 0 rgb(255, 234, 200),
    inset 0 -36px 14.2px -28px rgba(180, 80, 20, 0.5),
    0 3px 8px rgba(200, 96, 30, 0.35);
  text-shadow: 0 1px 2px rgba(90, 40, 0, 0.5);
}
.depth-glossy::after {
  content: "";
  position: absolute;
  left: 10px;
  right: 10px;
  top: -5px;
  height: 28px;
  border-radius: 500px;
  background: linear-gradient(to top, rgba(255, 255, 255, 0), #fff);
  filter: blur(1px);
  opacity: 0.7;
  transition: opacity 0.3s ease, top 0.3s ease;
  z-index: 1;
}
.depth-glossy:hover::after {
  opacity: 0.9;
  top: -3px;
}

/* ── Glow — a solid body lit from inside, hover turns the light up ───────────
   No specular. The depth is an internal glow: a dark-to-bright gradient with
   inset color glows, and a ::before that swaps to a brighter gradient with crisp
   light along the lower inner edge — the button appears to power on. */
.depth-glow {
  color: #fdeaff;
  text-shadow: 0 1px 2px rgba(40, 0, 48, 0.55);
  background: linear-gradient(180deg, #2a0a45 0%, #a01fd0 100%);
  box-shadow:
    inset 0 -1.5px 2px 0 #d67bff,
    inset 0 0 10px 0 #b01ffb,
    inset 0 0 8px 0 #b01ffb,
    0 2px 6px rgba(140, 20, 200, 0.35);
}
/* the brighter "light on" layer: hidden at rest, fades in on hover */
.depth-glow::before {
  opacity: 0;
  transition: opacity 0.2s ease;
  background: linear-gradient(180deg, #45108a 9%, #c31ffb 100%);
  box-shadow:
    inset 0 -0.5px 1px 0 #ff8cf0,
    inset 0 -1px 3px 0 #ff8cf0,
    inset 0 -1.5px 5px 0 #ff9ce8,
    inset 0 0 12px 0 #d155ff,
    inset 0 0 10px 0 #d155ff;
}
.depth-glow:hover::before {
  opacity: 1;
}

/* ── Metal — brushed surface with a bevel and a sheen that follows the cursor ─
   A cool vertical gradient with a bright top bevel and dark bottom bevel, a
   faint vertical "brushing", and a diagonal specular streak (::after) whose
   position tracks --pointer-x (a driver updates it while hovering; it rests in
   the centre). The glint slides to wherever the light "hits" as you move. */
.depth-metal {
  --pointer-x: 50%; /* driven by JS on hover; falls back to centre */
  color: #1c2230;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.55);
  overflow: hidden;
  background:
    repeating-linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.05) 0px,
      rgba(0, 0, 0, 0.04) 1px,
      rgba(255, 255, 255, 0.05) 2px
    ),
    linear-gradient(180deg, #f4f6f9 0%, #c3cad6 48%, #aab2c0 52%, #d3d9e2 100%);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.9),
    inset 0 -1px 1px 0 rgba(30, 38, 56, 0.35),
    inset 0 0 0 1px rgba(255, 255, 255, 0.25),
    0 3px 8px rgba(30, 38, 56, 0.28);
}
/* the moving glint: a soft band positioned at the cursor's x (smoothed in CSS) */
.depth-metal::after {
  opacity: 0.85;
  background: radial-gradient(
    120% 140% at var(--pointer-x, 50%) -20%,
    rgba(255, 255, 255, 0.85) 0%,
    rgba(255, 255, 255, 0.25) 18%,
    rgba(255, 255, 255, 0) 42%
  );
  transition: opacity 0.3s ease, background 0.12s linear;
}
.depth-metal:hover::after {
  opacity: 1;
}

/* ── Layered — depth from soft translucent overlays over any fill ────────────
   No baked colours: a translucent black base plus faint layers, so it adds depth
   to a button of ANY fill. Kept smooth — one gentle top→bottom dome on the body,
   a soft top sheen (::before, fades on press), and a clean even hairline rim
   (::after). Nothing heavy or uneven. */
.depth-layered {
  overflow: hidden;
  /* One smooth translucent body — no heavy center-shade. A single gentle
     top-to-bottom lightening does the doming, so it reads clean over any fill. */
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0) 40%,
      rgba(0, 0, 0, 0.12) 100%
    ),
    rgba(0, 0, 0, 0.55);
}
/* layer 1 — a soft top sheen (fades in on hover, off on press) */
.depth-layered::before {
  opacity: 0.1;
  background: linear-gradient(180deg, #fff 0%, rgba(255, 255, 255, 0) 60%);
  transition: opacity 0.2s ease;
}
.depth-layered:hover::before {
  opacity: 0.15;
}
.depth-layered:active::before {
  opacity: 0;
  transition-duration: 0.05s;
}
/* layer 2 — a clean, even hairline rim (soft, not the uneven white/grey band) */
.depth-layered::after {
  opacity: 1;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.16),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.14);
}

/* ── Inset — carved INTO the surface (the only recessed one) ─────────────────
   Unlike every other type (which sit ON the page), this one reads as a hole cut
   into it. The trick: the fill is NEARLY the page colour, so it looks like the
   same surface pushed inward — then a hard dark shadow along the TOP inner edge
   (the near wall the light can't reach) and a bright highlight along the BOTTOM
   inner edge + a 1px light lip just BELOW the button (the far rim catching light).
   No outer drop shadow (recessed things don't float). Tuned for a light page. */
.depth-inset {
  color: #5b6473;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
  background: linear-gradient(180deg, #dfe3ea 0%, #eef1f6 100%);
  box-shadow:
    inset 0 3px 4px -1px rgba(60, 70, 90, 0.5),
    inset 0 6px 10px -6px rgba(60, 70, 90, 0.45),
    inset 0 -2px 2px -1px rgba(255, 255, 255, 0.95),
    inset 0 0 0 1px rgba(60, 70, 90, 0.12),
    0 1px 0 0 rgba(255, 255, 255, 0.9); /* the lit far lip below the cut */
}
.depth-inset:hover {
  transform: none; /* recessed things don't lift */
  box-shadow:
    inset 0 4px 6px -1px rgba(60, 70, 90, 0.58),
    inset 0 8px 12px -6px rgba(60, 70, 90, 0.5),
    inset 0 -2px 2px -1px rgba(255, 255, 255, 1),
    inset 0 0 0 1px rgba(60, 70, 90, 0.16),
    0 1px 0 0 rgba(255, 255, 255, 0.9);
}
.depth-inset:active {
  /* press flattens the depth — the cut shallows */
  box-shadow:
    inset 0 1px 2px 0 rgba(60, 70, 90, 0.4),
    inset 0 0 0 1px rgba(60, 70, 90, 0.12);
}

/* ── Glass — real refraction through an SVG displacement filter ──────────────
   The background is bent through the button, not just blurred. A tiny SVG filter
   (feImage of a red/blue gradient map -> three per-channel feDisplacementMaps ->
   blended) refracts what is behind it, then we stack glass highlights on top: a
   gradient border ring (::before), an inner diagonal shine (::after), a top edge
   light line, and a layered outer glow. Needs the <svg id="liquid-glass-filter">
   present in the document (see color-depth.html). Put it over something colorful.
   Falls back to a plain blur where url() backdrop filters aren't supported. */
.depth-glass {
  /* white text reads on the (often busy/photo) background behind the glass */
  color: #ffffff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.12) 100%
  );
  -webkit-backdrop-filter: blur(2px) saturate(1.5) brightness(1.05);
  backdrop-filter: blur(2px) saturate(1.5) brightness(1.05);
  box-shadow:
    0 8px 32px rgba(31, 38, 135, 0.15),
    inset 0 0 0 1px rgba(255, 255, 255, 0.18),
    0 4px 24px rgba(0, 0, 0, 0.06),
    inset 0 1px 1px rgba(255, 255, 255, 0.4);
}
@supports (backdrop-filter: url(#liquid-glass-filter)) or
  (-webkit-backdrop-filter: url(#liquid-glass-filter)) {
  .depth-glass {
    -webkit-backdrop-filter: url(#liquid-glass-filter) saturate(1.5) brightness(1.05);
    backdrop-filter: url(#liquid-glass-filter) saturate(1.5) brightness(1.05);
  }
}
.depth-glass::before {
  opacity: 1;
  padding: 1px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0.1) 45%,
    transparent 100%
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}
.depth-glass::after {
  opacity: 0.8;
  inset: 2px;
  border-radius: inherit;
  background:
    linear-gradient(to right, transparent 10%, rgba(255, 255, 255, 0.6) 50%, transparent 90%)
      top / 100% 1px no-repeat,
    linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%);
}
.depth-glass:hover {
  box-shadow:
    0 12px 40px rgba(31, 38, 135, 0.2),
    inset 0 0 0 1px rgba(255, 255, 255, 0.25),
    0 6px 30px rgba(0, 0, 0, 0.08),
    inset 0 2px 2px rgba(255, 255, 255, 0.5);
}

/* ── Foil — iridescent metal that reacts to the cursor ───────────────────────
   The richest one: a silver metal base with a holographic rainbow that shifts,
   soft coloured "film" blobs, a pearly sheen, a moving shine band and a glare
   dot at the cursor. Built from stacked CHILD layers (not just pseudo-elements)
   because it needs five. A tiny JS driver feeds --pointer-x/y, --glare-x/y,
   --foil-shift and --shine-angle while hovering; without JS it still shows a
   handsome static foil. Markup:
     <button class="depth-btn depth-foil">
       <span class="depth-foil-l depth-foil-base"></span>
       <span class="depth-foil-l depth-foil-film"></span>
       <span class="depth-foil-l depth-foil-pearl"></span>
       <span class="depth-label">Get Started</span>
       <span class="depth-foil-l depth-foil-shine"></span>
       <span class="depth-foil-l depth-foil-glare"></span>
     </button>  */
.depth-foil {
  --foil-shift: 0%;
  --glare-x: 50%;
  --glare-y: 50%;
  --pointer-x: 50%;
  --pointer-y: 50%;
  --shine-angle: 135deg;
  color: #14202e;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
  overflow: hidden;
  background: linear-gradient(135deg, #eee 0%, #dcdcdc 40%, #c9c9c9 72%, #e8e8e8 100%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.5),
    inset 0 1px 1px rgba(255, 255, 255, 0.7),
    inset 0 -2px 4px rgba(60, 70, 90, 0.3),
    0 3px 10px rgba(30, 38, 56, 0.3);
}
.depth-foil-l {
  position: absolute;
  inset: -48%;
  z-index: 1;
  background-repeat: no-repeat;
  pointer-events: none;
}
/* the rainbow band over silver — visible at rest, and it drifts on its own so
   the foil shimmers without the cursor. The JS driver nudges --foil-shift on
   hover, which composes on top of the ambient drift via translateX. */
.depth-foil-base {
  background: linear-gradient(
    112deg,
    transparent 22%,
    rgba(0, 220, 255, 0.4) 30%,
    rgba(80, 255, 190, 0.34) 36%,
    rgba(190, 255, 80, 0.26) 41%,
    rgba(255, 230, 70, 0.24) 47%,
    rgba(255, 70, 180, 0.36) 55%,
    rgba(150, 90, 255, 0.36) 63%,
    rgba(60, 120, 255, 0.3) 70%,
    transparent 80%
  );
  background-size: 240% 100%;
  filter: saturate(1.3) contrast(1.25);
  /* Ambient drift ONLY (background-position). The pointer does NOT move this
     layer — that's what made it jump/lose state on hover. The rainbow just
     glides on its own; the cursor drives the highlight layers below instead. */
  animation: depth-foil-drift 7s ease-in-out infinite alternate;
}
/* soft coloured film blobs — also visible at rest, gently breathing */
.depth-foil-film {
  background:
    radial-gradient(ellipse at 20% 30%, rgba(255, 70, 180, 0.34) 0%, transparent 48%),
    radial-gradient(ellipse at 70% 20%, rgba(0, 220, 255, 0.34) 0%, transparent 52%),
    radial-gradient(ellipse at 78% 74%, rgba(80, 255, 190, 0.34) 0%, transparent 56%);
  background-size: 150% 150%, 160% 160%, 145% 145%;
  filter: blur(0.4px) saturate(1.4);
  mix-blend-mode: screen;
  opacity: 0.7;
  animation: depth-foil-drift 9s ease-in-out infinite alternate-reverse;
}
@keyframes depth-foil-drift {
  from {
    background-position: 0% center;
  }
  to {
    background-position: 100% center;
  }
}
@media (prefers-reduced-motion: reduce) {
  .depth-foil-base,
  .depth-foil-film {
    animation: none;
  }
}
/* pearly sheen — a soft moving highlight that tracks the cursor smoothly */
.depth-foil-pearl {
  z-index: 2;
  inset: 0; /* keep it on-box so its position math is stable, no jump */
  background: radial-gradient(
    120% 120% at var(--glare-x, 50%) var(--glare-y, 50%),
    rgba(230, 238, 245, 0.6) 0%,
    rgba(205, 217, 226, 0.2) 26%,
    transparent 58%
  );
  mix-blend-mode: soft-light;
  opacity: 0.95;
  transition: background 0.12s linear; /* smooth the cursor tracking */
}
/* the travelling shine band, angled by the cursor */
.depth-foil-shine {
  z-index: 4;
  inset: 0;
  background: linear-gradient(
    var(--shine-angle, 120deg),
    transparent 30%,
    rgba(226, 235, 242, 0.5) 48%,
    rgba(0, 124, 255, 0.1) 58%,
    rgba(255, 0, 147, 0.1) 66%,
    transparent 82%
  );
  background-size: 200% 100%;
  background-position: calc(var(--pointer-x, 50%)) center;
  filter: blur(0.25px);
  mix-blend-mode: screen;
  opacity: 0.6;
  transition: background-position 0.12s linear;
}
/* a bright glare dot right under the cursor */
.depth-foil-glare {
  z-index: 5;
  inset: 0;
  background: radial-gradient(
    circle at var(--glare-x, 50%) var(--glare-y, 50%),
    rgba(230, 238, 245, 0.55) 0%,
    rgba(205, 218, 228, 0.16) 10%,
    transparent 38%
  );
  mix-blend-mode: screen;
  opacity: 0.5;
  transition: background 0.12s linear;
}
@media (prefers-reduced-motion: reduce) {
  .depth-foil-l {
    transition: none;
  }
}

/* ── Neon — a crisp lit outline (a clean line, not a bloom) ──────────────────
   Restrained on purpose: the depth is one precise bright RING drawn as a solid
   line, with only a whisper of glow so it reads as a lit tube, not a shadow
   storm. A very slight inner tint from the bottom grounds the body. Hover firms
   the line and adds the faintest bloom. Refined, "in line", not shadowy. */
.depth-neon {
  --neon: #35f0ff;
  color: #eafeff;
  background:
    linear-gradient(180deg, rgba(53, 240, 255, 0) 55%, color-mix(in srgb, var(--neon) 12%, transparent) 100%),
    #0b1016;
  text-shadow: 0 0 5px color-mix(in srgb, var(--neon) 55%, transparent);
}
/* the ring: a clean 1px line with only the faintest inner glow — no outer bloom */
.depth-neon::before {
  opacity: 1;
  box-shadow:
    inset 0 0 0 1px var(--neon),
    inset 0 0 2px 0 color-mix(in srgb, var(--neon) 45%, transparent);
  transition: box-shadow 0.25s ease;
}
.depth-neon:hover::before {
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--neon) 55%, #fff),
    inset 0 0 4px 0 color-mix(in srgb, var(--neon) 60%, transparent),
    0 0 4px -2px color-mix(in srgb, var(--neon) 50%, transparent);
}

/* ── Duotone — a hard-bevel extruded key (crisp, not soft) ───────────────────
   No blur in the depth: a bright top FACE gradient, then a solid darker "side"
   under it built from stacked 1px box-shadows (the extrusion), so it looks like
   a chunky moulded plastic key. Pressing pushes it down onto its own side. */
.depth-duotone {
  background: linear-gradient(180deg, #ff8a4b 0%, #f2612f 100%);
  color: #fff;
  text-shadow: 0 1px 0 rgba(140, 50, 10, 0.6);
  box-shadow:
    inset 0 1px 0 rgba(255, 220, 190, 0.9),
    /* the extruded side: stacked hard shadows in the darker tone */
    0 1px 0 #c9481c,
    0 2px 0 #c9481c,
    0 3px 0 #b23f18,
    0 4px 0 #b23f18,
    0 5px 0 #9c3714,
    0 6px 0 #9c3714,
    0 8px 8px rgba(120, 40, 10, 0.35);
  transition:
    transform 0.12s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.12s ease;
}
.depth-duotone:hover {
  transform: translateY(-1px);
}
.depth-duotone:active {
  /* slam down onto the extrusion */
  transform: translateY(5px);
  box-shadow:
    inset 0 1px 0 rgba(255, 220, 190, 0.9),
    0 1px 0 #b23f18,
    0 2px 4px rgba(120, 40, 10, 0.35);
}

/* ── Satin — a single flat colour with the softest possible dome ─────────────
   Deliberately the OPPOSITE of Glossy: no gradient body, no specular, no top
   light bar. One solid pastel, and the only depth is a very soft radial vignette
   baked into the background (brighter centre, a hair darker at the rim) plus a
   whisper-thin inner ring. Nothing hard anywhere — pure smooth matte. */
.depth-satin {
  color: #6a4a86;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.6);
  background:
    radial-gradient(
      120% 140% at 50% 38%,
      rgba(255, 255, 255, 0.5) 0%,
      rgba(255, 255, 255, 0) 55%
    ),
    radial-gradient(
      130% 130% at 50% 100%,
      rgba(150, 120, 200, 0.22) 0%,
      rgba(150, 120, 200, 0) 60%
    ),
    #e7dcfb;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.45),
    0 6px 18px -6px rgba(160, 130, 210, 0.4);
  transition:
    filter 0.25s ease,
    transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}
.depth-satin:hover {
  filter: brightness(1.03);
}
.depth-satin:active {
  box-shadow:
    inset 0 2px 6px 0 rgba(150, 120, 200, 0.4),
    inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}
`;e.s(["COLOR_DEPTH_CSS",0,a],43682);var r=e.i(43476);let i="data:image/svg+xml,"+encodeURIComponent('<svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="r" x1="0%" x2="100%"><stop offset="0%" stop-color="#f00"/><stop offset="50%" stop-color="#808080"/><stop offset="100%" stop-color="#0f0"/></linearGradient><linearGradient id="b" y1="0%" y2="100%"><stop offset="0%" stop-color="#00f"/><stop offset="50%" stop-color="#808080"/><stop offset="100%" stop-color="#ff0"/></linearGradient></defs><rect width="200" height="80" rx="40" fill="url(#r)"/><rect width="200" height="80" rx="40" fill="url(#b)" style="mix-blend-mode:overlay"/><rect x="14" y="14" width="172" height="52" rx="26" fill="#808080" style="filter:blur(14px)"/></svg>');e.s(["LiquidGlassFilter",0,function(){return(0,r.jsx)("svg",{"aria-hidden":!0,width:"0",height:"0",style:{position:"absolute",pointerEvents:"none"},children:(0,r.jsx)("defs",{children:(0,r.jsxs)("filter",{id:"liquid-glass-filter",colorInterpolationFilters:"sRGB",children:[(0,r.jsx)("feImage",{href:i,x:"0",y:"0",width:"100%",height:"100%",result:"map"}),(0,r.jsx)("feDisplacementMap",{in:"SourceGraphic",in2:"map",scale:-14,xChannelSelector:"R",yChannelSelector:"G",result:"dispRed"}),(0,r.jsx)("feColorMatrix",{in:"dispRed",type:"matrix",values:"1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0",result:"red"}),(0,r.jsx)("feDisplacementMap",{in:"SourceGraphic",in2:"map",scale:-13,xChannelSelector:"R",yChannelSelector:"G",result:"dispGreen"}),(0,r.jsx)("feColorMatrix",{in:"dispGreen",type:"matrix",values:"0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0",result:"green"}),(0,r.jsx)("feDisplacementMap",{in:"SourceGraphic",in2:"map",scale:-12,xChannelSelector:"R",yChannelSelector:"G",result:"dispBlue"}),(0,r.jsx)("feColorMatrix",{in:"dispBlue",type:"matrix",values:"0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0",result:"blue"}),(0,r.jsx)("feBlend",{in:"red",in2:"green",mode:"screen",result:"rg"}),(0,r.jsx)("feBlend",{in:"rg",in2:"blue",mode:"screen",result:"output"}),(0,r.jsx)("feGaussianBlur",{in:"output",stdDeviation:"0.4"})]})})})}],58556);var n=e.i(71645);let o=new Set(["depth-metal","depth-foil"]),s=(e,t,a)=>Math.min(Math.max(e,t),a);function l(e,t,a=!0){(0,n.useEffect)(()=>{let r=e.current;if(!r||!a||!o.has(t)||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;let i=0,n=.5,l=.5,d=()=>{i=0;let e=r.style;e.setProperty("--pointer-x",`${(100*n).toFixed(1)}%`),e.setProperty("--pointer-y",`${(100*l).toFixed(1)}%`),e.setProperty("--glare-x",`${(100*n).toFixed(1)}%`),e.setProperty("--glare-y",`${(100*l).toFixed(1)}%`),e.setProperty("--shine-angle",`${(110+(n-.5)*50).toFixed(1)}deg`)},h=()=>{i||(i=requestAnimationFrame(d))},p=e=>{let t=r.getBoundingClientRect();t.width&&t.height&&(n=s((e.clientX-t.left)/t.width,0,1),l=s((e.clientY-t.top)/t.height,0,1)),h()},g=()=>{n=.5,l=.5,h()};return r.addEventListener("pointermove",p,{passive:!0}),r.addEventListener("pointerleave",g),()=>{r.removeEventListener("pointermove",p),r.removeEventListener("pointerleave",g),i&&cancelAnimationFrame(i)}},[e,t,a])}let d=e=>"depth-foil"===e;e.s(["isFoil",0,d,"useDepthPointer",0,l],75174);var h=e.i(38362),p=e.i(37878);function g({on:e}){return e?(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("span",{"aria-hidden":!0,className:"depth-foil-l depth-foil-base"}),(0,r.jsx)("span",{"aria-hidden":!0,className:"depth-foil-l depth-foil-film"}),(0,r.jsx)("span",{"aria-hidden":!0,className:"depth-foil-l depth-foil-pearl"})]}):null}function c({on:e}){return e?(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("span",{"aria-hidden":!0,className:"depth-foil-l depth-foil-shine"}),(0,r.jsx)("span",{"aria-hidden":!0,className:"depth-foil-l depth-foil-glare"})]}):null}function b(){return(0,r.jsxs)("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,r.jsx)("path",{d:"M5 12h14"}),(0,r.jsx)("path",{d:"m13 6 6 6-6 6"})]})}e.s(["DepthButton",0,function({className:e,size:a="lg",as:i="button",shape:o="pill"}){let s=(0,n.useRef)(null);l(s,e,"button"===i);let f=d(e),x=(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(g,{on:f}),(0,r.jsx)("span",{className:"depth-label",children:"icon"===o?(0,r.jsx)(b,{}):t}),(0,r.jsx)(c,{on:f})]}),u=`depth-btn ${e} ${"icon"===o?"depth-icon":""} ${"sm"===a?"!h-6 !px-3 !text-[11px]":""}`;return"span"===i?(0,r.jsx)("span",{ref:s,className:u,children:x}):(0,r.jsx)("button",{ref:s,type:"button","aria-label":"icon"===o?t:void 0,className:u,onClick:p.hapticTap,onPointerEnter:h.hoverLink,children:x})},"FoilBase",0,g,"FoilTop",0,c],77029)},27039,e=>{"use strict";var t=e.i(43476),a=e.i(71645),r=e.i(265),i=e.i(43682);let n=/\.depth-(btn|label|icon|toggle|knob|foil-l|foil-base|foil-film|foil-pearl|foil-shine|foil-glare)\b/;var o=e.i(58556),s=e.i(77029),l=e.i(75174),d=e.i(37878),h=e.i(38362);function p({className:e}){let r=(0,a.useRef)(null);(0,l.useDepthPointer)(r,e);let[i,n]=(0,a.useState)(!0),o=(0,l.isFoil)(e);return(0,t.jsxs)("button",{ref:r,type:"button",role:"switch","aria-checked":i,"aria-label":"Toggle",onPointerEnter:h.hoverLink,onClick:()=>{(0,d.hapticTap)(),n(e=>!e)},className:`depth-btn ${e} depth-toggle`,"data-on":i,children:[(0,t.jsx)(s.FoilBase,{on:o}),(0,t.jsx)("span",{"aria-hidden":!0,className:"depth-knob"}),(0,t.jsx)(s.FoilTop,{on:o})]})}var g=e.i(95795),c=e.i(92899);let b=e=>"glass"===e.id?"bg-[url('/vault/grid/grid-11.webp')] bg-cover bg-center":"bg-[#f4f5f8]";e.s(["ColorDepthPlayground",0,function(){let[e,l]=(0,a.useState)(0),f=r.RECIPES[e],x=(0,a.useMemo)(()=>(function(e,t){let a=`.depth-${t}`,r=e=>n.test(e),i=function(e){let t=[],a=0,r=e.length;for(;a<r;){let i=e.indexOf("{",a);if(-1===i)break;let n=0,o=i;for(;o<r;o++)if("{"===e[o])n++;else if("}"===e[o]&&0==--n)break;let s=e.slice(a,o+1).trim(),l=e.slice(a,i).trim();t.push({header:l,body:e.slice(i+1,o),whole:s}),a=o+1}return t}(e),o=[];for(let e of i)!e.header.startsWith("@keyframes")&&(e.header.startsWith("@")?(e.whole.includes(a)||r(e.header))&&o.push(e):(r(e.header)||e.header.includes(a))&&o.push(e));let s=new Set;for(let e of o)for(let t of e.whole.matchAll(/animation(?:-name)?\s*:\s*([^;]+);/g))for(let e of t[1].split(",")){let t=e.trim().split(/\s+/)[0];t&&!/^(none|inherit|initial|unset)$/.test(t)&&s.add(t)}return[...o,...i.filter(e=>{let t=e.header.match(/^@keyframes\s+([\w-]+)/);return t&&s.has(t[1])})].map(e=>e.whole).join("\n\n")+"\n"})(i.COLOR_DEPTH_CSS,f.id),[f.id]);return(0,t.jsxs)("div",{className:"flex min-w-0 flex-col gap-4",children:[(0,t.jsx)("style",{dangerouslySetInnerHTML:{__html:i.COLOR_DEPTH_CSS}}),(0,t.jsx)(o.LiquidGlassFilter,{}),(0,t.jsx)(c.SectionLabel,{action:(0,t.jsx)(g.CopyButton,{text:x,label:"Copy CSS"}),children:"Implementation"}),(0,t.jsxs)("div",{className:`relative flex min-h-[180px] items-center justify-center overflow-hidden rounded-xl border border-[var(--border-line)] px-4 py-6 sm:min-h-[220px] sm:px-6 sm:py-8 ${b(f)}`,children:[(0,t.jsxs)("div",{className:"flex origin-center scale-[0.78] items-center gap-2.5 sm:scale-100 sm:gap-4",children:[(0,t.jsx)(s.DepthButton,{className:f.className}),(0,t.jsx)(s.DepthButton,{className:f.className,shape:"icon"}),(0,t.jsx)(p,{className:f.className})]}),(0,t.jsx)("span",{className:"pointer-events-none absolute bottom-3 left-4 text-[12px] font-medium tracking-wide text-white/70 mix-blend-difference",children:f.name}),"foil"===f.id&&(0,t.jsx)("a",{href:"https://www.dqnamo.com/experiments/iridescent-foil",target:"_blank",rel:"noopener noreferrer",className:"absolute bottom-3 right-4 text-[12px] font-medium tracking-wide text-white/70 underline decoration-white/30 underline-offset-2 mix-blend-difference transition-colors hover:text-white",children:"credits to dqnamo"})]}),(0,t.jsx)("div",{className:"grid grid-cols-2 gap-2 sm:grid-cols-4",children:r.RECIPES.map((a,r)=>(0,t.jsxs)("button",{type:"button",onClick:()=>{(0,d.hapticTap)(),l(r)},onPointerEnter:h.hoverLink,"aria-pressed":r===e,className:`flex flex-col items-center gap-1 rounded-lg border px-1 pt-1 pb-0.5 transition-colors duration-150 ease-[var(--ease-out)] ${r===e?"border-[var(--border-ring)] bg-[var(--bg-hover)]":"border-[var(--border-line)] hover:bg-[var(--bg-hover)]"}`,children:[(0,t.jsx)("span",{className:`flex h-12 w-full items-center justify-center overflow-hidden rounded-md ${b(a)}`,children:(0,t.jsx)(s.DepthButton,{className:a.className,size:"sm",as:"span"})}),(0,t.jsx)("span",{className:"text-[11px] font-medium text-[var(--text-primary)]",children:a.name})]},a.id))})]})}],27039)},35399,e=>{e.n(e.i(27039))}]);