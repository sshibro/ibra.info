(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,26537,e=>{"use strict";var t=e.i(43476),a=e.i(71645);let i=432,r=[1,4,0,5,2,3],n=[.022,.055,.1,.187,.679,.882,.937,.97,.987,1],s=[{u:-1,v:-1,corner:!0},{u:1,v:-1,corner:!0},{u:1,v:1,corner:!0},{u:-1,v:1,corner:!0},{u:0,v:0,corner:!1}],o=[-100.4,-67.6,-28.4,0,28.4,67.6,100.4],h=[1,.72,1.15,1.3,.85,1.5],l=[1,.9,1.35,1.1,.8,.6],c=[{paper:[244,239,230],plate:[232,65,46],ink:[16,16,16]},{paper:[237,232,220],plate:[27,63,216],ink:[242,183,5]},{paper:[242,237,226],plate:[14,14,14],ink:[255,92,42]},{paper:[239,233,222],plate:[23,160,122],ink:[32,26,74]},{paper:[243,238,228],plate:[246,196,24],ink:[138,30,96]},{paper:[238,233,223],plate:[66,48,158],ink:[232,233,226]}],u=c[0].paper,d=[0,.012,.03,.055,.09,.42,.78,.9,.955,.985,1],f=[0,.03,.08,.17,.34,.62,.82,.92,.97,1];function p(e,t){let a=e.length-1,i=Math.min(Math.max(t,0),1)*a,r=Math.min(Math.floor(i),a-1);return e[r]+(e[r+1]-e[r])*(i-r)}let g=[0,.31,.62,.14,.79],m=[.35,-.52,.81,-.29,.63],v=[-.78,-.44,-.12,.19,.5,.84],w=[.52,.78,.34,.95,.61,.44],y=[.9,-1.4,1.9,-.7,1.2,-1.6],x=[0,.17,.34,.5,.67,.83],b=[.42,.16,.11,.2,.09,.14,.07],A=[.05,.62,.78,.52,.88,.7,.95],k=[.04,.4,.62,.72,.3,.55,.48],S=[.18,.62,-.44,.35,-.71,.51,-.28],R=[0,.12,.38,.55,.71,.84,.93],T=[0,.13,.27,.41,.56,.7,.86],M=["reach","face","drag","gather","aim","swell"],U=[.55,.7,.45,.5,.6,.8],$=2*Math.PI,P=Math.PI/180,C=72*r.indexOf(0)+6,E=[4,0,2],I=e=>Number.isInteger(e)?`${e}.0`:`${e}`,q=(e,t)=>{let a=t.slice(0,-1).map((e,t)=>`i == ${t} ? ${I(e)} : `).join("");return`float ${e}(int i) { return ${a}${I(t[t.length-1])}; }`},D=`
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`,F=`
precision highp float;

uniform vec2  uRes;    // canvas size in device px
uniform vec2  uC;      // star centre, top-left origin
uniform vec4  uRect;   // plate x0,y0,x1,y1
uniform float uUnit;   // radial unit: half the plate's height
uniform float uSeed;   // per-frame, so the grain and the wobble both boil
uniform int   uScene;  // which drawing, 0..3
uniform vec3  uPaper;  // the three inks, in the order they are laid down
uniform vec3  uPlate;
uniform vec3  uInk;
uniform vec3  uGrain;  // grain step size for paper, plate, ink
uniform float uSprayI; // this scene's ink spray width, device px
uniform vec3  uCursor; // pointer x, y in device px, and its strength 0..1

// The two general-purpose parameter arrays. Every scene packs its own per-frame
// numbers into these rather than adding uniforms of its own, so one program
// serves all four drawings:
//
//   scene 0 (star)   uA = ray bearings (rad)     uT = ray tip radii (px)
//   scene 1 (rings)  uA = gap centre (turns)     uT = unused
//   scene 2 (bars)   uA = bar centre x (px)      uT = unused
//   scene 3 (discs)  uA = disc centre x (px)     uT = disc centre y (px)
uniform float uA[8];
uniform float uT[8];

const float TAU = 6.28318530718;

// The scene tables, baked in as lookup functions.
//
// GLSL ES 1.0 has no array initialisers, and indexing a const array by a loop
// variable is only guaranteed for constant expressions, so a plain T[i] is
// not portable here. A chain of ternaries is: the compiler folds it, the index
// is never dynamic, and it costs nothing at runtime. Uniform arrays would also
// work and would be worse — these never change, and uploading them every frame
// to say the same thing is pure ceremony.
${q("RING_R",[.3,.47,.64,.82,1.02])}
${q("RING_W",[.055,.038,.062,.03,.045])}
${q("RING_GAP_W",[.12,.2,.09,.16,.13])}
${q("BAR_Y",v)}
${q("BAR_H",[.028,.062,.021,.045,.034,.055])}
${q("BAR_L",w)}
${q("DISC_R",b)}
${q("WEDGE_W",[.052,.031,.068,.024,.045,.06,.037])}

// One hash for everything. Each consumer offsets uSeed so the plate dither,
// the ink dither, the two wobbles and the three grains are independent; using
// one stream for all of them correlates the plate and ink edges and produces
// visible seams where they cross.
float hash(vec2 p, float s) {
  vec3 p3 = fract(vec3(p.x, p.y, p.x + s) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p, float s) {
  vec2 i = floor(p), fr = fract(p);
  fr = fr * fr * (3.0 - 2.0 * fr);
  return mix(mix(hash(i, s),                 hash(i + vec2(1.0, 0.0), s), fr.x),
             mix(hash(i + vec2(0.0, 1.0), s), hash(i + vec2(1.0, 1.0), s), fr.x), fr.y);
}

float sdBox(vec2 p, vec2 c, vec2 h) {
  vec2 d = abs(p - c) - h;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float angDist(float a, float b) {
  float d = mod(abs(a - b), TAU);
  return min(d, TAU - d);
}

/** Core radius at a ray, growing with that ray's length and then capped. */
float corePeak(float tip) {
  return min(uUnit * (${I(.167)} + ${I(.252)} * clamp(tip / uUnit, ${I(1.15)}, ${I(1.6)})),
             ${I(.62)} * uUnit);
}

/** A tapered spike, as a box SDF whose half-width varies along its length. The
 *  taper is shallow (about 11deg off the axis), so treating the edge as
 *  locally parallel costs under 2% in the distance and nothing visible once
 *  the spray is applied on top. */
float rayDist(vec2 q, float a, float tip, float base) {
  vec2 dir = vec2(cos(a), sin(a));
  float along = dot(q, dir);
  float perp = abs(q.x * dir.y - q.y * dir.x);
  float t = clamp((along - base) / max(1.0, tip - base), 0.0, 1.0);
  float w0 = ${I(.388)} * uUnit, wt = ${I(.026)} * uUnit;
  float hw = 0.5 * (wt + (w0 - wt) * pow(1.0 - t, ${I(1.05)}));
  vec2 d = vec2(max(base - along, along - tip), perp - hw);
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

/** Scene 1. Concentric annuli, one gap each, the whole set pushed off centre.
 *
 *  Distance to an annulus is exact and cheap: abs(length(q) - r) - w. The gap
 *  is cut by taking a max against a wedge rather than by clipping the arc, so
 *  the two cut ends carry a real signed distance and spray exactly like every
 *  other edge in the piece. Clipping would give them a hard vector end, which
 *  is the one thing that would announce this scene as different machinery. */
float ringsDist(vec2 p) {
  vec2 q = p - uC;
  float th = atan(q.y, q.x) / TAU;
  float r = length(q);
  float d = 1e5;
  for (int i = 0; i < 5; i++) {
    float ri = RING_R(i) * uUnit;
    float wi = RING_W(i) * uUnit;
    float ring = abs(r - ri) - wi;
    // How far into this ring's gap the bearing sits, in turns, wrapped.
    float g = th - uA[i];
    g = g - floor(g + 0.5);
    // Inside the wedge the distance is pushed out by the arc-length shortfall,
    // which is what makes the ends round off the way a stroke end does.
    float halfGap = RING_GAP_W(i) * 0.5;
    float cut = (halfGap - abs(g)) * TAU * ri;
    d = min(d, max(ring, cut));
  }
  return d;
}

/** Scene 2. Horizontal bars of unequal thickness sliding at unequal speeds.
 *  The one drawing in the set made of straight edges, which is most of why the
 *  other three read as curved. */
float barsDist(vec2 p) {
  float d = 1e5;
  for (int i = 0; i < 6; i++) {
    vec2 c = vec2(uA[i], uC.y + BAR_Y(i) * uUnit);
    d = min(d, sdBox(p, c, vec2(BAR_L(i) * uUnit, BAR_H(i) * uUnit)));
  }
  return d;
}

/** Scene 3. One big disc and six satellites on slow ellipses, min-combined so
 *  that where two overlap they FUSE into one compound blob rather than crossing
 *  as outlines. That fusing is the whole scene: min on signed distance is a
 *  union, and a union of circles is a shape you cannot get by drawing circles. */
float discsDist(vec2 p) {
  float d = 1e5;
  for (int i = 0; i < 7; i++) {
    d = min(d, length(p - vec2(uA[i], uT[i])) - DISC_R(i) * uUnit);
  }
  return d;
}

/** Scene 4. A pinwheel of hard-edged sectors with a hole at the middle.
 *  Distinct from the starburst on purpose: those are tapered spikes growing out
 *  of a fat core, these are wedges of constant angular width cut out of a ring.
 *  One reads as a drawn object, the other as a stencil. */
float wedgeDist(vec2 p) {
  vec2 q = p - uC;
  float r = max(length(q), 1e-4);
  float th = atan(q.y, q.x) / TAU;
  float rad = max(${I(.22)} * uUnit - r, r - ${I(1.25)} * uUnit);
  float d = 1e5;
  for (int i = 0; i < 7; i++) {
    float g = th - uA[i];
    g = g - floor(g + 0.5);
    // Angular half-width converted to an arc length at this radius, so a wedge
    // has parallel sides in the print rather than sides that spray wider the
    // further out they go.
    float ang = (abs(g) - WEDGE_W(i)) * TAU * r;
    d = min(d, max(ang, rad));
  }
  return d;
}

/** Scene 5. A halftone: a lattice of dots swelling and shrinking under a wave
 *  crossing the plate. The radius is capped below half a cell, which is what
 *  lets the whole infinite field be evaluated from one mod() instead of a
 *  search over the neighbouring cells. */
float dotsDist(vec2 p) {
  float step = ${I(.26)} * uUnit;
  vec2 q = p - uC;
  vec2 cell = floor(q / step);
  vec2 local = q - (cell + 0.5) * step;
  // uA[0] carries the wave's travelled phase; uA[1] and uA[2] its direction.
  float phase = dot(cell + 0.5, vec2(uA[1], uA[2])) + uA[0];
  float wave = 0.5 + 0.5 * sin(phase * TAU);
  float rr = mix(${I(.06)}, ${I(.44)}, wave);

  // SWELL. Dots fatten under the pointer, as if the sheet took more ink there.
  // Measured from the CELL CENTRE, not the fragment: per-fragment it would be a
  // gradient across each dot and every one near the pointer would come out a
  // teardrop. Per cell, each dot stays a circle and only its radius changes,
  // which is what a halftone actually does under pressure.
  vec2 cc = uC + (cell + 0.5) * step;
  float swell = uA[3] * (1.0 - smoothstep(0.0, ${I(1.1)} * uUnit,
                                          distance(cc, uCursor.xy)));
  // Clamped below half a cell, or a swollen dot reaches into its neighbour's
  // cell and the single-mod() shortcut this whole field relies on breaks.
  rr = min(rr * (1.0 + swell), 0.48) * step;

  float dots = length(local) - rr;

  // Clipped to the plate, which no other scene is. A halftone is a fill, not an
  // object, and a fill that reaches the card edges swallows the plate and the
  // paper margin with it. max() against the plate's own inset distance keeps the
  // boundary a real signed distance, so it sprays like every other edge instead
  // of ending on a hard line.
  vec2 rc = vec2((uRect.x + uRect.z) * 0.5, (uRect.y + uRect.w) * 0.5);
  vec2 rh = vec2((uRect.z - uRect.x) * 0.5, (uRect.w - uRect.y) * 0.5)
          - ${I(.05)} * uUnit;
  return max(dots, sdBox(p, rc, rh));
}

float starDist(vec2 p) {
  vec2 q = p - uC;
  float r = length(q);
  float th = atan(q.y, q.x);

  // The two nearest rays, which bracket this bearing. The core's radius is
  // read off them: it peaks on a ray and dips to a constant trough midway.
  float d1 = 99.0, d2 = 99.0, t1 = 0.0;
  for (int i = 0; i < 8; i++) {
    float dd = angDist(th, uA[i]);
    if (dd < d1) { d2 = d1; d1 = dd; t1 = uT[i]; }
    else if (dd < d2) { d2 = dd; }
  }
  float bump = pow(1.0 - clamp(d1 / max(d2, 1e-4), 0.0, 1.0), ${I(1.6)});
  float coreR = mix(${I(.388)} * uUnit, corePeak(t1), bump);

  // The band joining the spike bases into a ring, then the spikes themselves.
  float d = max(coreR - r, r - (coreR + ${I(.143)} * uUnit));
  for (int i = 0; i < 8; i++) {
    d = min(d, rayDist(q, uA[i], uT[i], corePeak(uT[i])));
  }
  return d;
}

/** Coverage from signed distance. The logistic is a cheap stand-in for the
 *  measured normal CDF (they agree to about 1% over the range that matters),
 *  plus the sparse far tail that carries the overspray. */
float coverage(float d, float sigma) {
  float c = 1.0 / (1.0 + exp(clamp(d * 1.702 / sigma, -20.0, 20.0)));
  if (d > 0.0) {
    c = max(c, ${I(.02)} * exp(-d / (${I(.056)} * uUnit)));
  }
  return c;
}

/** 0, 1 or 2 steps, weighted toward 0 to match the measured 62/25/12 split.
 *  Squaring the hash does that in one operation; a uniform pick reads as a
 *  flat 33% noise and grays the ink down too far. */
float grainStep(vec2 p, float s) {
  float h = hash(p, s);
  return floor(h * h * 3.0);
}

/** Whichever drawing is being printed this frame. A uniform branch, so it is
 *  the same path for every fragment in the draw and costs nothing. */
float sceneDist(vec2 p) {
  if (uScene == 0) return starDist(p);
  if (uScene == 1) return ringsDist(p);
  if (uScene == 2) return barsDist(p);
  if (uScene == 3) return discsDist(p);
  if (uScene == 4) return wedgeDist(p);
  return dotsDist(p);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float wob = ${I(.0714)} * uUnit;

  // The pointer's reach at this pixel. Applied to the PRINT, identically in
  // every drawing: near the cursor the ink sprays wider and the interiors grain
  // harder, as if that part of the sheet took more ink. This half needs no
  // per-scene code, which is what makes it scale — a drawing added later gets
  // it without being told.
  float near = uCursor.z * (1.0 - smoothstep(0.0, ${I(1.6)} * uUnit,
                                             distance(p, uCursor.xy)));


  vec3 col = uPaper - grainStep(p, uSeed + 71.3) * uGrain.x;

  vec2 rc = vec2((uRect.x + uRect.z) * 0.5, (uRect.y + uRect.w) * 0.5);
  vec2 rh = vec2((uRect.z - uRect.x) * 0.5, (uRect.w - uRect.y) * 0.5);
  float dp = sdBox(p, rc, rh)
           + (vnoise(p / wob, uSeed + 11.0) - 0.5) * 2.0 * ${I(.0153)} * uUnit;
  if (hash(p, uSeed + 3.7) < coverage(dp, ${I(.033)} * uUnit)) {
    col = uPlate - grainStep(p, uSeed + 91.1) * uGrain.y * (1.0 + ${I(.5)} * near);
  }

  float db = sceneDist(p)
           + (vnoise(p / wob, uSeed + 29.0) - 0.5) * 2.0 * ${I(.0128)} * uUnit;
  if (hash(p, uSeed + 5.1) < coverage(db, uSprayI * (1.0 + ${I(.35)} * near))) {
    col = uInk - grainStep(p, uSeed + 53.9) * uGrain.z * (1.0 + ${I(.5)} * near);
  }

  gl_FragColor = vec4(col, 1.0);
}
`;function _(e,t){return t-e-Math.round(t-e)}function L(e,t){let a=(t.x1-t.x0)*.5,i=(t.y1-t.y0)*.5;return[t.x0+a+.553*e.u*a,t.y0+i+.553*e.v*i]}function G(e,t,a,i){let r;if(e.corner){let n=e.u>0?i.x0:i.x1,s=Math.atan2((e.v>0?i.y0:i.y1)-a,n-t);r=[...o.map(e=>s+e*P),s+Math.PI]}else r=[0,Math.PI/2,Math.PI,-Math.PI/2,...[[i.x1,i.y1],[i.x0,i.y1],[i.x0,i.y0],[i.x1,i.y0]].map(([e,i])=>Math.atan2(i-a,e-t))];return r.map(e=>(e%$+$)%$).sort((e,t)=>e-t)}class B{ok=!1;canvas;gl=null;prog=null;quad=null;u={};raf=0;running=!1;start0=0;lastFrame=-1;rect={x0:0,y0:0,x1:0,y1:0};unit=1;angles=new Float32Array(8);tips=new Float32Array(8);px=0;py=0;over=!1;cursor=0;lastT=0;star={cx:0,cy:0,a:new Float32Array(8),t:new Float32Array(8)};constructor(e){this.canvas=e;const t=e.getContext("webgl",{antialias:!1,alpha:!1,depth:!1,stencil:!1,preserveDrawingBuffer:!1})??e.getContext("experimental-webgl");if(!t)return;this.gl=t;const a=this.link(D,F);if(!a)return;this.prog=a,this.quad=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.quad),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),t.STATIC_DRAW);const i=t.getAttribLocation(a,"aPos");for(const e of(t.enableVertexAttribArray(i),t.vertexAttribPointer(i,2,t.FLOAT,!1,0,0),["uRes","uC","uRect","uUnit","uSeed","uScene","uPaper","uPlate","uInk","uGrain","uSprayI","uCursor"]))this.u[e]=t.getUniformLocation(a,e);this.u.uA=t.getUniformLocation(a,"uA[0]"),this.u.uT=t.getUniformLocation(a,"uT[0]"),this.ok=!0,this.resize()}compile(e,t){let a=this.gl;if(!a)return null;let i=a.createShader(e);return i?(a.shaderSource(i,t),a.compileShader(i),a.getShaderParameter(i,a.COMPILE_STATUS))?i:(a.deleteShader(i),null):null}link(e,t){let a=this.gl;if(!a)return null;let i=this.compile(a.VERTEX_SHADER,e),r=this.compile(a.FRAGMENT_SHADER,t);if(!i||!r)return null;let n=a.createProgram();return n?(a.attachShader(n,i),a.attachShader(n,r),a.linkProgram(n),a.deleteShader(i),a.deleteShader(r),a.getProgramParameter(n,a.LINK_STATUS))?(a.useProgram(n),n):(a.deleteProgram(n),null):null}resize(){let e=this.gl;if(!e||!this.ok)return;let t=Math.min(window.devicePixelRatio||1,1.5),a=Math.max(1,Math.round(this.canvas.clientWidth*t)),i=Math.max(1,Math.round(this.canvas.clientHeight*t));(this.canvas.width!==a||this.canvas.height!==i)&&(this.canvas.width=a,this.canvas.height=i),e.viewport(0,0,a,i);let r=.108*i;this.rect={x0:r,y0:r,x1:a-r,y1:i-r},this.unit=(this.rect.y1-this.rect.y0)*.5,this.lastFrame=-1}starFrame(e,t){let a=Math.floor(e/24)%3,i=e%24,r=a,o=a,h=1;i>=20?(o=(a+1)%3,h=n[i-20]):i<n.length-4&&(r=(a+3-1)%3,h=n[i+4]);let[l,c]=L(s[E[r]],this.rect),[u,d]=L(s[E[o]],this.rect);t.cx=l+(u-l)*h,t.cy=c+(d-c)*h;let f=G(s[E[r]],l,c,this.rect),p=G(s[E[o]],u,d,this.rect),g=.051*this.unit,m={x0:this.rect.x0-g,y0:this.rect.y0-g,x1:this.rect.x1+g,y1:this.rect.y1+g};for(let e=0;e<8;e++){let a=function(e,t,a){let i=((t-e+Math.PI)%$+$)%$-Math.PI;return e+i*a}(f[e],p[e],h);t.a[e]=a,t.t[e]=function(e,t,a,i){let r=Math.cos(a),n=Math.sin(a),s=1/0;return r>1e-6?s=Math.min(s,(i.x1-e)/r):r<-1e-6&&(s=Math.min(s,(i.x0-e)/r)),n>1e-6?s=Math.min(s,(i.y1-t)/n):n<-1e-6&&(s=Math.min(s,(i.y0-t)/n)),Number.isFinite(s)?s:0}(t.cx,t.cy,a,m)}}render(e){let t=this.gl;if(!t||!this.prog)return;let a=Math.floor(e/72)%6,i=r[a],n=e%72,s=n/72,o=c[a],u=(e,t)=>{let a=s*t;return Math.floor(a)+p(e,a%1)},P=this.cursor*U[i],C=M[i],E=1.1*this.unit,I=(e,t)=>Math.max(0,1-Math.hypot(e-this.px,t-this.py)/E),q=this.angles,D=this.tips,F=(this.rect.x0+this.rect.x1)*.5,L=(this.rect.y0+this.rect.y1)*.5;if(0===i){if(this.starFrame(n,this.star),F=this.star.cx,L=this.star.cy,q.set(this.star.a),D.set(this.star.t),"reach"===C&&P>0){let e=Math.atan2(this.py-L,this.px-F);for(let t=0;t<8;t++){let a=Math.max(0,Math.cos(q[t]-e));D[t]*=1+P*a*a}}}else if(1===i){F+=0*this.unit,L+=0*this.unit;let e=u(d,2),t=Math.atan2(this.py-L,this.px-F)/$;for(let a=0;a<m.length;a++){let i=g[a]+m[a]*e;q[a]=i+P*_(i,t)}}else if(2===i){let e=Math.max(...w)*this.unit,t=this.rect.x1-this.rect.x0+2*e;for(let a=0;a<y.length;a++){let i=2*s+x[a],r=Math.floor(i)+p(d,i%1),n=(y[a]*r%1+1)%1,o=this.rect.x0-e+n*t;q[a]=o+P*I(o,this.rect.y0+(this.rect.y1-this.rect.y0)*.5+v[a]*this.unit)*(this.px-o)}}else if(3===i){let e=u(f,1);for(let t=0;t<b.length;t++){let a=(R[t]+S[t]*e)*$,i=F+Math.cos(a)*A[t]*this.unit,r=L+Math.sin(a)*k[t]*this.unit,n=P*I(i,r)*(b[0]/b[t]);i+=n*(this.px-i),r+=n*(this.py-r),q[t]=i,D[t]=r}}else if(4===i){let e=.22*u(d,3);if(P>0){let t=Math.atan2(this.py-L,this.px-F)/$,a=0;for(let i=0;i<T.length;i++){let r=_(T[i]+e,t);(Math.abs(r)<Math.abs(a)||0===i)&&(a=r)}e+=P*a}for(let t=0;t<T.length;t++)q[t]=T[t]+e}else{let e=.08*$;q[0]=+u(f,2),q[1]=1.35*Math.cos(e)*.26,q[2]=1.35*Math.sin(e)*.26,q[3]=P}t.useProgram(this.prog),t.uniform2f(this.u.uRes,this.canvas.width,this.canvas.height),t.uniform2f(this.u.uC,F,L),t.uniform4f(this.u.uRect,this.rect.x0,this.rect.y0,this.rect.x1,this.rect.y1),t.uniform1f(this.u.uUnit,this.unit),t.uniform1i(this.u.uScene,i),t.uniform3f(this.u.uPaper,o.paper[0]/255,o.paper[1]/255,o.paper[2]/255),t.uniform3f(this.u.uPlate,o.plate[0]/255,o.plate[1]/255,o.plate[2]/255),t.uniform3f(this.u.uInk,o.ink[0]/255,o.ink[1]/255,o.ink[2]/255),t.uniform1f(this.u.uSprayI,.028*this.unit*h[i]),t.uniform3f(this.u.uCursor,this.px,this.py,this.cursor);let G=l[i];t.uniform3f(this.u.uGrain,G/255,4*G/255,G/255),t.uniform1f(this.u.uSeed,7.13*e+.5),t.uniform1fv(this.u.uA,q),t.uniform1fv(this.u.uT,D),t.drawArrays(t.TRIANGLES,0,3)}frame=e=>{if(!this.running)return;this.start0||(this.start0=e);let t=this.lastT?Math.min((e-this.lastT)/1e3,.05):0;this.lastT=e;let a=+!!this.over;t>0&&(this.cursor+=(a-this.cursor)*(1-Math.exp(-t/.28)));let r=Math.abs(this.cursor-a)>.001,n=Math.floor((e-this.start0)/1e3*24)%i;(n!==this.lastFrame||r)&&(this.lastFrame=n,this.render(n)),this.raf=requestAnimationFrame(this.frame)};start(){this.ok&&!this.running&&(this.running=!0,this.start0=performance.now()-(this.lastFrame<0?0:this.lastFrame/24*1e3),this.raf=requestAnimationFrame(this.frame))}stop(){this.running=!1,this.raf&&cancelAnimationFrame(this.raf),this.raf=0}setPointer(e,t){if(null==e||null==t){this.over=!1;return}let a=this.canvas.width/Math.max(1,this.canvas.clientWidth);this.px=e*a,this.py=t*a,this.over=!0}renderStill(){this.ok&&(this.lastFrame=C,this.render(C))}destroy(){this.stop();let e=this.gl;e&&(this.quad&&e.deleteBuffer(this.quad),this.prog&&e.deleteProgram(this.prog),e.getExtension("WEBGL_lose_context")?.loseContext()),this.gl=null,this.prog=null,this.ok=!1}}var z=e.i(20268);e.s(["SprayBurstCard",0,function({bare:e=!1,viewTransitionName:i}={}){let r=(0,a.useRef)(null);return(0,a.useEffect)(()=>{let e=r.current;if(!e)return;let t=window.matchMedia("(prefers-reduced-motion: reduce)").matches,a=null,i=!1,n=!1,s=!1,o=()=>{a&&!t&&(!i||n||s?a.stop():a.start())},h=requestAnimationFrame(()=>{!r.current||(a=new B(e)).ok&&(t?a.renderStill():o())}),l=new IntersectionObserver(e=>{i=e[0]?.isIntersecting??!1,o()},{threshold:.2});l.observe(e);let c=()=>{n=document.hidden,o()};document.addEventListener("visibilitychange",c);let u=(0,z.onTransitionChange)(e=>{s=e,o()}),d=t=>{let i=e.getBoundingClientRect();a?.setPointer(t.clientX-i.left,t.clientY-i.top)},f=()=>a?.setPointer(null,null);e.addEventListener("pointermove",d),e.addEventListener("pointerdown",d),e.addEventListener("pointerleave",f),e.addEventListener("pointercancel",f);let p=0,g=()=>{window.clearTimeout(p),p=window.setTimeout(()=>{a?.resize(),a&&(t||!i||n)&&a.renderStill()},120)};return window.addEventListener("resize",g),()=>{cancelAnimationFrame(h),l.disconnect(),e.removeEventListener("pointermove",d),e.removeEventListener("pointerdown",d),e.removeEventListener("pointerleave",f),e.removeEventListener("pointercancel",f),document.removeEventListener("visibilitychange",c),u(),window.removeEventListener("resize",g),window.clearTimeout(p),a?.destroy()}},[]),(0,t.jsx)("div",{"data-canvas-card":!0,role:"img","aria-label":"A screenprint on cream paper that changes every three seconds, each time in new colours: rings each broken by a turning gap, a pinwheel of wedges, a many-pointed starburst jumping around its plate, a field of dots swelling under a passing wave, thick bars sliding across each other, and a crowd of circles drifting together into blobs. Every edge is a fine spray of dots rather than a clean line, and the whole print shivers as if redrawn by hand on every frame. Moving the pointer across it lays the ink on more heavily under your hand.",style:{...i?{viewTransitionName:i}:null,backgroundColor:`rgb(${u[0]}, ${u[1]}, ${u[2]})`},className:"relative mx-auto aspect-[1344/820] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)]",children:(0,t.jsx)("canvas",{ref:r,className:"h-full w-full"})})}],26537)},9989,e=>{e.n(e.i(26537))}]);