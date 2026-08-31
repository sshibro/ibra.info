(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,66662,52597,e=>{"use strict";let t=`
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`,i=`
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uDir;   // per-tap step (texel * radius) along one axis

void main() {
  // 9-tap Gaussian weights (sigma ~ 2), normalized.
  float w0 = 0.2270270270;
  float w1 = 0.1945945946;
  float w2 = 0.1216216216;
  float w3 = 0.0540540541;
  float w4 = 0.0162162162;
  vec4 c = texture2D(uTex, vUv) * w0;
  c += texture2D(uTex, vUv + uDir * 1.0) * w1;
  c += texture2D(uTex, vUv - uDir * 1.0) * w1;
  c += texture2D(uTex, vUv + uDir * 2.0) * w2;
  c += texture2D(uTex, vUv - uDir * 2.0) * w2;
  c += texture2D(uTex, vUv + uDir * 3.0) * w3;
  c += texture2D(uTex, vUv - uDir * 3.0) * w3;
  c += texture2D(uTex, vUv + uDir * 4.0) * w4;
  c += texture2D(uTex, vUv - uDir * 4.0) * w4;
  gl_FragColor = c;
}
`,s=`
precision highp float;
varying vec2 vUv;

uniform sampler2D uMask;    // crisp white silhouette (the core)
uniform sampler2D uB0;      // bloom level 0 (tightest)
uniform sampler2D uB1;
uniform sampler2D uB2;
uniform sampler2D uB3;      // bloom level 3 (widest halo)
uniform vec2  uSplit;       // chromatic aberration offset (uv units), cursor/auto driven
uniform float uBloom;       // overall bloom gain
uniform vec3  uWarm;        // warm/yellow tint  (yellow/blue preset)
uniform vec3  uCool;        // cool/blue tint
uniform vec3  uRed;         // red/cyan fringe tint
uniform float uCore;        // brightness of the crisp white core
uniform vec3  uBg;          // background tint (dark wall, or light wall if inverted)
uniform float uInvert;      // 0 = dark wall + glowing word, 1 = light wall + dark press
uniform float uNoise;       // grain amount 0..1
uniform float uTime;        // for animated grain
uniform float uAspect;      // w/h, to keep the split + vignette round
uniform vec2  uResolution;
uniform float uSpectral;    // 0..1 how much true prism rainbow rides over the base split
uniform vec2  uCursor;      // pointer position in uv (0..1)
uniform float uCursorOn;    // 0..1 eased cursor presence over the card
uniform float uDisperse;    // 0..1 cycle transition: blooms the word out into a soft haze

// cheap hash noise for the lo-fi grain
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

// smooth value noise (bilinear-interpolated hash) — soft blotches, not per-pixel dither.
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f); // smoothstep the cell
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// a minimal but richer wall texture, centred around 0. Kept very subtle — just enough that
// the dark background reads as a soft, lit surface with depth instead of flat grain:
//   - 3-octave fbm gives gentle cloudy mottling (large soft blotches + a little fine break-up)
//   - a slow, large-scale diagonal drift so the surface feels hand-finished, not tiled
// The amplitude is low; the caller scales it down further. No hard edges, no obvious pattern.
float wallTex(vec2 uv, vec2 res) {
  vec2 p = uv * vec2(res.x / res.y, 1.0);        // square the domain so blotches aren't stretched
  float fbm =
      vnoise(p * 2.4) * 0.55 +
      vnoise(p * 5.1 + 11.0) * 0.30 +
      vnoise(p * 11.7 + 3.0) * 0.15;
  // a broad, slowly-varying sheen across the panel (one very low-freq octave), so one side
  // of the wall sits a touch lighter — a soft raking light rather than uniform fill.
  float sheen = vnoise(p * 0.9 + 5.0);
  return (fbm - 0.5) * 0.8 + (sheen - 0.5) * 0.5;
}

// the summed multi-radius bloom sampled at an offset (one "channel"). CONCENTRATED:
// the tight core levels carry most of the weight; the wide halo is only a faint skirt,
// so the glow hugs the letters instead of washing the whole card out.
float bloomAt(vec2 uv) {
  float b = 0.0;
  b += texture2D(uB0, uv).r * 0.85;  // tightest -> most of the glow
  b += texture2D(uB1, uv).r * 0.55;
  b += texture2D(uB2, uv).r * 0.22;
  b += texture2D(uB3, uv).r * 0.10;  // widest halo -> just a faint skirt
  return b;
}

// A palette-anchored spectral ramp: 0 = warm end, 1 = cool end, with the fringe tint
// as the midpoint. Instead of 3 hard tints this gives a smooth colour walk across the
// halo, so the split reads as a soft rainbow edge rather than a flat colour cast.
vec3 spectralTint(float u) {
  u = clamp(u, 0.0, 1.0);
  if (u < 0.5) return mix(uWarm, uRed, u * 2.0);
  return mix(uRed, uCool, (u - 0.5) * 2.0);
}

// TRUE prism dispersion, kept MINIMAL: the aberration grows with distance from the word
// centre (real glass fans outward), and we take a few taps across the spectrum along the
// split direction. Small radius + few taps => a refined rainbow rim, not a busy smear.
vec3 spectralFringe(vec2 uv, vec2 split) {
  // radial gain: ~1 near centre, a touch more toward the edges (clamped so it stays soft)
  vec2 fromC = (uv - 0.5) * vec2(uAspect, 1.0);
  float disp = 0.6 + 0.9 * clamp(length(fromC), 0.0, 1.0);
  vec2 step = split * disp;
  vec3 acc = vec3(0.0);
  // 5 evenly-spaced taps from -1 (warm) to +1 (cool); the fringe colour sits in the middle
  const int N = 5;
  for (int i = 0; i < N; i++) {
    float f = float(i) / float(N - 1);        // 0..1
    float off = (f - 0.5) * 2.0;              // -1..1
    float b = bloomAt(uv + step * off);
    acc += spectralTint(f) * b;
  }
  return acc / float(N);
}

void main() {
  // LIQUID-CHROME SHIMMER: a whisper-amplitude uv warp driven by slow noise, so the word
  // and its glow gently wobble like molten metal instead of a dead silhouette. The warp
  // is domain-distorted (noise of noise) for an organic, non-directional ripple and kept
  // extremely small (~0.15% of the frame) so it never smears the letters.
  vec2 uv = vUv;
  float wx = vnoise(uv * 4.0 + vec2(uTime * 0.13, uTime * 0.05));
  float wy = vnoise(uv * 4.0 + vec2(7.0 - uTime * 0.06, 3.0 + uTime * 0.11));
  uv += (vec2(wx, wy) - 0.5) * 0.0016;

  // ---- CYCLE DISPERSE & RE-FORM: the transition is made entirely of the effect's OWN
  // language — bloom + split — not a glitch. uDisperse (0 at rest, 1 at mid-swap) spreads
  // the chromatic split WIDE so the warm/cool copies pull far apart, melts the crisp core,
  // and lifts the bloom, so the old word blooms out into a soft coloured haze; at the peak
  // the word swaps under the cloud; then uDisperse falls and the new word condenses back
  // out of the light as the split collapses to rest. Smooth, glowy, in-style. ----
  vec2 s = uSplit;
  float disp = uDisperse;                         // 0..1 dispersion strength this frame
  // spread the split RADIALLY outward from centre (a prism blooming apart), plus a slow
  // swirl so the haze has a little organic drift rather than a pure zoom.
  vec2 fromMid = (uv - 0.5) * vec2(uAspect, 1.0);
  float rr = length(fromMid) + 0.0001;
  vec2 radial = fromMid / rr;
  float ang = uTime * 0.6;
  vec2 swirl = vec2(radial.x * cos(ang) - radial.y * sin(ang),
                    radial.x * sin(ang) + radial.y * cos(ang));
  // during dispersion the split grows (copies drift apart) and gains the radial/swirl
  // direction, so the word softens into a gentle rainbow haze instead of tearing. Kept
  // WEAK — the word stays put and just breathes, it never flies far out.
  s += mix(radial, swirl, 0.5) * disp * 0.022;
  s *= 1.0 + disp * 0.9;
  // no per-channel tear anymore — the split alone carries the whole transition.
  vec2 tearW = vec2(0.0), tearC = vec2(0.0), tearR = vec2(0.0);

  // CURSOR POOL: a soft aspect-correct falloff around the pointer. It does NOT move the
  // word — it just brightens the bloom + widens the rainbow locally, so the light lifts
  // where you hover and settles back when you leave. Gentle radius, eased by presence.
  vec2 cAsp = vec2(uAspect, 1.0);
  vec2 toCur = uv * cAsp - uCursor * cAsp;
  float cd = length(toCur);
  float pool = smoothstep(0.34, 0.0, cd) * uCursorOn;   // 1 at cursor -> 0 by ~0.34

  // HOVER LIFE: near the pointer the light behaves like a disturbed liquid, not just a
  // brighter spot. Two small touches, both fading out with the pool:
  //  1. a soft concentric RIPPLE pushes the sampled uv in/out radially around the cursor,
  //     so the glow ripples as if the pointer pressed into it.
  //  2. the split gains a component that leans ALONG the cursor->centre direction, so the
  //     rainbow tilts toward where you are (felt, but it never drags the whole word).
  if (pool > 0.001) {
    vec2 rdir = toCur / max(cd, 0.0001);
    float ripple = sin(cd * 46.0 - uTime * 5.0) * pool * 0.0022;
    uv += (rdir / cAsp) * ripple;
    s += (rdir / cAsp) * pool * 0.010;                  // split leans toward the cursor
  }

  // Chromatic aberration: sample the bloom three times, each pushed a different way, so
  // the tinted copies pull apart at the edges:
  //   warm  ->  +split
  //   cool  ->  -split
  //   fringe -> perpendicular split (a second, weaker fringe)
  // These are SCALAR intensities per channel, tinted then blended below.
  float bw = bloomAt(uv + s + tearW);
  float bc = bloomAt(uv - s + tearC);
  float br = bloomAt(uv + vec2(-s.y, s.x) * 0.6 + tearR);

  // Coloured glow, tone-mapped with a soft rolloff so the letter bodies don't clip to
  // flat white. 1 - exp(-x) saturates gently toward the tint's own colour. A small
  // amount of the TRUE spectral fringe (radial prism, multi-tap) is mixed into the raw
  // energy so the halo edge gains a soft rainbow without changing the overall colour.
  vec3 baseRaw = (uWarm * bw + uCool * bc + uRed * br);
  // near the cursor, widen the rainbow (more spectral) and lift the glow (more energy).
  // during dispersion gently widen the spectral rainbow + lift the bloom a touch, so the
  // word softly breathes rather than blowing into a big cloud. Kept weak.
  float specAmt = clamp(uSpectral + pool * 0.4 + disp * 0.25, 0.0, 1.0);
  vec3 raw = mix(baseRaw, spectralFringe(uv, s), specAmt * 0.55) * uBloom * (1.0 + pool * 0.9 + disp * 0.45);
  vec3 glow = vec3(1.0) - exp(-raw);
  // the crisp white core softens as the word disperses (loses its hard edge into the bloom)
  // but never fully vanishes, so it stays readable while it re-forms.
  float core = texture2D(uMask, uv).r * (1.0 - disp * 0.75);

  // shared: vignette + a minimal plaster grain so the wall reads as a real surface
  vec2 vc = (uv - 0.5) * vec2(uAspect, 1.0);
  float vig = smoothstep(1.05, 0.35, length(vc));
  float tex = wallTex(uv, uResolution);
  float g = hash(uv * uResolution * 0.5 + uTime);

  // LIVING WALL: a very slow caustic drift so the dark background breathes instead of
  // sitting dead. Two counter-scrolling low-freq noise fields beat against each other;
  // the result is tiny (a few % of the wall value) and tinted by the palette below.
  float ca = vnoise(uv * vec2(uAspect, 1.0) * 2.3 + vec2(uTime * 0.012, uTime * 0.008));
  float cb = vnoise(uv * vec2(uAspect, 1.0) * 3.7 - vec2(uTime * 0.009, uTime * 0.014));
  float caustic = (ca * cb - 0.25);   // centred-ish, mostly small

  // ---- DARK mode: dark wall + glowing word (additive) ----
  vec3 rimC = vec3(uCore) * smoothstep(0.35, 0.55, core) * (1.0 - smoothstep(0.6, 0.9, core));
  vec3 glowD = glow;
  glowD += rimC;
  glowD += (g - 0.5) * uNoise * (0.4 + 0.6 * length(glowD));
  glowD *= mix(0.82, 1.0, vig);
  // base wall + a soft mottle/sheen: multiply for the darker blotches, plus a gentle additive
  // lift on the bright side of the sheen so the surface has light on it (not only shadow).
  vec3 wallD = uBg * mix(0.82, 1.08, vig) * (1.0 + tex * 0.35) + uBg * max(tex, 0.0) * 0.25;
  // palette-tinted caustic light on the wall (stronger toward the darker outer field, so it
  // never fights the glow): the wall clearly shimmers in the word's own colours instead of
  // sitting as a flat near-black panel.
  vec3 causticTint = normalize(uWarm + uCool + 0.0001);
  wallD += causticTint * caustic * 0.09 * (1.0 - vig * 0.4);
  vec3 outD = wallD + glowD;

  // ---- LIGHT mode: dark word with the SAME soft bloom, as a dark tinted haze ----
  // This is dark mode's look inverted: the same soft multi-radius bloom (bw/bc/br) drives
  // everything, so the word carries the same blurry glow — but here it DARKENS the light
  // wall toward each split colour instead of adding light. Because we use the soft bloom
  // (not the crisp mask), the edges are soft + glowy, and the warm/cool offsets give the
  // coloured chromatic haze. A crisp dark core sits under it so the letters stay legible.
  vec3 wallL = uBg * mix(1.0, 0.94, 1.0 - vig);       // light wall, faintly darker at edges
  wallL += tex * 0.018;                               // faint mottle/sheen (subtle on paper)

  // the soft bloom, tinted + split, as a "darken amount" per channel (same tone-map as
  // dark mode). glowL is bright/coloured near the word, ~0 out on the wall.
  vec3 rawL = mix(baseRaw, spectralFringe(uv, s), specAmt * 0.55) * uBloom * (1.0 + pool * 0.9);
  vec3 glowL = vec3(1.0) - exp(-rawL);
  // darken the wall toward the COMPLEMENT of the glow colour, weighted by how strong the
  // glow is here -> a soft warm haze on one side, cool on the other, fading into the wall.
  vec3 pressed = wallL * (vec3(1.0) - glowL * 0.9);

  // a crisp dark core so the letters read solid (the soft bloom alone is too faint to be
  // legible as text). Uses the plain mask, pressed to near-black.
  float ink = smoothstep(0.4, 0.62, core);
  pressed *= mix(1.0, 0.1, ink);
  pressed += (g - 0.5) * uNoise * 0.4;                // grain
  vec3 outL = pressed;

  vec3 outc = mix(outD, outL, uInvert);
  gl_FragColor = vec4(outc, 1.0);
}
`;async function o(e,t,i,s){let o=Math.max(1,Math.round(t)),a=Math.max(1,Math.round(i)),r=document.createElement("canvas");r.width=o,r.height=a;let l=r.getContext("2d");l.clearRect(0,0,o,a);let n=(e||"").trim();if(!n)return r;let h=o/2,c=.5*a,u=.78*o,d=.42*a;l.font=`800 ${d}px ${s}`;let m=l.measureText(n).width;m>u&&(d*=u/m,l.font=`800 ${d}px ${s}`),l.fillStyle="#fff",l.textAlign="center",l.textBaseline="middle";let p=.02*d,f=[...n],w=f.map(e=>l.measureText(e).width),v=h-(w.reduce((e,t)=>e+t,0)+p*(f.length-1))/2;l.textAlign="left";for(let e=0;e<f.length;e++)l.fillText(f[e],v,c),v+=w[e]+p;return r}let a={word:"chrome",bloom:1.62,split:9,core:1.06,noise:.15,spectral:.6,warm:[1,.66,.5],cool:[.42,.6,.95],red:[1,.42,.6],bg:[.11,.13,.2],invert:!1},r=[{scale:.5,radius:1.5},{scale:.25,radius:2},{scale:.125,radius:2.5},{scale:.0625,radius:3}];e.s(["CHROMA_DEFAULTS",0,a,"ChromaGlow",0,class{host;canvas;gl=null;blurProg=null;compProg=null;quad=null;blurLoc={};compLoc={};mask=null;maskW=1;maskH=1;levels=[];raf=0;running=!1;awake=!1;startT=0;w=0;h=0;dpr=1;fontFamily="var(--font-neue-corp), sans-serif";params;builtW=0;builtH=0;builtWord="";builtFont="";buildScheduled=0;destroyed=!1;painted=!1;px=0;py=0;tpx=0;tpy=0;active=0;tActive=0;fx=0;fy=0;cycle=!1;cycleWords=[];cyclePalettes=[];cycleIdx=0;cyclePhase="hold";cyclePhaseT=0;holdDur=1.15;outDur=.24;inDur=.32;disperse=0;nextPending=!1;lastNow=0;palFrom=null;palTo=null;palMix=1;ok=!1;constructor(e,o){this.host=e,this.params={...a,...o},this.canvas=document.createElement("canvas"),Object.assign(this.canvas.style,{position:"absolute",inset:"0",width:"100%",height:"100%",display:"block",opacity:"0"}),e.appendChild(this.canvas);const r=this.canvas.getContext("webgl",{alpha:!1,antialias:!1,premultipliedAlpha:!1});if(!r)return;this.gl=r;try{this.blurProg=this.build(t,i),this.compProg=this.build(t,s)}catch{this.gl=null;return}for(const e of["uTex","uDir"])this.blurLoc[e]=r.getUniformLocation(this.blurProg,e);for(const e of["uMask","uB0","uB1","uB2","uB3","uSplit","uBloom","uWarm","uCool","uRed","uCore","uBg","uInvert","uNoise","uTime","uAspect","uResolution","uSpectral","uCursor","uCursorOn","uDisperse"])this.compLoc[e]=r.getUniformLocation(this.compProg,e);this.quad=r.createBuffer(),r.bindBuffer(r.ARRAY_BUFFER,this.quad),r.bufferData(r.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),r.STATIC_DRAW),r.clearColor(this.params.bg[0],this.params.bg[1],this.params.bg[2],1),this.resize(),this.buildMaskNow(),this.canvas.addEventListener("pointermove",this.onMove),this.canvas.addEventListener("pointerenter",this.onEnter),this.canvas.addEventListener("pointerleave",this.onLeave),this.ok=!0}build(e,t){let i=this.gl,s=(e,t)=>{let s=i.createShader(e);if(i.shaderSource(s,t),i.compileShader(s),!i.getShaderParameter(s,i.COMPILE_STATUS))throw Error(i.getShaderInfoLog(s)||"compile failed");return s},o=i.createProgram();if(i.attachShader(o,s(i.VERTEX_SHADER,e)),i.attachShader(o,s(i.FRAGMENT_SHADER,t)),i.linkProgram(o),!i.getProgramParameter(o,i.LINK_STATUS))throw Error(i.getProgramInfoLog(o)||"link failed");return o}makeTarget(e,t){let i=this.gl,s=i.createTexture();i.bindTexture(i.TEXTURE_2D,s),i.texImage2D(i.TEXTURE_2D,0,i.RGBA,e,t,0,i.RGBA,i.UNSIGNED_BYTE,null),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MAG_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE);let o=i.createFramebuffer();return i.bindFramebuffer(i.FRAMEBUFFER,o),i.framebufferTexture2D(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,s,0),i.bindFramebuffer(i.FRAMEBUFFER,null),{fb:o,tex:s,w:e,h:t}}allocLevels(){if(!this.gl)return;this.freeLevels();let e=this.canvas.width,t=this.canvas.height;this.levels=r.map(i=>{let s=Math.max(2,Math.round(e*i.scale)),o=Math.max(2,Math.round(t*i.scale));return{out:this.makeTarget(s,o),tmp:this.makeTarget(s,o)}})}freeLevels(){let e=this.gl;if(e){for(let t of this.levels)e.deleteFramebuffer(t.out.fb),e.deleteTexture(t.out.tex),e.deleteFramebuffer(t.tmp.fb),e.deleteTexture(t.tmp.tex);this.levels=[]}}setFont(e){e!==this.fontFamily&&(this.fontFamily=e,this.scheduleBuild())}setParams(e){let t=void 0!==e.word&&e.word!==this.params.word;this.params={...this.params,...e},t?this.scheduleBuild():this.running||this.renderOnce()}enableCycle(e,t){e.length&&(this.cycle=!0,this.cycleWords=e,this.cyclePalettes=t,this.cycleIdx=0,this.cyclePhase="hold",this.cyclePhaseT=0,this.palMix=1,this.palFrom=t[0]??null,this.palTo=t[0]??null,this.params={...this.params,word:e[0],...t[0]??{}},this.scheduleBuild())}lerp(e,t,i){return e+(t-e)*i}lerp3(e,t,i){return[this.lerp(e[0],t[0],i),this.lerp(e[1],t[1],i),this.lerp(e[2],t[2],i)]}tweenedPalette(){let e=this.params;if(!this.palFrom||!this.palTo||this.palMix>=1){let t=this.palTo??{};return{...e,...t}}let t={...e,...this.palFrom},i={...e,...this.palTo},s=this.palMix;return{...e,warm:this.lerp3(t.warm,i.warm,s),cool:this.lerp3(t.cool,i.cool,s),red:this.lerp3(t.red,i.red,s),bg:this.lerp3(t.bg,i.bg,s),split:this.lerp(t.split,i.split,s),bloom:this.lerp(t.bloom,i.bloom,s),core:this.lerp(t.core,i.core,s),noise:this.lerp(t.noise,i.noise,s),spectral:this.lerp(t.spectral,i.spectral,s),invert:s<.5?t.invert:i.invert}}onMove=e=>{let t=this.canvas.getBoundingClientRect();this.tpx=(e.clientX-t.left)/t.width*2-1,this.tpy=-((e.clientY-t.top)/t.height*2-1),this.tActive=1,this.wake()};onEnter=()=>{this.tActive=1,this.wake()};onLeave=()=>{this.tActive=0,this.tpx=0,this.tpy=0,this.wake()};wake(){this.awake&&!this.running&&this.start()}resize(){let e=this.host.getBoundingClientRect();this.dpr=Math.min(2,window.devicePixelRatio||1),this.w=e.width,this.h=e.height;let t=Math.max(1,Math.round(this.w*this.dpr)),i=Math.max(1,Math.round(this.h*this.dpr));this.canvas.width!==t||this.canvas.height!==i?(this.canvas.width=t,this.canvas.height=i,this.gl?.viewport(0,0,t,i),this.allocLevels(),this.scheduleBuild()):0===this.levels.length&&this.allocLevels()}maskSize(){let e=Math.max(2,Math.min(1400,Math.round(this.w*this.dpr))),t=Math.max(2,Math.round(e*(this.h/Math.max(1,this.w))));return[e,t]}scheduleBuild(){if(!this.gl||this.destroyed)return;let[e,t]=this.maskSize();if(e===this.builtW&&t===this.builtH&&this.params.word===this.builtWord&&this.fontFamily===this.builtFont||this.buildScheduled)return;let i=()=>{this.buildScheduled=0,this.buildMaskNow()},s=window.requestIdleCallback;this.buildScheduled=s?s(i,{timeout:200}):window.setTimeout(i,0)}async buildMaskNow(){let e=this.gl;if(!e||this.destroyed)return;if(this.buildScheduled){let e=window.cancelIdleCallback;e?e(this.buildScheduled):window.clearTimeout(this.buildScheduled),this.buildScheduled=0}let[t,i]=this.maskSize();this.builtW=t,this.builtH=i,this.builtWord=this.params.word,this.builtFont=this.fontFamily;let s=await o(this.params.word,t,i,this.fontFamily);this.gl&&!this.destroyed&&(this.mask||(this.mask=e.createTexture()),e.bindTexture(e.TEXTURE_2D,this.mask),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,s),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),this.maskW=s.width,this.maskH=s.height,this.running||this.renderOnce())}start(){if(!this.ok||(this.awake=!0,this.running))return;this.running=!0,this.resize(),this.startT||(this.startT=performance.now());let e=t=>{this.running&&(this.frame(t),this.raf=requestAnimationFrame(e))};this.raf=requestAnimationFrame(e)}stop(){this.awake=!1,this.running=!1,this.raf&&cancelAnimationFrame(this.raf),this.raf=0}renderOnce(){this.raf||(this.raf=requestAnimationFrame(e=>{this.raf=0,this.render(e)}))}frame(e){this.px+=(this.tpx-this.px)*.08,this.py+=(this.tpy-this.py)*.08,this.active+=(this.tActive-this.active)*.06;let t=3.2*((e-(this.startT||e))/1e3),i=.16*Math.sin(1.15*t)+.09*Math.sin(2.6*t+1)+.05*Math.cos(4.1*t+.4),s=.13*Math.cos(.95*t+2.1)+.07*Math.sin(2.2*t+.5)+.04*Math.cos(3.7*t+1.7);if(this.fx+=(i-this.fx)*.2,this.fy+=(s-this.fy)*.2,this.cycle){let t=this.lastNow?Math.min(.05,(e-this.lastNow)/1e3):1/60;this.stepCycle(t)}this.lastNow=e,this.render(e)}stepCycle(e){if(this.cyclePhaseT+=e,"hold"===this.cyclePhase){if(this.disperse+=(0-this.disperse)*Math.min(1,12*e),this.cyclePhaseT>=this.holdDur){this.palFrom=this.cyclePalettes[this.cycleIdx]??null;let e=(this.cycleIdx+1)%this.cycleWords.length;this.palTo=this.cyclePalettes[e]??this.palFrom,this.palMix=0,this.nextPending=!0,this.cyclePhase="out",this.cyclePhaseT=0}}else if("out"===this.cyclePhase){let e=Math.min(1,this.cyclePhaseT/this.outDur);this.disperse=e*e,this.palMix=.5*e,e>=1&&(this.nextPending&&(this.nextPending=!1,this.cycleIdx=(this.cycleIdx+1)%this.cycleWords.length,this.params={...this.params,word:this.cycleWords[this.cycleIdx]},this.buildMaskNow()),this.cyclePhase="in",this.cyclePhaseT=0)}else{let e=Math.min(1,this.cyclePhaseT/this.inDur);this.disperse=1-(1-(1-e)*(1-e)),this.palMix=.5+.5*e,e>=1&&(this.disperse=0,this.palMix=1,this.cyclePhase="hold",this.cyclePhaseT=0)}}render(e){let t=this.gl;if(!t||!this.compProg||!this.blurProg||!this.mask||0===this.levels.length)return;let i=(e-this.startT)/1e3;t.useProgram(this.blurProg),t.bindBuffer(t.ARRAY_BUFFER,this.quad);let s=t.getAttribLocation(this.blurProg,"aPosition");t.enableVertexAttribArray(s),t.vertexAttribPointer(s,2,t.FLOAT,!1,0,0);for(let e=0;e<this.levels.length;e++){let i=this.levels[e],s=0===e?this.mask:this.levels[e-1].out.tex,o=r[e].radius;t.bindFramebuffer(t.FRAMEBUFFER,i.tmp.fb),t.viewport(0,0,i.tmp.w,i.tmp.h),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,s),t.uniform1i(this.blurLoc.uTex,0),t.uniform2f(this.blurLoc.uDir,o/i.tmp.w,0),t.drawArrays(t.TRIANGLES,0,3),t.bindFramebuffer(t.FRAMEBUFFER,i.out.fb),t.viewport(0,0,i.out.w,i.out.h),t.bindTexture(t.TEXTURE_2D,i.tmp.tex),t.uniform2f(this.blurLoc.uDir,0,o/i.out.h),t.drawArrays(t.TRIANGLES,0,3)}t.bindFramebuffer(t.FRAMEBUFFER,null),t.viewport(0,0,this.canvas.width,this.canvas.height),t.useProgram(this.compProg),t.bindBuffer(t.ARRAY_BUFFER,this.quad);let o=t.getAttribLocation(this.compProg,"aPosition");t.enableVertexAttribArray(o),t.vertexAttribPointer(o,2,t.FLOAT,!1,0,0),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.mask),t.uniform1i(this.compLoc.uMask,0);for(let e=0;e<4;e++)t.activeTexture(t.TEXTURE1+e),t.bindTexture(t.TEXTURE_2D,this.levels[e]?.out.tex??this.mask),t.uniform1i(this.compLoc[`uB${e}`],1+e);let a=this.cycle?this.tweenedPalette():this.params,l=a.split/620,n=2.4*this.fx*l,h=2.4*this.fy*l;t.uniform2f(this.compLoc.uSplit,n,h),t.uniform2f(this.compLoc.uCursor,.5*this.px+.5,.5*this.py+.5),t.uniform1f(this.compLoc.uCursorOn,this.active),t.uniform1f(this.compLoc.uDisperse,this.disperse);let c=a.bloom*(.94+.06*Math.sin(.7*i));t.uniform1f(this.compLoc.uBloom,c),t.uniform3f(this.compLoc.uWarm,a.warm[0],a.warm[1],a.warm[2]),t.uniform3f(this.compLoc.uCool,a.cool[0],a.cool[1],a.cool[2]),t.uniform3f(this.compLoc.uRed,a.red[0],a.red[1],a.red[2]),t.uniform1f(this.compLoc.uCore,a.core),t.uniform1f(this.compLoc.uSpectral,a.spectral),t.uniform3f(this.compLoc.uBg,a.bg[0],a.bg[1],a.bg[2]),t.uniform1f(this.compLoc.uInvert,+!!a.invert),t.uniform1f(this.compLoc.uNoise,a.noise),t.uniform1f(this.compLoc.uTime,i),t.uniform1f(this.compLoc.uAspect,this.w/Math.max(1,this.h)),t.uniform2f(this.compLoc.uResolution,this.canvas.width,this.canvas.height),t.drawArrays(t.TRIANGLES,0,3),this.painted||(this.painted=!0,this.canvas.style.opacity="1")}renderStill(){this.resize(),this.buildMaskNow(),this.startT=performance.now(),this.render(performance.now())}destroy(){if(this.destroyed=!0,this.buildScheduled){let e=window.cancelIdleCallback;e?e(this.buildScheduled):window.clearTimeout(this.buildScheduled),this.buildScheduled=0}this.stop(),this.canvas.removeEventListener("pointermove",this.onMove),this.canvas.removeEventListener("pointerenter",this.onEnter),this.canvas.removeEventListener("pointerleave",this.onLeave);let e=this.gl;e&&(this.freeLevels(),this.mask&&e.deleteTexture(this.mask),this.quad&&e.deleteBuffer(this.quad),e.getExtension("WEBGL_lose_context")?.loseContext()),this.canvas.remove()}}],66662);let l=[{id:"peachsteel",name:"Peach / Steel",params:{warm:[1,.66,.5],cool:[.42,.6,.95],red:[1,.42,.6],split:9,bloom:1.62,core:1.06,noise:.15,spectral:.6,bg:[.11,.13,.2]}},{id:"chartviolet",name:"Chartreuse / Violet",params:{warm:[.78,.95,.2],cool:[.55,.3,1],red:[.3,.7,1],split:10.5,bloom:1.52,core:1.04,noise:.17,spectral:.85,bg:[.15,.08,.19]}},{id:"pinkamber",name:"Hot Pink / Amber",params:{warm:[1,.22,.62],cool:[1,.72,.24],red:[1,.5,.85],split:8,bloom:1.55,core:1.05,noise:.16,spectral:.5,bg:[.19,.08,.15]}},{id:"rustmint",name:"Rust / Mint",params:{warm:[.92,.42,.22],cool:[.5,.95,.78],red:[.3,.85,.7],split:7.5,bloom:1.5,core:1.02,noise:.13,spectral:.45,bg:[.07,.16,.13]}},{id:"sandcobalt",name:"Sand / Cobalt",params:{warm:[1,.55,.42],cool:[.24,.36,.95],red:[.95,.34,.5],split:9,bloom:1.5,core:1,noise:.09,spectral:.6,bg:[.95,.9,.8],invert:!0}},{id:"blushsky",name:"Blush / Sky",params:{warm:[1,.44,.5],cool:[.34,.72,1],red:[.6,.5,1],split:9.5,bloom:1.52,core:1,noise:.09,spectral:.7,bg:[.97,.9,.92],invert:!0}}],n=[{word:"boom",params:l[0].params},{word:"poof",params:l[3].params},{word:"zap",params:l[1].params},{word:"pow",params:l[2].params},{word:"yeet",params:l[5].params},{word:"oof",params:l[4].params}],h=["boom","poop","pow","zap","yeet","oof","bruh","meep","honk","blip","splat","womp","boing","poof","zoom","womp"];function c(e,t=.15){let i=+(1-Math.abs(e/60%2-1)),s=[[1,i,0],[i,1,0],[0,1,i],[0,i,1],[i,0,1],[1,0,i]][Math.floor(e/60)%6];return[s[0]*(1-t)+t,s[1]*(1-t)+t,s[2]*(1-t)+t]}e.s(["HERO_CYCLE",0,n,"defaultChromaParams",0,function(){return{...a,...l[0].params}},"fromHex",0,e=>{let t=e.replace("#","");return[0,2,4].map(e=>parseInt(t.slice(e,e+2)||"0",16)/255)},"remixChromaParams",0,function(){var e,t;let i,s,o,a,r=360*Math.random(),l=c(r),n=c((r+150+60*Math.random())%360),u=c((r+40+40*Math.random())%360,.1),d=.34>Math.random(),m=d?(e=l,t=n,s=Math.max((i=[(e[0]+t[0])/2,(e[1]+t[1])/2,(e[2]+t[2])/2])[0],i[1],i[2],.001),[0,1,2].map(e=>.88+i[e]/s*.08)):(a=Math.max((o=[(l[0]+n[0])/2,(l[1]+n[1])/2,(l[2]+n[2])/2])[0],o[1],o[2],.001),[0,1,2].map(e=>.05+o[e]/a*.12000000000000001));return{word:h[Math.floor(Math.random()*h.length)],warm:l,cool:n,red:u,bg:m,invert:d,split:4+8*Math.random(),bloom:1+.4*Math.random(),noise:.06+.14*Math.random(),spectral:.3+.6*Math.random()}},"toHex",0,e=>"#"+e.map(e=>Math.round(255*Math.min(1,Math.max(0,e))).toString(16).padStart(2,"0")).join("")],52597)},3390,e=>{"use strict";var t=e.i(43476),i=e.i(71645),s=e.i(66662),o=e.i(52597),a=e.i(20268);e.s(["ChromaGlowCard",0,function({bare:e=!1,viewTransitionName:r}={}){let l=(0,i.useRef)(null);return(0,i.useEffect)(()=>{let e=l.current;if(!e)return;let t=window.matchMedia("(prefers-reduced-motion: reduce)").matches,i=null,r=!1,n=!1,h=!1,c=()=>{i&&!t&&(!r||n||h?i.stop():i.start())},u=requestAnimationFrame(()=>{if(l.current&&(i=new s.ChromaGlow(e)).ok&&(t||i.enableCycle(o.HERO_CYCLE.map(e=>e.word),o.HERO_CYCLE.map(e=>e.params)),t?i.renderStill():c(),document.fonts?.load)){let e=document.createElement("span");e.style.cssText="position:absolute;visibility:hidden",e.style.fontFamily="var(--font-neue-corp)",e.textContent="Ag",document.body.appendChild(e);let t=getComputedStyle(e).fontFamily.split(",")[0].replace(/["']/g,"").trim();document.body.removeChild(e),document.fonts.load(`800 1em "${t}"`).then(()=>i?.setFont(`"${t}", sans-serif`),()=>{})}}),d=new IntersectionObserver(e=>{r=e[0]?.isIntersecting??!1,c()},{threshold:.15});d.observe(e);let m=()=>{n=document.hidden,c()};document.addEventListener("visibilitychange",m);let p=(0,a.onTransitionChange)(e=>{h=e,c()}),f=0,w=()=>{window.clearTimeout(f),f=window.setTimeout(()=>i?.resize(),120)};return window.addEventListener("resize",w),()=>{cancelAnimationFrame(u),d.disconnect(),document.removeEventListener("visibilitychange",m),p(),window.removeEventListener("resize",w),window.clearTimeout(f),i?.destroy()}},[]),(0,t.jsx)("div",{ref:l,"data-canvas-card":!0,"aria-label":"The word chrome glowing on a dark card, with a shifting rainbow chromatic-aberration split that follows the cursor.",style:r?{viewTransitionName:r}:void 0,className:"relative mx-auto aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[#1c2133]"})}])},68753,e=>{e.n(e.i(3390))}]);