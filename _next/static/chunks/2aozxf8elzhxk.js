(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,13590,t=>{"use strict";var e=t.i(43476),i=t.i(71645);let a="var(--font-mondwest)",r=[{word:"wow",font:a,weight:400,outline:"#ff2e6e",fill:"#2b0b4f",x:.17,y:.28,rot:0},{word:"design",font:a,weight:400,outline:"#7c4dff",fill:"#eaff5a",x:.66,y:.24,rot:0},{word:"vault",font:a,weight:400,outline:"#00b3a4",fill:"#ff3d6e",x:.82,y:.7,rot:0},{word:"yes!",font:a,weight:400,outline:"#ff7a1a",fill:"#0a2f6b",x:.3,y:.74,rot:0},{word:"arlan",font:a,weight:400,outline:"#ffd21e",fill:"#c81e5b",x:.52,y:.55,rot:0},{word:"ship it",font:a,weight:400,outline:"#1668ff",fill:"#7dffb0",x:.2,y:.55,rot:0}];function s(t){let e=t.dpr??Math.min(window.devicePixelRatio||1,2),i=t.fontSizePx,a=t.border??Math.max(6,Math.round(.16*i)),r=`${t.weight} ${i}px ${t.font}`,s=document.createElement("canvas").getContext("2d");s.font=r;let o=s.measureText(t.word),n=o.actualBoundingBoxAscent||.8*i,l=o.actualBoundingBoxDescent||.2*i,h=o.width,d=a+4,c=Math.ceil(h+2*d),f=Math.ceil(n+l+2*d),u=document.createElement("canvas");u.width=Math.ceil(c*e),u.height=Math.ceil(f*e);let p=u.getContext("2d");p.scale(e,e),p.textBaseline="alphabetic",p.font=r;let g=d+n,m=document.createElement("canvas");m.width=u.width,m.height=u.height;let x=m.getContext("2d");x.scale(e,e),x.font=r,x.textBaseline="alphabetic",x.fillStyle=t.outline;for(let e=a;e>.5;e-=1){let i=Math.max(16,Math.ceil(3*e));for(let a=0;a<i;a++){let r=a/i*Math.PI*2;x.fillText(t.word,d+Math.cos(r)*e,g+Math.sin(r)*e)}}return x.fillText(t.word,d,g),p.setTransform(1,0,0,1,0,0),p.drawImage(m,0,0),p.setTransform(e,0,0,e,0,0),p.fillStyle=t.fill,p.font=r,p.textBaseline="alphabetic",p.fillText(t.word,d,g),{canvas:u,width:c,height:f}}let o=`
  attribute vec2 aPosition; // -0.5..0.5 quad space
  attribute vec2 aUV;       // 0..1

  uniform vec2  uGrabUV;    // where the pointer grabbed (uv)
  uniform vec2  uAnchorUV;  // the far anchor the peel rolls toward (uv)
  uniform float uFraction;  // 0..1 peel progress
  uniform float uElevation; // max z lift
  uniform float uPullback;  // how much the lifted part pulls back along the axis
  uniform float uAspect;    // width/height, to keep the pullback isotropic
  uniform vec2  uDragOffset;// xy shift while dragging (quad space)
  uniform mat4  uProj;

  varying vec2  vUV;
  varying float vLift;
  varying vec3  vWorldPos;  // for normal reconstruction in the fragment shader

  float smooth01(float x){ x = clamp(x,0.0,1.0); return x*x*(3.0-2.0*x); }

  // A moving window: as uFraction goes 0→1 the lifted band sweeps from the grab
  // (t=0) outward to t=1. Vertices behind the front are fully lifted, so a real fold
  // rolls across and a corner curls up.
  float valueAt(float fraction, float t){
    float windowSize = 0.85;
    float front = mix(-windowSize, 1.0, fraction);
    float w = clamp((t - front) / windowSize, 0.0, 1.0);
    return 1.0 - smooth01(w);
  }

  void main(){
    vUV = aUV;
    vec3 pos = vec3(aPosition, 0.0);

    vec2 axis = uAnchorUV - uGrabUV;
    float axisLen2 = max(dot(axis, axis), 1e-4);
    float tSigned = dot(aUV - uGrabUV, axis) / axisLen2;
    float t = clamp(abs(tSigned), 0.0, 1.0);

    float lift = valueAt(uFraction, t);
    pos.z += lift * uElevation;

    // curl: pull the lifted part back along the peel axis
    vec2 axisDir = axis / sqrt(axisLen2);
    vec2 shift = vec2(axisDir.x * uAspect, axisDir.y) * lift * uPullback;
    pos.xy -= shift;
    pos.xy += uDragOffset;

    vLift = lift;
    vWorldPos = pos;
    gl_Position = uProj * vec4(pos, 1.0);
  }
`,n=`
  #extension GL_OES_standard_derivatives : enable
  precision highp float;
  uniform sampler2D uTex;
  uniform float uAlphaCutoff;
  varying vec2  vUV;
  varying float vLift;
  varying vec3  vWorldPos;

  void main(){
    vec4 tex = texture2D(uTex, vUV);
    if (tex.a < uAlphaCutoff) discard;

    // Reconstruct the real surface normal from the peeled geometry (screen-space
    // derivatives of the world position), then light it with one directional light
    // + ambient — a plain, realistic shade, no rainbow/holographic tint. The flat
    // (unlifted) part keeps its normal facing the camera, so it renders unchanged;
    // the curled part turns away and shades naturally.
    vec3 dpx = dFdx(vWorldPos);
    vec3 dpy = dFdy(vWorldPos);
    vec3 N = normalize(cross(dpx, dpy));
    if (N.z < 0.0) N = -N; // face the camera

    vec3 L = normalize(vec3(-0.35, 0.5, 0.8)); // key light from upper-left-front
    float diff = clamp(dot(N, L), 0.0, 1.0);
    // ambient so shadows never go black; light scales gently around 1.0 so a flat
    // sticker (N≈+z, diff≈0.72) reads at full color and the curl darkens/brightens.
    float shade = 0.72 + 0.5 * diff;

    // a soft specular glint on the steepest part of the curl (backing sheen), subtle
    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 H = normalize(L + V);
    float spec = pow(clamp(dot(N, H), 0.0, 1.0), 24.0) * vLift * 0.25;

    vec3 rgb = clamp(tex.rgb * shade + spec, 0.0, 1.0);
    gl_FragColor = vec4(rgb, tex.a);
  }
`,l=`
  precision highp float;
  uniform sampler2D uTex;
  uniform float uAlphaCutoff;
  varying vec2  vUV;
  varying float vLift;

  void main(){
    vec4 tex = texture2D(uTex, vUV);
    if (tex.a < uAlphaCutoff) discard;
    // more lift → more turned away from the light → a touch darker, with a small
    // brighten right at the start of the fold. Plain shading, no tint.
    float shade = 1.0 - vLift * 0.22 + smoothstep(0.0, 0.25, vLift) * 0.08;
    gl_FragColor = vec4(clamp(tex.rgb * shade, 0.0, 1.0), tex.a);
  }
`;class h{canvas;gl;prog;posBuf;uvBuf;idxBuf;idxCount=0;loc={};aPos=0;aUV=0;dpr=1;W=1;H=1;ok=!1;constructor(){this.canvas=document.createElement("canvas"),Object.assign(this.canvas.style,{position:"absolute",inset:"0",width:"100%",height:"100%",display:"block",pointerEvents:"none"});const t=this.canvas.getContext("webgl",{alpha:!0,premultipliedAlpha:!1,antialias:!0});if(!t){this.gl=null,this.prog=null,this.posBuf=this.uvBuf=this.idxBuf=null;return}this.gl=t;const e=!!t.getExtension("OES_standard_derivatives");for(const i of(this.prog=this.build(o,e?n:l),this.aPos=t.getAttribLocation(this.prog,"aPosition"),this.aUV=t.getAttribLocation(this.prog,"aUV"),["uGrabUV","uAnchorUV","uFraction","uElevation","uPullback","uAspect","uDragOffset","uProj","uTex","uAlphaCutoff"]))this.loc[i]=t.getUniformLocation(this.prog,i);const i=this.buildMesh();this.posBuf=i.posBuf,this.uvBuf=i.uvBuf,this.idxBuf=i.idxBuf,this.idxCount=i.count,t.enable(t.BLEND),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA),this.ok=!0}get available(){return this.ok}build(t,e){let i=this.gl,a=(t,e)=>{let a=i.createShader(t);if(i.shaderSource(a,e),i.compileShader(a),!i.getShaderParameter(a,i.COMPILE_STATUS))throw Error(i.getShaderInfoLog(a)||"shader compile failed");return a},r=i.createProgram();if(i.attachShader(r,a(i.VERTEX_SHADER,t)),i.attachShader(r,a(i.FRAGMENT_SHADER,e)),i.linkProgram(r),!i.getProgramParameter(r,i.LINK_STATUS))throw Error(i.getProgramInfoLog(r)||"program link failed");return r}buildMesh(){let t=this.gl,e=[],i=[],a=[];for(let t=0;t<=24;t++)for(let a=0;a<=24;a++){let r=a/24,s=t/24;e.push(r-.5,s-.5),i.push(r,1-s)}for(let t=0;t<24;t++)for(let e=0;e<24;e++){let i=25*t+e,r=i+1,s=i+25,o=s+1;a.push(i,r,s,r,o,s)}let r=(e,i)=>{let a=t.createBuffer();return t.bindBuffer(i,a),t.bufferData(i,e,t.STATIC_DRAW),a};return{posBuf:r(new Float32Array(e),t.ARRAY_BUFFER),uvBuf:r(new Float32Array(i),t.ARRAY_BUFFER),idxBuf:r(new Uint16Array(a),t.ELEMENT_ARRAY_BUFFER),count:a.length}}makeTexture(t,e,i){let a=this.gl,r=a.createTexture();return a.bindTexture(a.TEXTURE_2D,r),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MIN_FILTER,a.LINEAR),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_MAG_FILTER,a.LINEAR),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_S,a.CLAMP_TO_EDGE),a.texParameteri(a.TEXTURE_2D,a.TEXTURE_WRAP_T,a.CLAMP_TO_EDGE),a.texImage2D(a.TEXTURE_2D,0,a.RGBA,a.RGBA,a.UNSIGNED_BYTE,t),{tex:r,texW:e,texH:i}}resize(t,e,i){this.W=t,this.H=e,this.dpr=i,this.canvas.width=Math.max(1,Math.round(t*i)),this.canvas.height=Math.max(1,Math.round(e*i)),this.ok&&this.gl.viewport(0,0,this.canvas.width,this.canvas.height)}beginFrame(){if(!this.ok)return;let t=this.gl;t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT),t.useProgram(this.prog),t.bindBuffer(t.ARRAY_BUFFER,this.posBuf),t.enableVertexAttribArray(this.aPos),t.vertexAttribPointer(this.aPos,2,t.FLOAT,!1,0,0),t.bindBuffer(t.ARRAY_BUFFER,this.uvBuf),t.enableVertexAttribArray(this.aUV),t.vertexAttribPointer(this.aUV,2,t.FLOAT,!1,0,0),t.bindBuffer(t.ELEMENT_ARRAY_BUFFER,this.idxBuf)}drawSticker(t){if(!this.ok)return;let e=this.gl,i=t.w*t.scale,a=t.h*t.scale,r=t.x+t.w/2,s=t.y+t.h/2,o=i/this.W*2,n=a/this.H*2,l=r/this.W*2-1,h=1-s/this.H*2,d=new Float32Array([o,0,0,0,0,n,0,0,0,0,1,-.6/Math.max(this.W,this.H),l,h,0,1]);e.uniformMatrix4fv(this.loc.uProj,!1,d),e.uniform2f(this.loc.uGrabUV,t.grabU,t.grabV),e.uniform2f(this.loc.uAnchorUV,t.anchorU,t.anchorV),e.uniform1f(this.loc.uFraction,t.fraction),e.uniform1f(this.loc.uElevation,t.elevation),e.uniform1f(this.loc.uPullback,t.pullback),e.uniform1f(this.loc.uAspect,i/Math.max(1,a)),e.uniform2f(this.loc.uDragOffset,t.dragOffX,t.dragOffY),e.uniform1f(this.loc.uAlphaCutoff,.02),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,t.tex),e.uniform1i(this.loc.uTex,0),e.drawElements(e.TRIANGLES,this.idxCount,e.UNSIGNED_SHORT,0)}destroy(){if(!this.ok)return;let t=this.gl;t.getExtension("WEBGL_lose_context")?.loseContext()}}function d(t){let e=document.createElement("span");e.style.fontFamily=t,e.style.position="absolute",e.style.visibility="hidden",e.textContent="Ag",document.body.appendChild(e);let i=getComputedStyle(e).fontFamily||"sans-serif";return document.body.removeChild(e),i}class c{host;items=[];W=1;H=1;dpr=1;gl=null;useGL=!1;raf=0;running=!1;disposed=!1;laidOut=!1;entranceStarted=!1;now=0;drag=null;ro;cleanup=[];constructor(t){this.host=t,this.dpr=Math.min(window.devicePixelRatio||1,2),this.measure();const e=new h;for(const i of(e.available&&(this.gl=e,this.useGL=!0,e.resize(this.W,this.H,this.dpr),t.appendChild(e.canvas)),r)){const e=this.stickerFontPx(),a=s({word:i.word,font:d(i.font),weight:i.weight,fill:i.fill,outline:i.outline,fontSizePx:e}),r=a.canvas;let o=null;this.useGL&&this.gl?o=this.gl.makeTexture(r,a.width,a.height).tex:(Object.assign(r.style,{position:"absolute",width:`${a.width}px`,height:`${a.height}px`,left:"0",top:"0",pointerEvents:"none"}),r.setAttribute("aria-hidden","true"),t.appendChild(r));const n=document.createElement("div");Object.assign(n.style,{position:"absolute",left:"0",top:"0",width:`${a.width}px`,height:`${a.height}px`,cursor:"grab",touchAction:"none"}),n.setAttribute("aria-hidden","true"),t.appendChild(n);const l={def:i,art:r,hit:n,tex:o,w:a.width,h:a.height,x:i.x*this.W-a.width/2,y:i.y*this.H-a.height/2,tx:0,ty:0,vx:0,vy:0,scale:1,dragging:!1,peel:0,grabU:.5,grabV:.5,anchorU:.5,anchorV:.5,offX:0,offY:0,appear:0,appearAt:0};l.tx=l.x,l.ty=l.y,this.clampInside(l),this.placeItem(l),this.items.push(l),this.bindDrag(l)}this.ro=new ResizeObserver(()=>this.onResize()),this.ro.observe(t)}measure(){this.W=this.host.clientWidth||1,this.H=this.host.clientHeight||1}stickerFontPx(){return Math.max(32,Math.min(66,.088*(this.W>40?this.W:640)))}onResize(){let t=this.W,e=this.H;if(this.measure(),this.W<2||this.H<2)return;this.gl?.resize(this.W,this.H,this.dpr);let i=this.W/(t||1),a=this.H/(e||1);for(let t of this.items)t.x*=i,t.y*=a,t.tx=t.x,t.ty=t.y;this.rerenderAll()}effScale(t){let e=t.appearAt>0?t.appear:1;return t.scale*e}placeItem(t){let e=this.effScale(t),i=`translate(${t.x}px, ${t.y}px)${1!==e?` scale(${e})`:""}`;t.hit.style.transform=i,this.useGL||(t.art.style.transform=i)}clampInside(t){t.x=Math.max(0,Math.min(this.W-t.w,t.x)),t.y=Math.max(0,Math.min(this.H-t.h,t.y))}bindDrag(t){let e=e=>{e.preventDefault(),this.host.appendChild(t.hit),t.dragging=!0,t.vx=t.vy=0,t.hit.style.cursor="grabbing",t.hit.style.zIndex="10";let i=this.rect(),a=(e.clientX-i.left-t.x)/t.w,r=(e.clientY-i.top-t.y)/t.h;t.grabU=Math.min(1,Math.max(0,a)),t.grabV=Math.min(1,Math.max(0,r)),t.anchorU=1-t.grabU,t.anchorV=1-t.grabV,this.drag={item:t,dx:e.clientX-i.left-t.x,dy:e.clientY-i.top-t.y,lastX:e.clientX,lastY:e.clientY,moved:0,pointerId:e.pointerId},t.hit.setPointerCapture?.(e.pointerId)};t.hit.addEventListener("pointerdown",e),this.cleanup.push(()=>t.hit.removeEventListener("pointerdown",e));let i=e=>{if(!this.drag||this.drag.item!==t)return;let i=this.rect();t.tx=e.clientX-i.left-this.drag.dx,t.ty=e.clientY-i.top-this.drag.dy,this.drag.moved+=Math.hypot(e.clientX-this.drag.lastX,e.clientY-this.drag.lastY),this.drag.lastX=e.clientX,this.drag.lastY=e.clientY};t.hit.addEventListener("pointermove",i),this.cleanup.push(()=>t.hit.removeEventListener("pointermove",i));let a=e=>{this.drag&&this.drag.item===t&&(t.dragging=!1,t.hit.style.cursor="grab",t.hit.style.zIndex="",t.vx*=.7,t.vy*=.7,t.hit.releasePointerCapture?.(e.pointerId),this.drag=null)};t.hit.addEventListener("pointerup",a),t.hit.addEventListener("pointercancel",a),this.cleanup.push(()=>{t.hit.removeEventListener("pointerup",a),t.hit.removeEventListener("pointercancel",a)})}rect(){return this.host.getBoundingClientRect()}start(){if(this.running||this.disposed)return;let t=this.W;if(this.measure(),(!this.laidOut||Math.abs(this.W-t)>2)&&(this.layout(),this.laidOut=!0),!this.entranceStarted){this.entranceStarted=!0;let t=[...this.items].sort((t,e)=>t.def.x-e.def.x),e=performance.now()+150;t.forEach((t,i)=>t.appearAt=e+140*i)}this.running=!0,this.raf=requestAnimationFrame(this.loop)}stop(){this.running=!1,this.raf&&cancelAnimationFrame(this.raf),this.raf=0}layout(){if(!(this.W<2)&&!(this.H<2)){for(let t of(this.gl?.resize(this.W,this.H,this.dpr),this.rerenderAll(),this.items))t.x=t.def.x*this.W-t.w/2,t.y=t.def.y*this.H-t.h/2,t.tx=t.x,t.ty=t.y,t.vx=t.vy=0,t.scale=1,this.clampInside(t),this.placeItem(t);this.drawGL()}}loop=()=>{if(this.running){for(let t of(this.now=performance.now(),this.items)){t.appearAt>0&&this.now>=t.appearAt&&t.appear<1&&(t.appear+=(1-t.appear)*.09,t.appear>.999&&(t.appear=1));let e=t.dragging?1.12:1;Math.abs(e-t.scale)>.001&&(t.scale+=(e-t.scale)*.12);let i=+!!t.dragging;if(Math.abs(i-t.peel)>.001&&(t.peel+=(i-t.peel)*.1),t.dragging){let e=t.x+(t.tx-t.x)*.1,i=t.y+(t.ty-t.y)*.1;t.vx=e-t.x,t.vy=i-t.y,t.x=e,t.y=i,this.placeItem(t);continue}let a=t.appearAt>0&&t.appear<1;(!(!(Math.abs(t.vx)>=.05||Math.abs(t.vy)>=.05)&&t.peel<.001&&.001>Math.abs(t.scale-1))||a)&&(t.x+=t.vx,t.y+=t.vy,t.x<0?(t.x=0,t.vx=-(.55*t.vx)):t.x>this.W-t.w&&(t.x=this.W-t.w,t.vx=-(.55*t.vx)),t.y<0?(t.y=0,t.vy=-(.55*t.vy)):t.y>this.H-t.h&&(t.y=this.H-t.h,t.vy=-(.55*t.vy)),t.vx*=.92,t.vy*=.92,this.placeItem(t))}this.drawGL(),this.raf=requestAnimationFrame(this.loop)}};drawGL(){if(this.useGL&&this.gl)for(let t of(this.gl.beginFrame(),this.items))t.tex&&this.gl.drawSticker({x:t.x,y:t.y,w:t.w,h:t.h,scale:this.effScale(t),grabU:t.grabU,grabV:t.grabV,anchorU:t.anchorU,anchorV:t.anchorV,fraction:t.peel,elevation:.4,pullback:.16,dragOffX:0,dragOffY:0,tex:t.tex})}renderStill(){for(let t of this.items)t.vx=t.vy=0,t.scale=1,t.peel=0,t.appear=1,this.placeItem(t);this.entranceStarted=!0,this.drawGL()}refreshFonts(){this.measure(),this.gl?.resize(this.W,this.H,this.dpr),this.rerenderAll(),this.drawGL()}rerenderAll(){let t=this.stickerFontPx();for(let e of this.items){let i=s({word:e.def.word,font:d(e.def.font),weight:e.def.weight,fill:e.def.fill,outline:e.def.outline,fontSizePx:t});if(e.w=i.width,e.h=i.height,e.hit.style.width=`${i.width}px`,e.hit.style.height=`${i.height}px`,this.useGL&&this.gl)e.tex=this.gl.makeTexture(i.canvas,i.width,i.height).tex;else{let t=e.art.getContext("2d");e.art.width=i.canvas.width,e.art.height=i.canvas.height,e.art.style.width=`${i.width}px`,e.art.style.height=`${i.height}px`,t.clearRect(0,0,e.art.width,e.art.height),t.drawImage(i.canvas,0,0)}this.clampInside(e),this.placeItem(e)}}destroy(){for(let t of(this.disposed=!0,this.stop(),this.cleanup.forEach(t=>t()),this.ro?.disconnect(),this.items))t.hit.parentNode?.removeChild(t.hit),this.useGL||t.art.parentNode?.removeChild(t.art);this.gl?.canvas.parentNode?.removeChild(this.gl.canvas),this.gl?.destroy()}}var f=t.i(20268);t.s(["WordStickersCard",0,function({bare:t=!1}={}){let a=(0,i.useRef)(null);return(0,i.useEffect)(()=>{let t=a.current;if(!t)return;let e=window.matchMedia("(prefers-reduced-motion: reduce)").matches,i=null,s=!1,o=!1,n=!1,l=()=>{i&&!e&&(!s||o||n?i.stop():i.start())},h=requestAnimationFrame(()=>{if(a.current){if(i=new c(t),e)return void i.renderStill();document.fonts?.load&&(Promise.all(Array.from(new Set(r.map(t=>{var e,i;let a,r;return e=t.font,i=t.weight,(a=document.createElement("span")).style.fontFamily=e,a.style.position="absolute",a.style.visibility="hidden",a.textContent="Ag",document.body.appendChild(a),r=getComputedStyle(a).fontFamily.split(",")[0].replace(/["']/g,"").trim(),document.body.removeChild(a),`${i} 1em "${r}"`}))).map(t=>document.fonts.load(t).catch(()=>{}))).then(()=>i?.refreshFonts()),document.fonts.ready.then(()=>i?.refreshFonts()).catch(()=>{})),l()}}),d=new IntersectionObserver(t=>{s=t[0]?.isIntersecting??!1,l()},{threshold:.15});d.observe(t);let u=()=>{o=document.hidden,l()};document.addEventListener("visibilitychange",u);let p=(0,f.onTransitionChange)(t=>{n=t,l()});return()=>{cancelAnimationFrame(h),d.disconnect(),document.removeEventListener("visibilitychange",u),p(),i?.destroy()}},[]),(0,e.jsx)("div",{ref:a,"aria-label":`Draggable word stickers: ${r.map(t=>t.word).join(", ")}`,className:"relative mx-auto aspect-[1344/620] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[var(--bg-page)]"})}],13590)},98482,t=>{t.n(t.i(13590))}]);