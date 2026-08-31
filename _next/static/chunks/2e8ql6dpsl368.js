(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,84136,e=>{"use strict";var t=e.i(43476),i=e.i(71645);let n=[.864,.842,.826,.812,.801,.792,.784,.777,.733,.71,.689,.63,.611,.593,.579,.567,.556,.546,.537,.528,.52,.511,.503,.494,.486,.476,.464,.453,.439,.426,.409,.391,.371,.349,.323,.292,.256,.182,.133,.104,.069],r=["Open Sound","Technology"],s=[.641,.664,.679,.69,.697,.702,.706,.707,.707,.706,.702,.699,.693,.687,.659,.567,.539,.518,.512,.506,.502,.5,.498,.49,.494,.494,.494,.494,.494,.493,.496,.491,.492,.488,.486],o=["Sound","is","rich"],a=[[0,17],[18,34],[35,51]],h=[.422,.21,.113,.068,.042,.026,.014,.007,.001,-.002,-.004,-.004,-.006,-.01,-.016,-.027,-.043,-.076,.416,.304,.223,.159,.107,.069,.019,.004,-.004,-.009,-.011,-.013,-.023,-.039,-.066,-.108,-.169,.45,.268,.156,.093,.056,.031,.017,.008,0,-.004,-.007,-.007,-.009,-.02,-.031,-.053,-.093],l='Georgia, "Times New Roman", serif',u={rl:1.05,str:2.4,pow:3,rip:.35,wave:.34,rim0:.25},c={rl:.49,str:1.7,pow:2.4,rip:.55,wave:.16,rim0:.35},f={rl:.85,str:.9,pow:2.2,rip:.28,wave:.42,rim0:.1},d=e=>Number.isInteger(e)?`${e}.0`:`${e}`,m=`
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`,p=`
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uU;
uniform vec2 uOff;      // content offset, px (where the word has moved to)
uniform vec2 uCen;      // lens centre, px — normally the frame centre
uniform float uRL;      // lens radius, px
uniform float uStr, uPow, uRip, uWave, uRim0;
uniform float uRipPh;   // ripple phase
uniform float uBall;    // 1 = clip content to the ball + draw its ring
uniform float uRingT;   // stepped boil time
uniform vec3 uInk, uPaper;

// The lens law, factored out so it can be evaluated per colour channel and
// differentiated for the caustics. k scales the pincushion term: dispersion is
// a per-channel change in how hard the glass bends, which is what a real lens
// does — it does not bend all wavelengths equally.
float magAt(float r, float k) {
  float rn = r / uRL;
  float m = 1.0
    + uStr * k * pow(clamp(rn, 0.0, 1.6), uPow)
    + uRip * sin(6.28318 * r / (uWave * uU) - uRipPh)
        * smoothstep(uRim0, 1.0, rn);
  return max(m, 0.35);
}

// Ink at a given magnification — one texture read.
float inkAt(vec2 q, vec2 c, float m) {
  vec2 src = c + q / m - uOff;
  return 1.0 - texture2D(uTex, src / uRes).r;
}

void main() {
  vec2 px = vUv * uRes;
  vec2 c = uCen;
  vec2 q = px - c;
  float r = length(q);
  float rn = r / uRL;

  // CHROMATIC ABERRATION. The channels refract by slightly different amounts,
  // scaled by rn so the fringe lives at the rim where the distortion already
  // peaks and the centre — where the type has to stay readable — stays neutral.
  float d = ${d(.016)} * clamp(rn, 0.0, 1.0);
  float mR = magAt(r, 1.0 + d);
  float mG = magAt(r, 1.0);
  float mB = magAt(r, 1.0 - d);

  vec3 ink = vec3(inkAt(q, c, mR), inkAt(q, c, mG), inkAt(q, c, mB));

  if (uBall > 0.5) {
    float th = atan(q.y, q.x);
    float wob =
        ${[[3,.01,1.3],[7,.007,-2.1],[11,.005,3.7]].map(([e,t,i])=>`${d(t)} * sin(${e}.0 * th + ${d(i)} * uRingT)`).join(" + ")};
    float Rw = uRL * (1.0 + wob);
    // content lives only inside the glass
    float insideM = 1.0 - smoothstep(Rw - 1.5, Rw + 0.5, r);
    ink *= insideM;
    // the horizon itself: an ink ring whose weight breathes around the circle
    float w = ${d(.008)} * uU * (${d(.35)} + (1.0 - ${d(.35)}) * (0.5 + 0.5 * sin(2.0 * th + 0.9 * uRingT)));
    float ring = 1.0 - smoothstep(w * 0.45, w, abs(r - Rw));
    ink = max(ink, vec3(ring));
  }

  vec3 col = mix(uPaper, uInk, clamp(ink, 0.0, 1.0));


  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`,v=e=>[parseInt(e.slice(1,3),16)/255,parseInt(e.slice(3,5),16)/255,parseInt(e.slice(5,7),16)/255];function w(e,t,i=0,n=e.length-1){let r=Math.min(Math.max(t,i),n),s=Math.floor(r),o=Math.min(s+1,n);return e[s]+(e[o]-e[s])*(r-s)}class g{ok=!1;canvas;gl=null;prog=null;quad=null;tex=null;u={};src;srcCtx;fontFamily=l;texKey="";raf=0;running=!1;disposed=!1;scene=0;sceneT0=0;ptrX=.5;ptrY=.5;lensX=.5;lensY=.5;hover=0;hoverTo=0;lastNow=0;W=0;H=0;dpr=1;constructor(e){this.canvas=e,this.src=document.createElement("canvas"),this.srcCtx=this.src.getContext("2d");const t=e.getContext("webgl",{alpha:!1,antialias:!1,premultipliedAlpha:!1,powerPreference:"low-power"});if(!t||!this.srcCtx)return;this.gl=t;const i=(e,i)=>{let n=t.createShader(e);return(t.shaderSource(n,i),t.compileShader(n),t.getShaderParameter(n,t.COMPILE_STATUS))?n:(console.warn("[glass-type]",t.getShaderInfoLog(n)),null)},n=i(t.VERTEX_SHADER,m),r=i(t.FRAGMENT_SHADER,p);if(!n||!r)return;const s=t.createProgram();if(t.attachShader(s,n),t.attachShader(s,r),t.linkProgram(s),!t.getProgramParameter(s,t.LINK_STATUS))return;for(const e of(this.prog=s,this.quad=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.quad),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),t.STATIC_DRAW),["uTex","uRes","uU","uOff","uRL","uStr","uPow","uRip","uWave","uRim0","uRipPh","uBall","uRingT","uInk","uPaper","uCen"]))this.u[e]=t.getUniformLocation(s,e);this.tex=t.createTexture(),t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,1),t.bindTexture(t.TEXTURE_2D,this.tex),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),this.ok=!0,this.sceneT0=performance.now(),this.resize()}setFont(e){this.fontFamily=`${e}, ${l}`,this.texKey="",this.running||this.disposed||this.renderStill()}resize(){let e=this.canvas.getBoundingClientRect();e.width&&e.height&&(this.dpr=Math.min(window.devicePixelRatio||1,2),this.W=Math.round(e.width*this.dpr),this.H=Math.round(e.height*this.dpr),this.canvas.width=this.W,this.canvas.height=this.H,this.src.width=2*this.W,this.src.height=2*this.H,this.texKey="",this.running||this.renderStill())}start(){this.running||this.disposed||!this.ok||(this.running=!0,this.sceneT0=performance.now()-this.pausedAt,this.raf=requestAnimationFrame(this.loop))}setPointer(e){if(!e){this.hoverTo=0;return}this.ptrX=e.x,this.ptrY=e.y,0===this.hoverTo&&this.hover<.01&&(this.lensX=e.x,this.lensY=e.y),this.hoverTo=1}pausedAt=0;stop(){this.running&&(this.pausedAt=performance.now()-this.sceneT0),this.running=!1,this.raf&&cancelAnimationFrame(this.raf),this.raf=0}renderStill(){if(this.pausedAt>0){let e=[41,35,52][this.scene];this.drawScene(this.scene,this.pausedAt%(e/24*1e3));return}this.drawScene(0,854.1666666666666)}destroy(){this.disposed=!0,this.stop()}loop=()=>{if(!this.running)return;let e=performance.now(),t=Math.min(Math.max((e-this.lastNow)/1e3,1/240),.1);this.lastNow=e;let i=this.hoverTo>this.hover?.22:.5;this.hover+=(this.hoverTo-this.hover)*(1-Math.exp(-t/i));let n=1-Math.exp(-(6*t));this.lensX+=(this.ptrX-this.lensX)*n,this.lensY+=(this.ptrY-this.lensY)*n;let r=e-this.sceneT0,s=[41,35,52][this.scene]/24*1e3;r>=5e3&&r%s<40?(this.scene=(this.scene+1)%3,this.sceneT0=performance.now(),this.drawScene(this.scene,0)):this.drawScene(this.scene,r%s),this.raf=requestAnimationFrame(this.loop)};setContent(e,t,i){let n=`${e}|${t.toFixed(3)}|${i.toFixed(1)}|${this.fontFamily}`;if(n===this.texKey)return;this.texKey=n;let r=this.srcCtx,s=2*this.W,o=2*this.H;r.fillStyle="#ffffff",r.fillRect(0,0,s,o),r.fillStyle="#000000",r.textAlign="center",r.textBaseline="middle",r.font=`500 100px ${this.fontFamily}`;let a=t*i*200/(r.measureText(e).width||1);r.font=`500 ${a}px ${this.fontFamily}`,r.fillText(e,s/2,o/2);let h=this.gl;h.bindTexture(h.TEXTURE_2D,this.tex),h.texImage2D(h.TEXTURE_2D,0,h.RGBA,h.RGBA,h.UNSIGNED_BYTE,this.src)}drawScene(e,t){let i=this.gl;if(!i||!this.prog||!this.W)return;let{W:l,H:d}=this,m=Math.min(d,l/(16/9)),p=t/1e3*24,g=t/1e3,T=0,R=0,x=1,E=0,A=[u,c,f][e];if(0===e)this.setContent("(open) your world",1.49,m),R=-(w(n,p)-.5)*m,x=A.rl*m;else if(1===e){let e=r[+(p>=15)];this.setContent(e,.56,m),x=w(s,p)*m*(A.rl/.49),E=1}else{let e=a.findIndex(([e,t])=>p>=e&&p<=t+1),t=e<0?2:e;this.setContent(o[t],.76,m),T=w(h,p,a[t][0],a[t][1])*m,x=A.rl*m}i.viewport(0,0,l,d),i.useProgram(this.prog),i.bindBuffer(i.ARRAY_BUFFER,this.quad);let y=i.getAttribLocation(this.prog,"aPos");i.enableVertexAttribArray(y),i.vertexAttribPointer(y,2,i.FLOAT,!1,0,0),i.activeTexture(i.TEXTURE0),i.bindTexture(i.TEXTURE_2D,this.tex),i.uniform1i(this.u.uTex,0),i.uniform2f(this.u.uRes,l,d),i.uniform1f(this.u.uU,m),i.uniform2f(this.u.uOff,T,R);let b=.72*this.hover;i.uniform2f(this.u.uCen,l*(.5+(this.lensX-.5)*b),d*(.5-(this.lensY-.5)*b)),i.uniform1f(this.u.uRL,x),i.uniform1f(this.u.uStr,A.str),i.uniform1f(this.u.uPow,A.pow),i.uniform1f(this.u.uRip,A.rip),i.uniform1f(this.u.uWave,A.wave),i.uniform1f(this.u.uRim0,A.rim0),i.uniform1f(this.u.uRipPh,1.1*g),i.uniform1f(this.u.uBall,E),i.uniform1f(this.u.uRingT,Math.floor(12*g)/12),i.uniform3fv(this.u.uInk,v("#0a0a0a")),i.uniform3fv(this.u.uPaper,v("#ffffff")),i.drawArrays(i.TRIANGLES,0,3)}}var T=e.i(20268);e.s(["GlassTypeCard",0,function({bare:e=!1,viewTransitionName:n}={}){let r=(0,i.useRef)(null);return(0,i.useEffect)(()=>{let e=r.current;if(!e)return;let t=window.matchMedia("(prefers-reduced-motion: reduce)").matches,i=null,n=!1,s=!1,o=!1,a=()=>{i&&!t&&(!n||s||o?i.stop():i.start())},h=requestAnimationFrame(()=>{if(r.current&&(i=new g(e)).ok&&(t?i.renderStill():a(),document.fonts?.load)){let e=document.createElement("span");e.style.cssText="position:absolute;visibility:hidden",e.style.fontFamily="var(--font-kyoto)",e.textContent="Ag",document.body.appendChild(e);let t=getComputedStyle(e).fontFamily.split(",")[0].replace(/["']/g,"").trim();e.remove(),t&&document.fonts.load(`500 1em "${t}"`).then(()=>i?.setFont(`"${t}"`),()=>{})}}),l=new IntersectionObserver(e=>{n=e[0]?.isIntersecting??!1,a()},{threshold:.2});l.observe(e);let u=()=>{s=document.hidden,a()};document.addEventListener("visibilitychange",u);let c=(0,T.onTransitionChange)(e=>{o=e,a()}),f=0,d=()=>{window.clearTimeout(f),f=window.setTimeout(()=>i?.resize(),120)};window.addEventListener("resize",d);let m=t=>{if("mouse"!==t.pointerType)return;let n=e.getBoundingClientRect();n.width&&n.height&&i?.setPointer({x:(t.clientX-n.left)/n.width,y:(t.clientY-n.top)/n.height})},p=()=>i?.setPointer(null);return e.addEventListener("pointermove",m),e.addEventListener("pointerleave",p),window.addEventListener("blur",p),()=>{cancelAnimationFrame(h),l.disconnect(),document.removeEventListener("visibilitychange",u),c(),window.removeEventListener("resize",d),e.removeEventListener("pointermove",m),e.removeEventListener("pointerleave",p),window.removeEventListener("blur",p),window.clearTimeout(f),i?.destroy()}},[]),(0,t.jsx)("div",{"data-canvas-card":!0,role:"img","aria-label":"Black serif type on white, warped through a glass lens that fringes colour at its rim: a line rises and unrolls to readable, a hand-drawn glass ball swaps two words inside its boiling outline, and single words drift through a magnifying wave. The three scenes take turns, and hovering carries the lens with the pointer.",style:n?{viewTransitionName:n}:void 0,className:"relative mx-auto aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-white",children:(0,t.jsx)("canvas",{ref:r,className:"h-full w-full"})})}],84136)},18626,e=>{e.n(e.i(84136))}]);