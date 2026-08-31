(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,46975,e=>{"use strict";var t=e.i(43476),o=e.i(71645);let a=`
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`,s=`
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uDir;   // (radius/width, 0) then (0, radius/height)
uniform float uMorph;
uniform sampler2D uTexB;
uniform float uUseMorph;
uniform float uPartOut;      // outgoing halo's dissolve clock (leads)
uniform float uPartIn;       // incoming halo's (trails) — together they open the held breath
uniform float uLetterSpread; // per-letter stagger, must match the composite's
// variable focus: the reference is sharp in the MIDDLE of the word and blurry at the ends
// (a depth-of-field). uFocus.xy = word left/right edge (0..1), uFocusAmt scales the effect.
uniform vec2  uFocus;
uniform float uFocusAmt;
// NOTE: do NOT drive the focal point from the cursor here. This blur is SEPARABLE (H pass then V
// pass), which assumes a radius that is uniform along the axis being blurred. The existing focus
// term already varies the radius by x, but gently and symmetrically about a STATIC centre, so
// neighbouring columns still sample at nearly the same step and the 9 taps overlap. Sliding that
// centre toward the pointer pushes the far side of the word well past that budget: adjacent
// columns take visibly different steps, the taps stop overlapping, and the halo breaks into hard
// vertical columns (plus smearing on the letters). A cursor rack needs a non-separable blur.

float bhash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float bvnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  float a = bhash(i), b2 = bhash(i+vec2(1.0,0.0));
  float c = bhash(i+vec2(0.0,1.0)), d = bhash(i+vec2(1.0,1.0));
  return mix(mix(a,b2,u.x), mix(c,d,u.x), u.y);
}
float bfbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ v += a * bvnoise(p); p = p * 2.0 + 11.0; a *= 0.5; }
  return v;
}
// TRANSITION — a CLOUD DISSOLVE. We sweep a threshold through a static fractal field, so the new
// word appears as organic islands that grow and merge — not a directional line. 0 = old, 1 = new.
// A faint gradient bias keeps it globally progressing so no island is left behind.
//
// The FIELD must stay byte-identical to the composite's transitionMask so the body and the halo
// dissolve through the same shapes. Only the THRESHOLD differs: this pass is fed the LEAD morph
// and the composite the LAG morph, so the incoming halo blooms ~57ms before its letters resolve
// (and the outgoing glow lingers past its body). See MORPH_LEAD / MORPH_LAG in params.ts.
// The m argument is pre-shaped on the CPU: exactly 0 at the start and exactly 1 at the end.
float bTransition(vec2 uv, float m){
  // DOMAIN-WARPED fbm: warp the sample point by another fbm so the reveal field flows in
  // tendrils/smoke shapes rather than round blobs — a more unique, organic "ink unfurling" form.
  vec2 q = vec2(bfbm(uv * 2.1 + 3.7), bfbm(uv * 2.1 - 1.3));
  float n = bfbm(uv * 3.0 + q * 1.1);                    // static warped cloud field ~0..1
  float bias = (uv.x * 0.8 + uv.y * 0.2) * 0.30;         // gentle global drift so it fully clears
  float field = clamp(n * 0.74 + bias, 0.0, 1.0);        // 0..1 organic field
  const float BAND = 0.26;                               // wider soft band → silkier, smoother front
  // threshold sweeps from ABOVE all field values (mask 0 = OLD everywhere) DOWN to below all of
  // them (mask 1 = NEW). Monotonic 0→1 across the morph (no reappear); highest field reveals first.
  float thr = mix(1.0 + BAND, -BAND, m);
  return smoothstep(thr - BAND, thr + BAND, field);
}
// Per-letter window, matching the composite's letterPhase exactly so the halo dissolves on the
// same clock as the body it belongs to.
float bLetterPhase(sampler2D tex, vec2 uv, float m, float spread){
  float idx = texture2D(tex, uv).r;
  return clamp((m * (1.0 + spread)) - idx * spread, 0.0, 1.0);
}
vec4 samp(vec2 uv){
  if (uUseMorph > 0.5) {
    // Same two-sided exchange as the composite's cover(): the outgoing halo leaves on its own
    // clock and the incoming one arrives on its own, so the glow opens the same held breath the
    // letters do. Level 0 samples the raw masks, so the red channel is intact here.
    vec4 aTex = texture2D(uTex, uv);
    vec4 bTex = texture2D(uTexB, uv);
    float outM = bTransition(uv, bLetterPhase(uTex,  uv, uPartOut, uLetterSpread));
    float inM  = bTransition(uv, bLetterPhase(uTexB, uv, uPartIn,  uLetterSpread));
    return max(aTex * (1.0 - outM), bTex * inM);
  }
  return texture2D(uTex, uv);
}
void main(){
  // focus factor: ~0 at the word centre (stay sharp), rising toward 1 at both ends (blur more)
  float mid = (uFocus.x + uFocus.y) * 0.5;
  float halfW = max(0.001, (uFocus.y - uFocus.x) * 0.5);
  float ends = clamp(abs(vUv.x - mid) / halfW, 0.0, 1.6);
  float focus = 1.0 + uFocusAmt * ends * ends;   // radius multiplier, 1 in the centre
  vec2 dir = uDir * focus;

  // 9-tap gaussian weights (sigma ~2), normalized
  float w0 = 0.2270270270;
  float w1 = 0.1945945946;
  float w2 = 0.1216216216;
  float w3 = 0.0540540541;
  float w4 = 0.0162162162;
  vec4 c = samp(vUv) * w0;
  c += samp(vUv + dir * 1.0) * w1;
  c += samp(vUv - dir * 1.0) * w1;
  c += samp(vUv + dir * 2.0) * w2;
  c += samp(vUv - dir * 2.0) * w2;
  c += samp(vUv + dir * 3.0) * w3;
  c += samp(vUv - dir * 3.0) * w3;
  c += samp(vUv + dir * 4.0) * w4;
  c += samp(vUv - dir * 4.0) * w4;
  gl_FragColor = c;
}`,r=`
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;

uniform sampler2D uMask;   // sharp word (glow core, alpha)
uniform sampler2D uMaskB;  // incoming word during a cross-dissolve
uniform sampler2D uL0;     // blur levels (smooth halo), coarsest-first weighting below
uniform sampler2D uL1;
uniform sampler2D uL2;
uniform sampler2D uL3;
uniform vec2  uRes;
uniform float uMorph;
uniform float uPartOut;    // the OUTGOING word's own dissolve clock — runs slightly ahead
uniform float uPartIn;     // the INCOMING word's — trails it, opening the held breath between
uniform float uLetterSpread; // how much of the morph separates the first glyph from the last
uniform float uFront;      // 0..1 heat on the dissolve front, faded in/out with the morph
uniform vec2  uCursor;     // 0..1
uniform float uCursorOn;
uniform float uWarpRadius; // hot-spot radius (fraction of the shorter edge) — tight, so it's local
uniform float uWarpAmp;    // peak sample displacement, UV
uniform float uWarpSwirl;  // 0 = pure push-away, 1 = pure rotation
uniform vec2  uWarpVel;    // smoothed cursor velocity — the letters get dragged along it
uniform float uWarpDrag;   // how strongly the wake pulls
uniform float uWarpStretch; // anisotropy: elongates the disturbance along the direction of travel
uniform float uPhase;
uniform float uBloom;      // breathe multiplier on the halo REACH (see the glow field below)
uniform vec2  uCast0;      // per-level cast offsets: the halo is displaced along one vector so the
uniform vec2  uCast1;      // word reads as lit from a direction instead of evenly outlined.
uniform vec2  uCast2;      // Magnitudes grow with each level's blur radius, so the family stays
uniform vec2  uCast3;      // concentric near the letters and separates further out.

uniform float uPos[5];
uniform vec3  uCol[5];
uniform vec3  uInk;    // letter-body colour (tinted per palette, not plain black)
uniform vec3  uPaper;  // page colour (light)
uniform float uGrain;  // grain (film noise) strength, 0 = off. Blur-glow passes ~0.4.

float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
// smooth 2D value noise + fbm for the CLOUD-DISSOLVE transition
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  float a = hash(i), b2 = hash(i+vec2(1.0,0.0));
  float c = hash(i+vec2(0.0,1.0)), d = hash(i+vec2(1.0,1.0));
  return mix(mix(a,b2,u.x), mix(c,d,u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ v += a * vnoise(p); p = p * 2.0 + 11.0; a *= 0.5; }
  return v;
}

// TRANSITION MASK — a CLOUD DISSOLVE. The FIELD below is byte-identical to the blur pass's
// bTransition so the sharp word body and the blurred halo dissolve through the same shapes (no
// misregistration). What differs is the THRESHOLD: this pass is driven by uMorph, which the CPU
// feeds the LAG-shaped morph while the blur pass gets the LEAD-shaped one — so the body resolves
// just after its own halo. Returns 0 (OLD) → 1 (NEW), exactly 0 at morph 0, exactly 1 at 1.
float transitionMask(vec2 uv, float m){
  // MUST be byte-identical to bTransition (domain-warped fbm) so body + halo reveal in lockstep.
  vec2 q = vec2(fbm(uv * 2.1 + 3.7), fbm(uv * 2.1 - 1.3));
  float n = fbm(uv * 3.0 + q * 1.1);
  float bias = (uv.x * 0.8 + uv.y * 0.2) * 0.30;
  float field = clamp(n * 0.74 + bias, 0.0, 1.0);
  const float BAND = 0.26;
  float thr = mix(1.0 + BAND, -BAND, m);
  return smoothstep(thr - BAND, thr + BAND, field);
}

// ── per-letter, two-sided dissolve ──────────────────────────────────────────────────────────
// The cloud field alone doesn't know where the letters are, so the word dissolves like weather
// passing over it. The mask's RED channel carries each glyph's position in the word (0..1), which
// lets each letter cross over on its own clock: the word is UNWRITTEN left-to-right and REWRITTEN
// left-to-right, each letter still cloud-dissolving internally.
//
// The two words also do NOT share one threshold. The outgoing word leaves slightly AHEAD of the
// incoming word's arrival (uPartOut vs uPartIn), which opens a held breath in the middle of the
// transition — an instant where the old letters are nearly gone and the new ones have barely
// begun, and the card is almost pure glow. That negative space is the point.
float letterPhase(sampler2D tex, vec2 uv, float m, float spread){
  float idx = texture2D(tex, uv).r;          // 0 at the first glyph, 1 at the last
  // Compress the global morph into a per-letter window. Earlier letters get a head start; the
  // window is widened so every letter still completes inside the morph (never strands a glyph).
  float local = (m * (1.0 + spread)) - idx * spread;
  return clamp(local, 0.0, 1.0);
}
float coverA(vec2 uv){ return texture2D(uMask, uv).a; }
float coverB(vec2 uv){ return texture2D(uMaskB, uv).a; }
// Coverage during a transition. Each word is gated by its OWN cloud threshold, so they can be
// out of phase rather than cross-fading through a muddy 50/50 midpoint.
float cover(vec2 uv){
  float outM = transitionMask(uv, letterPhase(uMask,  uv, uPartOut, uLetterSpread));
  float inM  = transitionMask(uv, letterPhase(uMaskB, uv, uPartIn,  uLetterSpread));
  // old fades by its own mask; new arrives by its own. Not a mix — an exchange.
  return max(coverA(uv) * (1.0 - outM), coverB(uv) * inM);
}

vec3 gradientMap(float x){
  vec3 c = uCol[0];
  c = mix(c, uCol[1], smoothstep(uPos[0], uPos[1], x));
  c = mix(c, uCol[2], smoothstep(uPos[1], uPos[2], x));
  c = mix(c, uCol[3], smoothstep(uPos[2], uPos[3], x));
  c = mix(c, uCol[4], smoothstep(uPos[3], uPos[4], x));
  return c;
}

// soft-light blend (Photoshop formula) — used for the grain, like the PSD's noise layer
vec3 softLight(vec3 base, float g){
  vec3 s = vec3(g);
  vec3 lo = 2.0*base*s + base*base*(1.0 - 2.0*s);
  vec3 hi = 2.0*base*(1.0 - s) + sqrt(base)*(2.0*s - 1.0);
  return mix(lo, hi, step(0.5, s));
}

// ── cursor warp ─────────────────────────────────────────────────────────────────────────────
// Displace the sample point around the pointer so the LETTERFORMS themselves bulge and flow,
// rather than just brightening. Two components, combined:
//   - a push directly away from the cursor (the bulge)
//   - a perpendicular swirl (the flow — keeps it from reading as a plain magnifier)
// Falloff is smooth and compactly supported, so the displacement and its gradient both reach
// exactly zero at the edge of the hot-spot: no seam where the warp stops.
vec2 warpUV(vec2 uv){
  if (uCursorOn < 0.001) return uv;
  float asp = uRes.x / max(1.0, uRes.y);
  vec2 d = (uv - uCursor) * vec2(asp, 1.0);   // aspect-corrected, so the field is round
  float r = length(d);
  float R = uWarpRadius;
  if (r > R || r < 1e-5) return uv;
  float f = 1.0 - r / R;
  f = f * f * (3.0 - 2.0 * f);                 // smooth, zero value AND slope at the rim
  vec2 dir = d / r;
  vec2 swirl = vec2(-dir.y, dir.x);
  vec2 push = mix(dir, swirl, uWarpSwirl);

  // WAKE: the letters are also dragged along the cursor's own travel, so moving across the word
  // pulls the glyphs after the pointer like it's stirring them, and they settle back when it
  // stops. This is what makes the interaction read as a material responding rather than a lens
  // sitting on top — a static bulge follows the cursor, a wake is CAUSED by it.
  push += uWarpVel * uWarpDrag;

  // STRETCH ALONG TRAVEL: an isotropic bulge is the generic effect — every cursor toy does it.
  // Anisotropy is what gives a deformation a MATERIAL. The field is squashed perpendicular to the
  // direction of motion and elongated along it, so the disturbance is a lens-shaped smear trailing
  // the pointer rather than a circle. When the cursor rests it relaxes back to round.
  float speed = length(uWarpVel);
  if (speed > 0.02) {
    vec2 vdir = uWarpVel / speed;
    float along = dot(d / r, vdir);            // -1..1, how aligned this pixel is with travel
    float stretch = 1.0 + uWarpStretch * clamp(speed, 0.0, 1.0) * (along * along - 0.35);
    f *= clamp(stretch, 0.0, 2.2);
  }

  // A travelling ripple. Deliberately kept to HALF a spatial cycle across the radius: banding
  // comes from the displacement's spatial gradient, and a full-cycle ripple was measured at 0.75
  // of an L0 tap step (3x over budget — it would have banded exactly like the old focus rack).
  // Most of the motion is carried by the TIME term instead, which costs no spatial gradient at
  // all, so the wave still visibly travels outward while staying well inside the budget.
  float ripple = 1.0 + 0.16 * sin(r / R * 3.1416 - uPhase * 5.0);

  // NON-UNIFORM RECOVERY: the trailing edge relaxes more slowly than the leading edge pushes, so
  // the material looks like it has a little viscosity rather than snapping back symmetrically.
  float lead = 0.5 + 0.5 * dot(normalize(d + 1e-6), normalize(uWarpVel + 1e-6));
  float visc = mix(1.15, 0.85, lead);

  return uv + push * (f * ripple * visc * uWarpAmp * uCursorOn) / vec2(asp, 1.0);
}

void main(){
  // Every mask read below goes through the warped point, so the glyphs deform as one piece.
  // The wide blur levels are deliberately left on the UNWARPED uv (see uWarpAmp docs).
  vec2 uv = warpUV(vUv);

  // Cursor hot-spot. Measured from the UNWARPED point so it doesn't chase its own displacement,
  // in px space so it stays circular on a wide card. Deliberately WIDER than the warp radius: the
  // warp is a tight local deformation, while this is a broad, soft lift of the colour field, so
  // the two read as different registers rather than one doubled-up effect at the same scale.
  float cd = distance(vUv * uRes, uCursor * uRes);
  float hot = uCursorOn * smoothstep(min(uRes.x, uRes.y) * uWarpRadius * 2.4, 0.0, cd);

  // ── glow field: crisp core + 4 smooth blur levels, weighted so the halo spreads wide and
  //    soft. Each level's alpha is the coverage smeared at that scale; summed they make one
  //    continuous falloff from letter core out into the paper.
  //
  //    Each level is sampled along the CAST vector (see uCast*), displaced further the coarser it
  //    is. The tight core stays put, so the light appears to come from one direction and the word
  //    lifts off the page instead of being ringed evenly.
  //
  //    The breathe (uBloom) is applied to the OUTER levels only. Summed weights are 3.68 against a
  //    2.45 divisor, so the field saturates across the letter cores — a breathe on every term is
  //    mathematically clipped exactly where the eye is looking, and only survives at the halo's
  //    edge. Driving the wide levels alone makes the halo's REACH breathe, which is visible. ──
  // amplified because it now only rides the wide levels. The cursor's halo contribution is kept
  // modest — a strong lift here is what read as a flashlight — but NOT zero: it's what makes the
  // glow swell under the pointer.
  float b = 1.0 + (uBloom - 1.0) * 1.25 + 0.14 * hot;
  // The crisp core and L0 follow the WARP (small kernels — the deformation reads there).
  // L1..L3 sample the UNWARPED point: their tap steps are 12-48px, so a warp is invisible in them
  // and displacing a kernel that wide is where banding risk would actually live.
  float glow =
      1.00 * cover(uv)
    + 0.92 * texture2D(uL0, uv + uCast0).a
    + 0.78 * texture2D(uL1, vUv + uCast1).a * b
    + 0.58 * texture2D(uL2, vUv + uCast2).a * b
    + 0.40 * texture2D(uL3, vUv + uCast3).a * b;
  glow = clamp(glow / 2.45, 0.0, 1.0);

  // Shape the field so the coloured band hugs the letters like the reference: the deep violet-
  // blue sits tight to the strokes, magenta mid, warm/paper on the soft outer falloff.
  float field = pow(glow, 0.6);
  // Lift the field under the cursor. This is the term that drives the GRADIENT MAP: pushing field
  // up walks those pixels toward the hot end of the palette ramp, so hovering shifts the colour
  // world locally rather than just adding white. Multiplied by the field itself so bare paper
  // stays untouched and only the word and its halo respond — a colour shift, not a spotlight.
  field = clamp(field + hot * 0.16 * field, 0.0, 1.0);

  // ── heat on the dissolve front ──
  // A real dissolve concentrates energy at its edge rather than fading uniformly. The cloud field
  // and the current threshold are both already computed, so the distance between them IS the
  // front: near zero exactly where the transition is happening right now. Spiking the glow along
  // that band makes the word look like it's BURNING across instead of fading. Costs one abs().
  // Gated by uFront so it exists only during a morph and is absent at rest.
  if (uFront > 0.001) {
    vec2 q = vec2(fbm(uv * 2.1 + 3.7), fbm(uv * 2.1 - 1.3));
    float n = fbm(uv * 3.0 + q * 1.1);
    float fieldN = clamp(n * 0.74 + (uv.x * 0.8 + uv.y * 0.2) * 0.30, 0.0, 1.0);
    float thrIn = mix(1.26, -0.26, uPartIn);
    float edge = 1.0 - smoothstep(0.0, 0.30, abs(fieldN - thrIn));
    // only where there's something to burn — the letters and their immediate halo
    field = clamp(field + edge * uFront * 0.30 * smoothstep(0.02, 0.45, glow), 0.0, 1.0);
  }

  // ── gradient map (keyed on luminance; invert field so paper=1 → light end, cores=0 → dark) ──
  float drift = 0.022 * sin(uPhase + uv.x * 3.0 + uv.y * 2.0);
  // The cursor also SLIDES the ramp lookup, not just the field feeding it. Because the palette is
  // a 5-stop colour ramp, shifting where a pixel lands on it changes its HUE — hovering pulls the
  // local colour world toward the ramp's hot end (violet→magenta→gold in Ultraviolet) instead of
  // merely making it brighter. This is the part that reads as the gradient responding to you.
  float t = clamp(1.0 - field + drift - hot * 0.10, 0.0, 1.0);
  vec3 col = gradientMap(t);

  // paper: where the field is ~0, force the exact page colour so the card background matches.
  // But paper next to a strong coloured light picks up a BOUNCE of it. uL3 is the widest, softest
  // level — reused here (no extra sampling cost) as a very weak, very broad wash of the palette's
  // mid tone across the page. It ties the word to its background instead of leaving it floating on
  // a white plate: the difference between a word ON paper and a word IN a room. Kept far below the
  // grain's strength so it registers as atmosphere, never as a visible tint.
  vec3 bounced = mix(uPaper, uCol[2], texture2D(uL3, vUv + uCast3).a * 0.16);
  col = mix(bounced, col, smoothstep(0.0, 0.06, field));

  // ── the WORD body ── the letters are SOFT (part of the blurred stack) but must stay LEGIBLE
  // and not too dark. Coverage = mostly the L0 blur (soft edges) + a little of the crisp mask so
  // the centres read, on a ramp that keeps the edges soft without snapping to a hard outline.
  float softCov = clamp(texture2D(uL0, uv).a * 1.05 + cover(uv) * 0.25, 0.0, 1.0);
  // ramp: soft feathered edge (not a hard threshold), so letters stay blurry but readable.
  float interior = smoothstep(0.18, 0.62, softCov);

  // body colour: a clearly-coloured ink lifted well toward the glow so it's NOT near-black, with
  // the letter interiors kept lighter (mix in the mid glow colour) so the word doesn't read heavy.
  vec3 bodyCol = mix(uInk, uCol[1], 0.5);            // lighter, clearly coloured ink
  bodyCol = mix(bodyCol, uCol[2], (1.0 - interior) * 0.5); // soft edges catch the mid glow

  // VOLUME: a uniformly-tinted glyph reads flat. The crisp mask already distinguishes the fat
  // interior of a stroke from its thin extremities, so let the letter's own colour follow it —
  // deep where the stroke is solid, lifted toward the surrounding glow where it thins out. Light
  // bleeding into the edges of a shape is what makes it read as lit rather than painted. Costs
  // one already-fetched texture value; no extra samples.
  float solid = smoothstep(0.35, 0.95, cover(uv)); // 1 deep inside a stroke, 0 at its edge
  bodyCol = mix(mix(bodyCol, uCol[2], 0.30), mix(bodyCol, uInk, 0.22), solid);
  col = mix(col, bodyCol, interior * 0.9);           // never fully opaque → keeps some glow through

  // ── grain: dense monochrome film grain, SOFT-LIGHT blended (like the PSD's 50% noise layer).
  //    STATIC per-pixel (no time term) so it reads as fixed film grain, not a crawling texture.
  //    WEIGHTED BY THE FIELD, the way real emulsion grain is denser in the exposed areas: the bare
  //    paper stays clean and the coloured band around the letters picks up the tooth, so the halo
  //    sits IN the page instead of on top of it. ──
  float g = hash(gl_FragCoord.xy);
  vec3 grained = softLight(col, g);
  col = mix(col, grained, uGrain * (0.5 + 0.7 * field));

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;function i(e,t,o,a){let s=Math.max(1,Math.round(t)),r=Math.max(1,Math.round(o)),i=document.createElement("canvas");i.width=s,i.height=r;let l=i.getContext("2d");l.clearRect(0,0,s,r);let h=(e||"").trim();if(!h)return{canvas:i,x0:.45,x1:.55};let n=s/2,u=.52*r,d=.66*s,p=.34*r;l.font=`600 ${p}px ${a}`;let c=l.measureText(h).width;c>d&&(p*=d/c,l.font=`600 ${p}px ${a}`,c=l.measureText(h).width),l.textAlign="left",l.textBaseline="middle";let f=.015*p,m=[...h],v=m.map(e=>l.measureText(e).width),g=v.reduce((e,t)=>e+t,0)+f*(m.length-1),b=n-g/2,w=b,x=Math.max(1,m.length-1);for(let e=0;e<m.length;e++){let t=e/x;l.fillStyle=`rgba(${Math.round(255*t)}, 0, 0, 1)`,l.fillText(m[e],b,u),b+=v[e]+f}return{canvas:i,x0:w/s,x1:(w+g)/s}}let l=e=>[parseInt(e.slice(1,3),16)/255,parseInt(e.slice(3,5),16)/255,parseInt(e.slice(5,7),16)/255],h=[{name:"Ultraviolet",stops:[{pos:0,color:l("#0c0622")},{pos:.22,color:l("#5b1fd6")},{pos:.46,color:l("#ff3bd4")},{pos:.72,color:l("#ffcf4d")},{pos:1,color:l("#faf7ff")}],ink:l("#2a0f66"),paper:l("#faf7ff")},{name:"Molten",stops:[{pos:0,color:l("#28060a")},{pos:.22,color:l("#d21414")},{pos:.46,color:l("#ff6a1f")},{pos:.72,color:l("#ffcf52")},{pos:1,color:l("#fff7ec")}],ink:l("#7a1410"),paper:l("#fff7ec")},{name:"Bubblegum",stops:[{pos:0,color:l("#2a0718")},{pos:.22,color:l("#ff1e8e")},{pos:.46,color:l("#ff7ab0")},{pos:.72,color:l("#ffe0b0")},{pos:1,color:l("#fff5fa")}],ink:l("#8a0e52"),paper:l("#fff5fa")},{name:"Electric",stops:[{pos:0,color:l("#04102e")},{pos:.22,color:l("#1550ff")},{pos:.46,color:l("#25c8ff")},{pos:.72,color:l("#bff0ff")},{pos:1,color:l("#f4faff")}],ink:l("#0a2b8c"),paper:l("#f4faff")},{name:"Jade",stops:[{pos:0,color:l("#03170f")},{pos:.22,color:l("#0f7a4a")},{pos:.46,color:l("#1fd88a")},{pos:.72,color:l("#b8f5d8")},{pos:1,color:l("#f3fbf6")}],ink:l("#0a3d28"),paper:l("#f3fbf6")},{name:"Sunburst",stops:[{pos:0,color:l("#04161c")},{pos:.22,color:l("#0e7d86")},{pos:.46,color:l("#f2a20c")},{pos:.72,color:l("#ffe27a")},{pos:1,color:l("#fefaf0")}],ink:l("#0a3a40"),paper:l("#fefaf0")}];function n(e){let t=[],o=[];for(let a=0;a<5;a++){let s=e.stops[Math.min(a,e.stops.length-1)];t.push(s.pos),o.push(s.color[0],s.color[1],s.color[2])}return{positions:t,colors:o,ink:e.ink,paper:e.paper}}function u(e,t,o){let a=e.map((e,a)=>e+(t[a]-e)*o),s=Math.sin(Math.PI*o);if(s<1e-4)return a;let r=(e,t,o)=>{let a=Math.max(e,t,o);return 0===a?0:(a-Math.min(e,t,o))/a};for(let o=0;o+2<a.length;o+=3){let i=a[o],l=a[o+1],h=a[o+2],n=Math.max(r(e[o],e[o+1],e[o+2]),r(t[o],t[o+1],t[o+2])),u=r(i,l,h);if(u<1e-4||n<1e-4)continue;let d=(u+(n-u)*s)/u,p=.2126*i+.7152*l+.0722*h;a[o]=Math.min(1,Math.max(0,p+(i-p)*d)),a[o+1]=Math.min(1,Math.max(0,p+(l-p)*d)),a[o+2]=Math.min(1,Math.max(0,p+(h-p)*d))}return a}let d=["hello","pookie","monkey"],p=[1.45,.9,1],c=[8e-4,.0022,.0042,.0075],f=[{scale:.5,radius:2},{scale:.25,radius:3},{scale:.125,radius:3},{scale:.0625,radius:3}];class m{host;canvas;gl=null;blurProg=null;compProg=null;quad=null;maskA=null;maskB=null;focusA=[.35,.65];focusB=[.35,.65];levels=[];blurU={};compU={};fontFamily="sans-serif";raf=0;running=!1;destroyed=!1;start0=0;lastT=0;revealed=!1;wordIdx=0;paletteIdx=0;morph=0;morphEased=0;morphGlow=0;morphBody=0;morphing=!1;holdUntil=0;paletteFrom=n(h[0]);paletteTo=n(h[0]);curX=.5;curY=.5;tgtX=.5;tgtY=.5;curOn=0;tgtOn=0;velX=0;velY=0;prevX=.5;prevY=.5;constructor(e){this.host=e,this.canvas=document.createElement("canvas"),Object.assign(this.canvas.style,{display:"block",width:"100%",height:"100%",opacity:"0",transition:"opacity 0.4s ease"}),e.appendChild(this.canvas);const t=this.canvas.getContext("webgl",{alpha:!1,antialias:!1,premultipliedAlpha:!1,powerPreference:"low-power"});if(!t||(this.gl=t,this.buildPrograms(),!this.blurProg||!this.compProg))return;this.resolveFont(),this.resize(),e.addEventListener("pointermove",this.onMove),e.addEventListener("pointerleave",this.onLeave)}compile(e,t){let o=this.gl,a=o.createShader(e);return(o.shaderSource(a,t),o.compileShader(a),o.getShaderParameter(a,o.COMPILE_STATUS))?a:(console.warn("[blur-glow] shader:",o.getShaderInfoLog(a)),null)}link(e,t){let o=this.gl,a=this.compile(o.VERTEX_SHADER,e),s=this.compile(o.FRAGMENT_SHADER,t);if(!a||!s)return null;let r=o.createProgram();return(o.attachShader(r,a),o.attachShader(r,s),o.linkProgram(r),o.getProgramParameter(r,o.LINK_STATUS))?r:(console.warn("[blur-glow] link:",o.getProgramInfoLog(r)),null)}buildPrograms(){let e=this.gl;if(this.quad=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,this.quad),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW),this.blurProg=this.link(a,s),this.compProg=this.link(a,r),!this.blurProg||!this.compProg)return;let t=t=>e.getUniformLocation(this.blurProg,t);this.blurU={uTex:t("uTex"),uTexB:t("uTexB"),uDir:t("uDir"),uMorph:t("uMorph"),uUseMorph:t("uUseMorph"),uFocus:t("uFocus"),uFocusAmt:t("uFocusAmt"),uPartOut:t("uPartOut"),uPartIn:t("uPartIn"),uLetterSpread:t("uLetterSpread")};let o=t=>e.getUniformLocation(this.compProg,t);this.compU={uMask:o("uMask"),uMaskB:o("uMaskB"),uL0:o("uL0"),uL1:o("uL1"),uL2:o("uL2"),uL3:o("uL3"),uRes:o("uRes"),uMorph:o("uMorph"),uCursor:o("uCursor"),uCursorOn:o("uCursorOn"),uWarpRadius:o("uWarpRadius"),uWarpAmp:o("uWarpAmp"),uWarpSwirl:o("uWarpSwirl"),uWarpVel:o("uWarpVel"),uWarpDrag:o("uWarpDrag"),uWarpStretch:o("uWarpStretch"),uPhase:o("uPhase"),uBloom:o("uBloom"),uCast0:o("uCast0"),uCast1:o("uCast1"),uCast2:o("uCast2"),uCast3:o("uCast3"),uPartOut:o("uPartOut"),uPartIn:o("uPartIn"),uLetterSpread:o("uLetterSpread"),uFront:o("uFront"),uPos:o("uPos[0]"),uCol:o("uCol[0]"),uInk:o("uInk"),uPaper:o("uPaper"),uGrain:o("uGrain")}}bindQuad(e){let t=this.gl;t.bindBuffer(t.ARRAY_BUFFER,this.quad);let o=t.getAttribLocation(e,"aPos");t.enableVertexAttribArray(o),t.vertexAttribPointer(o,2,t.FLOAT,!1,0,0)}uploadPalette(e){let t=this.gl;t&&this.compProg&&(t.useProgram(this.compProg),t.uniform1fv(this.compU.uPos,new Float32Array(e.positions)),t.uniform3fv(this.compU.uCol,new Float32Array(e.colors)),t.uniform3fv(this.compU.uInk,new Float32Array(e.ink)),t.uniform3fv(this.compU.uPaper,new Float32Array(e.paper)),this.canvas.style.background=`rgb(${e.paper.map(e=>Math.round(255*e)).join(",")})`)}applyPalette(e){let t=e%h.length;this.paletteFrom=n(h[t]),this.paletteTo=this.paletteFrom,this.uploadPalette(this.paletteFrom)}resolveFont(){if("u">typeof document)try{let e=document.createElement("span");e.style.cssText="position:absolute;visibility:hidden;font-family:var(--font-pangram)",e.textContent="Ag",document.body.appendChild(e),this.fontFamily=getComputedStyle(e).fontFamily.split(",")[0].replace(/["']/g,"").trim()||"sans-serif",document.body.removeChild(e)}catch{}}makeTarget(e,t){let o=this.gl,a=o.createTexture();o.bindTexture(o.TEXTURE_2D,a),o.texImage2D(o.TEXTURE_2D,0,o.RGBA,e,t,0,o.RGBA,o.UNSIGNED_BYTE,null),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MIN_FILTER,o.LINEAR),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MAG_FILTER,o.LINEAR),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_S,o.CLAMP_TO_EDGE),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_T,o.CLAMP_TO_EDGE);let s=o.createFramebuffer();return o.bindFramebuffer(o.FRAMEBUFFER,s),o.framebufferTexture2D(o.FRAMEBUFFER,o.COLOR_ATTACHMENT0,o.TEXTURE_2D,a,0),o.bindFramebuffer(o.FRAMEBUFFER,null),{fb:s,tex:a,w:e,h:t}}freeLevels(){let e=this.gl;if(e){for(let t of this.levels)e.deleteFramebuffer(t.out.fb),e.deleteTexture(t.out.tex),e.deleteFramebuffer(t.tmp.fb),e.deleteTexture(t.tmp.tex);this.levels=[]}}allocLevels(){this.freeLevels();let e=this.canvas.width,t=this.canvas.height;this.levels=f.map(o=>{let a=Math.max(2,Math.round(e*o.scale)),s=Math.max(2,Math.round(t*o.scale));return{out:this.makeTarget(a,s),tmp:this.makeTarget(a,s)}})}uploadMask(e,t){let o=this.gl,a=t??o.createTexture();return o.bindTexture(o.TEXTURE_2D,a),o.pixelStorei(o.UNPACK_FLIP_Y_WEBGL,!0),o.pixelStorei(o.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),o.texImage2D(o.TEXTURE_2D,0,o.RGBA,o.RGBA,o.UNSIGNED_BYTE,e),o.pixelStorei(o.UNPACK_FLIP_Y_WEBGL,!1),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MIN_FILTER,o.LINEAR),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_MAG_FILTER,o.LINEAR),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_S,o.CLAMP_TO_EDGE),o.texParameteri(o.TEXTURE_2D,o.TEXTURE_WRAP_T,o.CLAMP_TO_EDGE),a}buildMask(){if(!this.gl)return;let e=i(d[this.wordIdx%d.length],this.canvas.width,this.canvas.height,this.fontFamily);this.maskA=this.uploadMask(e.canvas,this.maskA),this.focusA=[e.x0,e.x1]}buildMaskB(){if(!this.gl)return;let e=(this.wordIdx+1)%d.length,t=i(d[e],this.canvas.width,this.canvas.height,this.fontFamily);this.maskB=this.uploadMask(t.canvas,this.maskB),this.focusB=[t.x0,t.x1]}resize(){if(!this.gl)return;let e=Math.min(window.devicePixelRatio||1,1.5),t=this.host.getBoundingClientRect(),o=Math.max(1,Math.round(t.width*e)),a=Math.max(1,Math.round(t.height*e));(this.canvas.width!==o||this.canvas.height!==a||!this.levels.length)&&(this.canvas.width=o,this.canvas.height=a,this.allocLevels(),this.buildMask(),this.buildMaskB(),this.morphing||this.applyPalette(this.paletteIdx))}beginMorph(){this.morph=0,this.morphing=!0,this.paletteFrom=n(h[this.paletteIdx%h.length]),this.paletteTo=n(h[(this.paletteIdx+1)%h.length])}finishMorph(){this.wordIdx=(this.wordIdx+1)%d.length;let e=this.maskA;this.maskA=this.maskB,this.maskB=e,this.focusA=this.focusB,this.morph=0,this.morphing=!1,this.buildMaskB(),this.paletteIdx=(this.paletteIdx+1)%h.length,this.paletteFrom=this.paletteTo,this.uploadPalette(this.paletteTo)}render(e,t){var o,a,s;let r,i,l=this.gl;if(!l||!this.blurProg||!this.compProg||!this.levels.length)return;l.useProgram(this.blurProg),this.bindQuad(this.blurProg),l.disable(l.BLEND);let h=this.morph,n=h*h*h*(h*(6*h-15)+10);this.morphGlow=Math.pow(n,.78),this.morphBody=Math.pow(n,1.3),this.morphEased=n;let d=e=>[Math.min(1,1.22*e),Math.max(0,Math.min(1,1.22*e-.22))],[p,m]=d(this.morphGlow),[v,g]=d(this.morphBody),b=this.morphing?Math.sin(Math.PI*n):0,w=this.focusA[0]+(this.focusB[0]-this.focusA[0])*n,x=this.focusA[1]+(this.focusB[1]-this.focusA[1])*n;l.uniform2f(this.blurU.uFocus,w,x),l.uniform1f(this.blurU.uFocusAmt,1.5),l.uniform1f(this.blurU.uMorph,this.morphGlow),l.uniform1f(this.blurU.uPartOut,p),l.uniform1f(this.blurU.uPartIn,m),l.uniform1f(this.blurU.uLetterSpread,.45);for(let e=0;e<this.levels.length;e++){let t=this.levels[e],o=f[e].radius,a=0===e?this.maskA:this.levels[e-1].out.tex,s=0===e&&this.morphing?1:0;l.bindFramebuffer(l.FRAMEBUFFER,t.tmp.fb),l.viewport(0,0,t.tmp.w,t.tmp.h),l.activeTexture(l.TEXTURE0),l.bindTexture(l.TEXTURE_2D,a),l.uniform1i(this.blurU.uTex,0),l.activeTexture(l.TEXTURE1),l.bindTexture(l.TEXTURE_2D,this.maskB??this.maskA),l.uniform1i(this.blurU.uTexB,1),l.uniform1f(this.blurU.uUseMorph,s),l.uniform2f(this.blurU.uDir,o/t.tmp.w,0),l.drawArrays(l.TRIANGLES,0,3),l.bindFramebuffer(l.FRAMEBUFFER,t.out.fb),l.viewport(0,0,t.out.w,t.out.h),l.activeTexture(l.TEXTURE0),l.bindTexture(l.TEXTURE_2D,t.tmp.tex),l.uniform1i(this.blurU.uTex,0),l.uniform1f(this.blurU.uUseMorph,0),l.uniform2f(this.blurU.uDir,0,o/t.out.h),l.drawArrays(l.TRIANGLES,0,3)}l.bindFramebuffer(l.FRAMEBUFFER,null),l.viewport(0,0,this.canvas.width,this.canvas.height),l.useProgram(this.compProg),this.bindQuad(this.compProg),this.morphing&&this.uploadPalette((o=this.paletteFrom,a=this.paletteTo,s=this.morphEased,{positions:(r=o.positions,i=a.positions,r.map((e,t)=>e+(i[t]-e)*s)),colors:u(o.colors,a.colors,s),ink:u(o.ink,a.ink,s),paper:u(o.paper,a.paper,s)})),l.activeTexture(l.TEXTURE0),l.bindTexture(l.TEXTURE_2D,this.maskA),l.uniform1i(this.compU.uMask,0),l.activeTexture(l.TEXTURE1),l.bindTexture(l.TEXTURE_2D,this.maskB??this.maskA),l.uniform1i(this.compU.uMaskB,1);let T=["uL0","uL1","uL2","uL3"];for(let e=0;e<this.levels.length;e++)l.activeTexture(l.TEXTURE2+e),l.bindTexture(l.TEXTURE_2D,this.levels[e].out.tex),l.uniform1i(this.compU[T[e]],2+e);l.uniform2f(this.compU.uRes,this.canvas.width,this.canvas.height),l.uniform1f(this.compU.uMorph,this.morphBody),l.uniform1f(this.compU.uPartOut,v),l.uniform1f(this.compU.uPartIn,g),l.uniform1f(this.compU.uLetterSpread,.45),l.uniform1f(this.compU.uFront,b),l.uniform2f(this.compU.uCursor,this.curX,this.curY),l.uniform1f(this.compU.uCursorOn,this.curOn),l.uniform1f(this.compU.uWarpRadius,.2),l.uniform1f(this.compU.uWarpAmp,.013),l.uniform1f(this.compU.uWarpSwirl,.6),l.uniform2f(this.compU.uWarpVel,this.velX,this.velY),l.uniform1f(this.compU.uWarpDrag,.26),l.uniform1f(this.compU.uWarpStretch,.5),l.uniform1f(this.compU.uPhase,t),l.uniform1f(this.compU.uBloom,e);let y=this.canvas.width/Math.max(1,this.canvas.height),E=[this.compU.uCast0,this.compU.uCast1,this.compU.uCast2,this.compU.uCast3];for(let e=0;e<E.length;e++){let t=c[e];l.uniform2f(E[e],.38*t/y,.92*t)}l.uniform1f(this.compU.uGrain,.4),l.drawArrays(l.TRIANGLES,0,3),this.reveal()}holdFor(e){return 700*(p[e%d.length]??1)}frame=e=>{if(!this.running||this.destroyed)return;this.start0||(this.start0=e,this.lastT=e,this.holdUntil=e+this.holdFor(this.wordIdx));let t=(e-this.start0)/1e3,o=Math.min(.05,Math.max(.001,(e-this.lastT)/1e3));this.lastT=e,this.curX=this.tgtX,this.curY=this.tgtY,this.curOn+=(this.tgtOn-this.curOn)*(1-Math.pow(1-.42,60*o));let a=(this.curX-this.prevX)/o,s=(this.curY-this.prevY)/o;this.prevX=this.curX,this.prevY=this.curY;let r=1-Math.pow(.5,60*o);this.velX+=(a-this.velX)*r,this.velY+=(s-this.velY)*r;let i=Math.hypot(this.velX,this.velY);i>2.2&&(this.velX=this.velX/i*2.2,this.velY=this.velY/i*2.2),!this.morphing&&e>=this.holdUntil&&this.beginMorph(),this.morphing&&(this.morph=Math.min(1,this.morph+o/.8),this.morph>=1&&(this.finishMorph(),this.holdUntil=e+this.holdFor(this.wordIdx)));let l=1+.16*Math.sin(.6*t);this.render(l,.5*t),this.raf=requestAnimationFrame(this.frame)};reveal(){this.revealed||(this.revealed=!0,this.canvas.style.opacity="1")}onMove=e=>{let t=this.host.getBoundingClientRect();this.tgtX=(e.clientX-t.left)/t.width,this.tgtY=1-(e.clientY-t.top)/t.height,this.tgtOn=1};onLeave=()=>{this.tgtOn=0};start(){!this.running&&this.gl&&this.compProg&&(this.running=!0,this.start0=0,this.raf=requestAnimationFrame(this.frame))}stop(){this.running=!1,this.raf&&cancelAnimationFrame(this.raf),this.raf=0}renderStill(e=!1){this.gl&&this.compProg&&(e&&!this.revealed&&(this.canvas.style.transition="none",this.revealed=!0,this.canvas.style.opacity="1"),this.render(1,0))}refreshFont(){this.resolveFont(),this.buildMask(),this.buildMaskB(),this.running||this.renderStill()}onResize(){this.resize(),this.running||this.renderStill()}destroy(){this.destroyed=!0,this.stop(),this.host.removeEventListener("pointermove",this.onMove),this.host.removeEventListener("pointerleave",this.onLeave);let e=this.gl;e&&(this.freeLevels(),this.maskA&&e.deleteTexture(this.maskA),this.maskB&&e.deleteTexture(this.maskB),this.quad&&e.deleteBuffer(this.quad),this.blurProg&&e.deleteProgram(this.blurProg),this.compProg&&e.deleteProgram(this.compProg),e.getExtension("WEBGL_lose_context")?.loseContext()),this.canvas.remove()}}e.s(["BlurGlowCard",0,function({bare:e=!1}={}){let a=(0,o.useRef)(null);return(0,o.useEffect)(()=>{let e=a.current;if(!e)return;let t=window.matchMedia("(prefers-reduced-motion: reduce)").matches,o=null,s=!1,r=!1,i=()=>{o&&!t&&(s&&!r?o.start():o.stop())},l=requestAnimationFrame(()=>{if(a.current&&(o=new m(e),t?o.renderStill(!0):i(),document.fonts?.load)){let e=document.createElement("span");e.style.cssText="position:absolute;visibility:hidden;font-family:var(--font-pangram)",e.textContent="Ag",document.body.appendChild(e);let t=getComputedStyle(e).fontFamily.split(",")[0].replace(/["']/g,"").trim();document.body.removeChild(e),document.fonts.load(`600 1em "${t}"`).then(()=>o?.refreshFont(),()=>{})}}),h=new IntersectionObserver(e=>{s=e[0]?.isIntersecting??!1,i()},{threshold:.2});h.observe(e);let n=()=>{r=document.hidden,i()};document.addEventListener("visibilitychange",n);let u=0,d=new ResizeObserver(()=>{window.clearTimeout(u),u=window.setTimeout(()=>o?.onResize(),120)});return d.observe(e),()=>{cancelAnimationFrame(l),window.clearTimeout(u),h.disconnect(),d.disconnect(),document.removeEventListener("visibilitychange",n),o?.destroy()}},[]),(0,t.jsx)("div",{ref:a,"aria-label":`Glowing blurred text, cycling through the words ${d.join(", ")}`,className:"relative mx-auto aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-white"})}],46975)},71708,e=>{e.n(e.i(46975))}]);