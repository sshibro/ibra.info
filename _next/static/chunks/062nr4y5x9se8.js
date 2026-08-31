(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,6891,e=>{"use strict";var t=e.i(43476),i=e.i(71645),s=e.i(38362);let r=`
precision highp float;
uniform sampler2D src;
uniform vec2 resolution;
uniform vec2 offset;
uniform float time;
uniform float enterTime;
uniform float leaveTime;

uniform int mode;
uniform float speed;
uniform float delay;
uniform float width;
uniform vec3 accent;   // deep blue end of the per-cell blue range
uniform vec3 accent2;  // bright cyan-blue end — cells lerp between the two by hash
uniform vec3 baseCol;  // the resting (un-scanned) cell colour
uniform vec2 mouse;    // cursor position in px (card-local, bottom-left origin)
uniform float hover;   // 0 when idle, eased -> 1 while the cursor is over the card
uniform float spot;    // flare radius (in p-space units)

// short trail of recent cursor points (p-space) with per-point freshness weights,
// so cells the cursor passed over keep glowing briefly then fade — a lasting wake.
#define TRAIL 24
uniform vec2 trail[TRAIL];
uniform float trailW[TRAIL]; // 1 = freshest, decays -> 0 (0 = empty slot)

#define W width
#define LAYERS 3.0   // must be a compile-time constant (ES 1.0 loop bound)

vec4 readTex(vec2 uv) {
  if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) return vec4(0);
  return texture2D(src, uv);
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(4859., 3985.))) * 3984.); }
float sdBox(vec2 p, float r) { vec2 q = abs(p) - r; return min(length(q), max(q.y, q.x)); }

float dir = 1.;
vec2 mp = vec2(0.);       // cursor in p-space (set in main)
vec2 tp[TRAIL];           // trail points converted to p-space (set in main)

// px (bottom-left origin) -> the same p-space as main's p
vec2 pxToP(vec2 px) {
  vec2 uv = (px - offset) / resolution;
  vec2 q = uv * 2. - 1.;
  q.y *= resolution.y / resolution.x;
  return q;
}

float toRangeT(vec2 p, float scale) {
  float d;
  if (mode == 0) d = p.x / (scale * 2.) + .5;            // left-to-right
  else if (mode == 1) d = 1. - (p.y / (scale * 2.) + .5); // top-to-bottom
  else if (mode == 2) d = length(p) / scale;              // radial
  // mode 3: diagonal — project onto the bottom-left -> top-right axis
  else d = dot(p, vec2(0.7071, 0.7071)) / (scale * 2.) + .5;
  d = dir > 0. ? d : (1. - d);
  return d;
}

// One little block at a grid cell. Each block is a SMALL box jittered off its
// lattice point (per-cell hash), so the field reads as a dense spray of tiny
// squares rather than a regular tiled grid. core = how much this block is an
// on-band "accent" block vs a dim surrounding one.
// ORIGINAL cell structure (Smertimba / VFX-JS), kept faithfully. Our only changes:
//  • colour is monochrome + one accent instead of the rainbow hsv2rgb,
//  • the cursor hover folds into the SAME anim term, so the pool reuses the exact
//    cell look (square + edge light) rather than a separate code path.
vec4 cell(vec2 p, vec2 pi, float scale, float t, float edge) {
  vec2 pc = pi + .5;

  // cell alpha (masked to the glyph)
  vec2 uvc = pc / scale;
  uvc.y /= resolution.y / resolution.x;
  uvc = uvc * 0.5 + 0.5;
  if (uvc.x < 0. || uvc.x > 1. || uvc.y < 0. || uvc.y > 1.) return vec4(0);
  float alpha = smoothstep(.0, .1, texture2D(src, uvc).a);

  // fade by the scan animation. The per-cell jitter (n * SPREAD) is wider than the
  // band, so neighbouring cells trigger at very different scan positions instead of
  // all peaking together — that scatters the lit boxes evenly rather than clustering.
  float x = toRangeT(pi, scale);
  float n = hash(pi);
  float SPREAD = W * 2.2;
  float anim = smoothstep(W * 2., .0, abs(x + n * SPREAD - t));

  // hover wake: a MORPHING blob, not a clean circle (like the Human Delta tile
  // field). The reach wobbles with the angle to the cursor + time, so the lit shape
  // has rotating, breathing lobes. ~20% smaller area (spot * 0.8).
  vec2 cellP = pc / scale;
  float spotA = 0.;
  for (int i = 0; i < TRAIL; i++) {
    float w = trailW[i];
    if (w <= 0.) continue;
    vec2 rel = cellP - tp[i];
    float ang = atan(rel.y, rel.x);
    float wob = 1.
      + 0.30 * sin(3. * ang + time * 1.6)
      + 0.16 * sin(5. * ang - time * 1.1 + 1.3);
    float reach = spot * 0.8 * wob; // 0.8 → ~20% less area; wob → morphing lobes
    spotA = max(spotA, smoothstep(reach, reach * 0.4, length(rel)) * w);
  }
  anim = max(anim, spotA * hover);

  // layered, MOVING blue: each cell's tone drifts between the deep blue and the
  // bright cyan-blue over time (per-cell phase from the hash). Faster + a touch of a
  // second harmonic so the shimmer reads as a more intense, lively colour shift.
  float tone = 0.5 + 0.5 * sin(time * 2.0 + n * 6.2831)
                   + 0.18 * sin(time * 3.7 + n * 12.566);
  tone = clamp(tone, 0., 1.);
  vec3 cellAccent = mix(accent, accent2, tone);
  vec4 color = vec4(mix(baseCol, cellAccent, anim), 1.) * anim;

  // super-weak cursor magnetism: cells near the pointer drift a hair toward it while
  // hovering. The pull is tiny and falls off with distance, so it's barely-there.
  // (mp/cellP are p-space; *scale converts the offset into this cell's box space.)
  float pull = hover * smoothstep(spot * 1.4, 0., length(cellP - mp));
  vec2 mag = normalize(mp - cellP + 1e-5) * pull * 0.18; // tiny, in cell units
  vec2 bp = p - pc - mag;

  // edge light — original box SDF; smaller box (was .5) for a bit smaller squares.
  // a slightly softer edge + a faint outer bleed give a super-minimal blur/glow.
  float sd = sdBox(bp, .38);
  color *= mix(1., clamp(.3 / abs(sd), 0., 10.), edge * pow(anim, 9.));
  color += vec4(cellAccent, 1.) * anim * smoothstep(.55, .0, abs(sd)) * 0.07; // soft bleed

  return color * alpha;
}

// ORIGINAL 5-tap: centre cell weighted \xd74, four orthogonal neighbours \xd71, /8.
vec4 cellsColor(vec2 p, float scale, float t) {
  vec2 pi = floor(p);
  vec2 d = vec2(0, 1);
  vec4 cc = vec4(0);
  cc += cell(p, pi, scale, t, .2) * 4.;
  cc += cell(p, pi + d.xy, scale, t, .9);
  cc += cell(p, pi - d.xy, scale, t, .9);
  cc += cell(p, pi + d.yx, scale, t, .9);
  cc += cell(p, pi - d.yx, scale, t, .9);
  return cc / 8.;
}

vec4 draw(vec2 uv, vec2 p, float t, float scale) {
  vec4 c = readTex(uv);
  vec2 pi = floor(p * scale);
  float n = hash(pi);
  t = t * (1. + W * 4.) - W * 2.;
  float x = toRangeT(pi, scale);
  float a1 = smoothstep(t, t - W, x + n * W);
  c *= a1;
  c += cellsColor(p * scale, scale, t) * 1.1; // lower = thinner/weaker cell density
  return c;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;
  vec2 p = uv * 2. - 1.;
  p.y *= resolution.y / resolution.x;

  // cursor + its recent trail, converted to p-space for the spotlight in cell()
  mp = pxToP(mouse);
  for (int i = 0; i < TRAIL; i++) tp[i] = pxToP(trail[i]);

  float t;
  if (leaveTime > 0.) { dir = -1.; t = clamp(leaveTime * speed, 0., 1.); }
  else { t = clamp((enterTime - delay) * speed, 0., 1.); }
  t = (fract(t * .99999) - 0.5) * dir + 0.5;

  // Same shape as the original (cos(i)*K+B) but the band is shifted UP, because our
  // card is wide (3.2:1) — the original's 10/14/17 makes huge cells here. ~28/36/42.
  for (float i = 0.; i < LAYERS; i++) {
    float s = cos(i) * 11. + 32.;
    gl_FragColor += draw(uv, p, t, abs(s));
  }
  gl_FragColor /= LAYERS;
  gl_FragColor *= smoothstep(0., 0.01, t);
}
`,a=`
precision highp float;
attribute vec3 position;
void main() { gl_Position = vec4(position, 1.0); }
`,o=[.4,.75,1],n=[1,.45,.8],l=[.85,.8,1];class h{host;canvas;THREE;word;accent;accent2;base;textColor;dpr=Math.min(2,window.devicePixelRatio||1);family;renderer;scene;camera;geo;material;uniforms;texture;wordCanvas=null;wordCtx=null;rect;entranceStart=performance.now();hoverTarget=0;hoverVal=0;trailVecs;trailWeights;trailBorn=Array(24).fill(-1e9);liveX=-1e4;liveY=-1e4;liveOn=!1;head=1;lastPx=0;lastPy=0;targetX=-1e4;targetY=-1e4;startTime=performance.now();lastFrame=this.startTime;raf=0;running=!1;constructor(e,t,i,s={}){this.host=e,this.canvas=t,this.THREE=i,this.word=s.word??"bababooey",this.accent=s.accent??o,this.accent2=s.accent2??n,this.base=s.base??l,this.textColor=s.textColor??"#191b24",this.family=function(e){let t=getComputedStyle(e).getPropertyValue("--font-kyoto").trim();return t?`${t}, Georgia, serif`:"Georgia, serif"}(e),this.renderer=new i.WebGLRenderer({canvas:this.canvas,alpha:!0,antialias:!1}),this.renderer.setPixelRatio(this.dpr),this.scene=new i.Scene,this.camera=new i.Camera,this.geo=new i.PlaneGeometry(2,2),this.rect=e.getBoundingClientRect(),this.texture=this.makeTexture(this.rect.width,this.rect.height),this.uniforms={src:{value:this.texture},resolution:{value:new i.Vector2(this.rect.width*this.dpr,this.rect.height*this.dpr)},offset:{value:new i.Vector2(0,0)},time:{value:0},enterTime:{value:0},leaveTime:{value:0},mode:{value:3},speed:{value:1},delay:{value:0},width:{value:.2},accent:{value:new i.Vector3(...this.accent)},accent2:{value:new i.Vector3(...this.accent2)},baseCol:{value:new i.Vector3(...this.base)},mouse:{value:new i.Vector2(-1e4,-1e4)},hover:{value:0},spot:{value:.28},trail:{value:Array.from({length:24},()=>new i.Vector2(-1e4,-1e4))},trailW:{value:Array(24).fill(0)}},this.material=new i.RawShaderMaterial({vertexShader:a,fragmentShader:r,uniforms:this.uniforms,transparent:!0}),this.scene.add(new i.Mesh(this.geo,this.material)),this.trailVecs=this.uniforms.trail.value,this.trailWeights=this.uniforms.trailW.value,this.setSize(),this.host.addEventListener("pointerenter",this.onEnter),this.host.addEventListener("pointerdown",this.onDown),this.host.addEventListener("pointerleave",this.onLeave),this.host.addEventListener("pointermove",this.onMove),window.addEventListener("resize",this.onResize),this.canvas.addEventListener("webglcontextlost",this.onContextLost),this.canvas.addEventListener("webglcontextrestored",this.onContextRestored)}makeTexture(e,t){var i,s,r,a,o,n;let l,h,c,d=(i=e,s=t,r=this.dpr,a=this.family,o=this.word,n=this.textColor,(l=document.createElement("canvas")).width=Math.max(1,Math.round(i*r)),l.height=Math.max(1,Math.round(s*r)),(h=l.getContext("2d")).scale(r,r),h.clearRect(0,0,i,s),c=.12*i,h.font=`500 ${c}px ${a}`,h.letterSpacing=`${-(.02*c)}px`,h.fillStyle=n,h.textAlign="center",h.textBaseline="middle",h.fillText(o,i/2,s/2+.04*c),l);this.wordCanvas=d,this.wordCtx=d.getContext("2d",{willReadFrequently:!0});let u=new this.THREE.CanvasTexture(d);return u.minFilter=this.THREE.LinearFilter,u.magFilter=this.THREE.LinearFilter,u.generateMipmaps=!1,u.needsUpdate=!0,u}overGlyph(e,t){if(!this.wordCanvas||!this.wordCtx)return!1;let i=Math.round(e),s=Math.round(this.wordCanvas.height-t);if(i<0||s<0||i>=this.wordCanvas.width||s>=this.wordCanvas.height)return!1;try{return this.wordCtx.getImageData(i,s,1,1).data[3]>20}catch{return!1}}setSize=()=>{this.rect=this.host.getBoundingClientRect(),this.renderer.setSize(this.rect.width,this.rect.height,!1),this.uniforms.resolution.value.set(this.rect.width*this.dpr,this.rect.height*this.dpr),this.texture.dispose(),this.texture=this.makeTexture(this.rect.width,this.rect.height),this.uniforms.src.value=this.texture};enterTimeVal(){let e=(performance.now()-this.entranceStart)/1e3;if(e>=2.6)return 2;let t=e/2.6;return 1-(1-t)*(1-t)}toLocal(e){let t=this.host.getBoundingClientRect();return{x:(e.clientX-t.left)*this.dpr,y:(t.height-(e.clientY-t.top))*this.dpr}}onEnter=e=>{this.hoverTarget=1,this.liveOn=!0;let t=this.toLocal(e);this.targetX=this.liveX=this.lastPx=t.x,this.targetY=this.liveY=this.lastPy=t.y,this.entranceStart=performance.now(),(0,s.glitchScan)(2.6)};onLeave=()=>{this.hoverTarget=0,this.liveOn=!1};onMove=e=>{let t=this.toLocal(e);this.targetX=t.x,this.targetY=t.y,this.overGlyph(t.x,t.y)&&(0,s.glitchTick)()};onDown=e=>{"touch"===e.pointerType&&(this.entranceStart=performance.now(),(0,s.glitchScan)(2.6))};onResize=()=>this.setSize();onContextLost=e=>{e.preventDefault(),this.raf&&cancelAnimationFrame(this.raf),this.raf=0};onContextRestored=()=>{this.setSize(),this.running&&!this.raf&&(this.raf=requestAnimationFrame(this.tick))};tick=()=>{let e=performance.now();if(this.uniforms.time.value=(e-this.startTime)/1e3,this.uniforms.enterTime.value=this.enterTimeVal(),this.hoverVal+=(this.hoverTarget-this.hoverVal)*.22,this.uniforms.hover.value=this.hoverVal,this.liveX+=(this.targetX-this.liveX)*.35,this.liveY+=(this.targetY-this.liveY)*.35,this.liveOn){let t=3*this.dpr,i=Math.hypot(this.liveX-this.lastPx,this.liveY-this.lastPy),s=i,r=0;for(;i>=t&&r<4;){let a=t/i;this.lastPx+=(this.liveX-this.lastPx)*a,this.lastPy+=(this.liveY-this.lastPy)*a,this.head=this.head+1>=24?1:this.head+1,this.trailVecs[this.head].set(this.lastPx,this.lastPy);let o=s>0?1-i/s:1;this.trailBorn[this.head]=this.lastFrame+(e-this.lastFrame)*o,i=Math.hypot(this.liveX-this.lastPx,this.liveY-this.lastPy),r++}}this.lastFrame=e,this.trailVecs[0].set(this.liveX,this.liveY),this.trailWeights[0]=+!!this.liveOn;for(let t=1;t<24;t++){let i=Math.max(0,Math.min(1,1-(e-this.trailBorn[t])/1e3/1.1));this.trailWeights[t]=i*i*(3-2*i)}this.uniforms.mouse.value.set(this.liveX,this.liveY),this.renderer.render(this.scene,this.camera),this.raf=requestAnimationFrame(this.tick)};start(){if(this.running)return;this.running=!0;let e=performance.now();this.lastFrame=e,this.raf=requestAnimationFrame(this.tick)}stop(){this.running=!1,this.raf&&cancelAnimationFrame(this.raf),this.raf=0}resize(){this.setSize()}destroy(){this.stop(),this.host.removeEventListener("pointerenter",this.onEnter),this.host.removeEventListener("pointerdown",this.onDown),this.host.removeEventListener("pointerleave",this.onLeave),this.host.removeEventListener("pointermove",this.onMove),window.removeEventListener("resize",this.onResize),this.canvas.removeEventListener("webglcontextlost",this.onContextLost),this.canvas.removeEventListener("webglcontextrestored",this.onContextRestored),this.texture.dispose(),this.geo.dispose(),this.material.dispose(),this.renderer.dispose(),this.renderer.forceContextLoss?.(),this.renderer.getContext().getExtension("WEBGL_lose_context")?.loseContext()}}var c=e.i(20268);let d="bababooey";e.s(["PixelScanField",0,function({bare:s=!1}={}){let r=(0,i.useRef)(null),a=(0,i.useRef)(null);return(0,i.useEffect)(()=>{let t=r.current,i=a.current;if(!t||!i||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;let s=!1,o=null,n=null;return(async()=>{let l=getComputedStyle(t).getPropertyValue("--font-kyoto").trim(),u=(async()=>{if(l)try{await document.fonts.load(`500 40px ${l}`,d),await document.fonts.ready}catch{}})(),[v]=await Promise.all([e.A(21442),u]);if(s||!r.current||!a.current)return;o=new h(t,i,v,{word:d});let m=!0,p=!1,f=!1,g=()=>{!m||p||f?o.stop():o.start()};g();let x=new ResizeObserver(()=>o.resize());x.observe(t);let w=new IntersectionObserver(e=>{m=e[0]?.isIntersecting??!0,g()});w.observe(t);let b=()=>{p=document.hidden,g()};document.addEventListener("visibilitychange",b);let y=(0,c.onTransitionChange)(e=>{f=e,g()});n=()=>{x.disconnect(),w.disconnect(),document.removeEventListener("visibilitychange",b),y(),o.destroy()}})(),()=>{s=!0,n?.()}},[]),(0,t.jsx)("div",{ref:r,className:"relative mx-auto flex aspect-[1344/420] w-full select-none items-center justify-center overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[#fafdff]","aria-label":`${d} (pixel scan effect)`,children:(0,t.jsx)("canvas",{ref:a,className:"absolute inset-0 h-full w-full"})})}],6891)},94526,e=>{e.n(e.i(6891))},21442,e=>{e.v(t=>Promise.all(["static/chunks/2rln0773edsh5.js"].map(t=>e.l(t))).then(()=>t(32009)))}]);