(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,97575,t=>{"use strict";var e=t.i(43476),a=t.i(71645);let i=["gone","before","you","look"],s="var(--font-neue-montreal)",o=[-1,.7,-.45,1],n=[1,.557,.121,.049,.014,0],r=[0,.08,.8,1];function h(t,e){let a=t.length-1,i=Math.min(Math.max(e,0),1)*a,s=Math.min(Math.floor(i),a-1);return t[s]+(t[s+1]-t[s])*(i-s)}function l(t,e,a){let i=Math.sin(a);return e*(Math.sin(t-a)-i)/(1+Math.abs(i))}let u=[0,.5,.82,.95,1,1],c=[0,.05,.14,.38,1],d=[0,0,0,.9],f=`
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`,p=i.length%2?[...i,...i]:i,m=Math.PI-.9;function w(t){let e,a,i=.85*p.length,s=t%i;s<0&&(s+=i);let o=Math.floor(s/.85),l=s-.85*o,d=!1;if(l<.045)e=1,a=l/.045*.9;else if(l<.285){let t=(l-.045)/.24;e=h(n,t),a=.9+m*h(u,t)}else if(l<.665)e=0,a=Math.PI;else if(l<.805){let t=(l-.665)/.14;e=h(r,t),a=Math.PI+m*h(c,t),d=!0}else e=1,a=2*Math.PI-.9*(1-(l-.805)/.045),d=!0;return{p:e,psi:a,idx:o,rising:d}}function g(t){if("u"<typeof document)return"sans-serif";let e=document.createElement("span");e.style.cssText=`position:absolute;visibility:hidden;font-family:${t}`,e.textContent="Ag",document.body.appendChild(e);let a=getComputedStyle(e).fontFamily;return document.body.removeChild(e),a||"sans-serif"}class v{ok=!1;host;canvas;gl=null;prog=null;quad=null;tex=null;uni={};aw=1024;hh=256;texCap=164;scratch=null;halfWord=[null,null];wordHalfW=1;rasteredFor=NaN;family="sans-serif";raf=0;running=!1;last=0;startOffset=.475;clock=this.startOffset;vel=0;lastY=0;held=!1;hold=0;autoUntil=0;autoCycle=-1;wall=0;constructor(t){this.host=t,this.canvas=document.createElement("canvas"),this.canvas.style.cssText="display:block;width:100%;height:100%",t.appendChild(this.canvas),this.family=g(s),this.init()}init(){let t,e=this.canvas.getContext("webgl",{alpha:!1,antialias:!1,depth:!1,stencil:!1,preserveDrawingBuffer:!1,powerPreference:"high-performance"});if(!e)return;this.gl=e;let a=window.matchMedia("(pointer: coarse)").matches,i=this.link(f,(t=a?18:28,`
precision highp float;
varying vec2 vUv;

uniform sampler2D uText;
uniform vec2  uRes;      // canvas size, device px
uniform vec2  uHalfPx;   // one atlas half, texels
uniform float uSx;       // screen px per texture px, horizontal (never blurred)
uniform vec3  uSyQ;      // vertical scale across the shutter as a quadratic in u:
                         //   sy(u) = x + y*u + z*u*u,  u in -0.5..0.5
                         // Fitted through the scale at the start, middle and end.
                         // A LINEAR sweep is wrong and the peak is where it shows:
                         // the word turns around there, so start and end sit at
                         // nearly the same scale and a straight line between them
                         // reports almost no motion. The blur then vanishes at the
                         // exact moment the word is biggest, which is also the
                         // moment it swaps, and you can read both words straight
                         // through the "blur". The quadratic carries the excursion
                         // to the top and back, which is the real path.
uniform float uCenterY;  // 0..1 of canvas height, measured from the bottom
uniform float uSwapU;    // where in the shutter the word swaps, -0.5..0.5 (2.0 = no swap)
uniform float uHalfA;    // atlas half holding the word BEFORE the swap
uniform float uHalfB;    // atlas half holding the word AFTER it
uniform vec3  uK;        // per-channel shutter length, R G B
uniform vec2  uSwapScl;  // scale multiplier for the outgoing word, then the incoming
uniform float uShape;    // shutter weighting, 0 = box, 1 = triangle on the present
uniform float uRoll;     // rolling shutter, shutter-lengths over the frame height
uniform float uLag;      // per-letter lag, shutter-lengths over the frame width
uniform float uThin;     // stroke thinning, 0 at rest
uniform float uBloom;    // halo strength, 0 at rest
uniform float uGain;     // brightness recovered at speed (channel-neutral)
uniform float uExp;      // filmic rolloff
uniform float uFocal;    // focal length, device px
uniform vec3  uPos;      // word centre in camera space: X, Y, Z
uniform vec4  uRot;      // sin/cos of the yaw, then sin/cos of the pitch
uniform float uCrt;      // monitor strength, 0 at rest
uniform float uTime;     // seconds, for the hum bar's drift
uniform vec4  uGlow;     // the ground: centre xy (device px), radii xy
uniform float uGlowAmp;  // its peak brightness

#define SAMPLES ${t}
#define BLOOM_TAPS 4
#define BLOOM_SPREAD 3.200
#define BLOOM_BIAS 3.500
#define TAU 6.2831853
#define CRT_PITCH 5.000
#define CRT_MASK 0.1600
#define CRT_SCAN_PITCH 3.000
#define CRT_SCAN 0.1200
#define CRT_BEAM 0.7000
#define CRT_HUM 0.0350
#define CRT_HUM_SPEED 0.1400

// One sample of the word at a given vertical scale, out of a given atlas half.
// Horizontal is read once per pixel and never swept: the measurement is
// unambiguous that the reference's blur does not touch x, which is why a
// vertical stem survives the worst frame as a hard white bar.
vec2 atlasUv(float sy, float halfIdx, vec2 W, out float inside) {
  float sx = max(uSx, 1e-4);
  float sv = max(abs(sy), 1e-4);
  vec2 q = vec2(
    (W.x / sx + uHalfPx.x * 0.5) / uHalfPx.x,
    (W.y / sv + uHalfPx.y * 0.5) / uHalfPx.y
  );
  // Arithmetic mask rather than a branch: this runs SAMPLES * 3 times a pixel
  // and the coordinates vary per iteration, so a real branch here would be
  // divergent and would also poison the derivatives the mip selection needs.
  inside = step(0.0, q.x) * step(q.x, 1.0) * step(0.0, q.y) * step(q.y, 1.0);
  return vec2(clamp(q.x, 0.0, 1.0), (clamp(q.y, 0.0, 1.0) + halfIdx) * 0.5);
}

float tap(float sy, float halfIdx, vec2 W, float front) {
  float inside;
  vec2 t = atlasUv(sy, halfIdx, W, inside);
  inside *= front;
  float v = texture2D(uText, t).r * inside;
  // Ink conservation: stretched type gets thinner. Squaring the coverage pulls
  // the antialiased edge in, so the stroke narrows as the word blasts instead
  // of keeping its resting weight and merely going grey. A mul-add rather than
  // a pow, because this line runs 84 times per pixel.
  return v * mix(1.0, v, uThin);
}

// The halo tap. Same geometry, read off a coarse mip so four of them cover what
// would otherwise take dozens, and NOT thinned — the halo is the light spilling
// off the stroke, not the stroke.
float tapBlur(float sy, float halfIdx, vec2 W, float front) {
  float inside;
  vec2 t = atlasUv(sy, halfIdx, W, inside);
  inside *= front;
  return texture2D(uText, t, BLOOM_BIAS).r * inside;
}

void main() {
  vec2 P = vUv * uRes;
  vec2 C = vec2(uRes.x * 0.5, uRes.y * uCenterY);
  vec2 sp = P - C;

  // ── Un-project ───────────────────────────────────────────────────────────
  // The word is a flat quad sitting at uPos in camera space, pitched about its
  // own horizontal axis and then yawed about its vertical one, seen through a
  // pinhole of focal length uFocal. Solve that projection backwards for the
  // point ON THE QUAD this pixel is looking at, and everything downstream
  // carries on working in the word's own flat space exactly as it did before
  // there was a quad.
  //
  //   Xc = uPos.x + a*cy + b*sp*sy
  //   Yc = uPos.y + b*cp
  //   Zc = uPos.z - a*sy + b*sp*cy
  //   sp_screen = uFocal * (Xc, Yc) / Zc
  //
  // Zc is LINEAR in a and b, so multiplying each screen equation through by it
  // leaves two linear equations in the two unknowns. A 2x2 solve, one
  // reciprocal, no iteration. There is no closed form that gets one coordinate
  // out before the other once both rotations are in play — with a single
  // rotation you can chain them, with two you cannot, and trying to leaves a
  // cross term unaccounted for that shows up as the word shearing.
  //
  // The determinant sits near uFocal^2 and cannot approach zero at the angles
  // this card turns through; the clamp is insurance, not load-bearing.
  //
  // At rest both rotations are zero and uPos is (0, 0, uFocal), which reduces
  // to a = sp.x and b = sp.y — the identity. The resting word is untouched.
  float sy = uRot.x, cy = uRot.y, sps = uRot.z, cps = uRot.w;
  float a1 = -(sp.x * sy + uFocal * cy);
  float b1 = sps * (sp.x * cy - uFocal * sy);
  float c1 = uFocal * uPos.x - sp.x * uPos.z;
  float a2 = -sp.y * sy;
  float b2 = sp.y * sps * cy - uFocal * cps;
  float c2 = uFocal * uPos.y - sp.y * uPos.z;
  float det = a1 * b2 - a2 * b1;
  float inv = 1.0 / (abs(det) < 1e-4 ? 1e-4 : det);
  float a = (c1 * b2 - c2 * b1) * inv;
  float b = (a1 * c2 - a2 * c1) * inv;
  float Zc = uPos.z - a * sy + b * sps * cy;
  vec2 W = vec2(a, b);
  // Behind the lens is not a place the word can be seen from.
  float front = step(uFocal * 0.05, Zc);

  vec3 acc = vec3(0.0);

  // At rest the word is not moving, so all three shutters have zero length and
  // every sample would land on the same texel. Take one tap instead: it is both
  // cheaper and genuinely sharper than 28 taps averaging the same value, and it
  // is the reason the resting frames come out pure white with no fringe. The
  // comparison is on a uniform, so the whole draw takes one side of it.
  if (abs(uSyQ.y) + abs(uSyQ.z) < 1e-5) {
    acc = vec3(tap(uSyQ.x, uHalfA, W, front));
  } else {
    // Where in the shutter THIS pixel sits, before the per-channel scaling.
    // Two offsets, both constant per pixel and both zero on the centre lines:
    // the rolling shutter reads the top of the frame earlier than the bottom,
    // and the lag puts the right of the word later in the blast than the left.
    // The lag is measured along the WORD, so it follows the word around the
    // orbit instead of staying pinned to the screen. The roll is a property of
    // the sensor, so it stays in screen space where it belongs.
    float off = uLag * (W.x / uRes.x) - uRoll * (sp.y / uRes.y);

    float wsum = 0.0;
    for (int i = 0; i < SAMPLES; i++) {
      float u = float(i) / float(SAMPLES - 1) - 0.5;
      // Weighted towards the present instant, so the streak has a bright head
      // at the scale the word is at now and tails that fall away either side.
      float w = 1.0 - uShape * abs(u) * 2.0;
      wsum += w;

      float us = u + off;
      // Sweep the SCALE, not the position. A translation sweep would drag the
      // centroid, and the reference's per-channel centroids sit on top of each
      // other to under 2px in every frame. Each channel walks the same curve,
      // just over its own fraction of the shutter.
      vec3 uk = us * uK;
      vec3 sy = uSyQ.x + uSyQ.y * uk + uSyQ.z * uk * uk;
      acc.r += w * tap(
        sy.r * (uk.r < uSwapU ? uSwapScl.x : uSwapScl.y),
        uk.r < uSwapU ? uHalfA : uHalfB, W, front);
      acc.g += w * tap(
        sy.g * (uk.g < uSwapU ? uSwapScl.x : uSwapScl.y),
        uk.g < uSwapU ? uHalfA : uHalfB, W, front);
      acc.b += w * tap(
        sy.b * (uk.b < uSwapU ? uSwapScl.x : uSwapScl.y),
        uk.b < uSwapU ? uHalfA : uHalfB, W, front);
    }
    // Divide, never sum. This is what makes speed cost brightness, and it is
    // why the reference's peak luminance dips to 239 of 255 mid-blast. By the
    // weight sum rather than the count, so shaping the shutter changes where
    // the light lands without changing how much of it there is.
    acc /= max(wsum, 1e-4);

    // The halo, over a much longer sweep and off a coarse mip. Same per-channel
    // shutter, so green's reaches furthest — it deepens the split rather than
    // washing it out the way a neutral bloom pass would.
    vec3 halo = vec3(0.0);
    for (int j = 0; j < BLOOM_TAPS; j++) {
      float u = (float(j) / float(BLOOM_TAPS - 1) - 0.5) * BLOOM_SPREAD + off;
      vec3 uk = u * uK;
      vec3 sy = uSyQ.x + uSyQ.y * uk + uSyQ.z * uk * uk;
      halo.r += tapBlur(
        sy.r * (uk.r < uSwapU ? uSwapScl.x : uSwapScl.y),
        uk.r < uSwapU ? uHalfA : uHalfB, W, front);
      halo.g += tapBlur(
        sy.g * (uk.g < uSwapU ? uSwapScl.x : uSwapScl.y),
        uk.g < uSwapU ? uHalfA : uHalfB, W, front);
      halo.b += tapBlur(
        sy.b * (uk.b < uSwapU ? uSwapScl.x : uSwapScl.y),
        uk.b < uSwapU ? uHalfA : uHalfB, W, front);
    }
    acc += halo * (uBloom / float(BLOOM_TAPS));

    // Give some of the speed's brightness back. Channel-neutral by
    // construction, so it moves the exposure and never the colour.
    acc *= uGain;
  }

  // Filmic rolloff, normalised so a solid white texel lands on exactly 1.0.
  // That normalisation is what makes it safe at rest: the still word stays pure
  // white, unclipped and untinted. Everything below white is lifted, and the
  // dense core of a stroke is lifted much harder than its thin coloured tails,
  // so the core saturates hot while the fringes keep their colour against it.
  acc = (1.0 - exp(-acc * uExp)) / (1.0 - exp(-uExp));

  // ── The ground ───────────────────────────────────────────────────────────
  // A neutral pool of light behind the word, following it around the orbit and
  // growing with it. Composited UNDER the type as a proper over, not added to
  // it: the word is additive light and the ground is what it is standing in
  // front of, so adding would lift the type's own darks and flatten it.
  //
  // Neutral in all three channels by construction, so the only thing on this
  // card that can carry a colour is still the word, and still only when it is
  // moving. It goes in AFTER the rolloff, which is tuned for the word's
  // dynamic range and would otherwise lift this well past what it is set to.
  vec2 gd = (P - uGlow.xy) / max(uGlow.zw, vec2(1.0));
  float ground = uGlowAmp * (1.0 - smoothstep(0.0, 1.0, length(gd)));
  acc += ground * (1.0 - acc);

  // ── The glass ────────────────────────────────────────────────────────────
  // A monitor, and only while the word is moving. uCrt carries p, so the
  // resting frame skips this entire block and comes out of the shader as the
  // same pixels it always was. Everything here MULTIPLIES what is already on
  // screen: no light is invented, the glass only decides where it lands, which
  // is what keeps it out of the way of the colour rule.
  if (uCrt > 0.0) {
    float lum = max(max(acc.r, acc.g), acc.b);

    // Aperture grille. Three phosphor stripes per triad, 120 degrees apart, in
    // SCREEN space so the mask belongs to the glass and does not travel with
    // the word. The mask peaks above 1.0 as well as below it, so a stroke's
    // white core clips back to white and only the mid-tones carry the stripes.
    vec3 m = 0.5 + 0.5 * cos(TAU * (P.x / CRT_PITCH - vec3(0.0, 0.33333, 0.66667)));
    vec3 mask = mix(vec3(1.0), m * 2.0, CRT_MASK * uCrt);

    // Scanlines, horizontal — the one direction this card otherwise never
    // touches, which is exactly why they read as a grid over the image instead
    // of as more smearing. The beam blooms as current rises, so the depth falls
    // away where the signal is hot and the brightest part of the blast goes
    // clean; without that they sit on the picture like a decal.
    float s = 0.5 + 0.5 * cos(TAU * P.y / CRT_SCAN_PITCH);
    float scan = 1.0 - CRT_SCAN * uCrt * (1.0 - CRT_BEAM * lum) * (1.0 - s);

    // Hum bar: a soft band of extra beam current crawling slowly up the frame,
    // a display running a little out of step with what is driving it.
    float bar = 0.5 + 0.5 * cos(TAU * (P.y / uRes.y - uTime * CRT_HUM_SPEED));
    float hum = 1.0 + CRT_HUM * uCrt * (bar * 2.0 - 1.0);

    acc *= mask * scan * hum;
  }

  gl_FragColor = vec4(acc, 1.0);
}
`));if(i){for(let t of(this.prog=i,this.quad=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,this.quad),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW),["uText","uRes","uHalfPx","uSx","uSyQ","uCenterY","uSwapU","uHalfA","uHalfB","uK","uShape","uRoll","uLag","uThin","uBloom","uGain","uExp","uSwapScl","uFocal","uPos","uRot","uCrt","uTime","uGlow","uGlowAmp"]))this.uni[t]=e.getUniformLocation(i,t);e.clearColor(0,0,0,1),this.resize(),this.ok=!0}}link(t,e){let a=this.gl,i=(t,e)=>{let i=a.createShader(t);return(a.shaderSource(i,e),a.compileShader(i),a.getShaderParameter(i,a.COMPILE_STATUS))?i:(a.deleteShader(i),null)},s=i(a.VERTEX_SHADER,t),o=i(a.FRAGMENT_SHADER,e);if(!s||!o)return null;let n=a.createProgram();return(a.attachShader(n,s),a.attachShader(n,o),a.bindAttribLocation(n,0,"aPos"),a.linkProgram(n),a.deleteShader(s),a.deleteShader(o),a.getProgramParameter(n,a.LINK_STATUS))?n:(a.deleteProgram(n),null)}allocAtlas(){let t=this.gl,e=2.706896551724138*this.canvas.width*1.3>1e3?2048:1024,a=e/4,i=e!==this.aw||!this.tex;this.aw=e,this.hh=a,this.texCap=Math.round(.64*a),i&&(this.tex&&t.deleteTexture(this.tex),this.tex=t.createTexture(),t.bindTexture(t.TEXTURE_2D,this.tex),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,e,2*a,0,t.RGBA,t.UNSIGNED_BYTE,null),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR_MIPMAP_LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),this.scratch=document.createElement("canvas"),this.scratch.width=e,this.scratch.height=a,this.halfWord=[null,null],this.rasteredFor=NaN)}rasterWord(t,e){let a=this.gl,i=this.scratch;if(!a||!i||!this.tex)return;let s=i.getContext("2d");s.fillStyle="#000",s.fillRect(0,0,i.width,i.height);let o=(t||"").trim();if(o){let t=1.4*this.texCap;s.font=`400 ${t}px ${this.family}`,t*=this.texCap/(s.measureText("H").actualBoundingBoxAscent||.72*t),s.font=`400 ${t}px ${this.family}`;let e=.92*i.width,a=s.measureText(o).width;a>e&&(t*=e/a,s.font=`400 ${t}px ${this.family}`),s.fillStyle="#fff",s.textAlign="center",s.textBaseline="alphabetic",s.fillText(o,i.width/2,i.height/2+this.texCap/2),this.wordHalfW=.5*s.measureText(o).width}a.bindTexture(a.TEXTURE_2D,this.tex),a.pixelStorei(a.UNPACK_FLIP_Y_WEBGL,!0),a.texSubImage2D(a.TEXTURE_2D,0,0,e*this.hh,a.RGBA,a.UNSIGNED_BYTE,i),a.pixelStorei(a.UNPACK_FLIP_Y_WEBGL,!1),a.generateMipmap(a.TEXTURE_2D),this.halfWord[e]=t}resize(){let t=this.gl;if(!t)return;let e=this.host.getBoundingClientRect();if(e.width<2||e.height<2)return;let a=Math.min(window.devicePixelRatio||1,1.5),i=Math.max(1,Math.round(e.width*a)),s=Math.max(1,Math.round(e.height*a));i===this.canvas.width&&s===this.canvas.height&&this.tex||(this.canvas.width=i,this.canvas.height=s,t.viewport(0,0,i,s),this.allocAtlas(),this.rasterWord(p[0],0),this.rasterWord(p[1%p.length],1),this.rasteredFor=0)}onResize(){this.resize(),this.running||this.draw(this.clock)}refreshFont(){this.family=g(s);let t=this.halfWord[0],e=this.halfWord[1];t&&this.rasterWord(t,0),e&&this.rasterWord(e,1),this.running||this.draw(this.clock)}draw(t){let e=this.gl,a=this.prog;if(!e||!a||!this.tex)return;let i=w(t),s=w(t-.02),n=w(t+.02),r=.85*p.length,h=t%r;h<0&&(h+=r);let u=Math.floor(h/.85);if(this.rasteredFor!==u&&h-.85*u>=.285){let t=(u+1)%p.length;this.rasterWord(p[t],t%2),this.rasteredFor=u}let c=Math.floor((t-.02)/.85),d=Math.floor((t+.02)/.85),f=d>c?(.85*d-t)/.04:2,m=Math.max(0,1-(2*(t-.85*Math.round(t/.85)))**2/.0016),g=.09*this.canvas.height/this.texCap,v=t=>g*(1+6*t.p),x=v(s),y=v(i),T=v(n),b=T-x,S=1.6*i.p*y,E=Math.sqrt(b*b+S*S),A=g*(1+i.p*(1.57-1)),R=.07*i.p,k=o[i.idx%o.length]??1,P=i.psi*Math.sign(k||1),C=Math.abs(k),M=+this.canvas.height,_=M*(1-.42*(1+Math.cos(P))*.5),U=.16*M*C*Math.sin(P),B=l(P,.55,.6),L=l(P,.26,-.9);e.useProgram(a),e.bindBuffer(e.ARRAY_BUFFER,this.quad),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.tex),e.uniform1i(this.uni.uText,0),e.uniform2f(this.uni.uRes,this.canvas.width,this.canvas.height),e.uniform2f(this.uni.uHalfPx,this.aw,this.hh),e.uniform1f(this.uni.uSx,A),e.uniform3f(this.uni.uSyQ,y,b<0?-E:E,2*(T+x-2*y)),e.uniform1f(this.uni.uCenterY,.5+R),e.uniform1f(this.uni.uSwapU,f),e.uniform1f(this.uni.uHalfA,s.idx%2),e.uniform1f(this.uni.uHalfB,n.idx%2),e.uniform3f(this.uni.uK,.62,1,.34),e.uniform1f(this.uni.uShape,.85),e.uniform1f(this.uni.uRoll,.38),e.uniform1f(this.uni.uLag,.55),e.uniform1f(this.uni.uThin,.55*i.p),e.uniform1f(this.uni.uBloom,.5*i.p),e.uniform1f(this.uni.uGain,(1+.95*i.p)*(1+.5*m)),e.uniform2f(this.uni.uSwapScl,1+.35*m,1-.35*m),e.uniform1f(this.uni.uExp,1.75),e.uniform1f(this.uni.uFocal,M),e.uniform3f(this.uni.uPos,0,U,_),e.uniform4f(this.uni.uRot,Math.sin(B),Math.cos(B),Math.sin(L),Math.cos(L)),e.uniform1f(this.uni.uCrt,+i.p);let F=.5*this.canvas.width+0*M/_,H=this.canvas.height*(.5+R)+M*U/_,I=M/_,W=this.wordHalfW*A*I,D=this.texCap*y*I;e.uniform4f(this.uni.uGlow,F,H,Math.max(2.6*W,.34*this.canvas.width),Math.min(Math.max(2.6*D,.34*this.canvas.height),1.2*this.canvas.height)),e.uniform1f(this.uni.uGlowAmp,.03+.028*i.p),e.uniform1f(this.uni.uTime,this.wall%7.142857142857142),e.clear(e.COLOR_BUFFER_BIT),e.drawArrays(e.TRIANGLES,0,3)}onScroll=()=>{let t=window.scrollY;this.vel=Math.min(this.vel+Math.abs(t-this.lastY),150),this.lastY=t};tick=t=>{if(!this.running)return;let e=this.last?Math.min((t-this.last)/1e3,.05):0;this.last=t,this.wall+=e,this.vel*=Math.exp(-4*e);let a=w(this.clock),i=d[a.idx%d.length]??0,s=Math.floor(this.clock/.85);i>0&&a.rising&&a.p>.55&&this.autoCycle!==s&&(this.autoCycle=s,this.autoUntil=this.wall+i);let o=Math.max(+!!this.held,+(this.wall<this.autoUntil)),n=o>this.hold?.05:.2,r=e>0?1-Math.exp(-e/n):0;this.hold+=(o-this.hold)*r;let h=a.p*a.p,l=1-.96*this.hold*h*h;this.clock+=e*(1+Math.min(.02*this.vel,3))*l,this.draw(this.clock),this.raf=requestAnimationFrame(this.tick)};start(){!this.running&&this.ok&&(this.running=!0,this.last=0,this.lastY=window.scrollY,this.vel=0,window.addEventListener("scroll",this.onScroll,{passive:!0}),this.raf=requestAnimationFrame(this.tick))}setHeld(t){this.held=t}stop(){this.running&&window.removeEventListener("scroll",this.onScroll),this.running=!1,cancelAnimationFrame(this.raf),this.raf=0}renderStill(){this.draw(this.clock)}destroy(){this.stop();let t=this.gl;t&&(this.prog&&t.deleteProgram(this.prog),this.quad&&t.deleteBuffer(this.quad),this.tex&&t.deleteTexture(this.tex),t.getExtension("WEBGL_lose_context")?.loseContext()),this.gl=null,this.prog=null,this.quad=null,this.tex=null,this.scratch=null,this.canvas.remove()}}var x=t.i(20268);t.s(["RushTypeCard",0,function({bare:t=!1,viewTransitionName:o}={}){let n=(0,a.useRef)(null);return(0,a.useEffect)(()=>{let t=n.current;if(!t)return;let e=window.matchMedia("(prefers-reduced-motion: reduce)").matches,a=null,i=!1,o=!1,r=!1,h=()=>{a&&!e&&(!i||o||r?a.stop():a.start())},l=requestAnimationFrame(()=>{if(n.current&&(a=new v(t)).ok&&(a.renderStill(),e||h(),document.fonts?.load)){let t=document.createElement("span");t.style.cssText=`position:absolute;visibility:hidden;font-family:${s}`,t.textContent="Ag",document.body.appendChild(t);let e=getComputedStyle(t).fontFamily.split(",")[0].replace(/["']/g,"").trim();document.body.removeChild(t),document.fonts.load(`400 1em "${e}"`).then(()=>a?.refreshFont(),()=>{})}}),u=new IntersectionObserver(t=>{i=t[0]?.isIntersecting??!1,h()},{threshold:.2});u.observe(t);let c=()=>{o=document.hidden,h()};document.addEventListener("visibilitychange",c);let d=()=>a?.setHeld(!0),f=()=>a?.setHeld(!1);t.addEventListener("pointerenter",d),t.addEventListener("pointerdown",d),t.addEventListener("pointerleave",f),t.addEventListener("pointerup",f),t.addEventListener("pointercancel",f);let p=(0,x.onTransitionChange)(t=>{r=t,h()}),m=0,w=()=>{window.clearTimeout(m),m=window.setTimeout(()=>a?.onResize(),120)};return window.addEventListener("resize",w),()=>{cancelAnimationFrame(l),u.disconnect(),t.removeEventListener("pointerenter",d),t.removeEventListener("pointerdown",d),t.removeEventListener("pointerleave",f),t.removeEventListener("pointerup",f),t.removeEventListener("pointercancel",f),document.removeEventListener("visibilitychange",c),p(),window.removeEventListener("resize",w),window.clearTimeout(m),a?.destroy()}},[]),(0,e.jsx)("div",{ref:n,"data-canvas-card":!0,role:"img","aria-label":`The words ${i.join(", ")} one at a time on a dark field. Each word holds still and sharp for a beat, then swings up and toward you, turning, until it stretches off the top and bottom of the frame and tears into vertical streaks of green and violet light, and the next word falls back out of the blur. Pointing at it holds the word at its largest.`,style:o?{viewTransitionName:o}:void 0,className:"relative mx-auto aspect-[1344/820] w-full cursor-pointer select-none overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-black"})}],97575)},37517,t=>{t.n(t.i(97575))}]);