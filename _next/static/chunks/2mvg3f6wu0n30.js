(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,36011,t=>{"use strict";let e=`
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`,a=`
precision highp float;

varying vec2 vUv;

uniform sampler2D uMask;      // the word, white on transparent
uniform vec2  uResolution;    // drawing buffer size, px
uniform float uAspect;        // w/h

// trail
uniform float uEchoes;        // how many copies to accumulate
uniform float uStep;          // spacing between copies, px @ 620h
uniform float uAlpha;         // per-copy alpha
uniform vec2  uFall;          // trail direction (unit-ish)
uniform float uZStep;         // recession per copy

// magnetism: the trail bends toward the cursor as it falls, hard near the word
// and relaxing back to a straight fall further out.
uniform vec2  uMagnet;        // cursor in uv; only meaningful when uMagnetOn > 0
uniform float uMagnetOn;      // eased 0..1 presence
uniform float uSwing;         // how much the cursor twists the near copies (depth coupling)

// The five layers built on top of the raw accumulation. All of them are pure
// arithmetic inside the sampling loop that was already running — none adds a
// texture fetch, which is the only thing that costs real money in a fill-rate
// bound shader like this one.
uniform float uTurb;          // how much the tail wavers (px @ 620h)
uniform float uSpread;        // how much each copy widens as it falls
uniform float uEdge;          // brightness of the true leading edge
uniform float uFringe;        // per-channel ramp offset -> dispersion at the tail

// camera
uniform vec2  uAnchor;        // word centre in uv
uniform float uYaw;
uniform float uPitch;
uniform float uFocal;

// colour
uniform vec3  uTrailHead;     // hsl-ish resolved rgb at the word
uniform vec3  uTrailTail;     // resolved rgb at the tail
uniform vec3  uBleed;
uniform vec3  uHalo;
uniform vec3  uCore;
uniform vec3  uBg;
uniform vec3  uPoolA;
uniform vec3  uPoolB;
uniform float uPoolAlphaA;
uniform float uPoolAlphaB;
uniform vec3  uVignette;
uniform float uSubtract;      // 1.0 = ink on paper, 0.0 = light on dark
uniform float uSoft;          // strength of the two soft word layers
uniform float uNoise;
uniform float uTime;
uniform vec2  uHaloShift;
uniform vec2  uWordShift;     // the bleed/halo offset that sells directional light

// Sample the word mask at a point on the plane, z units back, with the glyph
// scaled up by grow (1.0 = its own size).
// Forward projection is  p' = anchor + rot(p) * focal/(focal+z)
// so to find which mask texel lands on THIS fragment we undo it.
float maskAt(vec2 uv, float z, float grow) {
  vec2 p = uv - uAnchor;
  p.x *= uAspect;                       // work in square space so the turn is even

  float s = (uFocal + z) / uFocal;      // inverse of the perspective divide
  p *= s;

  // Making the SAMPLED glyph bigger means shrinking the lookup toward the anchor.
  p /= max(0.001, grow);

  // undo the in-plane rotation (yaw about y, pitch about x). The forward pass
  // scales x by cos(yaw) and y by cos(pitch), so invert that.
  float cy = max(0.001, cos(uYaw));
  float cp = max(0.001, cos(uPitch));
  p.x /= cy;
  p.y /= cp;

  p.x /= uAspect;
  vec2 t = p + uAnchor;
  if (t.x < 0.0 || t.x > 1.0 || t.y < 0.0 || t.y > 1.0) return 0.0;
  return texture2D(uMask, t).a;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;

  // ── the trail ────────────────────────────────────────────────────────────
  // March backward along the fall direction. Each step is one "copy": if the
  // word covers us at that offset, it contributes one more overlapping stamp.
  //
  // Rather than loop uEchoes times (a dynamic bound, illegal in GLSL ES 1.0,
  // and wasteful), we take a FIXED number of samples spread across the trail and
  // weight each by how many copies it stands in for. The accumulation law is
  // smooth in k, so sampling it coarsely and scaling the exponent is
  // indistinguishable from stamping every copy — and it is a constant cost.
  const int SAMPLES = 48;

  // One authored pixel, in uv. The params are written against a 620px-tall card,
  // so a step of 1.0 means one 620th of the height regardless of the real size —
  // that is what keeps the copies overlapping (and the ramp smooth) at every
  // card size instead of combing apart on a tall one.
  float px = 1.0 / 620.0;
  vec2 fall = uFall * uStep * px;
  float perSample = uEchoes / float(SAMPLES); // copies each sample represents

  // Recession per copy, in the SAME uv units the perspective divide works in.
  // This is the one that has to be normalised: uZStep is authored per-copy in
  // card pixels, and feeding raw pixel counts into focal/(focal+z) drove z to
  // ~115 against a focal of 1.6, a ~70x divide that threw every sample far
  // outside the mask — so nothing was found and the trail vanished entirely.
  float zPer = uZStep * px;

  float dens = 0.0;   // accumulated coverage 0..1
  float ramp = 0.0;   // density-weighted position along the trail, for the hue
  float wsum = 0.0;
  // (A) The lowest copy index that covered this pixel. This is the real leading
  // edge of the exposure — the front face of the whole stack — and it is exact
  // rather than assumed, so it follows the trail wherever the bend and the
  // turbulence put it. The Canvas 2D version could only fake this by brightening
  // the first three copies, which pinned a rim to the word instead of to the
  // actual front of the trail.
  float firstHit = 1e9;

  for (int i = 1; i <= SAMPLES; i++) {
    float fi = float(i) * perSample;           // which copy index this is
    float t  = fi / max(1.0, uEchoes);         // 0 at the word, 1 at the tail

    vec2 off = fall * fi;

    // ── magnetism ─────────────────────────────────────────────────────────
    // The trail bends toward the cursor instead of falling dead straight. The
    // pull grows along the trail (t*t), so the copies nearest the word stay put
    // and the far end swings — which is what makes it read as the trail being
    // ATTRACTED rather than the whole word being dragged. Squared so the bend is
    // a curve, not a kink.
    //
    // Free: the sample offset is already a vector, so this is one multiply-add
    // inside a loop that was going to run anyway. No extra texture fetches, which
    // is the only thing that actually costs anything in here.
    vec2 toCur = uMagnet - uAnchor;
    toCur.x *= uAspect;
    // Attraction falls off with distance, so a cursor parked in the far corner
    // relaxes the trail back to vertical instead of hauling it sideways forever.
    float grip = uMagnetOn / (1.0 + dot(toCur, toCur) * 5.0);
    off += toCur * (t * t * grip * 0.55);

    // ── cursor-coupled depth ──────────────────────────────────────────────
    // The recession already exists per copy; coupling it to the cursor makes the
    // near copies swing further than the far ones, so the stack shears in depth
    // and you get a genuine parallax read out of geometry that was already here.
    // (1-t) weights it toward the word end — the near copies are the ones a real
    // parallax would move most.
    float z = zPer * fi * (1.0 + uSwing * (1.0 - t));

    // ── (C) turbulence ────────────────────────────────────────────────────
    // The tail wavers, the head stays crisp. Two sines at incommensurate rates
    // beating against each other, so it never reads as a clean oscillation.
    //
    // The important part is that the phase advances with fi: the displacement
    // differs from copy to copy, so the trail SNAKES along its length instead of
    // sliding sideways as a rigid shape. Weighted t*t so it is nothing at the
    // word and strongest at the far end, which is how smoke and hot air actually
    // behave — the disturbance has had further to travel.
    float wob = sin(fi * 0.105 + uTime * 1.25)
              * sin(fi * 0.037 - uTime * 0.71 + 2.1);
    off += vec2(wob, wob * 0.35) * (t * t * uTurb * px);

    // ── (E) dissipation ───────────────────────────────────────────────────
    // Each copy is sampled slightly larger than the last, so the trail opens up
    // as it falls rather than staying a constant-width ribbon. A long exposure of
    // something emitting light does spread, and it also softens the hard edges of
    // the tail without any blur — the widening copies overlap less exactly, which
    // is its own kind of falloff.
    float grow = 1.0 + t * uSpread;

    float m = maskAt(uv - off, z, grow);
    if (m > 0.0) {
      // coverage contributed by perSample overlapping copies at uAlpha
      float k = 1.0 - pow(1.0 - uAlpha * m, perSample);
      // composite this band OVER what we already have (same as stacking stamps)
      dens += k * (1.0 - dens);
      ramp += t * k;   // t is this copy's position along the trail
      wsum += k;
      firstHit = min(firstHit, fi);   // (A)
    }
  }
  float q = wsum > 0.0 ? ramp / wsum : 0.0;    // mean position along the ramp

  // (A) The leading edge, from the real first-hit index. Decays fast, so it is a
  // thin bright rim on the front of the exposure rather than a general lift of
  // the head — which is what gives the trail a defined front instead of just
  // fading in from nothing.
  float edge = firstHit < 1.0e8 ? exp(-firstHit * 0.085) * uEdge : 0.0;

  // ── the word itself, three layers ────────────────────────────────────────
  // Sampled at z = 0, on the plane. The two soft layers are nudged AWAY from the
  // pointer so the light reads as directional; the core never moves. Now that
  // maskAt takes a scale, the wide layers ask for a genuinely larger glyph rather
  // than faking size with a second offset sample.
  float bleed = maskAt(uv - uWordShift, 0.0, 1.055);
  float halo  = maskAt(uv - uWordShift * 0.45, 0.0, 1.018);
  float core  = maskAt(uv, 0.0, 1.0);

  // ── the atmosphere pool ──────────────────────────────────────────────────
  vec2 pc = uv - uAnchor - uHaloShift;
  pc.x *= uAspect;
  float pd = length(pc) / 0.52;
  float pool = 1.0 - clamp(pd, 0.0, 1.0);
  pool *= pool;

  // ── compose ──────────────────────────────────────────────────────────────
  // (B) Chromatic fringe. Each channel reads the ramp at a slightly different
  // position, as if the three wavelengths had been exposed for slightly different
  // lengths of trail. Red trails a touch behind and blue runs a touch ahead, so
  // the tail separates into colour exactly where the density is thinnest and the
  // separation is visible — and the dense head stays neutral, because there the
  // ramp is flat and all three land in the same place.
  //
  // Three mixes on values already in registers. The Canvas 2D version bought the
  // same idea with a second ~190-blit pass over the whole trail.
  float qr = clamp(q + uFringe, 0.0, 1.0);
  float qb = clamp(q - uFringe, 0.0, 1.0);
  vec3 trailCol = vec3(
    mix(uTrailHead.r, uTrailTail.r, qr),
    mix(uTrailHead.g, uTrailTail.g, q),
    mix(uTrailHead.b, uTrailTail.b, qb)
  );
  // ── both composites, then blended ────────────────────────────────────────
  // uSubtract is CONTINUOUS, not a boolean, and that is the whole point.
  //
  // The presets alternate dark and light, so nearly every crossfade crosses from
  // additive to subtractive. Branching on uSubtract > 0.5 meant the compositing
  // mode SNAPPED at the midpoint of every transition — and the midpoint is the
  // worst possible moment for it, because the background is then a mid-grey where
  // neither mode looks right. That snap, plus the washed-out middle it sat in, is
  // what made the colour change read as broken rather than as a wash.
  //
  // Evaluating both and mixing costs a handful of ALU ops on values already in
  // registers (no extra texture fetches), and in exchange every frame of the
  // transition is a valid image. uSoft and the trail alpha can now ride the same
  // continuous mix instead of jumping with the mode.
  vec3 add = uBg;
  add += uPoolA * pool * uPoolAlphaA;
  add += uPoolB * pool * uPoolAlphaB;
  add += trailCol * dens;
  // (A) the leading edge, lifted toward the core colour so the front of the
  // exposure reads as the hottest part of the light.
  add += mix(trailCol, uCore, 0.5) * edge * dens;
  add += uBleed * bleed * 0.16 * uSoft;
  add += uHalo  * halo  * 0.32 * uSoft;
  add += uCore  * core  * 0.95;

  // INK ON PAPER. Adding light to near-white blows straight out and the trail
  // vanishes, so the same accumulation has to subtract instead — density of
  // pigment, not emission. Multiply is what keeps the ramp readable.
  vec3 sub = uBg;
  sub = mix(sub, sub * uPoolA, pool * uPoolAlphaA);
  sub = mix(sub, sub * uPoolB, pool * uPoolAlphaB);
  sub *= mix(vec3(1.0), trailCol, dens);
  // (A) on paper the leading edge is the DENSEST ink, not the brightest light —
  // the front of the stroke where the pigment pooled.
  sub *= mix(vec3(1.0), trailCol, edge * dens * 0.5);
  sub *= mix(vec3(1.0), uBleed, bleed * 0.16 * uSoft);
  sub *= mix(vec3(1.0), uHalo,  halo  * 0.32 * uSoft);
  sub *= mix(vec3(1.0), uCore,  core  * 0.95);

  vec3 col = mix(add, sub, uSubtract);

  // ── vignette ─────────────────────────────────────────────────────────────
  vec2 vc = uv - vec2(0.5, 0.45);
  vc.x *= uAspect;
  float vd = clamp((length(vc) - 0.16) / 0.56, 0.0, 1.0);
  col *= mix(vec3(1.0), uVignette, vd);

  // ── (D) grain ────────────────────────────────────────────────────────────
  // Wide soft gradients band badly in 8-bit, so some dither is non-negotiable.
  // But a FLAT layer of it reads as a dirty screen sitting in front of the image.
  // Real film grain lives in the emulsion: it is strongest where the exposure
  // actually happened and nearly absent in untouched shadow. Weighting it by the
  // trail's own density is what turns the dither into part of the photograph —
  // the trail comes out looking exposed rather than drawn.
  //
  // A floor keeps just enough everywhere to kill banding in the pool + vignette.
  // The sign rides uSubtract continuously (grain LIFTS out of shadow on a dark
  // ground, DARKENS on paper) so it passes through zero mid-transition instead of
  // inverting in one frame.
  float n = hash(gl_FragCoord.xy + vec2(uTime * 60.0)) - 0.5;
  float grainAmt = uNoise * (0.35 + 1.5 * max(dens, core));
  col += n * grainAmt * mix(1.0, -1.0, uSubtract);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`,i={echoes:210,step:1,alpha:.019,angle:Math.PI/2,hueShift:26,turbulence:16,spread:.22,edge:.5,fringe:.045},o="motion",s=[{name:"Afterglow",mode:"add",bg:"#0b0e0c",trail:{hue:132,sat:46,light:52,dHue:26,dSat:-14,dLight:-26},bleed:"hsl(150 45% 40%)",halo:"hsl(146 60% 62%)",core:"hsl(140 34% 93%)",pool:["rgba(94,214,138,0.16)","rgba(58,150,110,0.06)"],vignette:"#6b7a70",alphaScale:1},{name:"Graphite",mode:"subtract",bg:"#ffffff",trail:{hue:250,sat:14,light:26,dHue:8,dSat:-8,dLight:54},bleed:"hsl(250 16% 58%)",halo:"hsl(252 24% 34%)",core:"hsl(254 46% 13%)",pool:["rgba(120,120,170,0.07)","rgba(120,120,170,0.02)"],vignette:"#f6f5fa",alphaScale:.42},{name:"Amber",mode:"add",bg:"#0d0906",trail:{hue:32,sat:78,light:52,dHue:-14,dSat:-18,dLight:-28},bleed:"hsl(28 70% 42%)",halo:"hsl(36 88% 62%)",core:"hsl(44 60% 94%)",pool:["rgba(255,168,66,0.16)","rgba(168,96,28,0.06)"],vignette:"#7a6a56",alphaScale:1},{name:"Cyanotype",mode:"subtract",bg:"#fdfeff",trail:{hue:205,sat:58,light:30,dHue:-12,dSat:-18,dLight:52},bleed:"hsl(205 46% 56%)",halo:"hsl(206 64% 32%)",core:"hsl(210 82% 15%)",pool:["rgba(64,132,196,0.08)","rgba(64,132,196,0.025)"],vignette:"#f2f7fb",alphaScale:.42},{name:"Ultramarine",mode:"add",bg:"#07090f",trail:{hue:224,sat:64,light:54,dHue:26,dSat:-16,dLight:-30},bleed:"hsl(228 58% 44%)",halo:"hsl(220 78% 66%)",core:"hsl(210 46% 94%)",pool:["rgba(96,150,255,0.16)","rgba(48,80,180,0.06)"],vignette:"#606a86",alphaScale:1},{name:"Rust",mode:"subtract",bg:"#fffdfa",trail:{hue:16,sat:52,light:32,dHue:16,dSat:-20,dLight:52},bleed:"hsl(20 42% 58%)",halo:"hsl(16 56% 34%)",core:"hsl(10 66% 17%)",pool:["rgba(198,110,70,0.08)","rgba(198,110,70,0.025)"],vignette:"#fbf3ec",alphaScale:.42},{name:"Split",mode:"add",bg:"#0a070c",trail:{hue:318,sat:62,light:54,dHue:-132,dSat:-8,dLight:-26},bleed:"hsl(320 56% 44%)",halo:"hsl(318 76% 66%)",core:"hsl(300 34% 94%)",pool:["rgba(232,96,208,0.15)","rgba(72,120,190,0.07)"],vignette:"#786080",alphaScale:1}],r="var(--font-mondwest)";function n(t){let e=document.createElement("span");e.style.cssText="position:absolute;visibility:hidden",e.style.fontFamily=t,document.body.appendChild(e);let a=getComputedStyle(e).fontFamily||"sans-serif";return e.remove(),a}function l(t,e,a){t=(t%360+360)%360;let i=e=>(e+t/30)%12,o=(e=Math.max(0,Math.min(100,e))/100)*Math.min(a=Math.max(0,Math.min(100,a))/100,1-a),s=t=>a-o*Math.max(-1,Math.min(i(t)-3,Math.min(9-i(t),1)));return[s(0),s(8),s(4)]}function h(t){let e=t.trim();if(e.startsWith("#")){let t=e.slice(1);return 3===t.length&&(t=t.split("").map(t=>t+t).join("")),{rgb:[parseInt(t.slice(0,2),16)/255,parseInt(t.slice(2,4),16)/255,parseInt(t.slice(4,6),16)/255],a:1}}let a=e.match(/^hsl\(\s*([-\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)$/);if(a)return{rgb:l(+a[1],+a[2],+a[3]),a:1};let i=e.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/);return i?{rgb:[i[1]/255,i[2]/255,i[3]/255],a:void 0!==i[4]?+i[4]:1}:{rgb:[1,1,1],a:1}}let u=new Map;function d(t,e){let a=`${t.name}|${e.toFixed(2)}`,i=u.get(a);if(i)return i;let o=t.trail,s=h(t.pool[0]),r=h(t.pool[1]),n={subtract:+("subtract"===t.mode),bg:h(t.bg).rgb,head:l(o.hue,o.sat,o.light),tail:l(o.hue+e,o.sat+o.dSat,o.light+o.dLight),bleed:h(t.bleed).rgb,halo:h(t.halo).rgb,core:h(t.core).rgb,poolA:s.rgb,poolB:r.rgb,poolAlphaA:s.a,poolAlphaB:r.a,vignette:h(t.vignette).rgb,alphaScale:t.alphaScale};return u.set(a,n),n}let c=(t,e,a)=>t+(e-t)*a,f=(t,e,a)=>[c(t[0],e[0],a),c(t[1],e[1],a),c(t[2],e[2],a)],p=["uMask","uResolution","uAspect","uEchoes","uStep","uAlpha","uFall","uZStep","uMagnet","uMagnetOn","uSwing","uTurb","uSpread","uEdge","uFringe","uAnchor","uYaw","uPitch","uFocal","uTrailHead","uTrailTail","uBleed","uHalo","uCore","uBg","uPoolA","uPoolB","uPoolAlphaA","uPoolAlphaB","uVignette","uSubtract","uSoft","uNoise","uTime","uHaloShift","uWordShift"];class g{host;canvas;gl=null;prog=null;quad=null;loc={};mask=null;params={...i};paletteIdx=0;fadeFrom=0;fadeMix=1;hero=!1;cycleT=0;ghostX=.5;ghostY=.42;realPtr=!1;leanX=0;leanY=0;leanTargetX=0;leanTargetY=0;near=0;nearTarget=0;ptr=null;magX=.5;magY=.42;magOn=0;idleMix=1;lastFontWidth=0;t=0;tReal=0;raf=0;last=0;running=!1;dpr=1;ro=null;disposed=!1;fontFamily="sans-serif";builtW=0;builtH=0;builtFont="";constructor(t,i){this.host=t,this.fontFamily=i??n(r),this.canvas=document.createElement("canvas"),this.canvas.style.cssText="display:block;width:100%;height:100%",t.appendChild(this.canvas);const o=this.canvas.getContext("webgl",{alpha:!1,antialias:!1,premultipliedAlpha:!1});if(!o)return;this.gl=o;try{this.prog=this.build(e,a)}catch{this.gl=null;return}for(const t of p)this.loc[t]=o.getUniformLocation(this.prog,t);this.quad=o.createBuffer(),o.bindBuffer(o.ARRAY_BUFFER,this.quad),o.bufferData(o.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),o.STATIC_DRAW);const s=h(this.palette.bg).rgb;o.clearColor(s[0],s[1],s[2],1),this.resize(),this.ro=new ResizeObserver(()=>this.resize()),this.ro.observe(t)}get ok(){return!!this.gl&&!!this.prog}build(t,e){let a=this.gl,i=(t,e)=>{let i=a.createShader(t);if(a.shaderSource(i,e),a.compileShader(i),!a.getShaderParameter(i,a.COMPILE_STATUS))throw Error(a.getShaderInfoLog(i)||"compile failed");return i},o=a.createProgram();if(a.attachShader(o,i(a.VERTEX_SHADER,t)),a.attachShader(o,i(a.FRAGMENT_SHADER,e)),a.linkProgram(o),!a.getProgramParameter(o,a.LINK_STATUS))throw Error(a.getProgramInfoLog(o)||"link failed");return o}buildMask(){let t=this.gl;if(!t||this.disposed)return;let e=this.canvas.width,a=this.canvas.height;if(!e||!a||e===this.builtW&&a===this.builtH&&this.fontFamily===this.builtFont)return;this.builtW=e,this.builtH=a,this.builtFont=this.fontFamily;let i=function(t,e,a,i){let o=Math.max(1,Math.round(e)),s=Math.max(1,Math.round(a)),r=document.createElement("canvas");r.width=o,r.height=s;let n=r.getContext("2d");n.clearRect(0,0,o,s);let l=(t||"").trim();if(!l)return r;let h=.34*s;n.font=`400 ${h}px ${i}`;let u=.72*o,d=n.measureText(l).width;d>u&&(h*=u/d,n.font=`400 ${h}px ${i}`);let c=n.measureText(l),f=c.actualBoundingBoxAscent||.75*h,p=c.actualBoundingBoxDescent||.25*h;return n.fillStyle="#fff",n.textAlign="center",n.textBaseline="alphabetic",n.fillText(l,o/2,.42*s+(f-p)/2),r}(o,e,a,this.fontFamily);this.mask||(this.mask=t.createTexture()),t.bindTexture(t.TEXTURE_2D,this.mask),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,!0),t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,i),t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,!1)}resize(){let t=this.gl;if(!t||this.disposed)return;let e=this.host.clientWidth,a=this.host.clientHeight;if(!e||!a)return;this.dpr=Math.min(window.devicePixelRatio||1,1.5);let i=Math.round(e*this.dpr),o=Math.round(a*this.dpr);(this.canvas.width!==i||this.canvas.height!==o)&&(this.canvas.width=i,this.canvas.height=o,t.viewport(0,0,i,o),this.buildMask()),this.running||this.draw(0)}setParams(t){Object.assign(this.params,t),this.running||this.draw(0)}refreshFonts(){var t;let e;if(this.disposed||!this.gl)return;this.fontFamily=n(r);let a=(t=this.fontFamily,(e=document.createElement("canvas").getContext("2d"))?(e.font=`400 100px ${t}`,Math.round(e.measureText(o).width)):0);(!this.mask||a!==this.lastFontWidth)&&(this.lastFontWidth=a,this.builtFont="",this.buildMask(),this.running||this.draw(0))}setPointer(t){if(!t){this.ptr=null,this.realPtr=!1;return}this.ptr={x:t.x,y:t.y},this.realPtr=!0,this.applyPointerTargets()}applyPointerTargets(){let t=this.ptr;if(!t)return;this.leanTargetX=(t.x-.5)*.42,this.leanTargetY=(t.y-.5)*.24;let e=t.x-.5,a=t.y-.42;this.nearTarget=1-Math.min(1,Math.hypot(e,a)/.62)}next(){this.fadeFrom=this.paletteIdx,this.fadeMix=this.fadeMix>=1?0:this.fadeMix,this.paletteIdx=(this.paletteIdx+1)%s.length,this.running||this.draw(0)}enableHero(t=2){this.hero=!0,this.cyclePeriod=t,this.cycleT=t}cyclePeriod=2;get palette(){return s[this.paletteIdx%s.length]}get bgCss(){let t=this.lastBg;return`rgb(${Math.round(255*t[0])} ${Math.round(255*t[1])} ${Math.round(255*t[2])})`}lastBg=[0,0,0];onBg=null;step(t){if(this.hero&&!this.realPtr){let t=this.tReal,e=.55*Math.sin(2.3*t)+.3*Math.sin(3.7*t+1.1)+.15*Math.sin(6.1*t+.4),a=.55*Math.cos(1.9*t+2.1)+.3*Math.sin(4.3*t+.5)+.15*Math.cos(7.3*t+1.7);this.ghostX=.5+.2*e,this.ghostY=.42+.13*a,this.ptr={x:this.ghostX,y:this.ghostY},this.applyPointerTargets()}let e=!!this.ptr;this.idleMix+=(!e-this.idleMix)*Math.min(1,t*(e?26:.7)),e&&this.idleMix<.002&&(this.idleMix=0),this.t+=t*this.idleMix,this.tReal+=t,this.applyPointerTargets();let a=this.idleMix,i=.13*Math.sin(.23*this.t),o=.07*Math.sin(.31*this.t+1.7),s=.22+.1*Math.sin(.17*this.t),r=this.leanTargetX*(1-a)+i*a,n=this.leanTargetY*(1-a)+o*a,l=this.nearTarget*(1-a)+s*a,h=e=>1-Math.exp(-e*t),u=h(e?16:2.2);this.leanX+=(r-this.leanX)*u,this.leanY+=(n-this.leanY)*u,this.near+=(l-this.near)*h(e?12:1.8),this.leanX=Math.max(-.21,Math.min(.21,this.leanX)),this.leanY=Math.max(-.12,Math.min(.12,this.leanY));let d=h(7);this.ptr&&(this.magX+=(this.ptr.x-this.magX)*d,this.magY+=(this.ptr.y-this.magY)*d),this.magOn+=(!!this.ptr-this.magOn)*h(this.ptr?9:2.4),this.fadeMix<1&&(this.fadeMix=Math.min(1,this.fadeMix+t/.34)),this.hero&&this.fadeMix>=1&&(this.cycleT-=t,this.cycleT<=0&&(this.cycleT=this.cyclePeriod,this.next()))}draw(t){var e,a,i;let o,r,n=this.gl,l=this.prog;if(!n||!l||(this.step(t),this.mask||this.buildMask(),!this.mask))return;let h=this.canvas.width,u=this.canvas.height,p=this.params,g=h/Math.max(1,u),m=t=>t.trail.dHue*(p.hueShift/26),b=s[this.paletteIdx%s.length],v=this.fadeMix>=1?d(b,m(b)):(o=s[this.fadeFrom%s.length],r=this.fadeMix,e=d(o,m(o)),a=d(b,m(b)),i=r*r*(3-2*r),{subtract:c(e.subtract,a.subtract,i),alphaScale:c(e.alphaScale,a.alphaScale,i),bg:f(e.bg,a.bg,i),head:f(e.head,a.head,i),tail:f(e.tail,a.tail,i),bleed:f(e.bleed,a.bleed,i),halo:f(e.halo,a.halo,i),core:f(e.core,a.core,i),poolA:f(e.poolA,a.poolA,i),poolB:f(e.poolB,a.poolB,i),poolAlphaA:c(e.poolAlphaA,a.poolAlphaA,i),poolAlphaB:c(e.poolAlphaB,a.poolAlphaB,i),vignette:f(e.vignette,a.vignette,i)});n.useProgram(l),n.bindBuffer(n.ARRAY_BUFFER,this.quad);let w=n.getAttribLocation(l,"aPosition");n.enableVertexAttribArray(w),n.vertexAttribPointer(w,2,n.FLOAT,!1,0,0),n.activeTexture(n.TEXTURE0),n.bindTexture(n.TEXTURE_2D,this.mask),n.uniform1i(this.loc.uMask,0),n.uniform1f(this.loc.uYaw,-(.2*this.leanX)),n.uniform1f(this.loc.uPitch,-(.12*this.leanY)),n.uniform1f(this.loc.uFocal,1.6),n.uniform2f(this.loc.uAnchor,.5+.05*this.leanX,1-(.42+.05*this.leanY)),n.uniform2f(this.loc.uFall,Math.cos(p.angle),-Math.sin(p.angle)),n.uniform1f(this.loc.uStep,p.step),n.uniform1f(this.loc.uZStep,.55*p.step),n.uniform1f(this.loc.uAlpha,p.alpha*v.alphaScale),n.uniform2f(this.loc.uMagnet,this.magX,1-this.magY),n.uniform1f(this.loc.uMagnetOn,this.magOn),n.uniform1f(this.loc.uSwing,2.2*this.leanX),n.uniform1f(this.loc.uTurb,p.turbulence*(1+.35*this.magOn)),n.uniform1f(this.loc.uSpread,p.spread),n.uniform1f(this.loc.uEdge,p.edge),n.uniform1f(this.loc.uFringe,p.fringe);let x=1.15-.6*this.near;n.uniform1f(this.loc.uEchoes,Math.max(1,p.echoes*x)),n.uniform3fv(this.loc.uTrailHead,v.head),n.uniform3fv(this.loc.uTrailTail,v.tail),n.uniform3fv(this.loc.uBleed,v.bleed),n.uniform3fv(this.loc.uHalo,v.halo),n.uniform3fv(this.loc.uCore,v.core),n.uniform3fv(this.loc.uBg,v.bg),n.uniform3fv(this.loc.uPoolA,v.poolA),n.uniform3fv(this.loc.uPoolB,v.poolB),n.uniform1f(this.loc.uPoolAlphaA,v.poolAlphaA),n.uniform1f(this.loc.uPoolAlphaB,v.poolAlphaB),n.uniform3fv(this.loc.uVignette,v.vignette),(v.bg[0]!==this.lastBg[0]||v.bg[1]!==this.lastBg[1]||v.bg[2]!==this.lastBg[2])&&(this.lastBg=[v.bg[0],v.bg[1],v.bg[2]],this.onBg?.(this.bgCss)),n.uniform1f(this.loc.uSubtract,v.subtract),n.uniform1f(this.loc.uSoft,c(1,.35,v.subtract)),n.uniform1f(this.loc.uNoise,c(.02,.012,v.subtract)),n.uniform1f(this.loc.uTime,this.tReal),n.uniform1f(this.loc.uAspect,g),n.uniform2f(this.loc.uResolution,h,u),n.uniform2f(this.loc.uHaloShift,.07*this.leanX,-(.08*this.leanY)),n.uniform2f(this.loc.uWordShift,-(.006*this.leanX),.006*this.leanY),n.drawArrays(n.TRIANGLES,0,3)}renderStill(){this.draw(0)}start(){if(this.running||!this.ok||this.disposed)return;this.running=!0,this.last=performance.now();let t=e=>{if(!this.running)return;let a=Math.min((e-this.last)/1e3,1/30);this.last=e,this.draw(a),this.raf=requestAnimationFrame(t)};this.raf=requestAnimationFrame(t)}stop(){this.running=!1,this.raf&&cancelAnimationFrame(this.raf),this.raf=0}destroy(){this.disposed=!0,this.stop(),this.ro?.disconnect(),this.ro=null;let t=this.gl;t&&(this.mask&&t.deleteTexture(this.mask),this.quad&&t.deleteBuffer(this.quad),this.prog&&t.deleteProgram(this.prog),t.getExtension("WEBGL_lose_context")?.loseContext()),this.gl=null,this.canvas.remove()}}t.s(["DEFAULTS",0,i,"FadeMotion",0,g,"pixelFontSpec",0,function(){return`400 100px ${n(r)}`}],36011)},30243,t=>{"use strict";var e=t.i(43476),a=t.i(71645),i=t.i(36011),o=t.i(20268);t.s(["SmearCard",0,function({bare:t=!1,viewTransitionName:s}={}){let r=(0,a.useRef)(null);return(0,a.useEffect)(()=>{let t=r.current;if(!t)return;let e=window.matchMedia("(prefers-reduced-motion: reduce)").matches,a=null,s=0,n=!1,l=!1,h=!1,u=!1,d=()=>{a&&!e&&(!l||h||u?a.stop():a.start())},c=new IntersectionObserver(o=>{(l=o.some(t=>t.isIntersecting))&&!n&&(n||(n=!0,s=requestAnimationFrame(()=>{!r.current||(a=new i.FadeMotion(t)).ok&&(e||a.enableHero(2),a.onBg=e=>{t.style.backgroundColor=e},document.fonts?.load&&(document.fonts.load((0,i.pixelFontSpec)()).catch(()=>{}).then(()=>a?.refreshFonts()),document.fonts.ready.then(()=>a?.refreshFonts()).catch(()=>{})),e?a.renderStill():d())}))),n&&d()},{rootMargin:"200px"});c.observe(t);let f=()=>{h=document.hidden,d()};document.addEventListener("visibilitychange",f);let p=(0,o.onTransitionChange)(t=>{u=t,d()}),g=window.matchMedia("(pointer: fine)").matches,m=i=>{if(!a||e)return;let o=t.getBoundingClientRect();a.setPointer({x:(i.clientX-o.left)/o.width,y:(i.clientY-o.top)/o.height})},b=()=>a?.setPointer(null);return g&&(t.addEventListener("pointermove",m),t.addEventListener("pointerleave",b),t.addEventListener("pointercancel",b)),()=>{cancelAnimationFrame(s),c.disconnect(),document.removeEventListener("visibilitychange",f),p(),g&&(t.removeEventListener("pointermove",m),t.removeEventListener("pointerleave",b),t.removeEventListener("pointercancel",b)),a?.destroy()}},[]),(0,e.jsx)("div",{ref:r,"data-canvas-card":!0,style:{viewTransitionName:s},"aria-label":"A word trailing downward into light, its fade built from hundreds of overlapping copies",className:"relative aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[var(--bg-hover)]"})}])}]);