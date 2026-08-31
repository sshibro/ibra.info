(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,45227,e=>{"use strict";var t=e.i(43476),i=e.i(71645);let r=`
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
float cnoise(vec3 P){
  vec3 Pi0 = floor(P); vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod(Pi0, 289.0); Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P); vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz; vec4 iz1 = Pi1.zzzz;
  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0); vec4 ixy1 = permute(ixy + iz1);
  vec4 gx0 = ixy0 / 7.0; vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0); vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5); gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  vec4 gx1 = ixy1 / 7.0; vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1); vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5); gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x); vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z); vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x); vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z); vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000), dot(g010,g010), dot(g100,g100), dot(g110,g110)));
  g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001), dot(g011,g011), dot(g101,g101), dot(g111,g111)));
  g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000,n100,n010,n110), vec4(n001,n101,n011,n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  return 2.2 * mix(n_yz.x, n_yz.y, fade_xyz.x);
}
`,s=`
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`,a=`
precision highp float;
${r}
varying vec2 vUv;
uniform vec2 uResolution;
uniform sampler2D uMap;     // previous trail frame
uniform vec2  uPointer;     // cursor in uv (0..1)
uniform float uActive;      // 1 while the cursor is over the card, else 0
uniform float uDt;
uniform float uTime;
uniform float uSize;

void main() {
  vec2 uv = vUv;
  vec2 texel = vec2(1.0) / uResolution;

  // erode: shrink the trail evenly from its edges (min of the 4 neighbours) + a slow
  // global decay. Shrinking-from-edges keeps the trail ONE connected shape as it fades
  // (it retreats inward) instead of breaking into stray islands / circles.
  vec2 t = texel * (uDt * 16.0);
  float c1 = texture2D(uMap, uv + t).r;
  float c2 = texture2D(uMap, uv - t).r;
  float c3 = texture2D(uMap, uv + t * vec2(-1.0, 1.0)).r;
  float c4 = texture2D(uMap, uv + t * vec2(1.0, -1.0)).r;
  float faded = min(min(c1, c2), min(c3, c4)) * (1.0 - uDt * 0.35);

  // paint: a noise-warped spot at the cursor (one gentle scale of warp) -> an organic,
  // living trail edge without breaking into pieces.
  float d = distance(uv, uPointer);
  d += cnoise(vec3(uv * 2.0, uTime * 0.6)) * 0.45 * uSize;
  float paint = smoothstep(uSize, uSize * 0.2, d) * uActive;

  float v = max(faded, paint);
  gl_FragColor = vec4(v, 0.0, 0.0, 1.0);
}
`,o=`
precision highp float;
varying vec2 vUv;
uniform sampler2D uStyleA;  // current style photo
uniform sampler2D uStyleB;  // next style photo (crossfaded to)
uniform float uStyleMix;    // 0 = A, 1 = B (style crossfade)
uniform float uZoomA;       // per-style zoom for A (1 = as-is)
uniform float uZoomB;       // per-style zoom for B
uniform sampler2D uReal;    // the real photo (revealed)
uniform sampler2D uTrail;   // trail buffer (.r = reveal amount)
uniform vec2  uCover;       // cover-fit scale for the source textures
uniform vec2  uRealShift;   // fine alignment of the real photo (uv offset)
uniform float uRealZoom;    // fine scale of the real photo (so it lines up with LEGO)
uniform vec2  uParallax;    // hover parallax: cursor-driven uv offset

// cover-fit uv (center-crop) so a square photo fills a non-square card, with a zoom
// (1.12) so even the stronger autonomous parallax shift never exposes an edge.
vec2 cover(vec2 uv) { return (uv - 0.5) * uCover / 1.12 + 0.5 + uParallax; }

// how many reveal cells across (the reveal snaps to this grid of LEGO-ish blocks)
const float REVEAL_GRID = 24.0;

// signed distance to a rounded box of half-size b and corner radius r (p relative to
// the box centre)
float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

// the raw trail value at a cell centre
float cellVal(vec2 gc) {
  vec2 uv = (gc + 0.5) / REVEAL_GRID;
  return texture2D(uTrail, uv).r;
}
// is the cell revealed? A firm threshold, so faint DECAYING trail values don't light
// stray cells (which read as scattered circles around the trail).
float cellOn(float v) { return step(0.5, v); }
// stud-pop: a freshly-revealed cell (trail value just past the threshold, i.e. on the
// advancing front) briefly OVERSHOOTS its size, then settles as it saturates -> the
// block "pops" in like a stud clicking into place.
float cellPop(float v) {
  // peaks just above the 0.5 threshold, back to 0 once the cell is fully lit
  return smoothstep(0.5, 0.62, v) * (1.0 - smoothstep(0.62, 0.82, v));
}

// smooth union of two SDFs (no derivative kink at the seam, so fwidth-based AA does
// not draw a thin line where two merged boxes meet).
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

void main() {
  // The visible "style" layer: a PUSH crossfade. A single SHARED zoom-pulse is applied to
  // BOTH photos equally during the switch, so they stay perfectly registered (aligned) —
  // just a subtle synchronized breath that gives the swap a little depth, then settles. It
  // always shows a valid blend of two real textures (can never hide the image). At the ends
  // (uStyleMix 0 or 1) the pulse is 0, so a held style sits perfectly still.
  float push = uStyleMix * (1.0 - uStyleMix) * 4.0;   // 0 at ends, 1 at mid of the fade
  float pz = 1.0 + 0.025 * push;                      // weak, shared zoom pulse
  vec2 uvA = cover((vUv - 0.5) / (uZoomA * pz) + 0.5);
  vec2 uvB = cover((vUv - 0.5) / (uZoomB * pz) + 0.5);
  // uStyleMix already arrives smootherstepped from the engine, so blend with it directly.
  vec3 style = mix(texture2D(uStyleA, uvA).rgb, texture2D(uStyleB, uvB).rgb, uStyleMix);
  // the real photo is framed a touch differently, so nudge it to line up: scale about
  // center by uRealZoom then shift by uRealShift.
  vec2 realUV = cover((vUv - 0.5) / uRealZoom + 0.5) + uRealShift;
  vec3 realCrisp = texture2D(uReal, realUV).rgb;

  // Blocky reveal with ROUNDED OUTER CORNERS that MERGE across neighbours: the reveal
  // is the union of a FIXED-size rounded box per revealed cell (half-size 0.62 > 0.5
  // so neighbours overlap and fuse; only the outer boundary stays rounded). Fixed size
  // -> no strange pulsing; the smoothness comes from the trail itself fading.
  // Loop over the 5x5 neighbourhood (\xb12): a box reaches up to 0.62+0.14 = 0.76 grid
  // units, so a pixel can be covered by a revealed cell up to 2 away. \xb11 missed those
  // and left a thin sliver one block from the trail; \xb12 samples every contributing box.
  vec2 g = vUv * REVEAL_GRID;
  vec2 base = floor(g);
  float sd = 1e9;
  for (int j = -2; j <= 2; j++) {
    for (int i = -2; i <= 2; i++) {
      vec2 gc = base + vec2(float(i), float(j));
      float v = cellVal(gc);
      if (cellOn(v) > 0.5) {
        vec2 c = gc + 0.5;            // cell centre in grid space
        // base half-size 0.62 (>0.5 so neighbours merge), + a pop overshoot on the
        // freshly-revealed front so blocks bounce in
        float hs = 0.62 + 0.14 * cellPop(v);
        float d = sdRoundBox(g - c, vec2(hs), 0.3);
        sd = smin(sd, d, 0.16);       // smooth union -> no seam line between merges
      }
    }
  }
  // Antialias with a FIXED width in grid units (not fwidth): fwidth(sd) spikes wherever
  // the min switches dominant box, which is exactly what drew the thin seam lines. A
  // constant width gives a clean uniform edge.
  float m = 1.0 - smoothstep(-0.06, 0.06, sd);

  vec3 outc = mix(style, realCrisp, m);

  // ── minimal INSET on the revealed blocks ──
  // The reveal reads as peeling the top style away to a layer BELOW, so press the revealed
  // rounded squares IN with a subtle deboss. The edge NORMAL is the gradient of the SDF;
  // we get it derivative-free by re-evaluating the union SDF a hair to each side. A thin
  // band just INSIDE the edge is lit from the top-left: top/left inner edges catch a faint
  // highlight, bottom/right fall to shadow -> the block looks pushed in. Very minimal.
  float e = 0.03;
  float sdx = 1e9, sdy = 1e9;
  for (int j = -2; j <= 2; j++) {
    for (int i = -2; i <= 2; i++) {
      vec2 gc = base + vec2(float(i), float(j));
      float v = cellVal(gc);
      if (cellOn(v) > 0.5) {
        vec2 c = gc + 0.5;
        float hs = 0.62 + 0.14 * cellPop(v);
        sdx = smin(sdx, sdRoundBox(g + vec2(e, 0.0) - c, vec2(hs), 0.3), 0.16);
        sdy = smin(sdy, sdRoundBox(g + vec2(0.0, e) - c, vec2(hs), 0.3), 0.16);
      }
    }
  }
  vec2 nrm = normalize(vec2(sdx - sd, sdy - sd) + 1e-6); // outward edge normal
  float lightBias = dot(nrm, normalize(vec2(-1.0, 1.0))); // top-left light
  // a narrow band hugging the INSIDE of the reveal edge (sd in ~[-0.16, 0])
  float band = smoothstep(0.0, -0.05, sd) * smoothstep(-0.16, -0.05, sd);
  outc *= 1.0 - band * 0.26 * clamp(-lightBias, 0.0, 1.0);  // shadow side (bottom-right)
  outc += band * 0.13 * clamp(lightBias, 0.0, 1.0) * m;     // highlight side (top-left)

  gl_FragColor = vec4(outc, 1.0);
}
`;var l=e.i(35877);let n=(0,l.mediaUrl)("/lego/real.webp"),h=[{url:(0,l.mediaUrl)("/lego/lego.webp"),bg:[253,246,216],glow:[255,222,80],zoom:1.12},{url:(0,l.mediaUrl)("/lego/minecraft.webp"),bg:[231,244,224],glow:[126,211,90]},{url:(0,l.mediaUrl)("/lego/roblox.webp"),bg:[240,238,240],glow:[226,78,78]}];class c{host;canvas;gl=null;display=null;trail=null;dLoc={};tLoc={};quad=null;styleTex=h.map(()=>null);realTex=null;blackTex=null;styleAR=1;styleIdx=0;styleClock=0;styleMix=0;rtA=null;rtB=null;hasTrail=!1;raf=0;running=!1;visible=!1;painted=!1;destroyed=!1;last=0;time=0;idle=3;w=0;h=0;dpr=1;px=.5;py=.5;tpx=.5;tpy=.5;active=0;autoActive=0;revealSize=.13;parx=0;pary=0;tiltX=0;tiltY=0;glowX=.5;glowY=.5;glowI=0;onFrame;onReady;ok=!1;constructor(e,t){this.host=e,this.onFrame=t,this.canvas=document.createElement("canvas"),Object.assign(this.canvas.style,{position:"absolute",inset:"0",width:"100%",height:"100%",display:"block",opacity:"0"}),e.appendChild(this.canvas);const i=this.canvas.getContext("webgl",{alpha:!1,antialias:!1,premultipliedAlpha:!1});if(!i)return;this.gl=i,i.clearColor(.06,.06,.07,1);try{this.display=this.build(s,o),this.trail=this.build(s,a)}catch{this.gl=null;return}for(const e of["uStyleA","uStyleB","uStyleMix","uZoomA","uZoomB","uReal","uTrail","uCover","uRealShift","uRealZoom","uParallax"])this.dLoc[e]=i.getUniformLocation(this.display,e);for(const e of["uResolution","uMap","uPointer","uActive","uDt","uTime","uSize"])this.tLoc[e]=i.getUniformLocation(this.trail,e);const r=i.getAttribLocation(this.display,"aPosition");this.quad=i.createBuffer(),i.bindBuffer(i.ARRAY_BUFFER,this.quad),i.bufferData(i.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),i.STATIC_DRAW),i.enableVertexAttribArray(r),i.vertexAttribPointer(r,2,i.FLOAT,!1,0,0),this.setupTrail();const l=this.placeholder([40,40,45,255]);this.styleTex=h.map(()=>l),this.realTex=l,this.blackTex=this.placeholder([0,0,0,255]),this.loadTexture(h[0].url,(e,t)=>{this.styleTex[0]=e,this.styleAR=t,this.onReady?.(),this.onReady=void 0,this.running||this.renderOnce()});for(let e=1;e<h.length;e++){const t=e;this.loadTexture(h[t].url,e=>{this.styleTex[t]=e})}this.loadTexture(n,e=>{this.realTex=e,this.running||this.renderOnce()}),this.canvas.addEventListener("pointermove",this.onMove),this.canvas.addEventListener("pointerenter",this.onEnter),this.canvas.addEventListener("pointerleave",this.onLeave),this.resize(),this.ok=!0}build(e,t){let i=this.gl,r=(e,t)=>{let r=i.createShader(e);if(i.shaderSource(r,t),i.compileShader(r),!i.getShaderParameter(r,i.COMPILE_STATUS))throw Error(i.getShaderInfoLog(r)||"compile failed");return r},s=i.createProgram();if(i.attachShader(s,r(i.VERTEX_SHADER,e)),i.attachShader(s,r(i.FRAGMENT_SHADER,t)),i.linkProgram(s),!i.getProgramParameter(s,i.LINK_STATUS))throw Error(i.getProgramInfoLog(s)||"link failed");return s}placeholder(e){let t=this.gl;if(!t)return null;let i=t.createTexture();return t.bindTexture(t.TEXTURE_2D,i),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,1,1,0,t.RGBA,t.UNSIGNED_BYTE,new Uint8Array(e)),i}setupTrail(){let e=this.gl,t=e.getExtension("OES_texture_half_float");e.getExtension("OES_texture_half_float_linear");let i=t?t.HALF_FLOAT_OES:e.UNSIGNED_BYTE,r=()=>{let t=e.createTexture();e.bindTexture(e.TEXTURE_2D,t),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,220,220,0,e.RGBA,i,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);let r=e.createFramebuffer();e.bindFramebuffer(e.FRAMEBUFFER,r),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0);let s=e.checkFramebufferStatus(e.FRAMEBUFFER)===e.FRAMEBUFFER_COMPLETE;return e.bindFramebuffer(e.FRAMEBUFFER,null),s?{fb:r,tex:t}:null},s=r(),a=r();if(s&&a){for(let t of(this.rtA=s,this.rtB=a,this.hasTrail=!0,[s,a]))e.bindFramebuffer(e.FRAMEBUFFER,t.fb),e.viewport(0,0,220,220),e.clearColor(0,0,0,1),e.clear(e.COLOR_BUFFER_BIT);e.bindFramebuffer(e.FRAMEBUFFER,null),e.clearColor(.06,.06,.07,1)}}loadTexture(e,t){let i=new Image;i.crossOrigin="anonymous",i.onload=()=>{let e=this.gl;if(!e||this.destroyed)return;let r=e.createTexture();e.bindTexture(e.TEXTURE_2D,r),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,i),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),t(r,(i.naturalWidth||1)/(i.naturalHeight||1))},i.src=e}onMove=e=>{let t=this.canvas.getBoundingClientRect();this.tpx=(e.clientX-t.left)/t.width,this.tpy=1-(e.clientY-t.top)/t.height,this.active=1,this.wake()};onEnter=()=>{this.active=1,this.wake()};onLeave=()=>{this.active=0};wake(){this.visible&&!this.running&&this.startLoop()}resize(){let e=this.host.getBoundingClientRect();this.dpr=Math.min(2,window.devicePixelRatio||1),this.w=e.width,this.h=e.height;let t=Math.max(1,Math.round(this.w*this.dpr)),i=Math.max(1,Math.round(this.h*this.dpr));(this.canvas.width!==t||this.canvas.height!==i)&&(this.canvas.width=t,this.canvas.height=i,this.gl?.viewport(0,0,t,i),this.running||this.renderOnce())}coverScale(e){let t=this.w/Math.max(1,this.h);return t>e?[1,e/t]:[t/e,1]}setVisible(e){this.ok&&(this.visible=e,e?(this.resize(),this.startLoop()):this.pause())}startLoop(){if(!this.ok||this.running)return;this.running=!0,this.resize(),this.last=0;let e=t=>{this.running&&(this.frame(t),this.raf=requestAnimationFrame(e))};this.raf=requestAnimationFrame(e)}pause(){this.running=!1,this.raf&&cancelAnimationFrame(this.raf),this.raf=0}renderStill(){this.resize(),this.renderDisplay()}renderOnce(){this.running||requestAnimationFrame(()=>this.renderDisplay())}frame(e){let t=this.last?Math.min(.05,(e-this.last)/1e3):.016;if(this.last=e,this.time+=t,this.idle=this.active?0:this.idle+t,this.styleClock+=t,this.styleClock<2.8)this.styleMix=0;else if(this.styleClock<3.08){let e=(this.styleClock-2.8)/.28;this.styleMix=e*e*e*(e*(6*e-15)+10)}else this.styleIdx=(this.styleIdx+1)%h.length,this.styleClock=0,this.styleMix=0;let i=Math.min(1,Math.max(0,this.idle-.4)/.9),r=this.time,s=.5+.16*Math.sin(1.15*r)+.09*Math.sin(2.6*r+1)+.05*Math.cos(4.1*r+.4),a=.66+.13*Math.cos(.95*r+2.1)+.07*Math.sin(2.2*r+.5)+.04*Math.cos(3.7*r+1.7),o=this.active?this.tpx:this.tpx*(1-i)+s*i,l=this.active?this.tpy:this.tpy*(1-i)+a*i,n=Math.max(this.active,i);this.revealSize=.13+.07*(i*(1-this.active)),this.px+=(o-this.px)*.4,this.py+=(l-this.py)*.4,this.autoActive=n;let c=.02+.05*(i*(1-this.active)),u=-(2*(this.px-.5))*c*Math.max(n,this.active),d=(this.py-.5)*2*c*Math.max(n,this.active);this.parx+=(u-this.parx)*.045,this.pary+=(d-this.pary)*.045;let v=7+5*(i*(1-this.active)),g=(this.px-.5)*2*v,f=(this.py-.5)*2*v;this.tiltY+=(g-this.tiltY)*.06,this.tiltX+=(f-this.tiltX)*.06;let x=this.px,m=1-this.py;this.glowX+=(x-this.glowX)*.08,this.glowY+=(m-this.glowY)*.08;let p=.28+.72*n+.4*this.active;this.glowI+=(p-this.glowI)*.09;let y=h[this.styleIdx],b=h[(this.styleIdx+1)%h.length],E=(e,t)=>{let i=this.styleMix,r=Math.round(e[0]+(t[0]-e[0])*i),s=Math.round(e[1]+(t[1]-e[1])*i),a=Math.round(e[2]+(t[2]-e[2])*i);return`rgb(${r}, ${s}, ${a})`};this.onFrame?.({tiltX:this.tiltX,tiltY:this.tiltY,glowX:this.glowX,glowY:this.glowY,glowI:this.glowI,bg:E(y.bg,b.bg),glowColor:E(y.glow,b.glow)}),this.hasTrail&&this.stepTrail(t),this.renderDisplay()}stepTrail(e){let t=this.gl;if(!this.rtA||!this.rtB)return;t.useProgram(this.trail),t.bindFramebuffer(t.FRAMEBUFFER,this.rtB.fb),t.viewport(0,0,220,220),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.rtA.tex),t.uniform1i(this.tLoc.uMap,0),t.uniform2f(this.tLoc.uResolution,220,220),t.uniform2f(this.tLoc.uPointer,this.px,this.py),t.uniform1f(this.tLoc.uActive,this.autoActive),t.uniform1f(this.tLoc.uDt,e),t.uniform1f(this.tLoc.uTime,this.time),t.uniform1f(this.tLoc.uSize,this.revealSize),t.drawArrays(t.TRIANGLES,0,3),t.bindFramebuffer(t.FRAMEBUFFER,null);let i=this.rtA;this.rtA=this.rtB,this.rtB=i}renderDisplay(){let e=this.gl;if(!e||!this.display)return;e.viewport(0,0,this.canvas.width,this.canvas.height),e.useProgram(this.display);let t=this.styleTex[this.styleIdx]??this.blackTex,i=this.styleTex[(this.styleIdx+1)%h.length]??t;e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,t),e.uniform1i(this.dLoc.uStyleA,0),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,i),e.uniform1i(this.dLoc.uStyleB,1),e.uniform1f(this.dLoc.uStyleMix,this.styleMix),e.uniform1f(this.dLoc.uZoomA,h[this.styleIdx].zoom??1),e.uniform1f(this.dLoc.uZoomB,h[(this.styleIdx+1)%h.length].zoom??1),e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,this.realTex),e.uniform1i(this.dLoc.uReal,2),e.activeTexture(e.TEXTURE3),e.bindTexture(e.TEXTURE_2D,this.hasTrail&&this.rtA?this.rtA.tex:this.blackTex),e.uniform1i(this.dLoc.uTrail,3);let[r,s]=this.coverScale(this.styleAR);e.uniform2f(this.dLoc.uCover,r,s),e.uniform2f(this.dLoc.uRealShift,-.01,.05),e.uniform1f(this.dLoc.uRealZoom,1.12),e.uniform2f(this.dLoc.uParallax,this.parx,this.pary),e.drawArrays(e.TRIANGLES,0,3),this.painted||(this.painted=!0,this.canvas.style.opacity="1")}destroy(){this.destroyed=!0,this.visible=!1,this.pause(),this.canvas.removeEventListener("pointermove",this.onMove),this.canvas.removeEventListener("pointerenter",this.onEnter),this.canvas.removeEventListener("pointerleave",this.onLeave);let e=this.gl;if(e){let t=new Set;[...this.styleTex,this.realTex,this.blackTex,this.rtA?.tex??null,this.rtB?.tex??null].forEach(e=>e&&t.add(e)),t.forEach(t=>e.deleteTexture(t)),[this.rtA?.fb,this.rtB?.fb].forEach(t=>t&&e.deleteFramebuffer(t)),this.quad&&e.deleteBuffer(this.quad),e.getExtension("WEBGL_lose_context")?.loseContext()}this.canvas.remove()}}var u=e.i(20268);e.s(["LegoCard",0,function({bare:e=!1}={}){let r=(0,i.useRef)(null),s=(0,i.useRef)(null),a=(0,i.useRef)(null);return(0,i.useEffect)(()=>{let e=r.current;if(!e)return;let t=window.matchMedia("(prefers-reduced-motion: reduce)").matches,i=t?void 0:e=>{let t=s.current;t&&(t.style.transform=`perspective(900px) rotateX(${e.tiltX}deg) rotateY(${e.tiltY}deg)`,t.style.setProperty("--glow",e.glowColor));let i=a.current;i&&(i.style.setProperty("--gx",`${100*e.glowX}%`),i.style.setProperty("--gy",`${100*e.glowY}%`),i.style.setProperty("--glow",e.glowColor),i.style.opacity=String(Math.min(.95,.24+.7*e.glowI)),i.style.transform=`translate(-50%, -50%) scale(${.96+.08*e.glowI})`)},o=null,l=!1,n=!1,h=!1,d=()=>{o&&!t&&o.setVisible(l&&!n&&!h)},v=requestAnimationFrame(()=>{!r.current||(o=new c(e,i)).ok&&(o.onReady=()=>{a.current&&(a.current.style.opacity="1"),s.current&&(s.current.style.opacity="1")},t?o.renderStill():d())}),g=new IntersectionObserver(e=>{l=e[0]?.isIntersecting??!1,d()},{threshold:.15});g.observe(e);let f=()=>{n=document.hidden,d()};document.addEventListener("visibilitychange",f);let x=(0,u.onTransitionChange)(e=>{h=e,d()}),m=0,p=()=>{window.clearTimeout(m),m=window.setTimeout(()=>o?.resize(),120)};return window.addEventListener("resize",p),()=>{cancelAnimationFrame(v),g.disconnect(),document.removeEventListener("visibilitychange",f),x(),window.removeEventListener("resize",p),window.clearTimeout(m),o?.destroy()}},[]),(0,t.jsxs)("div",{"data-canvas-card":!0,"aria-label":"A stylized portrait that cycles through LEGO, Minecraft and Roblox styles and reveals the real photo underneath when you move over it.",className:"relative mx-auto flex aspect-[1344/620] w-full select-none items-center justify-center overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[var(--bg-hover)] p-6",children:[(0,t.jsx)("div",{ref:a,"aria-hidden":!0,className:"pointer-events-none absolute left-1/2 top-1/2 aspect-square h-[40%] rounded-[10px] sm:h-[46%]",style:{"--gx":"50%","--gy":"50%","--glow":"rgb(255, 222, 80)",boxShadow:"0 0 8px 0px color-mix(in srgb, var(--glow) 36%, transparent), 0 1px 13px 1px color-mix(in srgb, var(--glow) 25%, transparent), 0 2px 20px 2px color-mix(in srgb, var(--glow) 15%, transparent), 0 3px 27px 3px color-mix(in srgb, color-mix(in srgb, var(--glow) 70%, white) 9%, transparent), 0 5px 34px 4px color-mix(in srgb, color-mix(in srgb, var(--glow) 55%, white) 5%, transparent)",background:"color-mix(in srgb, var(--glow) 26%, transparent)",transform:"translate(-50%, -50%)",transition:"opacity 0.2s ease-out",opacity:0}}),(0,t.jsxs)("div",{ref:s,className:"relative z-10 aspect-square h-[72%] overflow-hidden rounded-[9px] sm:h-[80%]",style:{"--glow":"rgb(255, 222, 80)",transformStyle:"preserve-3d",willChange:"transform",opacity:0,transition:"opacity 0.25s ease-out",boxShadow:"inset 0 0 0 1px rgba(255,255,255,0.9), 0 0 0 1.5px var(--bg-hover), 0 0 0 2.5px color-mix(in srgb, var(--glow) 55%, transparent), 0 0 0 3px rgba(0,0,0,0.06), 0 2px 4px -1px rgba(20,20,25,0.18), 0 16px 28px -10px rgba(20,20,30,0.28)"},children:[(0,t.jsx)("div",{ref:r,className:"absolute inset-0"}),(0,t.jsx)("div",{"aria-hidden":!0,className:"pointer-events-none absolute inset-0 rounded-[9px]",style:{boxShadow:"inset 2px 2px 3px rgba(255,255,255,0.5), inset -2px -2px 3px rgba(0,0,0,0.42), inset 0 0 0 1px rgba(255,255,255,0.12)"}})]})]})}],45227)},62957,e=>{e.n(e.i(45227))}]);