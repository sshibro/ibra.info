(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,4402,e=>{"use strict";var t=e.i(43476),a=e.i(71645);e.i(47167);let i=`#version 300 es
void main(){
  vec2 v = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(v * 2.0 - 1.0, 0.0, 1.0);
}`,s=`#version 300 es
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform float uLow;     // 0..1 band energies
uniform float uMid;
uniform float uHigh;
uniform float uLevel;   // 0..1 overall loudness (drives amplitude + brightness)
uniform float uPresence;// 0..1 fades the whole thing in when the card comes alive
uniform float uWake;    // 0 = resting (idle breath), 1 = listening (full bloom)
uniform float uWakeLag; // uWake delayed ~120ms; drives dispersion only, so the
                        // colour blooms just AFTER the bend rather than with it
uniform vec3  uPaper;   // page background, so the glow composites onto the site
uniform float uDark;    // 1 = glow on dark, 0 = ink on light

out vec4 outColor;

const float PI = 3.14159265359;

// The four dispersion samples.
//
// The original uses a full wavelength->RGB ramp (pure red, green, green, blue).
// That is physically the honest thing to do, but it is also every rainbow shader
// ever written, and the four primaries average to a muddy green wherever they
// overlap — which is most of the ribbon.
//
// So this is a chosen PALETTE instead of a spectrum: a violet -> magenta -> coral
// ramp, which is Siri's own identity. The four still sum to a neutral core (the
// shader divides by the summed hue), so the un-bent middle of the ribbon stays
// bright and colourless and the split only shows where the wave actually bends.
vec3 spectral4(int s){
  // The stops have to be SPREAD, not merely different: the shader divides by the
  // summed hue, so what survives is each stop's deviation from the palette mean.
  // Four close violets average out to grey no matter how nice they look listed.
  vec3 c0 = vec3(0.26, 0.18, 1.00);  // blue-violet
  vec3 c1 = vec3(0.74, 0.17, 0.96);  // purple
  vec3 c2 = vec3(1.00, 0.22, 0.52);  // magenta
  vec3 c3 = vec3(1.00, 0.66, 0.22);  // warm coral
  return s == 0 ? c0 : s == 1 ? c1 : s == 2 ? c2 : c3;
}

// The ribbon's centre line at a given x and phase.
//
// Not a single sine: a fundamental plus a SECOND HARMONIC at an incommensurate
// frequency, drifting at its own rate. One sine undulates — it is too clean, and
// the eye reads it as a maths curve. Adding a smaller, faster partial makes the
// line RIPPLE, with peaks that are never quite the same height twice, which is
// what a real voice-driven wave looks like.
float waveY(float x, float amp, float env, float drift, float harm){
  float fundamental = sin(x * 1.1 + drift);
  // 2.3x is deliberately not a whole multiple, so the two never re-align into a
  // repeating shape; the extra 0.6 drift rate keeps the partial travelling too.
  float partial = sin(x * 2.53 + drift * 1.6 + 1.7);

  // A slow travelling swell along x, so the two halves of the ribbon are never
  // equally energetic at the same moment.
  //
  // The wave already MOVES — sin(x*1.1 + drift) travels. What made it read as
  // mechanical is that its envelope does not: the containment term is cos(|x|),
  // perfectly mirrored about the centre, so both ends always swell by exactly the
  // same amount and the shape stays balanced whatever the phase does. This breaks
  // that symmetry by letting a broad crest of emphasis drift across the width, so
  // one side leads and the other answers. Small (\xb114%) — enough to stop it
  // looking machined, not enough to look lopsided.
  float tilt = 1.0 + 0.14 * sin(x * 0.42 - drift * 0.6);

  return amp * env * tilt * (fundamental + harm * partial);
}

// Softly-varying line thickness: thin at the tapered ends, fattest in the middle,
// swelling a touch with the mid band. A constant thickness reads as a tube; a
// varying one reads as a brushstroke that was drawn with pressure.
float thicknessAt(float xN, float uMid){
  float taper = 1.0 - 0.55 * clamp(abs(xN) * 0.75, 0.0, 1.0);
  return (0.020 + 0.016 * taper) * (1.0 + 0.35 * uMid);
}

// One full pass of the spectral ribbon, so the reflection can reuse it verbatim.
// "soften" widens the glow and the caller scales the amplitude down, which is all
// the reflection needs to read as a blurrier copy in a surface.
vec3 ribbon(vec2 p, float aspect, float amp, float spread, float drift,
            float harm, float uMid, float uLevel, float soften){
  float xN  = p.x / max(aspect, 1.0);
  float env = cos(PI * 0.5 * min(abs(0.92 * xN), 1.0));
  env *= env;

  float thick = thicknessAt(xN, uMid) * soften;
  float soft  = (0.020 + 0.012 * uMid) * soften;
  float inten = 0.019 * (1.0 + 0.7 * uLevel);

  float yMain = waveY(p.x, amp, env, drift, harm);

  vec3 num = vec3(0.0), den = vec3(0.0);
  for (int s = 0; s < 4; s++){
    vec3 hue = spectral4(s);
    den += hue;
    // phase offset per copy: this is the dispersion. -spread..+spread across s.
    float ab = mix(-spread, spread, float(s) / 3.0);
    float yL = waveY(p.x, amp + 0.03 * uMid, env, drift + ab, harm);

    float d    = abs(p.y - yL);
    // Lorentzian core — the 1/d falloff IS the glow, so it stays. But its tail
    // never reaches zero, and four copies plus a reflection stack that residue
    // into a visible fog far from the wave. A wide gaussian window trims only the
    // far end: at d=0.2 it costs nothing, by d=1.2 it has cleared the haze.
    float line = inten / (sqrt(d * d + soft * soft) + thick);
    line *= exp(-d * d);

    // Fill between the main line and this copy, so the ribbon reads as a lit body
    // rather than separate wires. INSIDE the pair this is flat; outside it has to
    // die fast, so the falloff is exponential rather than 1/d.
    //
    // 1/d is unbounded: at a full unit away it is still ~10% of peak, and with
    // every copy contributing that, the background silts up into a soapy haze.
    // An exponential keeps the body and kills the tail — 29% one notch out,
    // effectively nothing by 0.4.
    float lo = min(yMain, yL), hi = max(yMain, yL);
    float dB = max(0.0, max(p.y - hi, lo - p.y));
    // (scaled by inten, like the line, so loudness still drives the body)
    float band = 4.9 * inten * exp(-dB / (0.08 * soften));

    num += hue * (line + band);
  }
  // Divide by a SCALAR, not per-channel. The original divides by the summed hue
  // vector, which forces anywhere the four samples overlap to neutral — correct
  // for a full spectrum (white core, coloured fringes), but fatal for a chosen
  // palette, because the overlap is most of the ribbon and it all goes grey.
  // A scalar divide keeps the palette's own colour everywhere and lets the
  // dispersion read as a shift WITHIN that family.
  float denS = (den.r + den.g + den.b) / 3.0;
  vec3 col = num / max(denS, 1e-5);

  // The main line again on top, uncoloured — keeps a bright neutral core so the
  // ribbon does not turn into pure rainbow mush at high spread.
  float dM = abs(p.y - yMain);
  col += 0.42 * inten / (sqrt(dM * dM + soft * soft) + thick);

  return col;
}

// Cheap value noise, for the film grain.
float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main(){
  vec2 R = uRes;
  float aspect = R.x / R.y;
  // centred coords, x scaled by aspect so the wave keeps its shape at any width
  vec2 p = (gl_FragCoord.xy + 0.5) * 2.0 / R - 1.0;
  p.x *= aspect;
  float yScreen = p.y;
  p /= 0.62;                     // zoom: how much of the wave fills the card

  float t = uTime;

  // ── awake vs resting ──────────────────────────────────────────────────────
  // uWake is 0 when nothing is driving the wave and 1 when it is listening. At
  // rest the ribbon nearly flattens and just breathes; waking makes it bloom.
  // Without this there is no visual difference between waiting and listening, and
  // the moment you turn the mic on lands on nothing.
  float wake = clamp(uWake, 0.0, 1.0);
  float rest = 1.0 - wake;

  // ── the wave ──────────────────────────────────────────────────────────────
  // Amplitude answers the low band (the body of a voice), the aberration spread
  // answers the highs (sibilance splits the colours further). At rest both fall
  // back to a small idle value so the line is calm but never dead.
  float idleBreath = 0.030 + 0.016 * sin(t * 0.9) * sin(t * 0.41 + 1.0);
  float amp    = mix(idleBreath, 0.20 + 0.34 * uLow, wake) * uPresence;
  // Dispersion rides the LAGGED wake, so the colours separate a beat after the
  // wave swings. Amplitude and spread answering the same value on the same frame
  // made the shape and its rainbow move as one object; splitting them is what
  // gives the ribbon depth.
  float lag    = clamp(uWakeLag, 0.0, 1.0);
  float spread = mix(0.55, 2.2 + 1.6 * uHigh + 0.6 * uMid, lag) * uPresence;
  float harm   = mix(0.10, 0.34 + 0.22 * uHigh, wake);

  float xN    = p.x / max(aspect, 1.0);
  float drift = t * mix(0.9, 2.1, wake);   // rests slower, speeds up awake
  float ends  = exp(-pow(xN * 1.55, 2.0));

  // ── the ribbon, and its reflection ────────────────────────────────────────
  vec3 col = ribbon(p, aspect, amp, spread, drift, harm, uMid, uLevel, 1.0);

  // Mirror about a surface line just below the ribbon. Reusing the same pass with
  // a flipped y is what makes it read as the SAME light rather than a second
  // object: it ripples in step, disperses in step, and answers the voice in step.
  // Wider glow + lower amplitude + a fast fade with depth do the rest.
  const float SURFACE = 0.50;
  vec2 rp = vec2(p.x, 2.0 * SURFACE - p.y);
  vec3 refl = ribbon(rp, aspect, amp * 0.86, spread, drift, harm, uMid, uLevel, 2.1);
  // A reflection only exists BELOW the surface. Clamping depth at 0 left the fade
  // at a flat 1.0 for every pixel above the line, so the mirrored wave was drawn
  // at full strength across the whole upper half — the stray lines above the
  // ribbon. This gates it to the lower side and fades it with distance from the
  // surface, which is what a reflection actually does.
  float underSurface = smoothstep(0.0, 0.16, p.y - SURFACE);
  float depth = clamp((p.y - SURFACE) / 0.95, 0.0, 1.0);
  col += refl * 0.52 * underSurface * (1.0 - depth) * (1.0 - depth);

  // Gamma-ish shaping: pushes the dim tail down and the core up, which is what
  // makes it read as light rather than a smear.
  col = pow(max(col, 0.0), vec3(1.45));

  // ── containment ───────────────────────────────────────────────────────────
  // Fade toward the card edges, and taper the ends horizontally. The bottom fade
  // starts later than the top one so it does not clip the reflection off halfway
  // — the wave has nothing above it but a whole mirrored copy below.
  float above = smoothstep(1.0, 0.34, -yScreen);
  float below = smoothstep(1.06, 0.52, yScreen);
  float edge  = yScreen < 0.0 ? above : below;
  col *= edge * ends * uPresence;

  // ── composite ─────────────────────────────────────────────────────────────
  // The original renders on black, where the wave IS the light and you just show
  // it directly. On white paper that inverts: adding light to a page that is
  // already at 1.0 blows straight out and the wave vanishes. So on light the glow
  // composites SUBTRACTIVELY — as pigment density on paper. The intensity says how
  // much light the ribbon takes away, and its hue says which wavelengths survive,
  // so a red-leaning part of the wave removes cyan and reads red. Same dispersion,
  // legible on white.
  vec3 outc;
  if (uDark > 0.5) {
    outc = col;
  } else {
    float dens = clamp(max(max(col.r, col.g), col.b) * 1.9, 0.0, 1.0);
    // normalised colour direction — which channel this part of the wave favours
    vec3 hue = col / max(max(max(col.r, col.g), col.b), 1e-6);
    // 0.55 keeps some ink in the favoured channel too, so the ribbon stays a
    // colour rather than a fully saturated primary.
    outc = uPaper * (1.0 - dens * (1.0 - hue * 0.55));
    outc = clamp(outc, 0.0, 1.0);
  }

  // ── grain ─────────────────────────────────────────────────────────────────
  // Dense film grain, soft-light blended. Takes the digital edge off these very
  // wide gradients, which otherwise look plasticky on a light page.
  float g = hash21(gl_FragCoord.xy * 0.75 + fract(uTime) * 91.7);
  // soft light: darkens below 0.5, lightens above, so it textures without
  // shifting the overall value of the paper.
  vec3 sl = outc * (1.0 - 2.0 * (g - 0.5) * outc) + (2.0 * (g - 0.5)) * sqrt(max(outc, 0.0));
  outc = mix(outc, clamp(sl, 0.0, 1.0), 0.055);

  // dither — these are wide, very smooth gradients and 8-bit banding shows badly
  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  outc += (n - 0.5) / 255.0;

  outColor = vec4(outc, 1.0);
}`,r=[{speak:2.6,pause:1.5,force:.85},{speak:1.3,pause:.9,force:.55},{speak:3.9,pause:2.1,force:1},{speak:1.8,pause:1.2,force:.7},{speak:3.1,pause:2.6,force:.9},{speak:1.1,pause:1.7,force:.45}];function n(e,t,a,i,s){return e+(t-e)*Math.min(1,a*(t>e?i:s))}class o{bands={low:0,mid:0,high:0,level:0};clock=0;phraseIdx=0;phraseT=0;phraseEnv=0;get envelope(){return this.phraseEnv}phrase(e){this.phraseT+=e;let t=r[this.phraseIdx%r.length],a=t.speak+t.pause;this.phraseT>=a&&(this.phraseT-=a,this.phraseIdx=(this.phraseIdx+1)%r.length);let i=r[this.phraseIdx%r.length],s=this.phraseT/i.speak;return this.phraseEnv=s>=1?0:function(e){if(e<=0||e>=1)return 0;let t=Math.min(1,e/.18),a=Math.min(1,(1-e)/.55);return t*t*(3-2*t)*(a*a*(3-2*a))}(s)*i.force,this.phraseEnv}ctx=null;analyser=null;stream=null;freq=null;binHz=0;get live(){return!!this.analyser}async enableMic(){if(this.analyser)return!0;if(!navigator.mediaDevices?.getUserMedia)return!1;try{let e=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:!0,noiseSuppression:!0,autoGainControl:!0}}),t=window.AudioContext??globalThis.webkitAudioContext;if(!t)return e.getTracks().forEach(e=>e.stop()),!1;let a=new t;"suspended"===a.state&&await a.resume();let i=a.createAnalyser();return i.fftSize=1024,i.smoothingTimeConstant=.86,a.createMediaStreamSource(e).connect(i),this.ctx=a,this.stream=e,this.analyser=i,this.freq=new Uint8Array(i.frequencyBinCount),this.binHz=a.sampleRate/i.fftSize,!0}catch{return!1}}disableMic(){this.stream?.getTracks().forEach(e=>e.stop()),this.ctx?.close().catch(()=>{}),this.stream=null,this.ctx=null,this.analyser=null,this.freq=null}bin(e,t){let a=this.freq;if(!a||!this.binHz)return 0;let i=Math.max(0,Math.floor(e/this.binHz)),s=Math.min(a.length,Math.ceil(t/this.binHz));if(s<=i)return 0;let r=0;for(let e=i;e<s;e++)r+=a[e];return r/(s-i)/255}read(e){this.clock+=e;let t=this.bands;if(this.analyser&&this.freq){this.analyser.getByteFrequencyData(this.freq);let a=this.bin(60,320),i=this.bin(320,1600),s=this.bin(1600,6e3),r=e=>{let t=2.3*e;return t/(1+.55*t)};return t.low=n(t.low,r(a),e,9,3.5),t.mid=n(t.mid,r(i),e,10,4),t.high=n(t.high,r(s),e,11,4.5),t.level=n(t.level,r((a+i+s)*.65),e,8,3),t}let a=this.clock,i=this.phrase(e),s=Math.pow(i,.85),r=Math.pow(i,1.35),o=(.45+.45*Math.sin(.8*a)*Math.sin(.37*a+1))*i,l=(.4+.4*Math.sin(1.7*a+2)*Math.sin(.53*a))*s,h=(.3+.3*Math.sin(2.9*a+4)*Math.sin(.71*a+2))*r;return t.low=n(t.low,Math.max(0,o),e,10,6),t.mid=n(t.mid,Math.max(0,l),e,12,7),t.high=n(t.high,Math.max(0,h),e,14,8),t.level=n(t.level,Math.max(0,(o+l+h)/2.4),e,10,5),t}destroy(){this.disableMic()}}class l{host;canvas;gl=null;prog=null;u={};signal=new o;raf=0;last=0;running=!1;dpr=1;ro=null;disposed=!1;presence=0;presenceTarget=1;wake=0;wakeLag=0;constructor(e){this.host=e,this.canvas=document.createElement("canvas"),this.canvas.style.cssText="display:block;width:100%;height:100%",e.appendChild(this.canvas);const t=this.canvas.getContext("webgl2",{antialias:!1,alpha:!1,powerPreference:"low-power"});if(!t)return;this.gl=t;const a=this.build(t);if(!a)return;for(const e of(this.prog=a,t.useProgram(a),["uRes","uTime","uLow","uMid","uHigh","uLevel","uPresence","uWake","uWakeLag","uPaper","uDark"]))this.u[e]=t.getUniformLocation(a,e);this.pushPalette(),this.resize(),this.ro=new ResizeObserver(()=>this.resize()),this.ro.observe(e)}get ok(){return!!this.gl&&!!this.prog}build(e){let t=(t,a)=>{let i=e.createShader(t);return(e.shaderSource(i,a),e.compileShader(i),e.getShaderParameter(i,e.COMPILE_STATUS))?i:(e.deleteShader(i),null)},a=t(e.VERTEX_SHADER,i),r=t(e.FRAGMENT_SHADER,s);if(!a||!r)return null;let n=e.createProgram();return(e.attachShader(n,a),e.attachShader(n,r),e.linkProgram(n),e.deleteShader(a),e.deleteShader(r),e.getProgramParameter(n,e.LINK_STATUS))?n:(e.deleteProgram(n),null)}pushPalette(){let e=this.gl;if(!e)return;let t=function(e,t,a){let i=getComputedStyle(e).getPropertyValue(t).trim();if(!i)return a;let s=i.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(s){let e=s[1],t=parseInt(3===e.length?e.split("").map(e=>e+e).join(""):e,16);return[(t>>16&255)/255,(t>>8&255)/255,(255&t)/255]}let r=i.match(/rgba?\(([^)]+)\)/i);if(r){let e=r[1].split(/[,\s/]+/).filter(Boolean).map(Number);if(e.length>=3&&e.every(e=>!Number.isNaN(e)))return[e[0]/255,e[1]/255,e[2]/255]}return a}(this.host,"--bg-surface",[1,1,1]);e.uniform3fv(this.u.uPaper,t),e.uniform1f(this.u.uDark,0)}refreshPalette(){this.gl&&this.prog&&(this.gl.useProgram(this.prog),this.pushPalette())}resize(){let e=this.gl;if(!e||this.disposed)return;let t=this.host.clientWidth,a=this.host.clientHeight;if(!t||!a)return;this.dpr=Math.min(window.devicePixelRatio||1,2);let i=Math.round(t*this.dpr),s=Math.round(a*this.dpr);(this.canvas.width!==i||this.canvas.height!==s)&&(this.canvas.width=i,this.canvas.height=s),e.viewport(0,0,i,s),this.running||this.draw(0)}async enableMic(){return this.signal.enableMic()}disableMic(){this.signal.disableMic()}get micLive(){return this.signal.live}draw(e){let t=this.gl;if(!t||!this.prog)return;let a=this.signal.read(e);this.presence+=(this.presenceTarget-this.presence)*Math.min(1,3*e);let i=this.signal.live?Math.min(1,1.35*a.level):.12+.88*this.signal.envelope,s=i>this.wake?4.5:1.4;this.wake+=(i-this.wake)*Math.min(1,e*s),this.wakeLag+=(this.wake-this.wakeLag)*Math.min(1,8*e),t.useProgram(this.prog),t.uniform2f(this.u.uRes,this.canvas.width,this.canvas.height),t.uniform1f(this.u.uTime,performance.now()/1e3),t.uniform1f(this.u.uLow,a.low),t.uniform1f(this.u.uMid,a.mid),t.uniform1f(this.u.uHigh,a.high),t.uniform1f(this.u.uLevel,a.level),t.uniform1f(this.u.uPresence,this.presence),t.uniform1f(this.u.uWake,this.wake),t.uniform1f(this.u.uWakeLag,this.wakeLag),t.drawArrays(t.TRIANGLES,0,3)}renderStill(){this.presence=1,this.wake=.82,this.wakeLag=.82;for(let e=0;e<60;e++)this.signal.read(1/60);this.draw(0)}start(){if(this.running||!this.ok||this.disposed)return;this.running=!0,this.last=performance.now();let e=t=>{if(!this.running)return;let a=Math.min((t-this.last)/1e3,1/30);this.last=t,this.draw(a),this.raf=requestAnimationFrame(e)};this.raf=requestAnimationFrame(e)}stop(){this.running=!1,this.raf&&cancelAnimationFrame(this.raf),this.raf=0}destroy(){this.disposed=!0,this.stop(),this.ro?.disconnect(),this.ro=null,this.signal.destroy();let e=this.gl;e&&(this.prog&&e.deleteProgram(this.prog),e.getExtension("WEBGL_lose_context")?.loseContext()),this.prog=null,this.gl=null,this.canvas.remove()}}var h=e.i(20268),d=e.i(37878);e.s(["SiriWaveCard",0,function({bare:e=!1}={}){let i=(0,a.useRef)(null),s=(0,a.useRef)(null),[r,n]=(0,a.useState)("off"),[o,c]=(0,a.useState)(!1);(0,a.useEffect)(()=>{let e=i.current;if(!e)return;let t=window.matchMedia("(prefers-reduced-motion: reduce)").matches,a=null,r=0,n=!1,o=!1,d=!1,u=!1,f=()=>{a&&!t&&(!o||d||u?a.stop():a.start())},p=new IntersectionObserver(h=>{(o=h.some(e=>e.isIntersecting))&&!n&&(n||(n=!0,r=requestAnimationFrame(()=>{!i.current||(s.current=a=new l(e),a.ok&&(c(!0),t?a.renderStill():f()))}))),n&&f()},{rootMargin:"200px"});p.observe(e);let m=()=>{d=document.hidden,f()};document.addEventListener("visibilitychange",m);let g=(0,h.onTransitionChange)(e=>{u=e,f()});return()=>{cancelAnimationFrame(r),p.disconnect(),document.removeEventListener("visibilitychange",m),g(),a?.destroy(),s.current=null}},[]);let u=(0,a.useCallback)(async()=>{let e=s.current;if(e){if((0,d.hapticTap)(),e.micLive){e.disableMic(),n("off");return}n("asking"),n(await e.enableMic()?"on":"denied")}},[]),f="on"===r?"Stop listening":"asking"===r?"Asking for the microphone":"denied"===r?"Microphone unavailable":"Use my voice";return(0,t.jsx)("div",{ref:i,"aria-label":"The Siri glow: a ribbon of light that ripples and splits into colour at its bends",className:"group relative aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[var(--bg-surface)]",children:o&&(0,t.jsx)("div",{className:`absolute bottom-4 left-1/2 z-10 -translate-x-1/2 transition-opacity duration-200 ease-[var(--ease-out)] focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100 ${"on"===r||"asking"===r?"opacity-100":"opacity-0"}`,children:(0,t.jsx)("button",{type:"button",onClick:u,disabled:"asking"===r,"aria-pressed":"on"===r,"aria-label":f,title:f,className:"flex items-center justify-center rounded-md p-1.5 text-[var(--text-secondary)] transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] active:scale-[0.96] disabled:opacity-50",children:"on"===r?(0,t.jsx)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"currentColor","aria-hidden":!0,children:(0,t.jsx)("rect",{x:"7",y:"7",width:"10",height:"10",rx:"2.5"})}):(0,t.jsxs)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.7",strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":!0,children:[(0,t.jsx)("rect",{x:"9",y:"2.5",width:"6",height:"11",rx:"3"}),(0,t.jsx)("path",{d:"M5.5 11a6.5 6.5 0 0 0 13 0"}),(0,t.jsx)("path",{d:"M12 17.5V21"})]})})})})}],4402)},63558,e=>{e.n(e.i(4402))}]);