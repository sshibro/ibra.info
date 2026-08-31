(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,30302,e=>{"use strict";var t=e.i(43476),r=e.i(71645);let a=`
  attribute vec2 aPosition;
  attribute vec2 aUV;
  varying vec2 vUV;
  void main(){
    vUV = aUV;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`,o=`
  precision highp float;
  uniform sampler2D uTex;
  uniform vec2  uTexel;    // 1/textureSize, blur tap spacing
  uniform float uProgress; // 0 hidden, 1 revealed
  uniform float uMaxBlur;  // starting blur radius (texels)
  uniform vec3  uEdge;     // glow-band color riding the reveal front
  uniform float uTime;     // seconds, drifts the dissolve field
  uniform float uAspect;   // card w/h so the bias stays proportional
  uniform float uSeed;     // per-cycle noise offset
  uniform vec2  uParTL;    // parallax offset for the TOP-LEFT corner region
  uniform vec2  uParBR;    // parallax offset for the BOTTOM-RIGHT corner region
  uniform vec2  uCursor;   // cursor in UV space (far off-screen when no pointer)
  uniform float uHover;    // 0..1 hover strength (eases in/out)
  uniform float uReverse;  // 0 = reveal sweeps ↘, 1 = clear sweeps ↖ (reverse exit)
  varying vec2 vUV;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    float a = hash(i), b = hash(i+vec2(1,0)), c = hash(i+vec2(0,1)), d = hash(i+vec2(1,1));
    return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
  }

  vec4 blurTex(vec2 uv, float radius){
    if (radius < 0.35) return texture2D(uTex, uv);
    vec2 r1 = uTexel * radius;
    vec2 r2 = uTexel * radius * 2.0;
    vec4 sum = texture2D(uTex, uv) * 1.0;
    float wsum = 1.0;
    for (int i = 0; i < 8; i++){
      float a = float(i) * 0.785398;
      vec2 dir = vec2(cos(a), sin(a));
      sum += texture2D(uTex, uv + dir * r1) * 0.75; wsum += 0.75;
      sum += texture2D(uTex, uv + dir * r2) * 0.5;  wsum += 0.5;
    }
    return sum / wsum;
  }

  float fbm(vec2 p){
    float v = 0.0, amp = 0.5;
    for (int i = 0; i < 4; i++){
      v += amp * noise(p);
      p *= 2.03;
      amp *= 0.5;
    }
    return v;
  }

  void main(){
    // PER-CORNER parallax: the top-left and bottom-right blocks lean INDEPENDENTLY. Blend
    // between the two offsets by the pixel's diagonal region (uv.x+uv.y: low = top-left,
    // high = bottom-right) with a soft midline so there's no seam across the plate.
    float region = smoothstep(0.35, 0.65, (vUV.x + vUV.y) * 0.5);
    vec2 par = mix(uParTL, uParBR, region);
    vec2 baseUV = vUV + par;

    if (uProgress >= 0.999) { gl_FragColor = texture2D(uTex, baseUV); return; }

    float p = uProgress * 1.3;

    vec2 sd = vec2(uSeed * 1.7, uSeed * -1.3);
    vec2 rc = (vUV - 0.5) * vec2(uAspect, 1.0);

    // (1) DIAGONAL DIRECTIONAL base, STAGED so the two corner blocks reveal ONE BY ONE:
    // the base is the top-left → bottom-right diagonal, but pushed to strong contrast so the
    // top-left region sits low (reveals first) and the bottom-right sits high (reveals after
    // the top has essentially finished). A per-cycle waver keeps the front organic.
    float diag = (vUV.x + vUV.y) * 0.5;                 // 0 top-left .. 1 bottom-right
    diag = smoothstep(0.18, 0.82, diag);               // steepen → separate the two corners
    // REVERSE EXIT: while clearing, flip the diagonal so the front sweeps bottom-right → top-
    // left (the top-left block, which arrived first, is the last to leave — a clean handoff).
    diag = mix(diag, 1.0 - diag, uReverse);
    diag += (fbm(vUV * 1.3 + sd) - 0.5) * 0.08;        // gently waver the front line

    // domain-warped fbm for wispy tendrils on the front
    vec2 warp = vec2(fbm(vUV * 3.2 + sd + uTime * 0.05 + 11.0),
                     fbm(vUV * 3.2 - sd - uTime * 0.04 - 7.0)) - 0.5;
    float turb = fbm(vUV * 5.5 + warp * 1.7 + sd + uTime * 0.06);

    // (3) INK STIPPLE: a fine high-frequency speckle mixed into the front, so the leading
    // edge breaks into grain (ink drying) rather than smooth fog.
    float stipple = noise(vUV * vec2(uAspect, 1.0) * 46.0 + sd * 3.0);

    // Lean HARD on the diagonal so the staging reads clearly; turb + stipple only texture the
    // front, they don't reorder which corner comes first.
    float mask = mix(diag, turb, 0.28);      // directional base dominates
    mask = mix(mask, stipple, 0.14);         // grainy front

    // (2) HOVER WIPES INTO FOCUS: near the cursor, locally push the mask below the front so
    // that region resolves sooner — moving the pointer wipes text clear under it.
    vec2 cur = (vUV - uCursor) * vec2(uAspect, 1.0);
    float near = 1.0 - smoothstep(0.0, 0.32, length(cur));
    mask -= near * uHover * 0.28;

    // Tighter feather band than the blur-reveal card so the staged front stays crisp and the
    // two corners don't bleed into each other — top-left resolves, then bottom-right.
    float reveal = smoothstep(p + 0.22, p - 0.22, mask);
    if (reveal <= 0.0) discard;

    float blurAmt = smoothstep(p - 0.34, p + 0.22, mask);

    // Front motion: unresolved regions drift toward center + up and scale a touch, decaying
    // to zero as they resolve — emerging letters settle into place, not fade in stationary.
    vec2 drift = (-rc * 0.010 + vec2(0.0, 0.006)) * blurAmt;
    float grow = 1.0 + 0.03 * blurAmt;
    vec2 suv = (baseUV - 0.5) / grow + 0.5 + drift;

    float radius = blurAmt * uMaxBlur;
    vec4 tex = blurTex(suv, radius);

    // The front band (peaks where mask ≈ p) — used for both the glow and the aberration.
    float fw = 0.30;
    float flare = smoothstep(p - fw, p, mask) * smoothstep(p + fw, p, mask);
    flare *= 1.0 - smoothstep(0.8, 1.0, uProgress);

    // (4) CHROMATIC EDGE: only where the front is passing, split R/G/B by a tiny offset so
    // the advancing edge shimmers with a hair of aberration; the settled body stays mono.
    float ab = flare * 2.0 * uTexel.x * uMaxBlur;
    if (ab > 0.0001) {
      tex.r = blurTex(suv + vec2(ab, 0.0), radius).r;
      tex.b = blurTex(suv - vec2(ab, 0.0), radius).b;
    }

    vec4 wide = blurTex(suv, uMaxBlur * 1.3);
    float halo = wide.a;

    vec3 rgb = tex.rgb;
    vec3 glow = mix(uEdge, vec3(1.0), 0.3);
    rgb += glow * flare * (tex.a * 0.6 + halo * 0.5);
    float alpha = max(tex.a * reveal, halo * flare * 0.5);

    gl_FragColor = vec4(rgb, alpha);
  }
`;class i{canvas;gl;prog;quad;loc={};aPos=0;aUV=0;tex=null;texW=1;texH=1;ok=!1;constructor(){this.canvas=document.createElement("canvas"),Object.assign(this.canvas.style,{position:"absolute",inset:"0",width:"100%",height:"100%",display:"block"});const e=this.canvas.getContext("webgl",{alpha:!0,premultipliedAlpha:!1});if(!e){this.gl=null,this.prog=null,this.quad=null;return}for(const t of(this.gl=e,this.prog=this.build(a,o),this.aPos=e.getAttribLocation(this.prog,"aPosition"),this.aUV=e.getAttribLocation(this.prog,"aUV"),["uTex","uTexel","uProgress","uMaxBlur","uEdge","uTime","uAspect","uSeed","uParTL","uParBR","uCursor","uHover","uReverse"]))this.loc[t]=e.getUniformLocation(this.prog,t);const t=new Float32Array([-1,-1,0,1,1,-1,1,1,-1,1,0,0,1,1,1,0]);this.quad=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,this.quad),e.bufferData(e.ARRAY_BUFFER,t,e.STATIC_DRAW),e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA),this.ok=!0}get available(){return this.ok}build(e,t){let r=this.gl,a=(e,t)=>{let a=r.createShader(e);if(r.shaderSource(a,t),r.compileShader(a),!r.getShaderParameter(a,r.COMPILE_STATUS))throw Error(r.getShaderInfoLog(a)||"shader compile failed");return a},o=r.createProgram();if(r.attachShader(o,a(r.VERTEX_SHADER,e)),r.attachShader(o,a(r.FRAGMENT_SHADER,t)),r.linkProgram(o),!r.getProgramParameter(o,r.LINK_STATUS))throw Error(r.getProgramInfoLog(o)||"program link failed");return o}setTexture(e){if(!this.ok)return;let t=this.gl;this.tex&&t.deleteTexture(this.tex);let r=t.createTexture();t.bindTexture(t.TEXTURE_2D,r),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,e),this.tex=r,this.texW=e.width,this.texH=e.height}resize(e,t,r){this.canvas.width=Math.max(1,Math.round(e*r)),this.canvas.height=Math.max(1,Math.round(t*r)),this.ok&&this.gl.viewport(0,0,this.canvas.width,this.canvas.height)}draw(e,t,r,a,o,i,s,n,l,h,u){if(!this.ok||!this.tex)return;let d=this.gl;d.clearColor(0,0,0,0),d.clear(d.COLOR_BUFFER_BIT),d.useProgram(this.prog),d.bindBuffer(d.ARRAY_BUFFER,this.quad),d.enableVertexAttribArray(this.aPos),d.vertexAttribPointer(this.aPos,2,d.FLOAT,!1,16,0),d.enableVertexAttribArray(this.aUV),d.vertexAttribPointer(this.aUV,2,d.FLOAT,!1,16,8),d.activeTexture(d.TEXTURE0),d.bindTexture(d.TEXTURE_2D,this.tex),d.uniform1i(this.loc.uTex,0),d.uniform2f(this.loc.uTexel,1/this.texW,1/this.texH),d.uniform1f(this.loc.uProgress,e),d.uniform1f(this.loc.uMaxBlur,t),d.uniform3f(this.loc.uEdge,r[0],r[1],r[2]),d.uniform1f(this.loc.uTime,a),d.uniform1f(this.loc.uAspect,o),d.uniform1f(this.loc.uSeed,i),d.uniform2f(this.loc.uParTL,s[0],s[1]),d.uniform2f(this.loc.uParBR,n[0],n[1]),d.uniform2f(this.loc.uCursor,l[0],l[1]),d.uniform1f(this.loc.uHover,h),d.uniform1f(this.loc.uReverse,u),d.drawArrays(d.TRIANGLE_STRIP,0,4)}destroy(){if(!this.ok)return;let e=this.gl;this.tex&&e.deleteTexture(this.tex),e.getExtension("WEBGL_lose_context")?.loseContext()}}var s=e.i(20268);let n=[{top:["The text fades in on its own,","one corner at a time."],bottom:["Then it clears the same way,","and quietly starts over."]},{top:["Type can move like weather,","rolling in from an edge."],bottom:["It gathers, holds for a beat,","then rolls back out again."]},{top:["Small things, done really well,","read as calm, not loud."],bottom:["Motion with a clear direction","always feels intentional."]}],l="#f2f1ec",h="data:image/svg+xml;utf8,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='140' height='140' filter='url(%23n)' opacity='0.5'/></svg>");function u(e){let t=document.createElement("span");t.style.cssText="position:absolute;visibility:hidden",t.style.fontFamily=e,t.textContent="Ag",document.body.appendChild(t);let r=getComputedStyle(t).fontFamily||"serif";return document.body.removeChild(t),r}e.s(["TextRevealCard",0,function({bare:e=!1}={}){let a=(0,r.useRef)(null);return(0,r.useEffect)(()=>{let e,t,r=a.current;if(!r)return;let o=window.matchMedia("(prefers-reduced-motion: reduce)").matches,h=r.clientWidth||1,d=r.clientHeight||1,c=Math.min(window.devicePixelRatio||1,2),f=u("var(--font-kyoto), Georgia, serif"),m=(3===(e=l.replace("#","")).length&&(e=e.split("").map(e=>e+e).join("")),[((t=parseInt(e,16))>>16&255)/255,(t>>8&255)/255,(255&t)/255]),g=new i,v=g.available;v&&(g.resize(h,d,c),r.appendChild(g.canvas));let p=0,x=1.7,b=()=>{if(!v)return;let e=n[p],t=function(e){let t=e.dpr??Math.min(window.devicePixelRatio||1,2),r=Math.max(1,Math.round(e.cardW)),a=Math.max(1,Math.round(e.cardH)),o=document.createElement("canvas");o.width=Math.round(r*t),o.height=Math.round(a*t);let i=o.getContext("2d");i.scale(t,t),i.fillStyle=e.fill,i.textBaseline="top";let s=Math.round(.035*r),n=.52*r,l=[...e.top,...e.bottom],h=Math.max(24,Math.min(40,.03*r));for(let t=0;t<24&&(i.font=`500 ${h}px ${e.font}`,!(Math.max(...l.map(e=>i.measureText(e).width))<=n)&&!(h<=15));t++)h-=1;let u=1.42*h;i.font=`500 ${h}px ${e.font}`,i.textAlign="left",e.top.forEach((e,t)=>{i.fillText(e,s,s+t*u)}),i.textAlign="right";let d=a-s-e.bottom.length*u;return e.bottom.forEach((e,t)=>{i.fillText(e,r-s,d+t*u)}),o}({top:e.top,bottom:e.bottom,font:f,fill:"#242320",cardW:h,cardH:d,dpr:c});g.setTexture(t)};b();let T=.5,w=.5,E=.5,y=.5,R=[-1,-1],A=0,P=0,U=e=>{let t=r.getBoundingClientRect(),a=(e.clientX-t.left)/t.width,o=(e.clientY-t.top)/t.height;T=a,w=o,R=[a,o],A=1},M=()=>{T=.5,w=.5,A=0};r.addEventListener("pointermove",U),r.addEventListener("pointerleave",M);let _="in",k=0,L=0,C=0,S=1,I=0,B=0,V=0,D=!1,F=0,O=()=>{var e,t,r;let a,o;if(!D)return;let i=performance.now(),s=Math.min(.05,Math.max(.001,(i-B)/1e3));B=i,I+=s;let l=S>.5?16:22;[L,C]=(e=L,t=C,r=S,a=2*Math.sqrt(l)*1.12,o=t+(-l*(e-r)-a*t)*s,[e+o*s,o]),"in"===_?L>=.95&&(_="hold",k=i):"hold"===_?i-k>=320&&(_="out",k=i,S=0):L<=.02&&i-k>=80&&(p=(p+1)%n.length,x=1.618*x%7+.3,b(),_="in",k=i,L=0,C=0,S=1);let u=1-Math.pow(9e-4,s);E+=(T-E)*u,y+=(w-y)*u,P+=(A-P)*(1-Math.pow(.002,s));let c=.006*P,f=[(E-.16)*c,(y-.18)*c],U=[(E-.84)*c,(y-.82)*c],M=Math.max(0,Math.min(1,L)),N=+("out"===_);if(v&&g.draw(M,16,m,I,h/Math.max(1,d),x,f,U,R,P,N),v){F+=(("hold"===_)-F)*(1-Math.pow(.02,s));let e=.5*Math.sin(.45*I)+.5,t=1+F*e*.0015,r=1+F*(e-.5)*.012;g.canvas.style.transform=`scale(${t.toFixed(4)})`,g.canvas.style.filter=`brightness(${r.toFixed(3)})`}V=requestAnimationFrame(O)},N=()=>{D=!1,V&&cancelAnimationFrame(V),V=0,B=0},H=!1,G=!1,X=!1,W=()=>{!o&&(!H||G||X?N():D||(D=!0,_="in",B=k=performance.now(),L=0,C=0,S=1,V=requestAnimationFrame(O)))},q=new IntersectionObserver(e=>{H=e[0]?.isIntersecting??!1,W()},{threshold:.15});q.observe(r);let z=()=>{G=document.hidden,W()};document.addEventListener("visibilitychange",z);let $=(0,s.onTransitionChange)(e=>{X=e,W()}),Y=0,j=new ResizeObserver(()=>{window.clearTimeout(Y),Y=window.setTimeout(()=>{h=r.clientWidth||1,d=r.clientHeight||1,h<2||d<2||(g.resize(h,d,c),b())},120)});return j.observe(r),document.fonts?.load&&document.fonts.load(`500 1em "${f}"`).then(()=>{f=u("var(--font-kyoto), Georgia, serif"),b()},()=>{}),o&&v&&g.draw(1,0,m,0,h/Math.max(1,d),x,[0,0],[0,0],[-1,-1],0,0),()=>{N(),q.disconnect(),j.disconnect(),window.clearTimeout(Y),document.removeEventListener("visibilitychange",z),$(),r.removeEventListener("pointermove",U),r.removeEventListener("pointerleave",M),g.destroy()}},[]),(0,t.jsxs)("div",{ref:a,"data-canvas-card":!0,"aria-label":"Two small text blocks in opposite corners that materialize through a soft cloudy mask, then clear and repeat with new words.",className:"relative mx-auto aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border",style:{backgroundColor:"#fdfdfb",borderColor:l},"aria-hidden":!0,children:[(0,t.jsx)("div",{className:"textreveal-wash pointer-events-none absolute",style:{inset:"-8%",backgroundImage:"radial-gradient(55% 75% at 18% 12%, rgba(255,255,255,0.95), transparent 60%), radial-gradient(48% 66% at 82% 22%, rgba(255,255,255,0.80), transparent 62%), radial-gradient(65% 55% at 50% 0%,  rgba(255,255,255,0.70), transparent 55%), radial-gradient(42% 52% at 8% 85%,  rgba(255,255,255,0.75), transparent 60%), radial-gradient(52% 60% at 92% 88%, rgba(255,255,255,0.65), transparent 62%), radial-gradient(38% 38% at 65% 55%, rgba(255,255,255,0.55), transparent 70%), radial-gradient(85% 46% at 50% 100%,rgba(255,255,255,0.55), transparent 55%), radial-gradient(28% 28% at 30% 45%, rgba(255,255,255,0.45), transparent 72%)"}}),(0,t.jsx)("div",{className:"pointer-events-none absolute inset-0",style:{backgroundImage:`url("${h}")`,backgroundSize:"140px 140px",opacity:.05,mixBlendMode:"multiply"}})]})}],30302)},15197,e=>{e.n(e.i(30302))}]);