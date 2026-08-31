(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,57849,e=>{"use strict";var o=e.i(32009);let t=`
precision highp float;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,r=`
precision highp float;
varying vec2 vUv;

uniform sampler2D src;
uniform vec2 resolution;
uniform vec2 srcScale;     // cover-crop of the source (<=1 on the cropped axis)
uniform float zoom;        // user zoom: >1 scales the source up, <1 shrinks it
uniform vec3 bgColor;      // colour shown around a shrunk source (the background)
uniform float cell;        // pixel cell size (px)

uniform vec3 bandColor[4];  // current colour per brightness band (the "to" preset)
uniform vec3 bandColorB[4]; // previous colour per band (the "from" preset)
uniform float bandLo[4];    // band lower bound (inclusive)
uniform float bandHi[4];    // band upper bound (inclusive)
uniform sampler2D glyph[4];  // current symbol per band
uniform sampler2D glyphB[4]; // previous symbol per band
uniform float morphT;        // 0 = fully previous, 1 = fully current (crossfade)

float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

// map a full-frame uv into the COVER-cropped + user-zoomed source (centred). zoom
// >1 magnifies; zoom <1 shrinks the source so background shows around it.
vec2 cover(vec2 uv) {
  return (uv - 0.5) * srcScale / zoom + 0.5;
}

// snap a uv to the centre of its cell, so a whole cell reads one source colour
vec2 cellUV(vec2 step) {
  return floor(vUv / step) * step + step * 0.5;
}

vec4 sampleGlyph(int i, vec2 uv) {
  if (i == 0) return texture2D(glyph[0], uv);
  if (i == 1) return texture2D(glyph[1], uv);
  if (i == 2) return texture2D(glyph[2], uv);
  return texture2D(glyph[3], uv);
}
vec4 sampleGlyphB(int i, vec2 uv) {
  if (i == 0) return texture2D(glyphB[0], uv);
  if (i == 1) return texture2D(glyphB[1], uv);
  if (i == 2) return texture2D(glyphB[2], uv);
  return texture2D(glyphB[3], uv);
}

void main() {
  vec3 paper = vec3(1.0);
  vec2 step = vec2(cell) / resolution;

  // sample the source at this cell's centre. If the sample falls outside the source
  // — including a 1px inset to avoid the clamped edge column that smears into a thin
  // line, and the area around a shrunk/zoomed source — fill with the background
  // colour instead of black, so a scaled-down video sits on a clean ground.
  vec2 suv = cover(cellUV(step));
  vec2 inset = 1.0 / resolution;
  if (suv.x < inset.x || suv.x > 1.0 - inset.x ||
      suv.y < inset.y || suv.y > 1.0 - inset.y) {
    gl_FragColor = vec4(bgColor, 1.0);
    return;
  }
  float l = lum(texture2D(src, suv).rgb);

  gl_FragColor = vec4(paper, 1.0);
  for (int i = 0; i < 4; i++) {
    if (l >= bandLo[i] && l <= bandHi[i]) {
      vec2 gUv = mod(vUv / step, vec2(1.0));   // glyph repeats once per cell
      // crossfade the glyph alpha AND the band colour from the previous preset
      // (B) to the current one, by morphT — so a remix dissolves smoothly.
      vec4 gA = sampleGlyph(i, gUv);
      vec4 gB = sampleGlyphB(i, gUv);
      float a = mix(gB.a, gA.a, morphT);
      vec3 gcol = mix(gB.rgb, gA.rgb, morphT);
      vec3 col = mix(bandColorB[i], bandColor[i], morphT);
      vec3 sym = mix(paper, gcol, a);          // glyph over paper
      float k = smoothstep(0.0, 1.0, lum(sym));
      gl_FragColor = vec4(mix(col, paper, k), 1.0);
    }
  }
}
`;var s=e.i(65502);class i{renderer;scene=new o.Scene;camera=new o.OrthographicCamera(-1,1,1,-1,0,1);quad;uniforms;canvas;srcAspect=1;video=null;videoTex=null;raf=0;playing=!1;pool=new Map;curUrl=null;pendingSwap=!1;recorder=null;chunks=[];glyphIdx;reqCell;morphRaf=0;constructor(e,s){this.glyphIdx=[...s.bandGlyphs],this.reqCell=s.cell,this.canvas=e,this.renderer=new o.WebGLRenderer({canvas:e,antialias:!0,preserveDrawingBuffer:!0}),this.renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1)),this.renderer.setClearColor(new o.Color(s.bg??"#ffffff"),1);const i=(()=>{let e=document.createElement("canvas");e.width=e.height=4;let t=e.getContext("2d");return t.fillStyle="#9a9a9a",t.fillRect(0,0,4,4),new o.CanvasTexture(e)})(),a=s.bandGlyphs.map(e=>this.makeGlyph(e)),l=s.bandColors.map(e=>new o.Color(e));this.uniforms={src:{value:i},resolution:{value:new o.Vector2(1,1)},srcScale:{value:new o.Vector2(1,1)},zoom:{value:s.zoom??1},bgColor:{value:new o.Color(s.bg??"#ffffff")},cell:{value:s.cell},bandColor:{value:l},bandColorB:{value:l.map(e=>e.clone())},bandLo:{value:[s.bandStops[0],s.bandStops[1],s.bandStops[2],s.bandStops[3]]},bandHi:{value:[s.bandStops[1],s.bandStops[2],s.bandStops[3],s.bandStops[4]]},glyph:{value:a},glyphB:{value:a.map((e,o)=>this.makeGlyph(s.bandGlyphs[o]))},morphT:{value:1}};const n=new o.ShaderMaterial({vertexShader:t,fragmentShader:r,uniforms:this.uniforms});this.quad=new o.Mesh(new o.PlaneGeometry(2,2),n),this.scene.add(this.quad),this.resize(),this.render()}makeGlyph(e){let t=new o.CanvasTexture((0,s.glyphCanvas)(e));return t.wrapS=t.wrapT=o.RepeatWrapping,t}render=()=>{this.renderer.render(this.scene,this.camera)};resize=()=>{let e=this.canvas.getBoundingClientRect(),o=Math.max(1,e.width),t=Math.max(1,e.height);this.renderer.setSize(o,t,!1),this.uniforms.resolution.value.set(o,t),this.applyCell(),this.fit(),this.render()};applyCell(){let e=Math.max(1,this.canvas.getBoundingClientRect().width),o=Math.max(2,this.reqCell*(e/600));this.uniforms.cell.value=o}fit(){this.quad.scale.set(1,1,1);let e=this.canvas.getBoundingClientRect(),o=e.width/Math.max(1,e.height),t=1,r=1;this.srcAspect>o?t=o/this.srcAspect:r=this.srcAspect/o,this.uniforms.srcScale.value.set(t,r)}morphing(){return this.uniforms.morphT.value<1}setCellStops(e,o){this.reqCell=e,this.applyCell(),this.uniforms.bandLo.value=[o[0],o[1],o[2],o[3]],this.uniforms.bandHi.value=[o[1],o[2],o[3],o[4]],this.render()}setZoom(e){this.pendingSwap||(this.uniforms.zoom.value=e,this.render())}commitZoom(e){this.uniforms.zoom.value=e}setBg(e){this.uniforms.bgColor.value.set(e),this.renderer.setClearColor(e,1),this.render()}setColors(e){this.morphing()||this.pendingSwap||(this.uniforms.bandColor.value.forEach((o,t)=>o.set(e[t])),this.uniforms.bandColorB.value.forEach((o,t)=>o.set(e[t])),this.uniforms.morphT.value=1,this.render())}setLook(e,o){cancelAnimationFrame(this.morphRaf);let t=this.uniforms.glyph.value,r=this.uniforms.glyphB.value,s=this.uniforms.bandColor.value,i=this.uniforms.bandColorB.value;for(let a=0;a<4;a++)t[a].dispose(),r[a].dispose(),t[a]=this.makeGlyph(o[a]),r[a]=this.makeGlyph(o[a]),s[a].set(e[a]),i[a].set(e[a]);this.glyphIdx=[...o],this.uniforms.morphT.value=1,this.render()}setGlyph(e,o){this.glyphIdx[e]=o;let t=this.uniforms.glyph.value,r=this.uniforms.glyphB.value;t[e].dispose(),r[e].dispose(),t[e]=this.makeGlyph(o),r[e]=this.makeGlyph(o),this.render()}morphTo(e,o,t=700){cancelAnimationFrame(this.morphRaf);let r=this.uniforms.glyph.value,s=this.uniforms.glyphB.value,i=this.uniforms.bandColor.value,a=this.uniforms.bandColorB.value;for(let t=0;t<4;t++)s[t].dispose(),s[t]=this.makeGlyph(this.glyphIdx[t]),a[t].copy(i[t]),r[t].dispose(),r[t]=this.makeGlyph(o[t]),i[t].set(e[t]);this.glyphIdx=[...o];let l=performance.now(),n=()=>{let e=Math.min(1,(performance.now()-l)/t);this.uniforms.morphT.value=e>=1?1:1-Math.exp(-7.5*e)*Math.cos(5.2*e),this.render(),e<1?this.morphRaf=requestAnimationFrame(n):this.uniforms.morphT.value=1};this.uniforms.morphT.value=0,this.morphRaf=requestAnimationFrame(n)}ensurePooled(e){if(this.pool.has(e))return this.pool.get(e);let t=document.createElement("video");t.src=e.startsWith("blob:")?e:encodeURI(e),t.loop=!0,t.muted=!0,t.playsInline=!0,t.preload="auto",t.crossOrigin="anonymous";let r=new o.VideoTexture(t);r.colorSpace=o.SRGBColorSpace;let s={video:t,tex:r,aspect:1,ready:!1};return t.addEventListener("loadeddata",()=>{s.aspect=t.videoWidth/t.videoHeight||1,s.ready=!0}),t.load(),this.pool.set(e,s),s}preload(e){for(let o of e)this.ensurePooled(o)}setImage(e,t){this.curUrl=e,t&&(this.pendingSwap=!0);let r=e.startsWith("blob:")?e:encodeURI(e);new o.TextureLoader().load(r,r=>{this.curUrl===e&&(r.colorSpace=o.SRGBColorSpace,this.pendingSwap=!1,t&&(this.setLook(t.colors,t.glyphs),void 0!==t.zoom&&this.commitZoom(t.zoom)),this.video&&this.video.pause(),this.stopLoop(),this.uniforms.src.value=r,this.srcAspect=r.image.width/r.image.height,this.video=null,this.videoTex=null,this.fit(),this.render())})}setVideo(e,o){this.curUrl=e,o&&(this.pendingSwap=!0);let t=this.ensurePooled(e),r=()=>{this.curUrl===e&&(this.video&&this.video!==t.video&&this.video.pause(),this.pendingSwap=!1,o&&(this.setLook(o.colors,o.glyphs),void 0!==o.zoom&&this.commitZoom(o.zoom)),this.uniforms.src.value=t.tex,this.video=t.video,this.videoTex=t.tex,this.srcAspect=t.aspect,this.fit(),this.startLoop(),this.render())},s=()=>{if(this.curUrl!==e)return;let o=performance.now(),s=()=>{if(this.curUrl!==e)return;let t=Math.max(0,100-(performance.now()-o));window.setTimeout(r,t)},i=t.video;"function"==typeof i.requestVideoFrameCallback?i.requestVideoFrameCallback(s):window.setTimeout(r,100),this.startLoop()};t.video.play().then(s).catch(()=>{r()})}hasVideo(){return!!this.video}playPause(){return!!this.video&&(this.video.paused?(this.video.play(),this.startLoop()):(this.video.pause(),this.stopLoop(),this.render()),!this.video.paused)}loop=()=>{this.playing&&(this.render(),this.raf=requestAnimationFrame(this.loop))};startLoop(){this.playing||(this.playing=!0,this.raf=requestAnimationFrame(this.loop))}stopLoop(){this.playing=!1,cancelAnimationFrame(this.raf)}download(e,o){let t=document.createElement("a");t.href=URL.createObjectURL(e),t.download=o,t.click(),setTimeout(()=>URL.revokeObjectURL(t.href),2e3)}exportPNG(){this.render(),this.canvas.toBlob(e=>{e&&this.download(e,`sandbox-${Date.now()}.png`)},"image/png")}toggleRecord(){if(this.recorder&&"recording"===this.recorder.state)return this.recorder.stop(),this.recorder=null,!1;let e=this.canvas.captureStream(30),o=MediaRecorder.isTypeSupported("video/webm;codecs=vp9")?"video/webm;codecs=vp9":"video/webm";return this.chunks=[],this.recorder=new MediaRecorder(e,{mimeType:o,videoBitsPerSecond:8e6}),this.recorder.ondataavailable=e=>e.data.size&&this.chunks.push(e.data),this.recorder.onstop=()=>this.download(new Blob(this.chunks,{type:"video/webm"}),`sandbox-${Date.now()}.webm`),this.recorder.start(),this.playing||this.startLoop(),!0}dispose(){for(let{video:e,tex:o}of(this.stopLoop(),cancelAnimationFrame(this.morphRaf),this.recorder&&"recording"===this.recorder.state&&this.recorder.stop(),this.pool.values()))e.pause(),e.src="",e.load(),o.dispose();this.pool.clear(),this.video=null,this.videoTex=null,this.uniforms.glyph.value.forEach(e=>e.dispose()),this.uniforms.glyphB.value.forEach(e=>e.dispose()),this.quad.material.dispose(),this.quad.geometry.dispose(),this.renderer.dispose()}}e.s(["SandboxRenderer",0,i],57849)}]);