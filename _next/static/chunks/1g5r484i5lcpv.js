(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,85398,e=>{"use strict";async function t(e,t,a,r,n){let s=Math.max(1,Math.round(a)),l=Math.max(1,Math.round(r)),o=document.createElement("canvas");o.width=s,o.height=l;let h=o.getContext("2d");h.clearRect(0,0,s,l),e.svg&&e.svg.trim()?await i(h,e.svg,s,l,.5,.5,.52):e.word.trim()&&function(e,t,i,a,r){let n=t.word;if(!n)return;let s=.82*i,l=.36*a;e.font=`800 ${l}px ${r}`;let o=e.measureText(n).width;o>s&&(l*=s/o,e.font=`800 ${l}px ${r}`),e.fillStyle="#fff",e.textAlign="center",e.textBaseline="middle",e.fillText(n,i/2,.5*a)}(h,e,s,l,n);let u=document.createElement("canvas");u.width=s,u.height=l;let c=u.getContext("2d");c.filter=`blur(${Math.max(.5,t).toFixed(2)}px)`,c.drawImage(o,0,0),c.filter="none";let d=document.createElement("canvas");d.width=s,d.height=l;let f=d.getContext("2d"),g=h.getImageData(0,0,s,l).data,m=c.getImageData(0,0,s,l).data,p=f.createImageData(s,l),v=p.data;for(let e=0;e<v.length;e+=4)v[e]=g[e+3],v[e+1]=m[e+3],v[e+2]=0,v[e+3]=255;return f.putImageData(p,0,0),d}async function i(e,t,i,a,r,n,s){let l=new Blob([t.replace(/<svg([^>]*)>/i,"<svg$1><style>*{fill:#fff!important;stroke:#fff!important}</style>")],{type:"image/svg+xml"}),o=URL.createObjectURL(l);try{var h;let t=await (h=o,new Promise((e,t)=>{let i=new Image;i.onload=()=>e(i),i.onerror=t,i.src=h})),l=a*s,u=t.width/Math.max(1,t.height),c=l,d=l*u,f=.82*i;d>f&&(c=(d=f)/u),e.drawImage(t,i*r-d/2,a*n-c/2,d,c)}catch{}finally{URL.revokeObjectURL(o)}}e.s(["BUILTIN_SVGS",0,[{id:"sparkle",name:"Sparkle",svg:'<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 4 C54 34 66 46 96 50 C66 54 54 66 50 96 C46 66 34 54 4 50 C34 46 46 34 50 4 Z"/></svg>'},{id:"star",name:"Star",svg:'<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 4 L61 38 L97 38 L68 60 L79 94 L50 72 L21 94 L32 60 L3 38 L39 38 Z"/></svg>'},{id:"heart",name:"Heart",svg:'<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 88 C10 60 8 30 26 20 C40 12 50 24 50 32 C50 24 60 12 74 20 C92 30 90 60 50 88 Z"/></svg>'},{id:"bolt",name:"Bolt",svg:'<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M58 4 L26 56 L46 56 L40 96 L74 40 L52 40 Z"/></svg>'},{id:"flower",name:"Flower",svg:'<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g><ellipse cx="50" cy="24" rx="15" ry="22"/><ellipse cx="50" cy="24" rx="15" ry="22" transform="rotate(72 50 50)"/><ellipse cx="50" cy="24" rx="15" ry="22" transform="rotate(144 50 50)"/><ellipse cx="50" cy="24" rx="15" ry="22" transform="rotate(216 50 50)"/><ellipse cx="50" cy="24" rx="15" ry="22" transform="rotate(288 50 50)"/><circle cx="50" cy="50" r="11"/></g></svg>'},{id:"sun",name:"Sun",svg:'<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g><circle cx="50" cy="50" r="20"/><g stroke-width="0"><rect x="47" y="4" width="6" height="16" rx="3"/><rect x="47" y="80" width="6" height="16" rx="3"/><rect x="4" y="47" width="16" height="6" rx="3"/><rect x="80" y="47" width="16" height="6" rx="3"/><rect x="47" y="4" width="6" height="16" rx="3" transform="rotate(45 50 50)"/><rect x="47" y="80" width="6" height="16" rx="3" transform="rotate(45 50 50)"/><rect x="4" y="47" width="16" height="6" rx="3" transform="rotate(45 50 50)"/><rect x="80" y="47" width="16" height="6" rx="3" transform="rotate(45 50 50)"/></g></g></svg>'},{id:"flame",name:"Flame",svg:'<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M52 4 C52 26 74 34 70 58 C68 74 60 78 60 78 C64 66 56 60 54 52 C50 62 42 62 44 76 C36 70 30 60 32 46 C34 30 52 30 52 4 Z"/></svg>'},{id:"blob",name:"Blob",svg:'<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M60 8 C82 12 94 34 88 56 C82 78 60 94 40 88 C18 82 6 58 14 38 C22 18 38 4 60 8 Z"/></svg>'},{id:"moon",name:"Moon",svg:'<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M64 8 A44 44 0 1 0 64 92 A34 34 0 0 1 64 8 Z"/></svg>'},{id:"arrow",name:"Arrow",svg:'<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M44 12 L44 62 L26 62 L50 92 L74 62 L56 62 L56 12 Z"/></svg>'},{id:"target",name:"Target",svg:'<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="47" y="6" width="6" height="88" rx="3"/><rect x="6" y="47" width="88" height="6" rx="3"/><circle cx="50" cy="50" r="22" fill="none" stroke-width="6"/></svg>'}],"makeContentField",0,t])},12066,e=>{"use strict";var t=e.i(43476),i=e.i(71645);let a=`
attribute vec2 aPosition;
attribute vec2 aUV;
varying vec2 vUV;
void main() {
  vUV = aUV;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`,r=`
precision highp float;

varying vec2 vUV;

uniform sampler2D uField;   // R = crisp coverage, G = blurred height (bevel ramp)
uniform sampler2D uPlaster; // real plaster surface
uniform sampler2D uGrunge;  // paper/grunge overlay
uniform float uGrungeAmt;
uniform vec2  uTexel;       // 1/fieldSize
uniform vec2  uLight;       // bevel light dir xy
uniform float uLightZ;
uniform vec2  uWash;        // hovered-panel wash center (cursor)
uniform float uHover;       // hovered panel index (-1 = none)
// per-panel style (3 panels): x=panel0, y=panel1, z=panel2
uniform vec3  uDepth;       // relief strength per panel
uniform vec3  uHi;          // highlight opacity per panel
uniform vec3  uSh;          // shadow opacity per panel
uniform vec3  uContrast;    // plaster grain punch per panel
uniform vec3  uBright;      // brightness per panel
uniform vec3  uTint0;       // panel tints
uniform vec3  uTint1;
uniform vec3  uTint2;
uniform vec3  uTexScale;    // plaster zoom per panel
uniform vec2  uTexOff0;     // plaster sample offset per panel
uniform vec2  uTexOff1;
uniform vec2  uTexOff2;
uniform float uReveal;
uniform float uAspect;

// panel columns in x (must match PANELS in text-mask.ts)
const vec2 P0 = vec2(0.02, 0.333);
const vec2 P1 = vec2(0.347, 0.653);
const vec2 P2 = vec2(0.667, 0.98);
// panels span this y band (vertical inset), rest is white card
const float PY0 = 0.16;
const float PY1 = 0.84;
const float RADIUS = 0.02; // rounded-corner softness in uv

float plasterAt(vec2 uv){ return texture2D(uPlaster, uv).r; }
float heightAt(vec2 uv){ return texture2D(uField, uv).g; }

// which panel (0/1/2) is uv.x in, or -1 outside all
int panelOf(float x){
  if (x >= P0.x && x <= P0.y) return 0;
  if (x >= P1.x && x <= P1.y) return 1;
  if (x >= P2.x && x <= P2.y) return 2;
  return -1;
}

void main() {
  vec2 uv = vUV;
  vec3 white = vec3(0.985);

  int panel = panelOf(uv.x);
  // vertical panel band
  float inY = step(PY0, uv.y) * step(uv.y, PY1);
  if (panel < 0 || inY < 0.5) { gl_FragColor = vec4(white, 1.0); return; }

  vec2 col2 = panel == 0 ? P0 : (panel == 1 ? P1 : P2);
  vec3 tint = panel == 0 ? uTint0 : (panel == 1 ? uTint1 : uTint2);
  // per-panel style params (pick component by panel index)
  float depth    = panel == 0 ? uDepth.x    : (panel == 1 ? uDepth.y    : uDepth.z);
  float hiAmt    = panel == 0 ? uHi.x       : (panel == 1 ? uHi.y       : uHi.z);
  float shAmt    = panel == 0 ? uSh.x       : (panel == 1 ? uSh.y       : uSh.z);
  float contrast = panel == 0 ? uContrast.x : (panel == 1 ? uContrast.y : uContrast.z);
  float bright   = panel == 0 ? uBright.x   : (panel == 1 ? uBright.y   : uBright.z);
  float texScale = panel == 0 ? uTexScale.x : (panel == 1 ? uTexScale.y : uTexScale.z);
  vec2  texOff   = panel == 0 ? uTexOff0    : (panel == 1 ? uTexOff1    : uTexOff2);

  // soft rounded edge of the panel (antialiased against the white card)
  float edgeX = min(uv.x - col2.x, col2.y - uv.x);
  float edgeY = min(uv.y - PY0, PY1 - uv.y);
  float edge = smoothstep(0.0, RADIUS, min(edgeX, edgeY));

  // --- word bevel ---
  float gstep = 1.0;
  float hL = heightAt(uv - vec2(gstep, 0.0) * uTexel);
  float hR = heightAt(uv + vec2(gstep, 0.0) * uTexel);
  float hD = heightAt(uv - vec2(0.0, gstep) * uTexel);
  float hU = heightAt(uv + vec2(0.0, gstep) * uTexel);
  float crisp = texture2D(uField, uv).r;
  vec2 slope = vec2(hR - hL, hU - hD) * depth * 16.0 * uReveal;
  vec3 N = normalize(vec3(-slope.x, -slope.y, 1.0));
  float bevel = clamp(length(slope), 0.0, 1.0);

  vec3 L = normalize(vec3(uLight, uLightZ));
  float diff = dot(N, L);
  float hi = pow(max(diff, 0.0), 1.2) * bevel;
  float sh = pow(max(-diff, 0.0), 1.0) * bevel;

  // --- plaster surface, DIFFERENT slice + tint per panel ---
  // Sample a sub-window of the plaster: zoom in by texScale (>=1 -> a smaller slice)
  // and pan by texOff, but CLAMP the window inside [0,1] so it never wraps. Using a
  // clamped sub-rect (not fract) removes the hard vertical/horizontal seams the wrap
  // used to create, and stops the texture tiling across the panel.
  float zoom = max(1.0, texScale);
  vec2 span = vec2(1.0 / zoom);           // size of the sampled window in tex space
  vec2 origin = clamp(texOff, 0.0, 1.0) * (1.0 - span); // keep the window in range
  vec2 puv = origin + uv * span;
  float p = texture2D(uPlaster, puv).r;
  p = clamp((p - 0.5) * contrast + 0.5, 0.0, 1.0);
  vec3 base = tint * p * bright;

  // deboss the glyph face
  float face = smoothstep(0.4, 0.62, crisp);
  base *= mix(1.0, 0.86, face * uReveal);

  vec3 c = base;
  c += hi * hiAmt * uReveal;   // per-panel highlight rim
  c -= sh * shAmt * uReveal;   // per-panel shadow

  // hovered panel: a weak directional wash follows the cursor
  if (uHover > float(panel) - 0.5 && uHover < float(panel) + 0.5) {
    vec2 tp = uv * vec2(uAspect, 1.0);
    float d = distance(tp, uWash * vec2(uAspect, 1.0));
    c += (0.5 - clamp(d * 0.9, 0.0, 1.0)) * 0.1;
  }

  // paper/grunge overlay inside the panel
  float gr = texture2D(uGrunge, uv).r;
  vec3 ov = mix(2.0 * c * gr, 1.0 - 2.0 * (1.0 - c) * (1.0 - gr), step(0.5, c));
  c = mix(c, ov, uGrungeAmt);
  c = clamp(c, 0.0, 1.0);

  // composite the panel over the white card with the soft rounded edge
  vec3 outc = mix(white, c, edge);
  gl_FragColor = vec4(outc, 1.0);
}
`,n=[{x0:.02,x1:.333},{x0:.347,x1:.653},{x0:.667,x1:.98}];async function s(e,t,i,a,r){let s=Math.max(1,Math.round(i)),o=Math.max(1,Math.round(a)),h=document.createElement("canvas");h.width=s,h.height=o;let u=h.getContext("2d"),c=document.createElement("canvas");c.width=s,c.height=o;let d=c.getContext("2d"),f=document.createElement("canvas");f.width=s,f.height=o;let g=f.getContext("2d"),m=h.getContext("2d"),p=.2*o;for(let t=0;t<n.length;t++){let i=e[t]?.word??"";if(!i)continue;let a=(n[t].x1-n[t].x0)*s,l=a-.1*a*2;m.font=`800 ${p}px ${r}`;let o=m.measureText(i).width;o>l&&(p*=l/o)}let v=document.createElement("canvas");v.width=s,v.height=o;let x=v.getContext("2d"),w=document.createElement("canvas");w.width=s,w.height=o;let T=w.getContext("2d");d.globalCompositeOperation="lighten",g.globalCompositeOperation="lighten";for(let i=0;i<n.length;i++){let a=e[i];a&&(a.word||a.svg)&&(x.clearRect(0,0,s,o),a.svg?await l(x,a.svg,s,o,n[i]):function(e,t,i,a,r,n,s){let l=r.x0*i,o=r.x1*i,h=a/2;e.textAlign="center",e.textBaseline="middle",e.font=`800 ${s}px ${n}`,e.fillStyle="#fff";let u=.01*s,c=[...t].map(t=>e.measureText(t).width),d=(l+o)/2-(c.reduce((e,t)=>e+t,0)+u*(t.length-1))/2;e.textAlign="left";for(let i=0;i<t.length;i++)e.fillText(t[i],d,h),d+=c[i]+u}(x,a.word,s,o,n[i],r,p),d.drawImage(v,0,0),T.clearRect(0,0,s,o),T.filter=`blur(${Math.max(.5,t[i]??2).toFixed(2)}px)`,T.drawImage(v,0,0),T.filter="none",g.drawImage(w,0,0))}let b=d.getImageData(0,0,s,o).data,E=g.getImageData(0,0,s,o).data,y=u.createImageData(s,o),R=y.data;for(let e=0;e<R.length;e+=4)R[e]=b[e+3],R[e+1]=E[e+3],R[e+2]=0,R[e+3]=255;return u.putImageData(y,0,0),h}async function l(e,t,i,a,r){let n=t.replace(/<svg([^>]*)>/i,"<svg$1><style>*{fill:#fff!important;stroke:#fff!important}</style>"),s=URL.createObjectURL(new Blob([n],{type:"image/svg+xml"}));try{let t=await new Promise((e,t)=>{let i=new Image;i.onload=()=>e(i),i.onerror=t,i.src=s}),n=(r.x1-r.x0)*i,l=(r.x0+r.x1)/2*i,o=Math.min(.62*n,.44*a),h=t.width/Math.max(1,t.height),u=o,c=o*h;c>.68*n&&(u=(c=.68*n)/h),e.drawImage(t,l-c/2,a/2-u/2,c,u)}catch{}finally{URL.revokeObjectURL(s)}}var o=e.i(85398),h=e.i(35877);let u=[{word:"beep",blurK:.0025,depth:1.3,hi:.42,sh:.46,contrast:.3,bright:1.62,tint:[.95,.95,.97],texOff:[.5,.55],texScale:1.1},{word:"",svg:o.BUILTIN_SVGS.find(e=>"flower"===e.id).svg,blurK:.0025,depth:1.1,hi:.3,sh:.34,contrast:.15,bright:2.15,tint:[1,.85,.2],texOff:[.45,.3],texScale:1.1},{word:"boop",blurK:.0025,depth:1.1,hi:.3,sh:.34,contrast:.25,bright:2.25,tint:[.6,.5,1],texOff:[.25,.6],texScale:.9}],c=[[.02,.333],[.347,.653],[.667,.98]],d=(0,h.mediaUrl)("/vault/emboss-plaster.webp"),f=(0,h.mediaUrl)("/vault/emboss-grunge.webp"),g=73*Math.PI/180;class m{host;canvas;gl=null;prog=null;loc={};quad=null;tex=null;texW=1;texH=1;plaster=null;grunge=null;raf=0;running=!1;awake=!1;w=0;h=0;dpr=1;fontFamily="var(--font-neue-corp), sans-serif";builtW=0;builtH=0;builtFont="";buildScheduled=0;destroyed=!1;painted=!1;wx=.5;wy=.5;twx=.5;twy=.5;hover=-1;ok=!1;constructor(e){this.host=e,this.canvas=document.createElement("canvas"),Object.assign(this.canvas.style,{position:"absolute",inset:"0",width:"100%",height:"100%",display:"block",opacity:"0"}),e.appendChild(this.canvas);const t=this.canvas.getContext("webgl",{alpha:!1,antialias:!1,premultipliedAlpha:!1});if(!t)return;this.gl=t;try{this.prog=this.build(a,r)}catch{this.gl=null;return}const i=this.prog;for(const e of["uField","uPlaster","uGrunge","uTexel","uLight","uLightZ","uWash","uHover","uDepth","uHi","uSh","uContrast","uBright","uGrungeAmt","uTint0","uTint1","uTint2","uTexScale","uTexOff0","uTexOff1","uTexOff2","uReveal","uAspect"])this.loc[e]=t.getUniformLocation(i,e);const n=t.getAttribLocation(i,"aPosition"),s=t.getAttribLocation(i,"aUV"),l=new Float32Array([-1,-1,0,1,1,-1,1,1,-1,1,0,0,1,1,1,0]);this.quad=t.createBuffer(),t.bindBuffer(t.ARRAY_BUFFER,this.quad),t.bufferData(t.ARRAY_BUFFER,l,t.STATIC_DRAW),t.useProgram(i),t.enableVertexAttribArray(n),t.vertexAttribPointer(n,2,t.FLOAT,!1,16,0),t.enableVertexAttribArray(s),t.vertexAttribPointer(s,2,t.FLOAT,!1,16,8),t.clearColor(1,1,1,1),this.resize(),this.plaster=this.newPlaceholder([128,128,128,255]),this.grunge=this.newPlaceholder([128,128,128,255]),this.loadTexture(d,()=>this.plaster,!1),this.loadTexture(f,()=>this.grunge,!1),this.buildFieldNow(),this.canvas.addEventListener("pointermove",this.onMove),this.canvas.addEventListener("pointerleave",this.onLeave),this.ok=!0}newPlaceholder(e){let t=this.gl;if(!t)return null;let i=t.createTexture();return t.bindTexture(t.TEXTURE_2D,i),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,1,1,0,t.RGBA,t.UNSIGNED_BYTE,new Uint8Array(e)),i}loadTexture(e,t,i=!1){let a=new Image;a.crossOrigin="anonymous",a.onload=()=>{let e=this.gl,r=t();if(!e||!r)return;e.bindTexture(e.TEXTURE_2D,r),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,a);let n=i?e.REPEAT:e.CLAMP_TO_EDGE;e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,n),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,n),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),this.running||this.render(performance.now())},a.src=e}build(e,t){let i=this.gl,a=(e,t)=>{let a=i.createShader(e);if(i.shaderSource(a,t),i.compileShader(a),!i.getShaderParameter(a,i.COMPILE_STATUS))throw Error(i.getShaderInfoLog(a)||"compile failed");return a},r=i.createProgram();if(i.attachShader(r,a(i.VERTEX_SHADER,e)),i.attachShader(r,a(i.FRAGMENT_SHADER,t)),i.linkProgram(r),!i.getProgramParameter(r,i.LINK_STATUS))throw Error(i.getProgramInfoLog(r)||"link failed");return r}setFont(e){e!==this.fontFamily&&(this.fontFamily=e,this.scheduleBuild())}wake(){this.awake&&!this.running&&this.start()}onMove=e=>{let t=this.canvas.getBoundingClientRect(),i=(e.clientX-t.left)/t.width,a=1-(e.clientY-t.top)/t.height;this.twx=i,this.twy=a,this.hover=-1;for(let e=0;e<c.length;e++)if(i>=c[e][0]&&i<=c[e][1]){this.hover=e;break}this.wake()};onLeave=()=>{this.hover=-1,this.wake()};resize(){let e=this.host.getBoundingClientRect();this.dpr=Math.min(2,window.devicePixelRatio||1),this.w=e.width,this.h=e.height;let t=Math.max(1,Math.round(this.w*this.dpr)),i=Math.max(1,Math.round(this.h*this.dpr));(this.canvas.width!==t||this.canvas.height!==i)&&(this.canvas.width=t,this.canvas.height=i,this.gl?.viewport(0,0,t,i),this.scheduleBuild())}maskSize(){let e=Math.max(2,Math.min(1500,Math.round(this.w*this.dpr))),t=Math.max(2,Math.round(e*(this.h/Math.max(1,this.w))));return[e,t]}scheduleBuild(){if(!this.gl||this.destroyed)return;let[e,t]=this.maskSize();if(e===this.builtW&&t===this.builtH&&this.fontFamily===this.builtFont||this.buildScheduled)return;let i=()=>{this.buildScheduled=0,this.buildFieldNow()},a=window.requestIdleCallback;this.buildScheduled=a?a(i,{timeout:200}):window.setTimeout(i,0)}async buildFieldNow(){let e=this.gl;if(!e||this.destroyed)return;if(this.buildScheduled){let e=window.cancelIdleCallback;e?e(this.buildScheduled):window.clearTimeout(this.buildScheduled),this.buildScheduled=0}let[t,i]=this.maskSize();this.builtW=t,this.builtH=i,this.builtFont=this.fontFamily;let a=u.map(e=>({word:e.word,svg:e.svg??null})),r=u.map(e=>Math.max(1,i*e.blurK)),n=await s(a,r,t,i,this.fontFamily);this.gl&&!this.destroyed&&(this.tex||(this.tex=e.createTexture()),e.bindTexture(e.TEXTURE_2D,this.tex),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,n),this.texW=n.width,this.texH=n.height,this.running||this.render(performance.now()))}start(){if(!this.ok||(this.awake=!0,this.running))return;this.running=!0,this.resize();let e=t=>{this.running&&(this.frame(t),this.raf=requestAnimationFrame(e))};this.raf=requestAnimationFrame(e)}stop(){this.awake=!1,this.pause()}pause(){this.running=!1,this.raf&&cancelAnimationFrame(this.raf),this.raf=0}frame(e){this.wx+=(this.twx-this.wx)*.1,this.wy+=(this.twy-this.wy)*.1,this.render(e)}renderStill(){this.resize(),this.buildFieldNow(),this.render(performance.now())}render(e){let t=this.gl;t&&this.prog&&this.tex&&(t.useProgram(this.prog),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,this.tex),t.uniform1i(this.loc.uField,0),t.activeTexture(t.TEXTURE1),t.bindTexture(t.TEXTURE_2D,this.plaster),t.uniform1i(this.loc.uPlaster,1),t.activeTexture(t.TEXTURE2),t.bindTexture(t.TEXTURE_2D,this.grunge),t.uniform1i(this.loc.uGrunge,2),t.uniform1f(this.loc.uGrungeAmt,.38),t.uniform2f(this.loc.uTexel,1/this.texW,1/this.texH),t.uniform2f(this.loc.uLight,Math.cos(g),Math.sin(g)),t.uniform1f(this.loc.uLightZ,.5),t.uniform2f(this.loc.uWash,this.wx,this.wy),t.uniform1f(this.loc.uHover,this.hover),t.uniform3f(this.loc.uDepth,u[0].depth,u[1].depth,u[2].depth),t.uniform3f(this.loc.uHi,u[0].hi,u[1].hi,u[2].hi),t.uniform3f(this.loc.uSh,u[0].sh,u[1].sh,u[2].sh),t.uniform3f(this.loc.uContrast,u[0].contrast,u[1].contrast,u[2].contrast),t.uniform3f(this.loc.uBright,u[0].bright,u[1].bright,u[2].bright),t.uniform3f(this.loc.uTint0,u[0].tint[0],u[0].tint[1],u[0].tint[2]),t.uniform3f(this.loc.uTint1,u[1].tint[0],u[1].tint[1],u[1].tint[2]),t.uniform3f(this.loc.uTint2,u[2].tint[0],u[2].tint[1],u[2].tint[2]),t.uniform3f(this.loc.uTexScale,u[0].texScale,u[1].texScale,u[2].texScale),t.uniform2f(this.loc.uTexOff0,u[0].texOff[0],u[0].texOff[1]),t.uniform2f(this.loc.uTexOff1,u[1].texOff[0],u[1].texOff[1]),t.uniform2f(this.loc.uTexOff2,u[2].texOff[0],u[2].texOff[1]),t.uniform1f(this.loc.uReveal,1),t.uniform1f(this.loc.uAspect,this.w/Math.max(1,this.h)),t.drawArrays(t.TRIANGLE_STRIP,0,4),this.painted||(this.painted=!0,this.canvas.style.opacity="1"),this.hover<0&&.001>Math.abs(this.wx-this.twx)&&.001>Math.abs(this.wy-this.twy)&&this.pause())}destroy(){if(this.destroyed=!0,this.buildScheduled){let e=window.cancelIdleCallback;e?e(this.buildScheduled):window.clearTimeout(this.buildScheduled),this.buildScheduled=0}this.stop(),this.canvas.removeEventListener("pointermove",this.onMove),this.canvas.removeEventListener("pointerleave",this.onLeave);let e=this.gl;e&&(this.tex&&e.deleteTexture(this.tex),this.plaster&&e.deleteTexture(this.plaster),this.grunge&&e.deleteTexture(this.grunge),this.quad&&e.deleteBuffer(this.quad),e.getExtension("WEBGL_lose_context")?.loseContext()),this.canvas.remove()}}var p=e.i(20268);e.s(["EmbossCard",0,function({bare:e=!1,viewTransitionName:a}={}){let r=(0,i.useRef)(null);return(0,i.useEffect)(()=>{let e=r.current;if(!e)return;let t=window.matchMedia("(prefers-reduced-motion: reduce)").matches,i=null,a=!1,n=!1,s=!1,l=()=>{i&&!t&&(!a||n||s?i.stop():i.start())},o=requestAnimationFrame(()=>{if(r.current&&(i=new m(e)).ok&&(t?i.renderStill():l(),document.fonts?.load)){let e=document.createElement("span");e.style.cssText="position:absolute;visibility:hidden",e.style.fontFamily="var(--font-neue-corp)",e.textContent="Ag",document.body.appendChild(e);let t=getComputedStyle(e).fontFamily.split(",")[0].replace(/["']/g,"").trim();document.body.removeChild(e),document.fonts.load(`800 1em "${t}"`).then(()=>i?.setFont(`"${t}", sans-serif`),()=>{})}}),h=new IntersectionObserver(e=>{a=e[0]?.isIntersecting??!1,l()},{threshold:.2});h.observe(e);let u=()=>{n=document.hidden,l()};document.addEventListener("visibilitychange",u);let c=(0,p.onTransitionChange)(e=>{s=e,l()}),d=0,f=()=>{window.clearTimeout(d),d=window.setTimeout(()=>i?.resize(),120)};return window.addEventListener("resize",f),()=>{cancelAnimationFrame(o),h.disconnect(),document.removeEventListener("visibilitychange",u),c(),window.removeEventListener("resize",f),window.clearTimeout(d),i?.destroy()}},[]),(0,t.jsx)("div",{ref:r,"data-canvas-card":!0,"aria-label":"Three colored plaster panels with words pressed into them, each a different emboss style.",style:a?{viewTransitionName:a}:void 0,className:"relative mx-auto aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-white"})}],12066)},41417,e=>{e.n(e.i(12066))}]);