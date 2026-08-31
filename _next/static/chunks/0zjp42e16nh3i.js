(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,86610,e=>{"use strict";var t=e.i(43476),i=e.i(71645);let a=`
attribute vec2 aPosition;
attribute vec2 aUV;
varying vec2 vUV;
void main() {
  vUV = aUV;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`,r=`
// Request highp, but MANY mobile GPUs silently give mediump in the fragment stage. All
// the math below is kept mediump-safe (small coordinates into hash/sin), so the fabric
// texture + grain survive on phones instead of collapsing to a flat shadow.
precision highp float;

varying vec2 vUV;

uniform sampler2D uArt;   // RGB: the flat colored scene (cloth + ink + border)
uniform sampler2D uField; // R coverage/puff, G ink mask, B border ring
uniform sampler2D uWeave; // grayscale fabric weave, tiled
uniform vec2  uTexel;     // 1/fieldSize
uniform vec2  uLight;     // bevel light dir xy (sweeps on hover)
uniform float uLightZ;
uniform vec2  uWash;      // cursor pos for the relight wash
uniform float uHover;     // 0..1 hover amount
uniform float uPress;     // 0..1 press amount (patches press into the cloth on click)
uniform vec2  uPressPos;  // press center (0..1)
uniform float uAspect;    // card aspect (w/h)
uniform vec3  uFabric;    // background cloth color
uniform float uDepth;     // puff relief strength
uniform float uWeaveScale;// weave tiles across the card

// mediump-safe hash: WRAP the cell coord into a small range (mod 137) before the
// sin(dot(...)) so the argument to sin never blows up on mobile (where huge sin args
// return garbage). This is what keeps the grain/mottle alive on phones.
float hash(vec2 p){
  p = mod(p, 137.0);
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p){
  // fold the domain so integer cells stay small (mediump-safe) — the pattern still
  // reads as random at the scales we use it.
  p = mod(p, 137.0);
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i+vec2(1.,0.)), c = hash(i+vec2(0.,1.)), d = hash(i+vec2(1.,1.));
  vec2 u = f*f*(3.-2.*f);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}
// weave sample: fract() the tiled coord ourselves so REPEAT works identically whether
// the GPU treats the coords as highp or mediump (large coords lose precision on mobile).
float weaveAt(vec2 uv){ return texture2D(uWeave, fract(uv * vec2(uAspect,1.0) * uWeaveScale)).r; }

void main() {
  vec2 uv = vUV;
  vec2 texel = uTexel;

  vec4 fld = texture2D(uField, uv);
  float cover = fld.r; // patch coverage / puff ramp
  float inkM  = fld.g; // dark lettering
  float ringM = fld.b; // white merrow border
  float stitchAng = fld.a * 3.14159; // satin-stitch run direction (0..pi)

  // ---- fabric background (dark cloth + weave + soft mottle + grain) ----
  // The TEXTURE comes primarily from the real WEAVE sample (a texture lookup, which is
  // precision-independent), so the fabric stays textured on mobile even if the noise
  // math degrades. The noise adds soft mottle + grain on top.
  vec2 dp = uv * vec2(uAspect, 1.0);
  float bw = weaveAt(uv + vec2(0.37, 0.11));
  float blotch = noise(dp * 3.0) * 0.1 + noise(dp * 7.0) * 0.05;
  vec3 fabric = uFabric * (0.72 + bw * 0.6 + (blotch - 0.075)); // stronger weave weight
  fabric += (noise(dp * 240.0) - 0.5) * 0.025;
  vec3 col = fabric;

  // press falls off with distance from the click point, so only the patch(es) under
  // the cursor react — the fabric surface itself never moves.
  float pdist = distance(uv * vec2(uAspect, 1.0), uPressPos * vec2(uAspect, 1.0));
  float pressLocal = uPress * (1.0 - smoothstep(0.0, 0.5, pdist));

  // ---- drop shadow: the patches lift off the fabric (tight, close contact shadow).
  // A local press FLATTENS it (offset shrinks + darkens less) so the patch reads as
  // pushed down into the cloth right where you clicked, then it springs back. ----
  float lift = 1.0 - pressLocal * 0.85;
  vec2 shOff = vec2(6.0, -6.0) * texel * lift;
  float shc = texture2D(uField, uv - shOff).r;
  col = mix(col, col * mix(0.42, 0.62, pressLocal), smoothstep(0.2, 0.8, shc) * 0.8);

  if (cover < 0.004) { gl_FragColor = vec4(col, 1.0); return; }

  // ---- weave-driven thread normal (fine stitches) + patch puff bevel ----
  float w0 = weaveAt(uv);
  float wL = weaveAt(uv - vec2(1.,0.)*texel), wR = weaveAt(uv + vec2(1.,0.)*texel);
  float wD = weaveAt(uv - vec2(0.,1.)*texel), wU = weaveAt(uv + vec2(0.,1.)*texel);
  vec2 wslope = vec2(wR - wL, wU - wD) * 22.0;
  vec3 Nw = normalize(vec3(-wslope.x, -wslope.y, 1.0));
  // patch puff (from the blurred coverage in R)
  float cL = texture2D(uField, uv - vec2(1.,0.)*texel).r, cR = texture2D(uField, uv + vec2(1.,0.)*texel).r;
  float cD = texture2D(uField, uv - vec2(0.,1.)*texel).r, cU = texture2D(uField, uv + vec2(0.,1.)*texel).r;
  vec2 pslope = vec2(cR - cL, cU - cD) * uDepth * 16.0;
  vec3 Np = vec3(-pslope.x, -pslope.y, 1.0);
  float bevel = clamp(length(pslope), 0.0, 1.0);
  vec3 N = normalize(Np + Nw * 2.0);

  vec3 L = normalize(vec3(uLight, uLightZ));
  float diff = dot(N, L);
  float hi = pow(max(diff, 0.0), 1.25);
  float sh = pow(max(-diff, 0.0), 1.1);

  // ---- the pre-colored art, modulated by the weave (over/under threads) ----
  vec3 art = texture2D(uArt, uv).rgb;
  vec3 c = art * (0.72 + w0 * 0.6);

  // ---- SATIN STITCH: parallel thread rows running along stitchAng. This is the
  // single biggest "embroidery not graffiti" cue: tight bright/dark bands across each
  // shape, perpendicular to the thread run, so light rakes over rows of thread. ----
  float sc = cos(stitchAng), ss = sin(stitchAng);
  // coordinate across the stitch rows (perpendicular to the run direction)
  float across = (dp.x * ss - dp.y * sc);
  float rows = across * 260.0;                 // stitch row frequency
  // WRAP the phase into [0, 2pi) before sin so the satin bands are identical under
  // mediump (mobile) and highp (desktop) — sin() of a large arg is imprecise on phones.
  float TWO_PI = 6.2831853;
  float satin = sin(mod(rows, TWO_PI));
  // rounded thread ridges + a little jitter so rows aren't ruler-straight
  float ridge = 0.5 + 0.5 * satin;
  ridge = pow(ridge, 1.4);
  float jit = noise(vec2(floor(rows), (dp.x*sc+dp.y*ss)*90.0)) * 0.25;
  float satinShade = mix(0.82, 1.14, clamp(ridge + jit*ridge, 0.0, 1.0));
  // apply satin only on cloth (not the flat ink letters, which are one dark thread mass)
  float clothFace = cover * (1.0 - inkM);
  c *= mix(1.0, satinShade, clothFace * 0.9 + ringM * 0.6);

  // ink letters read matte/darker; white border bead a touch brighter + its own satin
  c *= 1.0 - inkM * 0.05;

  // ---- light the thread (weave normal, tilt slightly along the satin run) ----
  c += hi * 0.46 * (0.5 + bevel * 0.5);
  c -= sh * 0.36;
  // inner shadow at the patch edge (PSD inner shadow) — tighter band
  float edge = 1.0 - smoothstep(0.0, 0.32, cover);
  c *= 1.0 - edge * 0.28 * cover;
  // fine thread noise
  c += (noise(dp * 380.0) - 0.5) * 0.045;

  // hover: a tight SPECULAR GLINT that travels the satin threads near the cursor, so
  // the floss sparkles as you move over it. The glint rides the satin ridge (bright
  // thread crowns) and falls off with distance from the pointer -> a moving highlight,
  // not a flat wash.
  if (uHover > 0.001) {
    float d = distance(dp, uWash * vec2(uAspect, 1.0));
    float halo = 1.0 - smoothstep(0.0, 0.42, d);          // soft pool around the cursor
    float crown = smoothstep(0.72, 1.0, ridge);           // only the raised thread crowns
    float glint = halo * halo * (0.35 + crown * 0.9) * uHover;
    c += glint * 0.16 * cover;
  }

  // PRESS DENT: where pressed, the patch is pushed into the cloth — it darkens a touch
  // and its thread highlights dim (less light reaches a recessed surface). Patch-only
  // (multiplied by cover), so the fabric stays put.
  c *= 1.0 - pressLocal * 0.16 * cover;

  c = clamp(c, 0.0, 1.0);
  // crisper patch edge (tighter AA) so it reads as a cut patch, not an airbrush
  float aa = smoothstep(0.06, 0.2, cover);
  gl_FragColor = vec4(mix(col, c, aa), 1.0);
}
`,s=[{word:"made",cx:.44,cy:.29,scale:.32,rotDeg:-4,fill:[.42,.62,.92],ink:[.09,.09,.1],border:[.97,.97,.98],stitchDeg:70},{word:"with",cx:.6,cy:.51,scale:.28,rotDeg:3,fill:[.96,.82,.36],ink:[.09,.09,.1],border:[.98,.98,.96],stitchDeg:20},{word:"love",cx:.48,cy:.72,scale:.34,rotDeg:-2,fill:[.9,.62,.82],ink:[.09,.09,.1],border:[.98,.97,.98],stitchDeg:100}],o=[.16,.13,.2];async function l(e,t,i){let a=Math.max(1,Math.round(e)),r=Math.max(1,Math.round(t)),l=()=>{let e=document.createElement("canvas");return e.width=a,e.height=r,e},u=Math.max(3,.018*r),f=Math.max(1.5,.007*r),m=l(),p=m.getContext("2d"),g=l().getContext("2d"),v=l().getContext("2d"),w=l(),T=w.getContext("2d"),x=l(),b=x.getContext("2d");for(let e of(b.fillStyle=h(o),b.fillRect(0,0,a,r),p.globalCompositeOperation="lighten",g.globalCompositeOperation="lighten",v.globalCompositeOperation="lighten",s)){let t=l();!function(e,t,i,a,r){let s=t.scale*a;e.save(),e.translate(t.cx*i,t.cy*a),e.rotate(t.rotDeg*Math.PI/180),e.font=`800 ${s}px ${r}`,e.fillStyle="#fff",e.textAlign="center",e.textBaseline="middle",e.fillText(t.word,0,0),e.restore()}(t.getContext("2d"),e,a,r,i);let s=l();c(s.getContext("2d"),t,2.1*u);let o=l();c(o.getContext("2d"),t,1.05*u);let f=l(),m=f.getContext("2d");m.drawImage(s,0,0),m.globalCompositeOperation="destination-out",m.drawImage(o,0,0),m.globalCompositeOperation="source-over";let w=l(),x=w.getContext("2d");x.drawImage(s,0,0),x.globalCompositeOperation="source-in",x.fillStyle=h(e.fill),x.fillRect(0,0,a,r),x.globalCompositeOperation="source-over",n(x,f,e.border),n(x,t,e.ink),b.drawImage(w,0,0),p.drawImage(s,0,0),d(g,s,t),d(v,s,f),T.drawImage(t,0,0)}let E=l().getContext("2d");E.filter=`blur(${f.toFixed(2)}px)`,E.drawImage(m,0,0),E.filter="none";let A=l().getContext("2d");A.filter=`blur(${Math.max(2,.02*r).toFixed(2)}px)`,A.drawImage(w,0,0),A.filter="none";let R=l().getContext("2d");R.filter=`blur(${Math.max(2,.016*r).toFixed(2)}px)`,R.drawImage(m,0,0),R.filter="none";let P=E.getImageData(0,0,a,r).data,y=g.getImageData(0,0,a,r).data,_=v.getImageData(0,0,a,r).data,D=A.getImageData(0,0,a,r).data,I=R.getImageData(0,0,a,r).data,U=new Uint8Array(a*r*4),M=(e,t,i)=>{let s=(t,i)=>(t=t<0?0:t>=a?a-1:t,e[((i=i<0?0:i>=r?r-1:i)*a+t)*4+3]);return[s(t+1,i)-s(t-1,i),s(t,i+1)-s(t,i-1)]};for(let e=0;e<r;e++)for(let t=0;t<a;t++){let i=(e*a+t)*4,[r,s]=M(_[i+3]>40&&y[i+3]<40?I:D,t,e),o=Math.atan2(s,r)+Math.PI/2;o=(o%Math.PI+Math.PI)%Math.PI,U[i]=P[i+3],U[i+1]=y[i+3],U[i+2]=_[i+3],U[i+3]=Math.round(o/Math.PI*255)}return{art:x,field:{data:U,width:a,height:r}}}function h(e){let t=e=>Math.round(255*Math.max(0,Math.min(1,e)));return`rgb(${t(e[0])},${t(e[1])},${t(e[2])})`}function n(e,t,i){let a=e.canvas.width,r=e.canvas.height,s=document.createElement("canvas");s.width=a,s.height=r;let o=s.getContext("2d");o.drawImage(t,0,0),o.globalCompositeOperation="source-in",o.fillStyle=h(i),o.fillRect(0,0,a,r),e.drawImage(s,0,0)}function c(e,t,i){for(let a=1;a>=.5;a-=.5)for(let r=0;r<28;r++){let s=r/28*Math.PI*2;e.drawImage(t,Math.cos(s)*i*a,Math.sin(s)*i*a)}e.drawImage(t,0,0)}function d(e,t,i){e.globalCompositeOperation="destination-out",e.drawImage(t,0,0),e.globalCompositeOperation="lighten",e.drawImage(i,0,0)}var u=e.i(35877);let f=73*Math.PI/180,m=(0,u.mediaUrl)("/vault/embroidery-weave.webp");class p{host;canvas;gl=null;prog=null;loc={};quad=null;artTex=null;fieldTex=null;weave=null;texW=1;texH=1;raf=0;running=!1;awake=!1;w=0;h=0;dpr=1;fontFamily="var(--font-neue-corp), sans-serif";builtW=0;builtH=0;builtFont="";buildScheduled=0;destroyed=!1;painted=!1;hover=0;hoverTarget=0;wx=.5;wy=.55;twx=.5;twy=.55;press=0;pressVel=0;pressKick=0;px=.5;py=.5;ok=!1;constructor(e,t){this.host=e,t&&(this.fontFamily=t),this.canvas=document.createElement("canvas"),Object.assign(this.canvas.style,{position:"absolute",inset:"0",width:"100%",height:"100%",display:"block",opacity:"0"}),e.appendChild(this.canvas);const i=this.canvas.getContext("webgl",{alpha:!1,antialias:!1,premultipliedAlpha:!1});if(!i)return;this.gl=i;try{this.prog=this.build(a,r)}catch{this.gl=null;return}const s=this.prog;for(const e of["uArt","uField","uWeave","uTexel","uLight","uLightZ","uWash","uHover","uPress","uPressPos","uAspect","uFabric","uDepth","uWeaveScale"])this.loc[e]=i.getUniformLocation(s,e);const l=i.getAttribLocation(s,"aPosition"),h=i.getAttribLocation(s,"aUV"),n=new Float32Array([-1,-1,0,1,1,-1,1,1,-1,1,0,0,1,1,1,0]);this.quad=i.createBuffer(),i.bindBuffer(i.ARRAY_BUFFER,this.quad),i.bufferData(i.ARRAY_BUFFER,n,i.STATIC_DRAW),i.useProgram(s),i.enableVertexAttribArray(l),i.vertexAttribPointer(l,2,i.FLOAT,!1,16,0),i.enableVertexAttribArray(h),i.vertexAttribPointer(h,2,i.FLOAT,!1,16,8),i.clearColor(.8*o[0],.8*o[1],.8*o[2],1),this.resize(),this.weave=this.newPlaceholder([150,150,150,255]),this.loadWeave(),this.buildSceneNow(),this.canvas.addEventListener("pointermove",this.onMove),this.ok=!0}newPlaceholder(e){let t=this.gl;if(!t)return null;let i=t.createTexture();return t.bindTexture(t.TEXTURE_2D,i),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,1,1,0,t.RGBA,t.UNSIGNED_BYTE,new Uint8Array(e)),i}loadWeave(){let e=new Image;e.crossOrigin="anonymous",e.onload=()=>{let t=this.gl;t&&this.weave&&!this.destroyed&&(t.bindTexture(t.TEXTURE_2D,this.weave),t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,!0),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,e),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.REPEAT),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.REPEAT),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,!1),this.running||this.render())},e.src=m}build(e,t){let i=this.gl,a=(e,t)=>{let a=i.createShader(e);if(i.shaderSource(a,t),i.compileShader(a),!i.getShaderParameter(a,i.COMPILE_STATUS))throw Error(i.getShaderInfoLog(a)||"compile failed");return a},r=i.createProgram();if(i.attachShader(r,a(i.VERTEX_SHADER,e)),i.attachShader(r,a(i.FRAGMENT_SHADER,t)),i.linkProgram(r),!i.getProgramParameter(r,i.LINK_STATUS))throw Error(i.getProgramInfoLog(r)||"link failed");return r}setFont(e){e!==this.fontFamily&&(this.fontFamily=e,this.scheduleBuild())}setPatch(e){}setHover(e){this.hoverTarget=Math.max(0,Math.min(1,e)),this.wake()}pressTap(e=.5,t=.5){this.px=e,this.py=1-t,this.pressKick=1,this.wake()}wake(){this.awake&&!this.running?this.start():this.running||this.render()}onMove=e=>{let t=this.canvas.getBoundingClientRect();this.twx=(e.clientX-t.left)/t.width,this.twy=1-(e.clientY-t.top)/t.height,this.wake()};resize(){let e=this.host.getBoundingClientRect();this.dpr=Math.min(2,window.devicePixelRatio||1),this.w=e.width,this.h=e.height;let t=Math.max(1,Math.round(this.w*this.dpr)),i=Math.max(1,Math.round(this.h*this.dpr));(this.canvas.width!==t||this.canvas.height!==i)&&(this.canvas.width=t,this.canvas.height=i,this.gl?.viewport(0,0,t,i),this.scheduleBuild())}maskSize(){let e=Math.max(2,Math.min(1400,Math.round(this.w*this.dpr))),t=Math.max(2,Math.round(e*(this.h/Math.max(1,this.w))));return[e,t]}scheduleBuild(){if(!this.gl||this.destroyed)return;let[e,t]=this.maskSize();if(e===this.builtW&&t===this.builtH&&this.fontFamily===this.builtFont||this.buildScheduled)return;let i=()=>{this.buildScheduled=0,this.buildSceneNow()},a=window.requestIdleCallback;this.buildScheduled=a?a(i,{timeout:200}):window.setTimeout(i,0)}uploadCanvas(e,t){let i=this.gl;i.bindTexture(i.TEXTURE_2D,e),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MAG_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.texImage2D(i.TEXTURE_2D,0,i.RGBA,i.RGBA,i.UNSIGNED_BYTE,t)}uploadPixels(e,t){let i=this.gl;i.bindTexture(i.TEXTURE_2D,e),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MAG_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.texImage2D(i.TEXTURE_2D,0,i.RGBA,t.width,t.height,0,i.RGBA,i.UNSIGNED_BYTE,t.data)}async buildSceneNow(){let e=this.gl;if(!e||this.destroyed)return;if(this.buildScheduled){let e=window.cancelIdleCallback;e?e(this.buildScheduled):window.clearTimeout(this.buildScheduled),this.buildScheduled=0}let[t,i]=this.maskSize();this.builtW=t,this.builtH=i,this.builtFont=this.fontFamily;let a=await l(t,i,this.fontFamily);this.gl&&!this.destroyed&&(this.artTex||(this.artTex=e.createTexture()),this.fieldTex||(this.fieldTex=e.createTexture()),this.uploadCanvas(this.artTex,a.art),this.uploadPixels(this.fieldTex,a.field),this.texW=a.field.width,this.texH=a.field.height,this.running||this.render())}start(){if(!this.ok||(this.awake=!0,this.running))return;this.running=!0,this.resize();let e=()=>{this.running&&(this.frame(),this.raf=requestAnimationFrame(e))};this.raf=requestAnimationFrame(e)}stop(){this.awake=!1,this.pause()}pause(){this.running=!1,this.raf&&cancelAnimationFrame(this.raf),this.raf=0}frame(){this.hover+=(this.hoverTarget-this.hover)*.12,this.wx+=(this.twx-this.wx)*.12,this.wy+=(this.twy-this.wy)*.12,this.pressKick*=.8,this.pressKick<.002&&(this.pressKick=0),this.pressVel+=(this.pressKick-this.press)*.28,this.pressVel*=.6,this.press+=this.pressVel,this.render()}renderStill(){this.resize(),this.buildSceneNow(),this.render()}render(){let e=this.gl;if(!e||!this.prog||!this.artTex||!this.fieldTex)return;let t=f+(this.wx-.5)*1.4*this.hover;e.useProgram(this.prog),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.artTex),e.uniform1i(this.loc.uArt,0),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,this.fieldTex),e.uniform1i(this.loc.uField,1),e.activeTexture(e.TEXTURE2),e.bindTexture(e.TEXTURE_2D,this.weave),e.uniform1i(this.loc.uWeave,2),e.uniform1f(this.loc.uWeaveScale,15),e.uniform2f(this.loc.uTexel,1/this.texW,1/this.texH),e.uniform2f(this.loc.uLight,Math.cos(t),Math.sin(t)),e.uniform1f(this.loc.uLightZ,.55),e.uniform2f(this.loc.uWash,this.wx,this.wy),e.uniform1f(this.loc.uHover,this.hover),e.uniform1f(this.loc.uPress,Math.max(0,Math.min(1,this.press))),e.uniform2f(this.loc.uPressPos,this.px,this.py),e.uniform1f(this.loc.uAspect,this.w/Math.max(1,this.h)),e.uniform3f(this.loc.uFabric,o[0],o[1],o[2]),e.uniform1f(this.loc.uDepth,1.15),e.drawArrays(e.TRIANGLE_STRIP,0,4),this.painted||(this.painted=!0,this.canvas.style.opacity="1"),.002>Math.abs(this.hover-this.hoverTarget)&&this.hoverTarget<.002&&.001>Math.abs(this.wx-this.twx)&&.001>Math.abs(this.wy-this.twy)&&0===this.pressKick&&.002>Math.abs(this.press)&&.002>Math.abs(this.pressVel)&&this.pause()}destroy(){if(this.destroyed=!0,this.buildScheduled){let e=window.cancelIdleCallback;e?e(this.buildScheduled):window.clearTimeout(this.buildScheduled),this.buildScheduled=0}this.stop(),this.canvas.removeEventListener("pointermove",this.onMove);let e=this.gl;e&&(this.artTex&&e.deleteTexture(this.artTex),this.fieldTex&&e.deleteTexture(this.fieldTex),this.weave&&e.deleteTexture(this.weave),this.quad&&e.deleteBuffer(this.quad),e.getExtension("WEBGL_lose_context")?.loseContext()),this.canvas.remove()}}var g=e.i(38362),v=e.i(37878),w=e.i(20268);e.s(["FolderEmbroideryCard",0,function({bare:e=!1,viewTransitionName:a}={}){let r=(0,i.useRef)(null),s=(0,i.useRef)(null);return(0,i.useEffect)(()=>{let e=r.current;if(!e)return;let t=window.matchMedia("(prefers-reduced-motion: reduce)").matches,i=null,a=!1,o=!1,l=!1,h=()=>{i&&!t&&(!a||o||l?i.stop():i.start())},n=!1,c=a=>{n||!r.current||(n=!0,s.current=i=new p(e,a?`"${a}", sans-serif`:void 0),i.ok&&(t?i.renderStill():h()))},d="u">typeof document&&"fonts"in document&&!!document.fonts,u=requestAnimationFrame(()=>{let e,t;if(!r.current)return;let i=d?((e=document.createElement("span")).style.cssText="position:absolute;visibility:hidden",e.style.fontFamily="var(--font-neue-corp)",e.textContent="Ag",document.body.appendChild(e),t=getComputedStyle(e).fontFamily.split(",")[0].replace(/["']/g,"").trim(),document.body.removeChild(e),t):"";if(d&&i){let e=window.setTimeout(()=>c(i),350);document.fonts.load(`800 1em "${i}"`).then(()=>{window.clearTimeout(e),c(i)},()=>{window.clearTimeout(e),c(i)})}else c()}),f=new IntersectionObserver(e=>{a=e[0]?.isIntersecting??!1,h()},{threshold:.2});f.observe(e);let m=()=>{o=document.hidden,h()};document.addEventListener("visibilitychange",m);let g=(0,w.onTransitionChange)(e=>{l=e,h()}),v=0,T=()=>{window.clearTimeout(v),v=window.setTimeout(()=>i?.resize(),120)};return window.addEventListener("resize",T),()=>{cancelAnimationFrame(u),f.disconnect(),document.removeEventListener("visibilitychange",m),g(),window.removeEventListener("resize",T),window.clearTimeout(v),i?.destroy(),s.current=null}},[]),(0,t.jsx)("div",{ref:r,"data-canvas-card":!0,"aria-label":"Live embroidered word-patches (made / with / love) stitched onto fabric; hover sends a glint across the threads, click presses them into the cloth.",style:a?{viewTransitionName:a}:void 0,className:"relative mx-auto aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[#2a2233]",onPointerEnter:()=>{s.current?.setHover(1),(0,g.hoverLink)(),(0,v.hapticHover)()},onPointerLeave:()=>s.current?.setHover(0),onPointerDown:e=>{let t=r.current;if(t){let i=t.getBoundingClientRect();s.current?.pressTap((e.clientX-i.left)/i.width,(e.clientY-i.top)/i.height)}else s.current?.pressTap(.5,.5);(0,v.hapticTap)(),(0,g.buttonClick)("earth")}})}],86610)},58354,e=>{e.n(e.i(86610))}]);