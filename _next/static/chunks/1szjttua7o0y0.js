(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,13644,e=>{"use strict";var t=e.i(43476),i=e.i(71645);let o=`
attribute vec2 aPosition;
attribute vec2 aUV;
varying vec2 vUV;
void main() {
  vUV = aUV;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`,a=`
precision highp float;

varying vec2 vUV;

uniform sampler2D uField; // R crisp coverage, G round height (the liquid surface)
uniform vec2  uTexel;
uniform vec2  uTilt;      // cursor-driven reflection tilt
uniform float uAspect;
uniform float uTime;
// chrome ramp: 5 stops (sky, horizon-light, horizon-dark, ground, base)
uniform vec3  uS0;
uniform vec3  uS1;
uniform vec3  uS2;
uniform vec3  uS3;
uniform vec3  uS4;
uniform vec3  uSpark;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i+vec2(1.,0.)), c = hash(i+vec2(0.,1.)), d = hash(i+vec2(1.,1.));
  vec2 u = f*f*(3.-2.*f);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}

// combined height = macro bulge (G) + a little micro-surface (B). The micro term adds
// fine curvature so the reflection has life; kept small so the surface stays smooth (#1).
float heightAt(vec2 uv){
  vec4 f = texture2D(uField, uv);
  return f.g + f.b * 0.18;
}

// SMOOTH continuous chrome reflection (#2). Instead of a 5-stop PIECEWISE-LINEAR ramp
// (which has slope kinks at every stop -> visible bands), blend the 5 preset colours
// with a SMOOTHSTEP (Hermite) basis so the horizon is one continuous curve with no
// discontinuities. Same 5 control colours, but C1-smooth between them.
vec3 ramp(float t){
  t = clamp(t, 0.0, 1.0);
  float x = t * 4.0;                    // 0..4 across the 5 stops
  vec3 col = uS0;
  col = mix(col, uS1, smoothstep(0.0, 1.0, clamp(x - 0.0, 0.0, 1.0)));
  col = mix(col, uS2, smoothstep(0.0, 1.0, clamp(x - 1.0, 0.0, 1.0)));
  col = mix(col, uS3, smoothstep(0.0, 1.0, clamp(x - 2.0, 0.0, 1.0)));
  col = mix(col, uS4, smoothstep(0.0, 1.0, clamp(x - 3.0, 0.0, 1.0)));
  return col;
}

// Reflect->ramp coordinate: turn an env direction into the vertical reflection coord
// with the horizon sharpen baked in. Shared by the sharp + blurry reflection layers.
float envT(vec2 env){
  float t = clamp(0.5 - env.y * 0.9, 0.0, 1.0);
  t = t + (t - 0.5) * 0.35 * (1.0 - abs(env.x));   // sharpen the horizon line
  return clamp(t, 0.0, 1.0);
}

// filmic-ish tone map (#7): soft-clip the summed HDR layers so stacked highlights
// COMPRESS (staying chrome-coloured) instead of hard-clipping to flat white.
vec3 toneMap(vec3 c){
  return c / (c + vec3(0.85)) * 1.85;   // Reinhard-ish, tuned to keep mids bright
}

// smooth 2-octave value-noise flow field, for the living backdrop + metal reflection.
float fbm(vec2 p){
  return noise(p) * 0.6 + noise(p * 2.1 + 4.0) * 0.3 + noise(p * 4.3 + 9.0) * 0.1;
}

// A DARK environment whose PALETTE is DERIVED FROM THE ACTIVE RAMP (uS0/uS3/uS4/uSpark),
// so the background follows each colorway and crossfades with it (the ramp uniforms are
// eased on the CPU). Slow morphing pools drift through it (an oil-slick aurora); because
// the metal also reflects this field, background + effect are one coherent environment.
// The word sits in a soft dark vignette so it stays the focus.
vec3 background(vec2 uv){
  vec2 p = uv * vec2(uAspect, 1.0);
  float t = uTime * 0.08;
  // two slowly-warping flow fields -> where each colour pool sits, morphing over time
  float f1 = fbm(p * 1.4 + vec2(t, -t * 0.7));
  float f2 = fbm(p * 1.9 + vec2(-t * 0.8, t) + f1);
  // pools built FROM THE PRESET, darkened to a moody-room level so it stays minimal.
  vec3 poolA = uS0   * 0.16;               // sky tint
  vec3 poolB = uS3   * 0.5;                // ground tint (usually the richest hue)
  vec3 poolC = uSpark* 0.1;                // accent glint tint
  vec3 col = uS4 * 0.04 + vec3(0.015);     // near-black base, faintly the metal's base hue
  col = mix(col, poolA, smoothstep(0.35, 0.75, f1));
  col = mix(col, poolB, smoothstep(0.4, 0.85, f2));
  col = mix(col, poolC, smoothstep(0.6, 0.95, f1 * f2 * 1.6));
  // a soft radial softbox behind the word, tinted by the preset's sky.
  vec2 c = (uv - vec2(0.5, 0.44)) * vec2(uAspect, 1.0);
  float radial = 1.0 - smoothstep(0.0, 0.95, length(c));
  col += (uS0 * 0.08 + vec3(0.02)) * radial;

  // ---- STUDIO cues that tie the room to the metal (minimal, all very faint). All are
  // tinted by the PRESET's sky/horizon colours so they follow + crossfade with it. ----
  vec3 studioTint = mix(uS0, uS1, 0.4);
  // 1) a soft REFLECTED HORIZON band low in the frame — the studio floor line the chrome
  //    reflects, so the void feels like a real (if dark) room, not flat black.
  float horizon = 1.0 - smoothstep(0.0, 0.16, abs(uv.y - 0.30));
  col += studioTint * 0.09 * horizon * 0.6;
  // 2) a slow drifting CAUSTIC light streak (a soft diagonal ray, like light through a
  //    window). One faint band that glides — gives the emptiness gentle structure.
  float ray = uv.x * uAspect * 0.5 + uv.y - fract(uTime * 0.03) * 2.0;
  col += studioTint * 0.07 * (1.0 - smoothstep(0.0, 0.22, abs(ray - 0.4))) * 0.5 * radial;
  // 3) a subtle TEMPERATURE split so the backdrop isn't monochrome: the preset sky on one
  //    side, its warm spark accent on the other.
  float temp = clamp((uv.x - uv.y) * 0.5 + 0.5, 0.0, 1.0);
  col += mix(uS0 * 0.03, uSpark * 0.03, temp) * radial;

  // dark vignette to the corners so the metal is the focus
  col *= mix(0.45, 1.0, radial);
  // fine grain
  col += (noise(p * 320.0) - 0.5) * 0.012;
  return col;
}

void main() {
  vec2 uv = vUV;

  // SUPER-WEAK PARALLAX: the word drifts a couple px toward the cursor on hover, over
  // the fixed background, for a hair of depth. uTilt is the eased cursor offset (0 at
  // rest), so this is zero until you hover and eases back on leave. Tiny on purpose.
  vec2 wuv = uv - uTilt * 0.012;

  float crisp = texture2D(uField, wuv).r;
  float height = heightAt(wuv);

  vec3 bg = background(uv);

  // ---- CONTACT SHADOW: a soft dark pool under the word so it doesn't float. Sample the
  // coverage a bit BELOW-on-screen (lower uv.y, the field is unflipped) at growing
  // offsets for a soft falloff. Only darkens the backdrop — never touches the metal. ----
  float shadow = 0.0;
  shadow += texture2D(uField, wuv - vec2(0.004, 0.03)).g * 0.5;
  shadow += texture2D(uField, wuv - vec2(0.006, 0.055)).g * 0.3;
  shadow += texture2D(uField, wuv - vec2(0.008, 0.085)).g * 0.2;
  bg *= 1.0 - clamp(shadow, 0.0, 1.0) * 0.6;

  // Keep the FLUFFY blurred edge (that's the poured-liquid look) — just don't let it
  // spread quite so far. The composite edge below trims the very faint blur tail so the
  // letters are puffy but not obese, without going hard-clipped/sharp.
  if (height < 0.01) {
    gl_FragColor = vec4(bg, 1.0);
    return;
  }

  // ---- SMOOTH SUPERSAMPLED NORMAL (#1, #9) ----
  // A single 8-bit height blur gives stair-stepped normals. We reconstruct the normal
  // from an 8-tap gradient over TWO rings (a near + a wider ring) and average them, which
  // supersamples the derivative -> a continuous, glassy surface with no contour steps.
  float g1 = 1.6, g2 = 3.4;
  // near ring
  float aL = heightAt(wuv - vec2(g1,0.)*uTexel), aR = heightAt(wuv + vec2(g1,0.)*uTexel);
  float aD = heightAt(wuv - vec2(0.,g1)*uTexel), aU = heightAt(wuv + vec2(0.,g1)*uTexel);
  // wider ring (smooths the low-frequency shape)
  float bL = heightAt(wuv - vec2(g2,0.)*uTexel), bR = heightAt(wuv + vec2(g2,0.)*uTexel);
  float bD = heightAt(wuv - vec2(0.,g2)*uTexel), bU = heightAt(wuv + vec2(0.,g2)*uTexel);
  vec2 slope = (vec2(aR - aL, aU - aD) * 0.6 + vec2(bR - bL, bU - bD) * 0.4) * 22.0;
  vec3 N = normalize(vec3(-slope.x, -slope.y, 1.0));

  // ---- reflection setup: reflect the view vector off N, add cursor tilt + churn ----
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 R = reflect(-V, N);
  // LIQUID-METAL RESTING CHURN: a slow flow-noise field rolls the reflection over the
  // letters like molten metal, plus a slow overall orbit.
  float tt = uTime;
  vec2 fp = uv * vec2(uAspect, 1.0) * 1.6;
  vec2 flow = vec2(
    fbm(fp + vec2(tt * 0.25, height * 3.0)) - 0.5,
    fbm(fp + vec2(-tt * 0.2 + 5.0, tt * 0.15)) - 0.5
  ) * 0.55;
  flow += vec2(sin(tt * 0.31) * 0.1, cos(tt * 0.24) * 0.08);
  vec2 env = R.xy + uTilt + flow;

  // ---- TWO-LAYER ENVIRONMENT REFLECTION (#3): a SHARP mirror reflection + a BLURRY
  // (rough) reflection, mixed. The sharp layer gives the crisp horizon; the blurry layer
  // is a soft body glow that removes hardness and reads as real polished (not mirror-
  // perfect) metal. The blur is done by averaging the ramp over jittered env directions. */
  vec3 sharpRefl = ramp(envT(env));
  vec3 blurRefl = vec3(0.0);
  const int NB = 6;
  for (int i = 0; i < NB; i++) {
    float a = float(i) / float(NB) * 6.2831853;
    vec2 j = vec2(cos(a), sin(a)) * 0.14;        // roughness radius in env space
    blurRefl += ramp(envT(env + j));
  }
  blurRefl /= float(NB);
  // roughness: a hair rougher on the flanks (steeper normal) than on the flat faces.
  float rough = 0.4 + 0.25 * clamp(length(slope), 0.0, 1.0);
  vec3 metal = mix(sharpRefl, blurRefl, rough);

  // reflect the iridescent BACKDROP too (ties bg <-> effect), on the reflective mids.
  float tMid = envT(env);
  vec3 envColor = background(clamp(uv + env * 0.35, 0.0, 1.0));
  float envMix = (1.0 - abs(tMid - 0.5) * 2.0) * 0.3;
  metal = mix(metal, metal + envColor * 2.0, envMix);

  // horizontal sky streak across the metal (soft).
  float streak = smoothstep(0.35, 0.5, abs(env.x + sin(env.y*3.0)*0.1));
  metal += (1.0 - streak) * 0.1 * uS1;

  // ---- FRESNEL RIM: edges of the bulge catch a bright reflection ----
  float fres = pow(1.0 - N.z, 2.2);
  metal += fres * uS1 * 0.45;

  // ---- BLINN-PHONG SPECULAR HOTSPOT (#5, #6): one moving KEY light. A tight bright spot
  // slides across the bulges as the surface curves = the single biggest "wet real metal"
  // cue. The light orbits slowly. #6: the highlight is stretched ANISOTROPICALLY along x
  // for a faint brushed-liquid streak (uAniso small -> mostly round). ----
  vec3 keyDir = normalize(vec3(cos(tt * 0.22) * 0.7, 0.5 + sin(tt * 0.18) * 0.3, 0.9));
  vec3 Hh = normalize(keyDir + V);
  // anisotropy: squash the half-vector's x contribution so the lobe elongates on x.
  vec3 Na = normalize(vec3(N.x * 0.6, N.y, N.z));
  float ndh = max(dot(Na, Hh), 0.0);
  float spec = pow(ndh, 120.0);                 // tight, glossy hotspot
  metal += spec * uSpark * 1.3;
  // a second, broader soft specular for the "sheen" body (keeps it from looking dry).
  metal += pow(max(dot(N, Hh), 0.0), 16.0) * uS1 * 0.25;

  // ---- traveling SHINE sweep (soft moving light band) ----
  float sweepPos = fract(uTime * 0.16);
  float diag = (uv.x * uAspect + (1.0 - uv.y)) * 0.42;
  float band = 1.0 - smoothstep(0.0, 0.06, abs(diag - sweepPos * 1.4 + 0.2));
  float facing = clamp(N.x * -0.6 + N.y * 0.6 + 0.4, 0.0, 1.0);
  metal += band * facing * uSpark * 0.5;

  // ---- SPARKS: sharp star glints at the brightest high-curvature ridges ----
  float curv = length(slope);
  float bright = smoothstep(0.62, 1.0, tMid) * smoothstep(0.4, 1.2, curv);
  float tw = 0.5 + 0.5 * sin(uTime * 2.0 + height * 40.0 + uv.x * 30.0);
  metal += bright * tw * tw * uSpark * 1.1;

  // ---- AMBIENT OCCLUSION in the crevices (#4): where coverage is high but the height
  // is LOW (the valleys where strokes meet / the letter interiors dip), darken the metal
  // so it has real depth. Uses the macro height directly. ----
  float ao = smoothstep(0.15, 0.7, texture2D(uField, wuv).g); // 0 in valleys, 1 on crowns
  metal *= 0.7 + ao * 0.3;

  // edge deboss so the metal reads as a raised liquid slab.
  float face = smoothstep(0.3, 0.55, crisp);
  metal *= 0.86 + face * 0.14;

  // fine grain (surface micro-texture).
  metal += (noise(uv * vec2(uAspect,1.0) * 520.0) - 0.5) * 0.035;

  // ---- TONE MAP (#7): soft-clip the summed layers so stacked highlights compress and
  // keep their chrome tint instead of blowing to flat white. ----
  vec3 c = toneMap(metal);
  // DITHER (#8) AFTER tone-map: sub-LSB noise removes any residual 8-bit banding.
  c += (hash(uv * 1024.0 + fract(uTime)) - 0.5) * (1.5 / 255.0);
  c = clamp(c, 0.0, 1.0);

  // composite over the backdrop with the soft fluffy liquid edge.
  float aa = smoothstep(0.16, 0.4, height);
  gl_FragColor = vec4(mix(bg, c, aa), 1.0);
}
`,s=[{name:"Silver Teal",stops:[[.62,.78,.85],[.98,1,1],[.03,.06,.08],[.1,.34,.4],[.5,.72,.78]],spark:[.85,.97,1]},{name:"Gold",stops:[[.95,.82,.4],[1,.98,.85],[.14,.08,0],[.6,.4,.05],[.9,.72,.3]],spark:[1,.95,.7]},{name:"Iridescent",stops:[[.55,.5,.95],[.95,.85,1],[.04,.02,.1],[.9,.3,.6],[.3,.8,.85]],spark:[1,.9,1]},{name:"Rose Gold",stops:[[.95,.72,.68],[1,.92,.9],[.12,.04,.05],[.72,.34,.32],[.9,.6,.56]],spark:[1,.9,.88]},{name:"Gunmetal",stops:[[.52,.56,.62],[.9,.93,.98],[.02,.03,.04],[.16,.2,.26],[.42,.47,.53]],spark:[.85,.9,1]},{name:"Toxic",stops:[[.55,.9,.3],[.95,1,.85],[.02,.08,.02],[.2,.5,.08],[.45,.82,.35]],spark:[.9,1,.75]},{name:"Molten",stops:[[1,.55,.2],[1,.92,.6],[.12,.01,0],[.55,.1,.04],[.9,.42,.16]],spark:[1,.85,.5]},{name:"Sapphire",stops:[[.35,.55,.98],[.85,.95,1],[.01,.02,.08],[.08,.16,.55],[.28,.45,.9]],spark:[.82,.92,1]}],r="var(--font-neue-montreal)";async function l(e,t,i,o,a){let s=Math.max(1,Math.round(i)),r=Math.max(1,Math.round(o)),l=document.createElement("canvas");l.width=s,l.height=r;let h=l.getContext("2d"),c=(e||"").trim();if(c){let e=.56*r;h.font=`600 ${e}px ${a}`;let t=.82*s,i=h.measureText(c).width;i>t&&(e*=t/i,h.font=`600 ${e}px ${a}`),h.fillStyle="#fff",h.textAlign="center",h.textBaseline="middle";let o=-.05*e,l=[...c],n=l.map(e=>h.measureText(e).width),u=s/2-(n.reduce((e,t)=>e+t,0)+o*(l.length-1))/2;h.textAlign="left";for(let e=0;e<l.length;e++)h.fillText(l[e],u,.5*r),u+=n[e]+o}let u=n(l,s,r,Math.max(.5,1.15*t)),d=n(l,s,r,Math.max(.5,.4*t)),m=h.getImageData(0,0,s,r).data,f=u.getContext("2d").getImageData(0,0,s,r).data,p=d.getContext("2d").getImageData(0,0,s,r).data,v=document.createElement("canvas");v.width=s,v.height=r;let g=v.getContext("2d"),b=g.createImageData(s,r),w=b.data;for(let e=0;e<w.length;e+=4)w[e]=m[e+3],w[e+1]=f[e+3],w[e+2]=p[e+3],w[e+3]=255;return g.putImageData(b,0,0),v}function n(e,t,i,o){let a=document.createElement("canvas");a.width=t,a.height=i;let s=a.getContext("2d");return s.filter=`blur(${o.toFixed(2)}px)`,s.drawImage(e,0,0),s.filter="none",a}function h(e){let t=[];for(let i of e.stops)t.push(i[0],i[1],i[2]);return t.push(e.spark[0],e.spark[1],e.spark[2]),t}class c{host;canvas;gl=null;prog=null;loc={};quad=null;tex=null;texW=1;texH=1;raf=0;running=!1;awake=!1;w=0;h=0;dpr=1;fontFamily=`${r}, sans-serif`;word="metal";rampIdx=0;curRamp=h(s[0]);targetRamp=h(s[0]);builtW=0;builtH=0;builtFont="";builtWord="";buildScheduled=0;destroyed=!1;painted=!1;t0=performance.now();tx=0;ty=0;ttx=0;tty=0;ok=!1;constructor(e,t){this.host=e,t&&(this.fontFamily=t),this.canvas=document.createElement("canvas"),Object.assign(this.canvas.style,{position:"absolute",inset:"0",width:"100%",height:"100%",display:"block",opacity:"0"}),e.appendChild(this.canvas);const i=this.canvas.getContext("webgl",{alpha:!1,antialias:!1,premultipliedAlpha:!1});if(!i)return;this.gl=i;try{this.prog=this.build(o,a)}catch{this.gl=null;return}const s=this.prog;for(const e of["uField","uTexel","uTilt","uAspect","uTime","uS0","uS1","uS2","uS3","uS4","uSpark"])this.loc[e]=i.getUniformLocation(s,e);const r=i.getAttribLocation(s,"aPosition"),l=i.getAttribLocation(s,"aUV"),n=new Float32Array([-1,-1,0,1,1,-1,1,1,-1,1,0,0,1,1,1,0]);this.quad=i.createBuffer(),i.bindBuffer(i.ARRAY_BUFFER,this.quad),i.bufferData(i.ARRAY_BUFFER,n,i.STATIC_DRAW),i.useProgram(s),i.enableVertexAttribArray(r),i.vertexAttribPointer(r,2,i.FLOAT,!1,16,0),i.enableVertexAttribArray(l),i.vertexAttribPointer(l,2,i.FLOAT,!1,16,8),i.clearColor(.045,.048,.055,1),this.resize(),this.buildFieldNow(),this.canvas.addEventListener("pointermove",this.onMove),this.canvas.addEventListener("pointerleave",this.onLeave),this.ok=!0}build(e,t){let i=this.gl,o=(e,t)=>{let o=i.createShader(e);if(i.shaderSource(o,t),i.compileShader(o),!i.getShaderParameter(o,i.COMPILE_STATUS))throw Error(i.getShaderInfoLog(o)||"compile failed");return o},a=i.createProgram();if(i.attachShader(a,o(i.VERTEX_SHADER,e)),i.attachShader(a,o(i.FRAGMENT_SHADER,t)),i.linkProgram(a),!i.getProgramParameter(a,i.LINK_STATUS))throw Error(i.getProgramInfoLog(a)||"link failed");return a}setFont(e){e!==this.fontFamily&&(this.fontFamily=e,this.scheduleBuild())}setWord(e){e!==this.word&&(this.word=e,this.scheduleBuild())}setRamp(e){this.rampIdx=(e%s.length+s.length)%s.length,this.targetRamp=h(s[this.rampIdx]),this.wake()}wake(){this.awake&&!this.running?this.start():this.running||this.render()}onMove=e=>{let t=this.canvas.getBoundingClientRect();this.ttx=((e.clientX-t.left)/t.width-.5)*.9,this.tty=((e.clientY-t.top)/t.height-.5)*.9,this.wake()};onLeave=()=>{this.ttx=0,this.tty=0,this.wake()};resize(){let e=this.host.getBoundingClientRect();this.dpr=Math.min(2,window.devicePixelRatio||1),this.w=e.width,this.h=e.height;let t=Math.max(1,Math.round(this.w*this.dpr)),i=Math.max(1,Math.round(this.h*this.dpr));(this.canvas.width!==t||this.canvas.height!==i)&&(this.canvas.width=t,this.canvas.height=i,this.gl?.viewport(0,0,t,i),this.scheduleBuild())}maskSize(){let e=Math.max(2,Math.min(1400,Math.round(this.w*this.dpr))),t=Math.max(2,Math.round(e*(this.h/Math.max(1,this.w))));return[e,t]}scheduleBuild(){if(!this.gl||this.destroyed)return;let[e,t]=this.maskSize();if(e===this.builtW&&t===this.builtH&&this.fontFamily===this.builtFont&&this.word===this.builtWord||this.buildScheduled)return;let i=()=>{this.buildScheduled=0,this.buildFieldNow()},o=window.requestIdleCallback;this.buildScheduled=o?o(i,{timeout:200}):window.setTimeout(i,0)}async buildFieldNow(){let e=this.gl;if(!e||this.destroyed)return;if(this.buildScheduled){let e=window.cancelIdleCallback;e?e(this.buildScheduled):window.clearTimeout(this.buildScheduled),this.buildScheduled=0}let[t,i]=this.maskSize();this.builtW=t,this.builtH=i,this.builtFont=this.fontFamily,this.builtWord=this.word;let o=Math.max(1.5,.012*i),a=await l(this.word,o,t,i,this.fontFamily);this.gl&&!this.destroyed&&(this.tex||(this.tex=e.createTexture()),e.bindTexture(e.TEXTURE_2D,this.tex),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,a),this.texW=a.width,this.texH=a.height,this.running||this.render())}start(){if(!this.ok||(this.awake=!0,this.running))return;this.running=!0,this.resize();let e=()=>{this.running&&(this.frame(),this.raf=requestAnimationFrame(e))};this.raf=requestAnimationFrame(e)}stop(){this.awake=!1,this.pause()}pause(){this.running=!1,this.raf&&cancelAnimationFrame(this.raf),this.raf=0}frame(){this.tx+=(this.ttx-this.tx)*.1,this.ty+=(this.tty-this.ty)*.1;for(let e=0;e<this.curRamp.length;e++)this.curRamp[e]+=(this.targetRamp[e]-this.curRamp[e])*.08;this.render()}rampSettling(){for(let e=0;e<this.curRamp.length;e++)if(Math.abs(this.curRamp[e]-this.targetRamp[e])>.002)return!0;return!1}renderStill(){this.resize(),this.buildFieldNow(),this.render()}render(){let e=this.gl;if(!e||!this.prog||!this.tex)return;e.useProgram(this.prog),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.tex),e.uniform1i(this.loc.uField,0),e.uniform2f(this.loc.uTexel,1/this.texW,1/this.texH),e.uniform2f(this.loc.uTilt,this.tx,this.ty),e.uniform1f(this.loc.uAspect,this.w/Math.max(1,this.h)),e.uniform1f(this.loc.uTime,(performance.now()-this.t0)/1e3);let t=this.curRamp;e.uniform3f(this.loc.uS0,t[0],t[1],t[2]),e.uniform3f(this.loc.uS1,t[3],t[4],t[5]),e.uniform3f(this.loc.uS2,t[6],t[7],t[8]),e.uniform3f(this.loc.uS3,t[9],t[10],t[11]),e.uniform3f(this.loc.uS4,t[12],t[13],t[14]),e.uniform3f(this.loc.uSpark,t[15],t[16],t[17]),e.drawArrays(e.TRIANGLE_STRIP,0,4),this.painted||(this.painted=!0,this.canvas.style.opacity="1"),!this.awake&&!this.rampSettling()&&.001>Math.abs(this.tx-this.ttx)&&.001>Math.abs(this.ty-this.tty)&&this.pause()}destroy(){if(this.destroyed=!0,this.buildScheduled){let e=window.cancelIdleCallback;e?e(this.buildScheduled):window.clearTimeout(this.buildScheduled),this.buildScheduled=0}this.stop(),this.canvas.removeEventListener("pointermove",this.onMove),this.canvas.removeEventListener("pointerleave",this.onLeave);let e=this.gl;e&&(this.tex&&e.deleteTexture(this.tex),this.quad&&e.deleteBuffer(this.quad),e.getExtension("WEBGL_lose_context")?.loseContext()),this.canvas.remove()}}var u=e.i(38362),d=e.i(37878),m=e.i(20268);e.s(["ChromeCard",0,function({bare:e=!1,viewTransitionName:o}={}){let a=(0,i.useRef)(null),l=(0,i.useRef)(null),[n,h]=(0,i.useState)(0);return(0,i.useEffect)(()=>{let e=a.current;if(!e)return;let t=window.matchMedia("(prefers-reduced-motion: reduce)").matches,i=null,o=!1,s=!1,n=!1,h=!1,u=()=>{i&&!t&&(!o||s||n?i.stop():i.start())},d=o=>{h||!a.current||(h=!0,l.current=i=new c(e,o?`"${o}", sans-serif`:void 0),i.ok&&(t?i.renderStill():u()))},f="u">typeof document&&"fonts"in document&&!!document.fonts,p=requestAnimationFrame(()=>{let e,t;if(!a.current)return;let i=f?((e=document.createElement("span")).style.cssText="position:absolute;visibility:hidden",e.style.fontFamily=r,e.textContent="Ag",document.body.appendChild(e),t=getComputedStyle(e).fontFamily.split(",")[0].replace(/["']/g,"").trim(),document.body.removeChild(e),t):"";if(f&&i){let e=window.setTimeout(()=>d(i),350);document.fonts.load(`600 1em "${i}"`).then(()=>{window.clearTimeout(e),d(i)},()=>{window.clearTimeout(e),d(i)})}else d()}),v=new IntersectionObserver(e=>{o=e[0]?.isIntersecting??!1,u()},{threshold:.2});v.observe(e);let g=()=>{s=document.hidden,u()};document.addEventListener("visibilitychange",g);let b=(0,m.onTransitionChange)(e=>{n=e,u()}),w=0,x=()=>{window.clearTimeout(w),w=window.setTimeout(()=>i?.resize(),120)};return window.addEventListener("resize",x),()=>{cancelAnimationFrame(p),v.disconnect(),document.removeEventListener("visibilitychange",g),b(),window.removeEventListener("resize",x),window.clearTimeout(w),i?.destroy(),l.current=null}},[]),(0,t.jsx)("div",{ref:a,"data-canvas-card":!0,"aria-label":"The word 'metal' rendered as flowing liquid chrome; move the cursor to tilt the reflection, click to change the colorway.",style:o?{viewTransitionName:o}:void 0,className:"relative mx-auto aspect-[1344/620] w-full cursor-pointer select-none overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[#0c0d10]",onPointerEnter:()=>(0,u.hoverLink)(),onClick:()=>{let e=(n+1)%s.length;h(e),l.current?.setRamp(e),(0,d.hapticTap)(),(0,u.hoverLink)()}})}],13644)},80042,e=>{e.n(e.i(13644))}]);