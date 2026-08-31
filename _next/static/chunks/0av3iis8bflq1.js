(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,52520,e=>{"use strict";var t=e.i(43476),i=e.i(71645),r=e.i(32009);class s{constructor(e,t,i){this.variables=[],this.currentTextureIndex=0;let s=r.FloatType;const a=new r.Scene,o=new r.Camera;o.position.z=1;const n={passThruTexture:{value:null}},l=c("uniform sampler2D passThruTexture;\n\nvoid main() {\n\n	vec2 uv = gl_FragCoord.xy / resolution.xy;\n\n	gl_FragColor = texture2D( passThruTexture, uv );\n\n}\n",n),h=new r.Mesh(new r.PlaneGeometry(2,2),l);function u(i){i.defines.resolution="vec2( "+e.toFixed(1)+", "+t.toFixed(1)+" )"}function c(e,t){t=t||{};let i=new r.ShaderMaterial({name:"GPUComputationShader",uniforms:t,vertexShader:"void main()	{\n\n	gl_Position = vec4( position, 1.0 );\n\n}\n",fragmentShader:e});return u(i),i}a.add(h),this.setDataType=function(e){return s=e,this},this.addVariable=function(e,t,i){let s={name:e,initialValueTexture:i,material:this.createShaderMaterial(t),dependencies:null,renderTargets:[],wrapS:null,wrapT:null,minFilter:r.NearestFilter,magFilter:r.NearestFilter};return this.variables.push(s),s},this.setVariableDependencies=function(e,t){e.dependencies=t},this.init=function(){if(0===i.capabilities.maxVertexTextures)return"No support for vertex shader textures.";for(let i=0;i<this.variables.length;i++){let r=this.variables[i];r.renderTargets[0]=this.createRenderTarget(e,t,r.wrapS,r.wrapT,r.minFilter,r.magFilter),r.renderTargets[1]=this.createRenderTarget(e,t,r.wrapS,r.wrapT,r.minFilter,r.magFilter),this.renderTexture(r.initialValueTexture,r.renderTargets[0]),this.renderTexture(r.initialValueTexture,r.renderTargets[1]);let s=r.material,a=s.uniforms;if(null!==r.dependencies)for(let e=0;e<r.dependencies.length;e++){let t=r.dependencies[e];if(t.name!==r.name){let e=!1;for(let i=0;i<this.variables.length;i++)if(t.name===this.variables[i].name){e=!0;break}if(!e)return"Variable dependency not found. Variable="+r.name+", dependency="+t.name}a[t.name]={value:null},s.fragmentShader="\nuniform sampler2D "+t.name+";\n"+s.fragmentShader}}return this.currentTextureIndex=0,null},this.compute=function(){let e=this.currentTextureIndex,t=+(0===this.currentTextureIndex);for(let i=0,r=this.variables.length;i<r;i++){let r=this.variables[i];if(null!==r.dependencies){let t=r.material.uniforms;for(let i=0,s=r.dependencies.length;i<s;i++){let s=r.dependencies[i];t[s.name].value=s.renderTargets[e].texture}}this.doRenderTarget(r.material,r.renderTargets[t])}this.currentTextureIndex=t},this.getCurrentRenderTarget=function(e){return e.renderTargets[this.currentTextureIndex]},this.getAlternateRenderTarget=function(e){return e.renderTargets[+(0===this.currentTextureIndex)]},this.dispose=function(){h.geometry.dispose(),h.material.dispose();let e=this.variables;for(let t=0;t<e.length;t++){let i=e[t];i.initialValueTexture&&i.initialValueTexture.dispose();let r=i.renderTargets;for(let e=0;e<r.length;e++)r[e].dispose()}},this.addResolutionDefine=u,this.createShaderMaterial=c,this.createRenderTarget=function(i,a,o,n,l,h){return i=i||e,a=a||t,o=o||r.ClampToEdgeWrapping,n=n||r.ClampToEdgeWrapping,l=l||r.NearestFilter,h=h||r.NearestFilter,new r.WebGLRenderTarget(i,a,{wrapS:o,wrapT:n,minFilter:l,magFilter:h,format:r.RGBAFormat,type:s,depthBuffer:!1})},this.createTexture=function(){let i=new Float32Array(e*t*4),s=new r.DataTexture(i,e,t,r.RGBAFormat,r.FloatType);return s.needsUpdate=!0,s},this.renderTexture=function(e,t){n.passThruTexture.value=e,this.doRenderTarget(l,t),n.passThruTexture.value=null},this.doRenderTarget=function(e,t){let r=i.getRenderTarget(),s=i.xr.enabled,n=i.shadowMap.autoUpdate;i.xr.enabled=!1,i.shadowMap.autoUpdate=!1,h.material=e,i.setRenderTarget(t),i.render(a,o),h.material=l,i.xr.enabled=s,i.shadowMap.autoUpdate=n,i.setRenderTarget(r)}}}let a={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};var o=r;class n{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}let l=new o.OrthographicCamera(-1,1,1,-1,0,1);class h extends o.BufferGeometry{constructor(){super(),this.setAttribute("position",new o.Float32BufferAttribute([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new o.Float32BufferAttribute([0,2,0,0,2,0],2))}}let u=new h;class c{constructor(e){this._mesh=new o.Mesh(u,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,l)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class d extends n{constructor(e,t){super(),this.textureID=void 0!==t?t:"tDiffuse",e instanceof r.ShaderMaterial?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=r.UniformsUtils.clone(e.uniforms),this.material=new r.ShaderMaterial({name:void 0!==e.name?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this.fsQuad=new c(this.material)}render(e,t,i){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=i.texture),this.fsQuad.material=this.material,this.renderToScreen?e.setRenderTarget(null):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil)),this.fsQuad.render(e)}dispose(){this.material.dispose(),this.fsQuad.dispose()}}class p extends n{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,i){let r,s,a=e.getContext(),o=e.state;o.buffers.color.setMask(!1),o.buffers.depth.setMask(!1),o.buffers.color.setLocked(!0),o.buffers.depth.setLocked(!0),this.inverse?(r=0,s=1):(r=1,s=0),o.buffers.stencil.setTest(!0),o.buffers.stencil.setOp(a.REPLACE,a.REPLACE,a.REPLACE),o.buffers.stencil.setFunc(a.ALWAYS,r,0xffffffff),o.buffers.stencil.setClear(s),o.buffers.stencil.setLocked(!0),e.setRenderTarget(i),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),o.buffers.color.setLocked(!1),o.buffers.depth.setLocked(!1),o.buffers.color.setMask(!0),o.buffers.depth.setMask(!0),o.buffers.stencil.setLocked(!1),o.buffers.stencil.setFunc(a.EQUAL,1,0xffffffff),o.buffers.stencil.setOp(a.KEEP,a.KEEP,a.KEEP),o.buffers.stencil.setLocked(!0)}}class m extends n{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class f{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),void 0===t){const i=e.getSize(new r.Vector2);this._width=i.width,this._height=i.height,(t=new r.WebGLRenderTarget(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:r.HalfFloatType})).texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new d(a),this.copyPass.material.blending=r.NoBlending,this.clock=new r.Clock}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);-1!==t&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){void 0===e&&(e=this.clock.getDelta());let t=this.renderer.getRenderTarget(),i=!1;for(let t=0,r=this.passes.length;t<r;t++){let r=this.passes[t];if(!1!==r.enabled){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(t),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,i),r.needsSwap){if(i){let t=this.renderer.getContext(),i=this.renderer.state.buffers.stencil;i.setFunc(t.NOTEQUAL,1,0xffffffff),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),i.setFunc(t.EQUAL,1,0xffffffff)}this.swapBuffers()}void 0!==p&&(r instanceof p?i=!0:r instanceof m&&(i=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(void 0===e){let t=this.renderer.getSize(new r.Vector2);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,(e=this.renderTarget1.clone()).setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let i=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(i,r),this.renderTarget2.setSize(i,r);for(let e=0;e<this.passes.length;e++)this.passes[e].setSize(i,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class v extends n{constructor(e,t,i=null,s=null,a=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=i,this.clearColor=s,this.clearAlpha=a,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new r.Color}render(e,t,i){let r,s,a=e.autoClear;e.autoClear=!1,null!==this.overrideMaterial&&(s=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),null!==this.clearColor&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),null!==this.clearAlpha&&(r=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),!0==this.clearDepth&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:i),!0===this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),null!==this.clearColor&&e.setClearColor(this._oldClearColor),null!==this.clearAlpha&&e.setClearAlpha(r),null!==this.overrideMaterial&&(this.scene.overrideMaterial=s),e.autoClear=a}}let g=`
uniform float uTime;
uniform float uDeltaTime;
uniform float uFlowFieldInfluence;
uniform float uFlowFieldStrength;
uniform float uFlowFieldFrequency;

uniform vec3  uMouse;
uniform float uMouseStrength;
uniform float uMouseSpeed;

uniform sampler2D uBase;

vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
float permute(float x){return floor(mod(((x*34.0)+1.0)*x, 289.0));}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float taylorInvSqrt(float r){return 1.79284291400159 - 0.85373472095314 * r;}

vec4 grad4(float j, vec4 ip){
  const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
  vec4 p,s;
  p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
  p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
  s = vec4(lessThan(p, vec4(0.0)));
  p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www;
  return p;
}

float simplexNoise4d(vec4 v){
  const vec2  C = vec2( 0.138196601125010504, 0.309016994374947451);
  vec4 i  = floor(v + dot(v, C.yyyy) );
  vec4 x0 = v -   i + dot(i, C.xxxx);
  vec4 i0;
  vec3 isX = step( x0.yzw, x0.xxx );
  vec3 isYZ = step( x0.zww, x0.yyz );
  i0.x = isX.x + isX.y + isX.z;
  i0.yzw = 1.0 - isX;
  i0.y += isYZ.x + isYZ.y;
  i0.zw += 1.0 - isYZ.xy;
  i0.z += isYZ.z;
  i0.w += 1.0 - isYZ.z;
  vec4 i3 = clamp( i0, 0.0, 1.0 );
  vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
  vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );
  vec4 x1 = x0 - i1 + 1.0 * C.xxxx;
  vec4 x2 = x0 - i2 + 2.0 * C.xxxx;
  vec4 x3 = x0 - i3 + 3.0 * C.xxxx;
  vec4 x4 = x0 - 1.0 + 4.0 * C.xxxx;
  i = mod(i, 289.0);
  float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);
  vec4 j1 = permute( permute( permute( permute (
             i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
           + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
           + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
           + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));
  vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;
  vec4 p0 = grad4(j0,   ip);
  vec4 p1 = grad4(j1.x, ip);
  vec4 p2 = grad4(j1.y, ip);
  vec4 p3 = grad4(j1.z, ip);
  vec4 p4 = grad4(j1.w, ip);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  p4 *= taylorInvSqrt(dot(p4,p4));
  vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
  vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);
  m0 = m0 * m0;
  m1 = m1 * m1;
  return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))
               + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;
}

void main() {
  float time = uTime * 0.2;
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 particle = texture(uParticles, uv);
  vec4 base = texture(uBase, uv);

  // Mouse repulsion: push particles away from the cursor, scaled by cursor speed.
  float uRepelStrength = clamp(uMouseSpeed, 0.0, uMouseStrength);
  vec3 particlePos = particle.xyz;
  vec3 dir = normalize(particlePos - uMouse);
  float dist = distance(uMouse, particlePos);
  float repulsionForce = uRepelStrength / (dist * (dist + 1.0));
  vec3 repulsion = dir * repulsionForce * 2.0;
  particle.xyz += repulsion * uRepelStrength;

  if (particle.a >= 1.0) {
    // life expired → respawn exactly on the home position (sharp wordmark).
    particle.a = mod(particle.a, 1.0);
    particle.xyz = base.xyz;
  } else {
    // curl flow field, gated by a per-particle noise threshold so only some drift.
    float strength = simplexNoise4d(vec4(base.xyz, time + 1.0));
    float influence = (uFlowFieldInfluence - 0.5) * (- 2.0);
    strength = smoothstep(influence, 1.0, strength);

    vec3 flowField = vec3(
      simplexNoise4d(vec4(particle.xyz * uFlowFieldFrequency + 0.0, time)),
      simplexNoise4d(vec4(particle.xyz * uFlowFieldFrequency + 1.0, time)),
      simplexNoise4d(vec4(particle.xyz * uFlowFieldFrequency + 2.0, time))
    );
    flowField = normalize(flowField);
    particle.xyz += flowField * uDeltaTime * strength * uFlowFieldStrength;

    // advance life; a firm pull back toward home snaps the word back quickly after
    // the cursor scatters it (higher = faster restore).
    particle.a += uDeltaTime * 0.3;
    vec3 toTarget = base.xyz - particle.xyz;
    particle.xyz += toTarget * uDeltaTime * 2.2;
  }

  gl_FragColor = particle;
}
`,x=`
uniform vec2 uResolution;
uniform float uSize;
uniform float uVisibility;
uniform sampler2D uParticlesTexture;

attribute vec2 aParticlesUv;
attribute float aSize;

varying float vAlpha;

void main() {
  vec4 particle = texture2D(uParticlesTexture, aParticlesUv);

  vec4 modelPosition = modelMatrix * vec4(particle.xyz, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  gl_Position = projectionMatrix * viewPosition;

  // Particles that have drifted far from home fade a touch, so the core word
  // stays densest. uVisibility scales the whole cloud in (entrance / scroll).
  vAlpha = uVisibility;
  gl_PointSize = uSize * aSize * uResolution.y * 0.006;
  gl_PointSize *= (1.0 / - viewPosition.z);
}
`,w=`
varying float vAlpha;
void main() {
  // round soft point
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.15, d) * vAlpha;
  // bright source — the ASCII pass reads luma from this. Color is irrelevant
  // (the ASCII pass recolors), so render white.
  gl_FragColor = vec4(vec3(1.0), a);
}
`,y=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,T=`
uniform sampler2D tDiffuse;
uniform vec2 uResolution;
uniform float uAsciiPixelSize;
uniform sampler2D uAsciiTexture;
uniform vec2 uCharCount;
uniform float uAsciiContrast;
uniform float uAsciiBrightness;
uniform float uAsciiMin;
uniform float uAsciiMax;

uniform float uAspect;    // card width/height, so glows are circular
uniform vec3  uInk;       // page ink (unused now the field is a fixed indigo)
uniform vec2  uTrail[24]; // recent cursor path, [0] = newest (UV, y up)
uniform float uTrailAge[24]; // 0..1 age per sample (0 = fresh, 1 = gone)
uniform float uTrailOn;   // 0..1 master strength (fades the whole trail in/out)

varying vec2 vUv;

void main() {
  vec2 normalizedPixelSize = uAsciiPixelSize / uResolution;
  vec2 uvPixel = normalizedPixelSize * floor(vUv / normalizedPixelSize);
  vec4 texColor = texture2D(tDiffuse, uvPixel);

  // Coverage = how much particle ink landed in this cell. Use the max of the
  // additive brightness and the alpha so faint-but-present cells still count
  // (multiplying the two was double-dimming, which made the letters thin).
  float lumaRGB = dot(vec3(0.2126, 0.7152, 0.0722), texColor.rgb);
  float luma = max(lumaRGB, texColor.a);

  // Remap to use the full range, then brightness/contrast (matches the original).
  luma = (luma - uAsciiMin) / (uAsciiMax - uAsciiMin);
  luma = clamp(luma, 0.0, 1.0);
  luma = luma + uAsciiBrightness;
  luma = (luma - 0.5) * uAsciiContrast + 0.5;
  luma = clamp(luma, 0.0, 1.0);

  // Pick the glyph cell from the ramp atlas by brightness.
  vec2 cellUV = fract(vUv / normalizedPixelSize);
  float charIndex = clamp(
    floor(luma * (uCharCount.x - 1.0)),
    0.0,
    uCharCount.x - 1.0
  );
  vec2 asciiUV = vec2(
    (charIndex + cellUV.x) / uCharCount.x,
    cellUV.y
  );
  float character = texture2D(uAsciiTexture, asciiUV).r;

  vec2 cellCenter = uvPixel + normalizedPixelSize * 0.5;

  // ── Resting color: ONE calm ink color for the whole word (no rainbow, no hue
  //    cycling). A single deep indigo, with a barely-there lift toward a cooler
  //    tone across x so it isn't dead-flat. All the color life lives in the trail.
  vec3 inkDeep = vec3(0.14, 0.16, 0.30);          // deep indigo ink
  vec3 inkLift = vec3(0.20, 0.24, 0.42);          // slightly lighter/cooler
  vec3 baseColor = mix(inkDeep, inkLift, smoothstep(0.0, 1.0, cellCenter.x));

  // ── Cursor comet-trail: walk the path, take the strongest glow. Younger + nearer
  //    samples glow more; the head is hot white-hot accent, the tail cooler.
  float trail = 0.0;   // 0..1 glow at this cell
  float headness = 0.0; // how close to the hot head the winning sample is (0..1)
  for (int i = 0; i < 24; i++) {
    float age = uTrailAge[i];
    if (age >= 1.0) continue;                     // empty / fully-decayed slot
    vec2 d = (cellCenter - uTrail[i]) * vec2(uAspect, 1.0);
    float rad = 0.16 + age * 0.10;                // tail spreads slightly as it ages
    float g = smoothstep(rad, 0.0, length(d)) * (1.0 - age);
    if (g > trail) { trail = g; headness = 1.0 - age; }
  }
  trail *= uTrailOn;

  // Trail color: hot pink-white head → electric violet/blue tail, layered over the
  // field so the path clearly pops in color.
  vec3 trailCool = vec3(0.29, 0.23, 1.0);         // violet-blue tail
  vec3 trailHot  = vec3(1.0, 0.32, 0.68);         // hot magenta head
  vec3 trailColor = mix(trailCool, trailHot, headness);

  vec3 glyphColor = mix(baseColor, trailColor, clamp(trail, 0.0, 1.0));

  // LIGHT MODE: colored ink where there's a glyph + any coverage; transparent
  // page elsewhere so the card's light background shows through. Ink ramps to
  // full quickly (low floor) so the letters read solid, not faint. The trail also
  // lifts coverage a touch so its glyphs glow brighter than the resting word.
  float ink = character * smoothstep(0.015, 0.18, luma);
  ink = min(1.0, ink + trail * character * 0.3);

  // PREMULTIPLIED output. The canvas context is premultipliedAlpha (three's
  // default), so it expects color already multiplied by alpha. Emitting straight
  // (glyphColor, ink) makes the bright glyph color bleed into near-zero-alpha
  // cells when composited over the page — on some GPUs (mobile) the whole card
  // washes toward white. Multiply the color by ink so empty cells are truly
  // transparent (0,0,0,0) and the page background shows through cleanly.
  gl_FragColor = vec4(glyphColor * ink, ink);
}
`,b=" .:-=+*#%VAULT",C=window.matchMedia?.("(pointer: coarse)").matches??!1,S=C?128:200,A=C?1.5:2;class P{host;opts;renderer;scene=new r.Scene;camera;composer;asciiPass;gpgpu;posVar;points;pointsMat;clock=new r.Clock;raf=0;running=!1;onScreen=!0;disposed=!1;mouse=new r.Vector3(9999,9999,0);prevMouse=new r.Vector3(9999,9999,0);mouseSpeed=0;mouseUv=new r.Vector2(9999,9999);onCard=!1;trailPos=[];trailAge=new Float32Array(24).fill(1);trailOn=0;visibility=0;wordAspect=3;WORD_MARGIN=.92;io;ro;constructor(e,t){this.host=e,this.opts=t}mount(){let{clientWidth:e,clientHeight:t}=this.host,i=Math.min(window.devicePixelRatio||1,A);this.renderer=new r.WebGLRenderer({alpha:!0,antialias:!1,powerPreference:"high-performance",failIfMajorPerformanceCaveat:!1}),this.renderer.setPixelRatio(i),this.renderer.setSize(e,t),this.renderer.setClearColor(0,0),this.host.appendChild(this.renderer.domElement),Object.assign(this.renderer.domElement.style,{position:"absolute",inset:"0",width:"100%",height:"100%",display:"block",touchAction:"pan-y",userSelect:"none",WebkitUserSelect:"none"});let{positions:s,count:a,aspect:o}=function(e,t){let i=t*t,r=document.createElement("canvas");r.width=1024,r.height=320;let s=r.getContext("2d",{willReadFrequently:!0});s.clearRect(0,0,1024,320),s.fillStyle="#fff",s.textAlign="center",s.textBaseline="middle";let a=240;s.font=`800 ${a}px ui-sans-serif, system-ui, sans-serif`;let o=s.measureText(e).width;o>944&&(a=Math.floor(944/o*a),s.font=`800 ${a}px ui-sans-serif, system-ui, sans-serif`),s.fillText(e,512,160);let n=s.getImageData(0,0,1024,320).data,l=[];for(let e=0;e<320;e+=2)for(let t=0;t<1024;t+=2)n[(1024*e+t)*4+3]>128&&l.push([t,e]);if(0===l.length)for(let e=0;e<256;e++)l.push([512,160]);let h=new Float32Array(4*i);for(let e=0;e<i;e++){let t=l[Math.random()*l.length|0],i=(Math.random()-.5)*2,r=(Math.random()-.5)*2,s=((t[0]+i)/1024-.5)*6.4,a=-(2*((t[1]+r)/320-.5)),o=(Math.random()-.5)*.08;h[4*e+0]=s,h[4*e+1]=a,h[4*e+2]=o,h[4*e+3]=Math.random()}return{positions:h,count:i,aspect:3.2}}(this.opts.word,S);return this.wordAspect=o,this.camera=new r.PerspectiveCamera(35,e/t,.1,100),this.frameWord(e/t),this.camera.lookAt(0,0,0),!!this.initGPGPU(s)&&(this.initPoints(a),this.initComposer(e,t,i),this.bindEvents(),!0)}initGPGPU(e){this.gpgpu=new s(S,S,this.renderer),this.gpgpu.setDataType(r.HalfFloatType);let t=this.gpgpu.createTexture();t.image.data.set(e);let i=this.gpgpu.createTexture();i.image.data.set(e),this.posVar=this.gpgpu.addVariable("uParticles",g,i),this.gpgpu.setVariableDependencies(this.posVar,[this.posVar]);let a=this.posVar.material.uniforms;a.uTime={value:0},a.uDeltaTime={value:0},a.uBase={value:t},a.uFlowFieldInfluence={value:.43},a.uFlowFieldStrength={value:1.09},a.uFlowFieldFrequency={value:.53},a.uMouse={value:new r.Vector3(9999,9999,0)},a.uMouseStrength={value:.08},a.uMouseSpeed={value:0};let o=this.gpgpu.init();return!o||(console.warn("[ascii-wordmark] GPGPU unsupported, skipping:",o),!1)}initPoints(e){let t=new r.BufferGeometry,i=new Float32Array(2*e),s=new Float32Array(e),a=0;for(let e=0;e<S;e++)for(let t=0;t<S;t++)i[2*a]=(t+.5)/S,i[2*a+1]=(e+.5)/S,s[a]=.6+.8*Math.random(),a++;t.setAttribute("position",new r.BufferAttribute(new Float32Array(3*e),3)),t.setAttribute("aParticlesUv",new r.BufferAttribute(i,2)),t.setAttribute("aSize",new r.BufferAttribute(s,1)),t.setDrawRange(0,e),this.pointsMat=new r.ShaderMaterial({vertexShader:x,fragmentShader:w,transparent:!0,depthWrite:!1,blending:r.AdditiveBlending,uniforms:{uResolution:{value:new r.Vector2},uSize:{value:4},uVisibility:{value:0},uParticlesTexture:{value:null}}}),this.points=new r.Points(t,this.pointsMat),this.points.frustumCulled=!1,this.scene.add(this.points)}initComposer(e,t,i){let s=Math.max(2,Math.round(.5*e)),a=Math.max(2,Math.round(.5*t));this.composer=new f(this.renderer),this.composer.setPixelRatio(i),this.composer.setSize(e,t),this.composer.addPass(new v(this.scene,this.camera));let o=function(e=b,t=64){let i=e.length,r=document.createElement("canvas");r.width=t*i,r.height=t;let s=r.getContext("2d");s.clearRect(0,0,r.width,r.height),s.fillStyle="#fff",s.textAlign="center",s.textBaseline="middle",s.font=`${Math.floor(.74*t)}px ui-monospace, "SF Mono", Menlo, monospace`;for(let r=0;r<i;r++){let i=e[r];" "!==i&&s.fillText(i,r*t+t/2,t/2+.04*t)}return r}(b),n=new r.CanvasTexture(o);n.minFilter=r.LinearFilter,n.magFilter=r.LinearFilter;let l=new r.Color(this.opts.inkColor);this.trailPos=Array.from({length:24},()=>new r.Vector2(9999,9999)),this.trailAge=new Float32Array(24).fill(1),this.asciiPass=new d({uniforms:{tDiffuse:{value:null},uResolution:{value:new r.Vector2(s*i,a*i)},uAsciiPixelSize:{value:s*i/100},uAsciiTexture:{value:n},uCharCount:{value:new r.Vector2(b.length,1)},uAsciiContrast:{value:1.4},uAsciiBrightness:{value:.12},uAsciiMin:{value:0},uAsciiMax:{value:1},uAspect:{value:e/t},uInk:{value:new r.Vector3(l.r,l.g,l.b)},uTrail:{value:this.trailPos},uTrailAge:{value:this.trailAge},uTrailOn:{value:0}},vertexShader:y,fragmentShader:T}),this.asciiPass.renderToScreen=!0,this.composer.addPass(this.asciiPass),this.pointsMat.uniforms.uResolution.value.set(e*i,t*i)}bindEvents(){let e=e=>{let t=this.host.getBoundingClientRect(),i=(e.clientX-t.left)/t.width*2-1,s=-((e.clientY-t.top)/t.height*2-1),a=new r.Vector3(i,s,.5).unproject(this.camera).sub(this.camera.position).normalize(),o=-this.camera.position.z/a.z;this.mouse.copy(this.camera.position).add(a.multiplyScalar(o)),this.mouseUv.set((e.clientX-t.left)/t.width,1-(e.clientY-t.top)/t.height),this.onCard=!0},t=()=>{this.mouse.set(9999,9999,0),this.mouseUv.set(9999,9999),this.onCard=!1};this.host.addEventListener("pointermove",e),this.host.addEventListener("pointerleave",t),this.cleanupFns.push(()=>{this.host.removeEventListener("pointermove",e),this.host.removeEventListener("pointerleave",t)});let i=()=>document.hidden?this.stop():this.maybeStart();document.addEventListener("visibilitychange",i),this.cleanupFns.push(()=>document.removeEventListener("visibilitychange",i)),this.io=new IntersectionObserver(e=>{this.onScreen=e[0]?.isIntersecting??!0,this.onScreen?this.maybeStart():this.stop()},{threshold:.01}),this.io.observe(this.host),this.ro=new ResizeObserver(()=>this.resize()),this.ro.observe(this.host)}cleanupFns=[];frameWord(e){let t=Math.tan(r.MathUtils.degToRad(this.camera.fov)/2),i=this.wordAspect/(t*e),s=Math.max(1/t,i)*this.WORD_MARGIN;this.camera.position.set(0,0,s)}resize(){if(this.disposed)return;let{clientWidth:e,clientHeight:t}=this.host;if(0===e||0===t)return;let i=Math.min(window.devicePixelRatio||1,A);this.renderer.setPixelRatio(i),this.renderer.setSize(e,t),this.composer.setPixelRatio(i),this.composer.setSize(e,t),this.camera.aspect=e/t,this.frameWord(e/t),this.camera.updateProjectionMatrix();let r=Math.max(2,Math.round(.5*e)),s=Math.max(2,Math.round(.5*t));this.asciiPass.uniforms.uResolution.value.set(r*i,s*i),this.asciiPass.uniforms.uAsciiPixelSize.value=r*i/100,this.asciiPass.uniforms.uAspect.value=e/t,this.pointsMat.uniforms.uResolution.value.set(e*i,t*i)}start(){this.onScreen=!0,this.maybeStart()}maybeStart(){this.disposed||this.running||!this.onScreen||document.hidden||(this.running=!0,this.clock.getDelta(),this.raf=requestAnimationFrame(this.loop))}stop(){this.running=!1,this.raf&&cancelAnimationFrame(this.raf),this.raf=0}advanceTrail(e){for(let t=0;t<24;t++)this.trailAge[t]=Math.min(1,this.trailAge[t]+e/.75);if(this.onCard){for(let e=23;e>0;e--)this.trailPos[e].copy(this.trailPos[e-1]),this.trailAge[e]=this.trailAge[e-1];this.trailPos[0].copy(this.mouseUv),this.trailAge[0]=0}this.asciiPass.uniforms.uTrailAge.value=this.trailAge}loop=()=>{if(!this.running)return;let e=Math.min(this.clock.getDelta(),1/30),t=this.clock.elapsedTime;this.mouseSpeed=this.mouse.distanceTo(this.prevMouse),this.mouse.x>9e3&&(this.mouseSpeed=0),this.prevMouse.copy(this.mouse);let i=this.posVar.material.uniforms;i.uTime.value=t,i.uDeltaTime.value=e,i.uMouse.value.copy(this.mouse),i.uMouseSpeed.value=1.5*this.mouseSpeed,this.gpgpu.compute(),this.pointsMat.uniforms.uParticlesTexture.value=this.gpgpu.getCurrentRenderTarget(this.posVar).texture,this.visibility=Math.min(1,this.visibility+.9*e),this.pointsMat.uniforms.uVisibility.value=this.visibility;let r=this.asciiPass.uniforms;this.advanceTrail(e),this.trailOn+=(!!this.onCard-this.trailOn)*Math.min(1,6*e),r.uTrailOn.value=this.trailOn,this.composer.render(),this.raf=requestAnimationFrame(this.loop)};dispose(){this.disposed=!0,this.stop(),this.cleanupFns.forEach(e=>e()),this.io?.disconnect(),this.ro?.disconnect(),this.points?.geometry.dispose(),this.pointsMat?.dispose(),this.asciiPass?.uniforms.uAsciiTexture.value?.dispose?.(),this.gpgpu?.dispose?.(),this.composer?.dispose?.(),this.renderer?.dispose(),this.renderer?.forceContextLoss?.(),this.renderer?.domElement.parentNode&&this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)}}var M=e.i(20268);e.s(["AsciiWordmarkCard",0,function({word:e="VAULT",bare:r=!1}={}){let s=(0,i.useRef)(null);return(0,i.useEffect)(()=>{let t=s.current;if(!t||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;let i=null,r=0,a=!1,o=new IntersectionObserver(n=>{n.some(e=>e.isIntersecting)&&(a||(a=!0,r=requestAnimationFrame(()=>{if(s.current){if(!(i=new P(t,{word:e,inkColor:getComputedStyle(document.documentElement).getPropertyValue("--text-primary").trim()||"#1b1b1b"})).mount()){i.dispose(),i=null;return}i.start()}})),o.disconnect())},{rootMargin:"200px"});o.observe(t);let n=(0,M.onTransitionChange)(e=>{e?i?.stop():i?.start()});return()=>{cancelAnimationFrame(r),o.disconnect(),n(),i?.dispose()}},[e]),(0,t.jsx)("div",{ref:s,"aria-label":`${e}, rendered as a live ASCII particle field`,className:"relative mx-auto aspect-[1344/520] w-full select-none overflow-hidden rounded-[12px] border border-[var(--border-line)] bg-[var(--bg-page)]"})}],52520)},77285,e=>{e.n(e.i(52520))}]);