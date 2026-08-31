(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,29902,e=>{"use strict";var t=e.i(43476),i=e.i(71645);let s=[{line:"make it obvious",bg:"#0b3d3a",fg:"#f7c948"},{line:"then make it fast",bg:"#ff4d4d",fg:"#fff0e6"},{line:"sweat the details",bg:"#1b1440",fg:"#a78bfa"},{line:"ship it anyway",bg:"#f2e9d8",fg:"#c2410c"},{line:"keep it honest",bg:"#0891b2",fg:"#fef9c3"},{line:"cut what is dull",bg:"#18181b",fg:"#f472b6"}],a=`
  attribute vec2 aPosition; // -1..1 fullscreen-ish quad
  attribute vec2 aUV;
  varying vec2 vUV;
  void main(){
    vUV = aUV;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`,r=`
  precision highp float;
  uniform sampler2D uTex;
  uniform vec2  uTexel;    // 1/textureSize, for blur tap spacing
  uniform float uProgress; // 0 = hidden, 1 = fully revealed
  uniform float uMaxBlur;  // starting blur radius in texels
  uniform vec3  uEdge;     // color of the glowing band that travels with the reveal front
  uniform float uTime;     // seconds, for the slowly-drifting dissolve field
  uniform float uAspect;   // card w/h, so the radial bias is round not oval
  uniform float uSeed;     // per-panel offset into the noise field → each cycle differs
  varying vec2 vUV;

  // cheap value noise for the dissolve mask
  float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    float a = hash(i), b = hash(i+vec2(1,0)), c = hash(i+vec2(0,1)), d = hash(i+vec2(1,1));
    return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
  }

  // Strong gaussian-ish blur: two rings of taps (inner + outer) plus center, at the
  // given radius in texels. A wide radius here genuinely softens the glyphs so the
  // "materialize into focus" reads clearly (a single 9-tap at a small radius did not).
  vec4 blurTex(vec2 uv, float radius){
    if (radius < 0.35) return texture2D(uTex, uv);
    vec2 r1 = uTexel * radius;         // inner ring
    vec2 r2 = uTexel * radius * 2.0;   // outer ring (wider spread = more visible blur)
    vec4 sum = texture2D(uTex, uv) * 1.0;
    float wsum = 1.0;
    // 8 directions, two radii each = 16 taps + center
    for (int i = 0; i < 8; i++){
      float a = float(i) * 0.785398; // 45\xb0 steps
      vec2 dir = vec2(cos(a), sin(a));
      sum += texture2D(uTex, uv + dir * r1) * 0.75; wsum += 0.75;
      sum += texture2D(uTex, uv + dir * r2) * 0.5;  wsum += 0.5;
    }
    return sum / wsum;
  }

  // fractal (multi-octave) noise — a turbulent field for an organic, wispy dissolve
  float fbm(vec2 p){
    float v = 0.0, amp = 0.5;
    for (int i = 0; i < 4; i++){
      v += amp * noise(p);
      p *= 2.03;      // lacunarity
      amp *= 0.5;     // gain
    }
    return v;
  }

  void main(){
    // Fully revealed → cheap path (just sample the sharp texture).
    if (uProgress >= 0.999) { gl_FragColor = texture2D(uTex, vUV); return; }

    // Overdrive so the reveal fully completes a hair before progress hits 1.
    float p = uProgress * 1.3;

    // Dissolve mask (A): NO left→right column wipe — a purely 2D fractal field, so the
    // front varies WITHIN each letter (not a whole glyph-column flipping at once). A
    // domain-warp gives wispy tendrils, a soft radial bias makes it bloom from center
    // outward, and a slow uTime drift makes the emerging front shimmer as it advances.
    // uSeed shifts the whole field per panel (and nudges the radial center) so no two
    // cycles dissolve the same way — the tendrils and bloom differ every time.
    vec2 sd = vec2(uSeed * 1.7, uSeed * -1.3);
    vec2 rc = (vUV - 0.5) * vec2(uAspect, 1.0);        // aspect-correct, centered
    rc += vec2(sin(uSeed * 2.3), cos(uSeed * 1.9)) * 0.12; // wander the bloom center
    float radial = length(rc) * 0.9;                    // 0 center → ~0.6 corners
    vec2 warp = vec2(fbm(vUV * 3.2 + sd + uTime * 0.05 + 11.0),
                     fbm(vUV * 3.2 - sd - uTime * 0.04 - 7.0)) - 0.5;
    float turb = fbm(vUV * 5.5 + warp * 1.7 + sd + uTime * 0.06);
    float mask = mix(radial, turb, 0.7);                // 0..1: per-pixel front position

    // reveal alpha (B): a WIDE, symmetric feathered band — no hard discard. Pixels ease
    // in over a broad range so the leading contour never winks on. Only skip pixels that
    // are still fully ahead of the front.
    float reveal = smoothstep(p + 0.34, p - 0.34, mask);
    if (reveal <= 0.0) discard;

    // Blur is LOCALIZED TO THE FRONT: max at the leading edge, crisp behind it — so
    // each part is soft as it emerges then settles sharp. (Not an all-over blur.)
    float blurAmt = smoothstep(p - 0.5, p + 0.34, mask); // 1 at/ahead of front, 0 behind

    // Front motion (C): un-resolved regions are sampled nudged slightly toward center +
    // lifted a touch, then scaled fractionally larger — so emerging letters drift into
    // place instead of fading in stationary. Decays to zero as each region resolves.
    vec2 drift = (-rc * 0.010 + vec2(0.0, 0.006)) * blurAmt; // toward center + up
    float grow = 1.0 + 0.03 * blurAmt;                        // subtle scale-up
    vec2 suv = (vUV - 0.5) / grow + 0.5 + drift;

    float radius = blurAmt * uMaxBlur;                  // in texels
    vec4 tex = blurTex(suv, radius);

    // Glow band: a SOFT, WIDE front that rides the advancing reveal edge (peaks where
    // mask ≈ p). Wider band + gentler falloff = a smooth wash, not a hard flare. Fades
    // out as the line finishes (progress 0.8→1).
    float fw = 0.30; // wider = smoother, more diffuse
    float flare = smoothstep(p - fw, p, mask) * smoothstep(p + fw, p, mask);
    flare *= 1.0 - smoothstep(0.8, 1.0, uProgress);

    // A HALO: sample the glyph alpha with a wide blur so the glow spills BEYOND the
    // letter edges (a real outline, visible in the gaps), not just on the ink.
    vec4 wide = blurTex(suv, uMaxBlur * 1.3);
    float halo = wide.a;

    vec3 rgb = tex.rgb;
    // ADD a WEAK luminous edge that rides the front: a gentle glow (uEdge only slightly
    // lifted toward white) added softly on the ink AND the surrounding halo, so it reads
    // as a subtle outline in the gaps — present but never hot.
    vec3 glow = mix(uEdge, vec3(1.0), 0.3); // only a little toward white = soft, on-color
    rgb += glow * flare * (tex.a * 0.6 + halo * 0.5); // weak
    float alpha = max(tex.a * reveal, halo * flare * 0.5);

    gl_FragColor = vec4(rgb, alpha);
  }
`;class o{canvas;gl;prog;quad;loc={};aPos=0;aUV=0;tex=null;texW=1;texH=1;ok=!1;constructor(){this.canvas=document.createElement("canvas"),Object.assign(this.canvas.style,{position:"absolute",inset:"0",width:"100%",height:"100%",display:"block"});const e=this.canvas.getContext("webgl",{alpha:!0,premultipliedAlpha:!1});if(!e){this.gl=null,this.prog=null,this.quad=null;return}for(const t of(this.gl=e,this.prog=this.build(a,r),this.aPos=e.getAttribLocation(this.prog,"aPosition"),this.aUV=e.getAttribLocation(this.prog,"aUV"),["uTex","uTexel","uProgress","uMaxBlur","uEdge","uTime","uAspect","uSeed"]))this.loc[t]=e.getUniformLocation(this.prog,t);const t=new Float32Array([-1,-1,0,1,1,-1,1,1,-1,1,0,0,1,1,1,0]);this.quad=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,this.quad),e.bufferData(e.ARRAY_BUFFER,t,e.STATIC_DRAW),e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA),this.ok=!0}get available(){return this.ok}build(e,t){let i=this.gl,s=(e,t)=>{let s=i.createShader(e);if(i.shaderSource(s,t),i.compileShader(s),!i.getShaderParameter(s,i.COMPILE_STATUS))throw Error(i.getShaderInfoLog(s)||"shader compile failed");return s},a=i.createProgram();if(i.attachShader(a,s(i.VERTEX_SHADER,e)),i.attachShader(a,s(i.FRAGMENT_SHADER,t)),i.linkProgram(a),!i.getProgramParameter(a,i.LINK_STATUS))throw Error(i.getProgramInfoLog(a)||"program link failed");return a}setTexture(e){if(!this.ok)return;let t=this.gl;this.tex&&t.deleteTexture(this.tex);let i=t.createTexture();t.bindTexture(t.TEXTURE_2D,i),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,e),this.tex=i,this.texW=e.width,this.texH=e.height}resize(e,t,i){this.canvas.width=Math.max(1,Math.round(e*i)),this.canvas.height=Math.max(1,Math.round(t*i)),this.ok&&this.gl.viewport(0,0,this.canvas.width,this.canvas.height)}draw(e,t,i,s,a,r){if(!this.ok||!this.tex)return;let o=this.gl;o.clearColor(0,0,0,0),o.clear(o.COLOR_BUFFER_BIT),o.useProgram(this.prog),o.bindBuffer(o.ARRAY_BUFFER,this.quad),o.enableVertexAttribArray(this.aPos),o.vertexAttribPointer(this.aPos,2,o.FLOAT,!1,16,0),o.enableVertexAttribArray(this.aUV),o.vertexAttribPointer(this.aUV,2,o.FLOAT,!1,16,8),o.activeTexture(o.TEXTURE0),o.bindTexture(o.TEXTURE_2D,this.tex),o.uniform1i(this.loc.uTex,0),o.uniform2f(this.loc.uTexel,1/this.texW,1/this.texH),o.uniform1f(this.loc.uProgress,e),o.uniform1f(this.loc.uMaxBlur,t),o.uniform3f(this.loc.uEdge,i[0],i[1],i[2]),o.uniform1f(this.loc.uTime,s),o.uniform1f(this.loc.uAspect,a),o.uniform1f(this.loc.uSeed,r),o.drawArrays(o.TRIANGLE_STRIP,0,4)}destroy(){if(!this.ok)return;let e=this.gl;this.tex&&e.deleteTexture(this.tex),e.getExtension("WEBGL_lose_context")?.loseContext()}}function l(e){let t=document.createElement("span");t.style.cssText="position:absolute;visibility:hidden",t.style.fontFamily=e,t.textContent="Ag",document.body.appendChild(t);let i=getComputedStyle(t).fontFamily||"serif";return document.body.removeChild(t),i}class n{host;stage;gl=null;useGL=!1;fallback=null;fontFamily="serif";index=0;W=1;H=1;dpr=1;raf=0;running=!1;disposed=!1;now=0;last=0;clock=0;phase="in";phaseStart=0;progress=0;vel=0;target=1;edge=[1,1,1];seed=100*Math.random();ro;constructor(e){this.host=e,this.dpr=Math.min(window.devicePixelRatio||1,2),this.measure();const t=document.createElement("div");Object.assign(t.style,{position:"absolute",inset:"0",background:s[0].bg,transition:"background-color 320ms ease",overflow:"hidden",fontFamily:"var(--font-neue-corp), system-ui, sans-serif"}),e.appendChild(t),this.stage=t,this.fontFamily=l("var(--font-neue-corp), system-ui, sans-serif");const i=new o;i.available&&(this.gl=i,this.useGL=!0,i.resize(this.W,this.H,this.dpr),t.appendChild(i.canvas)),this.ro=new ResizeObserver(()=>this.onResize()),this.ro.observe(e)}measure(){this.W=this.host.clientWidth||1,this.H=this.host.clientHeight||1}onResize(){this.measure(),this.W<2||this.H<2||(this.gl?.resize(this.W,this.H,this.dpr),this.mountPanel(this.index))}refreshFont(){this.fontFamily=l("var(--font-neue-corp), system-ui, sans-serif"),this.mountPanel(this.index)}mountPanel(e){let t,i,a=s[e];if(this.stage.style.background=a.bg,this.edge=(3===(t=a.fg.replace("#","")).length&&(t=t.split("").map(e=>e+e).join("")),[((i=parseInt(t,16))>>16&255)/255,(i>>8&255)/255,(255&i)/255]),this.useGL&&this.gl){let e=function(e){let t=e.dpr??Math.min(window.devicePixelRatio||1,2),i=Math.max(1,Math.round(e.cardW)),s=Math.max(1,Math.round(e.cardH)),a=document.createElement("canvas");a.width=Math.round(i*t),a.height=Math.round(s*t);let r=a.getContext("2d");r.scale(t,t),r.fillStyle=e.fill,r.textAlign="center",r.textBaseline="middle";let o=.86*i,l=Math.min(58,.1*i);for(let t=0;t<24&&(r.font=`500 ${l}px ${e.font}`,!(r.measureText(e.line).width<=o)&&!(l<=16));t++)l-=2;return r.fillText(e.line,i/2,s/2),{canvas:a,cssW:i,cssH:s}}({line:a.line,font:this.fontFamily,fill:a.fg,cardW:this.W,cardH:this.H,dpr:this.dpr});this.gl.setTexture(e.canvas)}else this.mountFallback(a.line,a.fg)}mountFallback(e,t){if(!this.fallback){let e=document.createElement("div");Object.assign(e.style,{position:"absolute",inset:"0",display:"flex",alignItems:"center",justifyContent:"center",padding:"8% 10%",fontStyle:"italic",fontWeight:"500",fontSize:"clamp(1.9rem, 7vw, 4rem)",textAlign:"center",transition:"opacity 300ms ease, filter 300ms ease"}),this.stage.appendChild(e),this.fallback=e}this.fallback.textContent=e,this.fallback.style.color=t}start(){this.running||this.disposed||(this.running=!0,this.mountPanel(this.index),this.phase="in",this.phaseStart=performance.now(),this.last=this.phaseStart,this.progress=0,this.vel=0,this.target=1,this.raf=requestAnimationFrame(this.loop))}stop(){this.running=!1,this.raf&&cancelAnimationFrame(this.raf),this.raf=0}loop=()=>{var e,t,i;let a,r;if(!this.running)return;this.now=performance.now();let o=Math.min(.05,Math.max(.001,(this.now-this.last)/1e3));this.last=this.now,this.clock+=o;let l=this.target>.5?42:60;[this.progress,this.vel]=(e=this.progress,t=this.vel,i=this.target,a=2*Math.sqrt(l)*1,r=t+(-l*(e-i)-a*t)*o,[e+r*o,r]),"in"===this.phase?this.progress>=.992&&(this.phase="hold",this.phaseStart=this.now):"hold"===this.phase?this.now-this.phaseStart>=900&&(this.phase="out",this.phaseStart=this.now,this.target=0):this.progress<=.02&&this.now-this.phaseStart>=40&&(this.index=(this.index+1)%s.length,this.seed=100*Math.random(),this.mountPanel(this.index),this.phase="in",this.phaseStart=this.now,this.progress=0,this.vel=0,this.target=1);let n=Math.max(0,Math.min(1,this.progress));this.useGL&&this.gl?this.gl.draw(n,18,this.edge,this.clock,this.W/Math.max(1,this.H),this.seed):this.fallback&&(this.fallback.style.opacity=String(n),this.fallback.style.filter=`blur(${(1-n)*10}px)`),this.raf=requestAnimationFrame(this.loop)};renderStill(){this.measure(),this.gl?.resize(this.W,this.H,this.dpr),this.mountPanel(this.index),this.progress=1,this.useGL&&this.gl?this.gl.draw(1,0,this.edge,0,this.W/Math.max(1,this.H),this.seed):this.fallback&&(this.fallback.style.opacity="1",this.fallback.style.filter="none")}destroy(){this.disposed=!0,this.stop(),this.ro?.disconnect(),this.gl?.destroy(),this.stage.parentNode?.removeChild(this.stage)}}var h=e.i(20268);e.s(["BlurRevealCard",0,function({bare:e=!1}={}){let a=(0,i.useRef)(null);return(0,i.useEffect)(()=>{let e=a.current;if(!e)return;let t=window.matchMedia("(prefers-reduced-motion: reduce)").matches,i=null,s=!1,r=!1,o=!1,l=()=>{i&&!t&&(!s||r||o?i.stop():i.start())},d=requestAnimationFrame(()=>{if(a.current&&(i=new n(e),t?i.renderStill():l(),document.fonts?.load)){let e=document.createElement("span");e.style.cssText="position:absolute;visibility:hidden",e.style.fontFamily="var(--font-neue-corp)",e.textContent="Ag",document.body.appendChild(e);let t=getComputedStyle(e).fontFamily.split(",")[0].replace(/["']/g,"").trim();document.body.removeChild(e),document.fonts.load(`500 1em "${t}"`).then(()=>i?.refreshFont(),()=>{})}}),u=new IntersectionObserver(e=>{s=e[0]?.isIntersecting??!1,l()},{threshold:.2});u.observe(e);let c=()=>{r=document.hidden,l()};document.addEventListener("visibilitychange",c);let f=(0,h.onTransitionChange)(e=>{o=e,l()});return()=>{cancelAnimationFrame(d),u.disconnect(),document.removeEventListener("visibilitychange",c),f(),i?.destroy()}},[]),(0,t.jsx)("div",{ref:a,"aria-label":`Cycling text reveal: ${s.map(e=>e.line).join(", ")}`,className:"relative mx-auto aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)]"})}],29902)},89001,e=>{e.n(e.i(29902))}]);