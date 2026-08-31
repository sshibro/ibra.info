(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,62671,41018,e=>{"use strict";var t=e.i(35877);let i=`
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`,a=`
// highp requested, but plenty of mobile GPUs quietly hand back mediump in the
// fragment stage. Every hash folds its input into a small range first, so the
// texture survives on a phone instead of collapsing into flat bands.
precision highp float;

varying vec2 vUv;

uniform sampler2D uField;       // R = face, G = white halo, B = black keyline
uniform vec2  uResolution;
uniform float uAspect;
uniform float uTime;

uniform sampler2D uMoire;   // the real moire interference plate, tiled
uniform sampler2D uGrain;   // the real fine-grain plate
uniform sampler2D uDust;    // the real dust specks, tiled
uniform float uTexture;     // surface strength
uniform float uSeparation;  // per-channel moire offset — print misregistration
uniform vec2  uCursor;      // pointer in uv
uniform float uCursorOn;    // eased presence, 0..1
uniform float uSwim;        // S3: cursor-driven counter-rotation of the moire
uniform float uParallax;    // how far the plates drift toward the pointer, in uv
uniform float uPull;        // magnetism: how hard the whole word leans in
uniform vec2  uMoireScale;  // how many times the plate tiles across the card
uniform vec2  uGrainScale;
uniform vec2  uDustScale;
uniform float uThreshold;   // the source's Threshold, as a crush on the ground

uniform vec3  uGround;
uniform vec3  uInk;
uniform vec3  uPaper;
uniform vec3  uFringe;

uniform vec2  uLevels;      // input black / white points
uniform float uVibrance;

// Still needed for the final dither only — the surface itself is now sampled
// from the real PSD plates rather than generated.
float hash(vec2 p){
  p = mod(p, 137.0);
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
// ── Photoshop blend modes, written out exactly ──────────────────────────────
// Not approximated with a mix(): these curves are the difference between
// "looks a bit like the reference" and "is the reference".
float hardLight(float base, float blend){
  return blend < 0.5
    ? 2.0 * base * blend
    : 1.0 - 2.0 * (1.0 - base) * (1.0 - blend);
}
float linearLight(float base, float blend){
  return clamp(base + 2.0 * blend - 1.0, 0.0, 1.0);
}

// Levels with gamma 1.0 — the source has no midtone shift, so this is a pure
// contrast crush and there is no pow() to pay for.
vec3 levels(vec3 c, float lo, float hi){
  return clamp((c - lo) / max(hi - lo, 0.0001), 0.0, 1.0);
}

// Vibrance, not saturation: it lifts muted channels far harder than saturated
// ones, so a hot ground gains almost nothing while the fringe gains a lot. Plain
// saturation clips the ground to a flat primary and kills the printed quality.
vec3 vibrance(vec3 c, float amt){
  float mx = max(c.r, max(c.g, c.b));
  float mn = min(c.r, min(c.g, c.b));
  float sat = mx - mn;
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(lum), c, 1.0 + amt * (1.0 - sat));
}

void main() {
  vec2 uv = vUv;
  vec2 p = uv * vec2(uAspect, 1.0);

  // ── PARALLAX ──────────────────────────────────────────────────────────────
  // The three plates drift toward the pointer at DIFFERENT rates, so the letter,
  // its white halo and its shadow separate slightly and the type reads as a
  // stack of layers rather than one flat print.
  //
  // THE UV IS SHIFTED, THE MASK IS NOT REBUILT, and that distinction is the
  // whole reason this can be smooth. The letters live on a fixed lattice, so
  // moving them WITHIN the grid means either resampling the block edges
  // (soft, shimmering staircase) or snapping in whole 9px cells (a visible
  // lurch). Sliding the sample point instead moves the entire rasterised plate
  // as one rigid sheet: every block keeps the exact shape it was built with, and
  // the motion is free of the grid because nothing is re-quantised.
  //
  // Tiny on purpose — a couple of pixels at most. Enough that the layers breathe
  // when you move; small enough that the poster never looks like it is sliding.
  // MAGNETISM. The word as a whole leans toward the pointer, strongest when the
  // cursor is near it and relaxing as you move away — so it reads as attraction
  // rather than as the card tracking your mouse everywhere.
  //
  // Measured from the FRAME CENTRE, not per pixel: a per-pixel pull would warp
  // the letterforms (near cells dragged further than far ones), and warping is
  // the one thing a lattice cannot survive. One vector for the whole plate keeps
  // every block rigid and just moves the sheet.
  vec2 fromMid = uCursor - vec2(0.5, 0.5);
  float grip = 1.0 - smoothstep(0.0, 0.75, length(fromMid * vec2(uAspect, 1.0)));
  vec2 pull = fromMid * uPull * grip * uCursorOn;

  vec2 toCur = (uCursor - uv) * uCursorOn * uParallax + pull;
  // The shadow moves most, the face least: the further a layer is from the
  // surface, the more a viewpoint change should shift it.
  float face = texture2D(uField, uv - toCur * 0.35).r;
  float halo = texture2D(uField, uv - toCur * 0.70).g;
  float key  = texture2D(uField, uv - toCur * 1.00).b;

  // ── THE GROUND SURVIVES ───────────────────────────────────────────────────
  vec3 col = uGround;

  // ── THE THRESHOLD, doing its real job ─────────────────────────────────────
  // In the source this is a Threshold 150 in color burn, and it only deepens the
  // ground where the print is already dark — it does not create the letterforms.
  // Modelled as a mild darkening of the ground's own shadows.
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col *= mix(1.0, 0.86, smoothstep(uThreshold, uThreshold - 0.35, lum));

  // ── THE LETTERS, painted back to front ────────────────────────────────────
  // Widest first, exactly as the two stroke effects stack: the black keyline is
  // 103px where the white halo is 73px, so the black shows as a band beyond the
  // white rather than sitting under it.
  col = mix(col, uInk, key);
  col = mix(col, uPaper, halo);
  col = mix(col, uInk, face);

  // ── THE SURFACE, OVER EVERYTHING ──────────────────────────────────────────
  // The three real texture layers from the PSD, in their own blend modes.
  //
  // THIS RUNS AFTER THE LETTERS, and the order is not a detail. In the source
  // the Textures group sits ABOVE the Effect group, so the surface falls across
  // the whole poster — the white halo and the black keyline included. Applying
  // it to the ground and then painting clean type on top leaves the letters
  // looking like flat vector laid on a printed background, and the most obvious
  // tell in the reference is that the white faces are just as printed as the red.
  //
  // The plates are sampled at a scale that keeps the moire's measured pitch
  // (~28px at 4500 wide, so ~0.6% of the width) rather than stretching the image
  // to fit — stretch it and the interference pattern changes frequency, which is
  // the one property that makes it read as moire at all.
  // ── S3 — THE MOIRE SWIMS ──────────────────────────────────────────────────
  // The plate is TWO curved gratings beating against each other, and that is
  // what makes this worth doing: interference is enormously sensitive to the
  // angle between its gratings. Sampling the plate a second time, rotated by a
  // fraction of a degree around the cursor, and taking the darker of the two
  // shifts the beat pattern across the whole surface. A rotation far too small
  // to see as a rotation produces a visible change in where the bands land.
  //
  // Rotating the WHOLE surface instead would just spin the texture, which reads
  // as the poster turning. Beating two nearly-identical samples is what makes
  // the pattern itself move while the print stays put.
  vec2 mUV = uv * uMoireScale;
  vec2 dUV = uv * uDustScale;

  float swimD = length((uv - uCursor) * vec2(uAspect, 1.0));
  // Falls off with distance, so the surface churns under your hand and is still
  // out at the edges — a local disturbance rather than a global animation.
  // A TIGHT falloff. At 0.55 the disturbance covered most of the card, which is
  // what made it read as a shape following the cursor rather than as the surface
  // reacting where you touch it.
  float swimAmt = smoothstep(0.22, 0.0, swimD) * uCursorOn * uSwim;
  float a = swimAmt * 0.055;                       // radians: ~3 degrees at most
  float cs = cos(a), sn = sin(a);
  vec2 about = uCursor * uMoireScale;
  vec2 rel = mUV - about;
  vec2 mUV2 = about + vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs);
  // ── COLOUR SEPARATION ─────────────────────────────────────────────────────
  // The moire sampled three times, one per channel, each offset by a fraction of
  // a tile along the stripe direction. A print out of register — and because the
  // offset is tied to the plate rather than the screen, the fringe rides the
  // interference pattern instead of floating over it.
  //
  // Small: at more than a texel or two this stops reading as registration drift
  // and starts reading as a 3D-glasses effect.
  vec2 sep = vec2(0.0022, 0.0009) * uSeparation;
  // BLEND BETWEEN THE TWO SAMPLES — DO NOT take min() of them.
  //
  // min() was the first attempt, on the reasoning that two overlaid physical
  // screens both block light. That reasoning is wrong in a way that is obvious
  // in hindsight: the minimum of two draws from the same distribution is
  // systematically DARKER than either draw (about 0.05 lower for this plate), so
  // it does not merely move the interference, it drops the brightness of the
  // whole region. With a wide falloff that paints a large dark disc under the
  // pointer — a grey blob that has nothing to do with moire.
  //
  // Mixing keeps the mean exactly where it was. The rotated sample still shifts
  // where the bands fall, which is the entire effect, but the surface does not
  // get darker for being disturbed.
  float mA = texture2D(uMoire, mUV).r;
  float mB = texture2D(uMoire, mUV2).r;
  float moire = mix(mA, mB, swimAmt);
  vec3 moireRGB = vec3(
    mix(texture2D(uMoire, mUV + sep).r, texture2D(uMoire, mUV2 + sep).r, swimAmt),
    moire,
    mix(texture2D(uMoire, mUV - sep).r, texture2D(uMoire, mUV2 - sep).r, swimAmt)
  );
  // The fine grain is its OWN plate from the PSD (the linear-light layer), not a
  // resample of the moire. They are genuinely different images — one is
  // structured interference, the other is per-pixel noise — and standing one in
  // for the other was a shortcut that showed.
  float grain = texture2D(uGrain, uv * uGrainScale).r;
  float dust  = texture2D(uDust, dUV).r;

  float t = uTexture;
  // 1) the moire, HARD LIGHT. The PSD layer is 30% opacity, but that is 30% of a
  //    plate composited in Photoshop's own colour pipeline — here it sits over a
  //    fully saturated ground where a 30% mix only swings the value by ~0.07,
  //    which is on the edge of visible at 8-bit. Taken up to where the print
  //    actually reads.
  vec3 h1 = vec3(
    hardLight(col.r, moireRGB.r),
    hardLight(col.g, moireRGB.g),
    hardLight(col.b, moireRGB.b)
  );
  col = mix(col, h1, 0.72 * t);

  // 2) the fine grain, LINEAR LIGHT.
  vec3 l2 = vec3(linearLight(col.r, grain), linearLight(col.g, grain), linearLight(col.b, grain));
  col = mix(col, l2, 0.55 * t);

  // A SIGNED GRAIN on top, because both blend modes go nearly silent on white.
  // Hard light and linear light CLIP at 1.0, so on a white letter face every
  // value above 0.5 does nothing and the paper can only ever darken — the grain
  // lands about half as strong on the type as on the ground, which is the
  // opposite of the reference, where the white faces are the most obviously
  // printed part of the poster.
  col += (grain - 0.5) * 0.16 * t;
  col += (moire - 0.5) * 0.10 * t;

  // 3) the dust, SCREEN
  col = 1.0 - (1.0 - col) * (1.0 - dust * 0.45 * t);

  // ── EDGE FRINGE ───────────────────────────────────────────────────────────
  // The coloured speckle the source shows along the quantised boundary — a
  // registration artefact of the print. Confined to the band between the halo
  // and the face, so it clings to the block edges rather than dusting the frame.
  float rim = clamp(halo - face, 0.0, 1.0);
  float speck = step(0.62, hash(floor(p * uResolution.y * 0.6) + 3.0));
  col += uFringe * rim * speck * 0.22 * uTexture;

  // ── FINISH ────────────────────────────────────────────────────────────────
  col = levels(col, uLevels.x, uLevels.y);
  col = vibrance(col, uVibrance);
  col += (hash(uv * 1024.0 + fract(uTime)) - 0.5) * (1.5 / 255.0);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`,r=[{name:"Arcade Red",ground:[.922,.031,.035],ink:[.02,.024,.02],paper:[1,1,1],fringe:[.35,1,.9]},{name:"Acid",ground:[.804,1,.05],ink:[.04,.06,.02],paper:[1,1,.96],fringe:[1,.2,.75]},{name:"Cyanide",ground:[.04,.85,.92],ink:[.01,.05,.08],paper:[.96,1,1],fringe:[1,.35,.2]},{name:"Monochrome",ground:[.9,.89,.87],ink:[.04,.04,.05],paper:[1,1,1],fringe:[.5,.55,.6]},{name:"Ultraviolet",ground:[.36,.05,.85],ink:[.03,.01,.08],paper:[.95,.92,1],fringe:[1,.85,.2]},{name:"Ember",ground:[1,.42,.02],ink:[.08,.02,0],paper:[1,.97,.9],fringe:[.2,.7,1]}],s={word:"arcade",threshold:.588,cols:150,halo:3,keyline:3,keylineOffset:[1,1],italic:!0,texture:.25,magnet:!0,magnetReach:1,swim:1,parallax:.009,pull:.016,separation:1,colorway:0},o=[5/255,230/255],n="var(--font-neue-montreal)";function l(e,t,i,a){let r=e;for(let e=0;e<a;e++){let e=new Uint8Array(t*i);for(let a=0;a<i;a++)for(let s=0;s<t;s++){let o=a*t+s;if(r[o]){e[o]=1;continue}(s>0&&r[o-1]||s<t-1&&r[o+1]||a>0&&r[o-t]||a<i-1&&r[o+t])&&(e[o]=1)}r=e}return r}e.s(["COLORWAYS",0,r,"DEFAULTS",0,s,"FONT_CSS",0,n,"FONT_WEIGHT",0,600,"LEVELS_IN",0,o,"VIBRANCE",0,.2],41018);let h=["arcade","insert coin","player one","game over"];function u(e){return"hold"===e?1900:"collapse"===e?240:380}function d(e){return[...e.ground,...e.ink,...e.paper,...e.fringe]}let c=["uField","uResolution","uAspect","uTime","uThreshold","uTexture","uMoire","uGrain","uDust","uSeparation","uCursor","uCursorOn","uSwim","uParallax","uPull","uMoireScale","uGrainScale","uDustScale","uGround","uInk","uPaper","uFringe","uLevels","uVibrance"];class m{host;canvas;gl=null;prog=null;loc={};quad=null;tex=null;moire=null;grain=null;dust=null;params={...s};w=0;h=0;dpr=1;fontFamily=`${n}, sans-serif`;cur=d(r[0]);cx=.5;cy=.5;on=0;onTarget=0;shX=0;shY=0;cycling=!1;phase="hold";phaseT=0;idx=0;wordIdx=0;builtCols=-1;liveShadow=[0,0];raf=0;running=!1;awake=!1;painted=!1;destroyed=!1;t0=performance.now();last=0;builtW=0;builtH=0;builtWord="";builtKey="";builtFont="";buildScheduled=0;ok=!1;constructor(e,r){this.host=e,r&&(this.fontFamily=r),this.canvas=document.createElement("canvas"),Object.assign(this.canvas.style,{position:"absolute",inset:"0",width:"100%",height:"100%",display:"block",opacity:"0"}),e.appendChild(this.canvas);const s=this.canvas.getContext("webgl",{alpha:!1,antialias:!1,premultipliedAlpha:!1});if(!s)return;this.gl=s;try{this.prog=this.build(i,a)}catch{this.gl=null;return}for(const e of c)this.loc[e]=s.getUniformLocation(this.prog,e);this.quad=s.createBuffer(),s.bindBuffer(s.ARRAY_BUFFER,this.quad),s.bufferData(s.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),s.STATIC_DRAW);const o=s.getAttribLocation(this.prog,"aPosition");s.useProgram(this.prog),s.enableVertexAttribArray(o),s.vertexAttribPointer(o,2,s.FLOAT,!1,0,0),this.loadPlate((0,t.mediaUrl)("/vault/arcade-moire.webp"),"moire"),this.loadPlate((0,t.mediaUrl)("/vault/arcade-grain.webp"),"grain"),this.loadPlate((0,t.mediaUrl)("/vault/arcade-dust.webp"),"dust"),this.resize(),this.buildFieldNow(),this.canvas.addEventListener("pointermove",this.onMove),this.canvas.addEventListener("pointerleave",this.onLeave),this.ok=!0}loadPlate(e,t){let i=this.gl;if(!i)return;let a=new Image;a.crossOrigin="anonymous",a.onload=()=>{if(!this.gl||this.destroyed)return;let e=e=>(e&e-1)==0,r=e(a.width)&&e(a.height),s=i.createTexture();i.bindTexture(i.TEXTURE_2D,s);let o=r?i.REPEAT:i.CLAMP_TO_EDGE;i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,o),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,o),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MAG_FILTER,i.LINEAR),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.texImage2D(i.TEXTURE_2D,0,i.RGBA,i.RGBA,i.UNSIGNED_BYTE,a),this[t]=s,this.running||this.render()},a.src=e}build(e,t){let i=this.gl,a=(e,t)=>{let a=i.createShader(e);if(i.shaderSource(a,t),i.compileShader(a),!i.getShaderParameter(a,i.COMPILE_STATUS))throw Error(i.getShaderInfoLog(a)||"compile failed");return a},r=i.createProgram();if(i.attachShader(r,a(i.VERTEX_SHADER,e)),i.attachShader(r,a(i.FRAGMENT_SHADER,t)),i.linkProgram(r),!i.getProgramParameter(r,i.LINK_STATUS))throw Error(i.getProgramInfoLog(r)||"link failed");return r}onMove=e=>{let t=this.canvas.getBoundingClientRect();this.cx=(e.clientX-t.left)/t.width,this.cy=1-(e.clientY-t.top)/t.height,this.onTarget=1,this.wake()};onLeave=()=>{this.onTarget=0,this.wake()};wake(){this.awake&&!this.running?this.start():this.running||this.render()}setParams(e){let t=void 0!==e.word&&e.word!==this.params.word||void 0!==e.cols&&e.cols!==this.params.cols||void 0!==e.halo&&e.halo!==this.params.halo||void 0!==e.keyline&&e.keyline!==this.params.keyline||void 0!==e.keylineOffset&&e.keylineOffset.join()!==this.params.keylineOffset.join()||void 0!==e.italic&&e.italic!==this.params.italic;Object.assign(this.params,e),void 0!==e.colorway&&this.setColorway(e.colorway),t&&this.scheduleBuild(),this.wake()}setColorway(e){let t=(e%r.length+r.length)%r.length;this.idx=t,this.params.colorway=t,this.cur=d(r[t]),this.wake()}setCycling(e){this.cycling=e,this.phase="hold",this.phaseT=0}setFont(e){e!==this.fontFamily&&(this.fontFamily=e,this.scheduleBuild())}resize(){let e=this.host.getBoundingClientRect();this.dpr=Math.min(2,window.devicePixelRatio||1),this.w=e.width,this.h=e.height;let t=Math.max(1,Math.round(this.w*this.dpr)),i=Math.max(1,Math.round(this.h*this.dpr));(this.canvas.width!==t||this.canvas.height!==i)&&(this.canvas.width=t,this.canvas.height=i,this.gl?.viewport(0,0,t,i),this.scheduleBuild())}paramKey(){let e=this.params,t=e.magnet?this.liveShadow:e.keylineOffset;return`${e.word}|${e.cols}|${e.halo}|${e.keyline}|${t.join(",")}|${e.italic}`}maskSize(){let e=Math.max(2,Math.min(1600,Math.round(this.w*this.dpr))),t=Math.max(2,Math.round(e*(this.h/Math.max(1,this.w))));return[e,t]}scheduleBuild(){if(!this.gl||this.destroyed)return;let[e,t]=this.maskSize();if(e===this.builtW&&t===this.builtH&&this.params.word===this.builtWord&&this.builtKey===this.paramKey()&&this.fontFamily===this.builtFont||this.buildScheduled)return;let i=()=>{this.buildScheduled=0,this.buildFieldNow()},a=window.requestIdleCallback;this.buildScheduled=a?a(i,{timeout:200}):window.setTimeout(i,0)}buildSync(){if(!this.gl||this.destroyed)return;let[e,t]=this.maskSize();this.uploadMask(e,t)}uploadMask(e,t){let i=this.gl;if(!i||this.destroyed)return;this.builtW=e,this.builtH=t,this.builtWord=this.params.word,this.builtKey=this.paramKey(),this.builtFont=this.fontFamily;let a=function(e){let t=Math.max(1,Math.round(e.w)),i=Math.max(1,Math.round(e.h)),a=Math.max(24,Math.round(e.cols)),r=Math.max(8,Math.round(i/t*a)),s=document.createElement("canvas");s.width=a,s.height=r;let o=s.getContext("2d",{willReadFrequently:!0});o.clearRect(0,0,a,r);let n=(e.word||"").trim();if(n){let t=e.keyline+2,i=.46*r,s=t=>(o.font=`${e.italic?"italic ":""}600 ${t}px ${e.fontFamily}`,o.measureText(n).width),l=(a-2*t)*.72;s(i)>l&&(i*=l/s(i)),o.font=`${e.italic?"italic ":""}600 ${i}px ${e.fontFamily}`,o.fillStyle="#fff",o.textAlign="center",o.textBaseline="middle",o.fillText(n,a/2,.5*r)}let h=o.getImageData(0,0,a,r).data,u=new Uint8Array(a*r);for(let e=0,t=0;e<h.length;e+=4,t++)u[t]=+(h[e+3]>127);let d=l(u,a,r,e.halo),c=l(u,a,r,e.keyline),[m,f]=e.keylineOffset,p=0===m&&0===f?c:(()=>{let e=new Uint8Array(a*r);for(let t=0;t<r;t++){let i=t-f;if(!(i<0)&&!(i>=r))for(let r=0;r<a;r++){let s=r-m;s<0||s>=a||(e[t*a+r]=c[i*a+s])}}for(let t=0;t<e.length;t++)c[t]&&(e[t]=1);return e})(),g=document.createElement("canvas");g.width=a,g.height=r;let w=g.getContext("2d"),v=w.createImageData(a,r);for(let e=0;e<a*r;e++)v.data[4*e]=255*!!u[e],v.data[4*e+1]=255*!!d[e],v.data[4*e+2]=255*!!p[e],v.data[4*e+3]=255;w.putImageData(v,0,0);let T=document.createElement("canvas");T.width=t,T.height=i;let b=T.getContext("2d");return b.imageSmoothingEnabled=!1,b.drawImage(g,0,0,t,i),T}({word:this.params.word,cols:this.params.cols,halo:this.params.halo,keyline:this.params.keyline,keylineOffset:this.params.magnet?this.liveShadow:this.params.keylineOffset,italic:this.params.italic,w:e,h:t,fontFamily:this.fontFamily});this.tex||(this.tex=i.createTexture()),i.bindTexture(i.TEXTURE_2D,this.tex),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MAG_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!0),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.texImage2D(i.TEXTURE_2D,0,i.RGBA,i.RGBA,i.UNSIGNED_BYTE,a),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1)}async buildFieldNow(){if(!this.gl||this.destroyed)return;if(this.buildScheduled){let e=window.cancelIdleCallback;e?e(this.buildScheduled):window.clearTimeout(this.buildScheduled),this.buildScheduled=0}let[e,t]=this.maskSize();this.uploadMask(e,t),this.running||this.render()}start(){if(!this.ok||(this.awake=!0,this.running))return;this.running=!0,this.last=0,this.resize();let e=t=>{this.running&&(this.frame(t),this.raf=requestAnimationFrame(e))};this.raf=requestAnimationFrame(e)}stop(){this.awake=!1,this.pause()}pause(){this.running=!1,this.raf&&cancelAnimationFrame(this.raf),this.raf=0}frame(e){let t=this.last?Math.min(64,e-this.last):16;this.last=e,this.on+=(this.onTarget-this.on)*.12,this.stepMagnet(),this.cycling&&this.stepCycle(t),this.render()}stepMagnet(){let e=this.params;if(!e.magnet)return;let t=e.keylineOffset[0]+e.magnetReach,i=-(2*(this.cx-.5))*t*this.on,a=(this.cy-.5)*2*t*this.on;this.shX+=(i-this.shX)*.14,this.shY+=(a-this.shY)*.14;let r=e.keylineOffset,s=Math.round(r[0]+this.shX),o=Math.round(r[1]+this.shY);(s!==this.liveShadow[0]||o!==this.liveShadow[1])&&(this.liveShadow=[s,o],this.buildSync())}stepCycle(e){var t,i,a;let r;this.phaseT+=e;let s=u(this.phase);if(this.phaseT>=s){this.phaseT=0;let e=this.phase;this.phase="hold"===(t=this.phase)?"collapse":"collapse"===t?"resolve":"hold","collapse"===e&&(this.wordIdx=(this.wordIdx+1)%h.length,this.params.word=h[this.wordIdx],this.setColorway(this.idx+1))}let o=Math.min(1,this.phaseT/u(this.phase)),n=(i=this.phase,"hold"===i?150:Math.round(150*Math.pow(.36666666666666664,"collapse"===i?(a=o)*a:1-(1-(r=1-o)*r*r))));n!==this.builtCols&&(this.builtCols=n,this.params.cols=n,this.buildSync())}renderStill(){this.resize(),this.buildFieldNow(),this.canvas.addEventListener("pointermove",this.onMove),this.canvas.addEventListener("pointerleave",this.onLeave),this.render()}render(){let e=this.gl;if(!e||!this.prog||!this.tex)return;let t=this.params;e.useProgram(this.prog),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.tex),e.uniform1i(this.loc.uField,0),e.uniform2f(this.loc.uResolution,this.canvas.width,this.canvas.height),e.uniform1f(this.loc.uAspect,this.w/Math.max(1,this.h)),e.uniform1f(this.loc.uTime,(performance.now()-this.t0)/1e3),e.uniform1f(this.loc.uThreshold,t.threshold),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,this.moire),e.uniform1i(this.loc.uMoire,1),e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,this.grain),e.uniform1i(this.loc.uGrain,2),e.activeTexture(e.TEXTURE3),e.bindTexture(e.TEXTURE_2D,this.dust),e.uniform1i(this.loc.uDust,3);let i=this.w/Math.max(1,this.h);e.uniform2f(this.loc.uMoireScale,+i,1),e.uniform2f(this.loc.uGrainScale,2.6*i,2.6),e.uniform2f(this.loc.uDustScale,.85*i,.85),e.uniform1f(this.loc.uTexture,t.texture),e.uniform1f(this.loc.uSeparation,t.separation),e.uniform2f(this.loc.uCursor,this.cx,this.cy),e.uniform1f(this.loc.uCursorOn,this.on),e.uniform1f(this.loc.uSwim,t.swim),e.uniform1f(this.loc.uParallax,t.parallax),e.uniform1f(this.loc.uPull,t.pull);let a=this.cur;e.uniform3f(this.loc.uGround,a[0],a[1],a[2]),e.uniform3f(this.loc.uInk,a[3],a[4],a[5]),e.uniform3f(this.loc.uPaper,a[6],a[7],a[8]),e.uniform3f(this.loc.uFringe,a[9],a[10],a[11]),e.uniform2f(this.loc.uLevels,o[0],o[1]),e.uniform1f(this.loc.uVibrance,.2),e.drawArrays(e.TRIANGLES,0,3),this.painted||(this.painted=!0,this.canvas.style.opacity="1"),!this.awake&&!this.cycling&&.002>Math.abs(this.on-this.onTarget)&&this.pause()}destroy(){if(this.destroyed=!0,this.buildScheduled){let e=window.cancelIdleCallback;e?e(this.buildScheduled):window.clearTimeout(this.buildScheduled),this.buildScheduled=0}this.stop(),this.canvas.removeEventListener("pointermove",this.onMove),this.canvas.removeEventListener("pointerleave",this.onLeave);let e=this.gl;e&&(this.tex&&e.deleteTexture(this.tex),this.moire&&e.deleteTexture(this.moire),this.grain&&e.deleteTexture(this.grain),this.dust&&e.deleteTexture(this.dust),this.quad&&e.deleteBuffer(this.quad),e.getExtension("WEBGL_lose_context")?.loseContext()),this.canvas.remove()}}e.s(["Arcade",0,m],62671)},15345,e=>{"use strict";var t=e.i(43476),i=e.i(71645),a=e.i(62671),r=e.i(41018),s=e.i(38362),o=e.i(20268);e.s(["ArcadeCard",0,function({bare:e=!1,viewTransitionName:n}={}){let l=(0,i.useRef)(null);return(0,i.useEffect)(()=>{let e=l.current;if(!e)return;let t=window.matchMedia("(prefers-reduced-motion: reduce)").matches,i=null,s=!1,n=!1,h=!1,u=!1,d=()=>{i&&!t&&(!s||n||h?i.stop():i.start())},c=r=>{u||!l.current||(u=!0,(i=new a.Arcade(e,r?`"${r}", sans-serif`:void 0)).ok&&(t?i.renderStill():(i.setCycling(!0),d())))},m="u">typeof document&&"fonts"in document&&!!document.fonts,f=requestAnimationFrame(()=>{let e,t;if(!l.current)return;let i=m?((e=document.createElement("span")).style.cssText="position:absolute;visibility:hidden",e.style.fontFamily=r.FONT_CSS,e.textContent="Ag",document.body.appendChild(e),t=getComputedStyle(e).fontFamily.split(",")[0].replace(/["']/g,"").trim(),e.remove(),t):"";if(m&&i){let e=window.setTimeout(()=>c(i),350),t=()=>{window.clearTimeout(e),c(i)};document.fonts.load(`${r.FONT_WEIGHT} 1em "${i}"`).then(t,t)}else c()}),p=new IntersectionObserver(e=>{s=e[0]?.isIntersecting??!1,d()},{threshold:.2});p.observe(e);let g=()=>{n=document.hidden,d()};document.addEventListener("visibilitychange",g);let w=(0,o.onTransitionChange)(e=>{h=e,d()}),v=0,T=()=>{window.clearTimeout(v),v=window.setTimeout(()=>i?.resize(),120)};return window.addEventListener("resize",T),()=>{cancelAnimationFrame(f),p.disconnect(),document.removeEventListener("visibilitychange",g),w(),window.removeEventListener("resize",T),window.clearTimeout(v),i?.destroy()}},[]),(0,t.jsx)("div",{ref:l,"data-canvas-card":!0,role:"img","aria-label":"The word arcade printed into a flat colour poster, its edges quantised into hard pixel blocks by a threshold; the colourway cycles slowly and the blocks sharpen wherever the pointer passes",style:n?{viewTransitionName:n}:void 0,className:"relative mx-auto aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[#EB0809]",onPointerEnter:()=>(0,s.hoverLink)()})}])},24068,e=>{e.n(e.i(15345))}]);