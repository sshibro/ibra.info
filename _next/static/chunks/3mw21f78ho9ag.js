(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,27143,84034,e=>{"use strict";var t=e.i(43476),r=e.i(71645);let a=(e,t,r)=>e<t?t:e>r?r:e,n=(e,t)=>Math.round(e/t)*t,i=(e,t,r,a,n)=>(e-t)*(n-a)/(r-t)+a,c=["charFill","charInverse","charAccent","charAccentInverse","charAccentFill","charBorder"];class s{element;originalContent;source;length;fps;cycles;cycleLength;frames;frame=0;loop=null;delay;delayTimer=null;charNodes=[];type="initial";divisor;denominator;variations;initVisible;constructor(e,t={}){this.element=e,this.originalContent=e.innerHTML,this.source=e.textContent||"",this.length=this.source.replace(/\s/g,"").length,this.fps=t.fps??20,this.cycles=t.cycles??3,this.cycleLength=t.cycleLength??.5,this.frames=this.length?this.fps*(1+.01*this.length):0,this.delay=t.delay??0,this.divisor=this.length>1?this.length-1:1,this.denominator=this.frames-this.frames*this.cycleLength||1,this.variations=(t.variations??[...c]).slice(),this.shuffle(),this.initVisible=t.initVisible??!1,this.length&&(this.build(),this.initVisible?(this.charNodes.forEach(e=>this.setClass(e,"char")),this.type="done",this.element.dataset.typerType="done"):(this.applyFrame(),this.element.dataset.typerType="initial"))}build(){this.element.innerHTML="",this.charNodes=[];let e=this.source.split(/(\s+)/),t=0;for(let r of e){if(""===r.trim()){this.element.append(document.createTextNode(r));continue}let e=document.createElement("span");for(let a of(e.className="word",r.split(""))){let r=n(function(e,t=1e-6){let r=e=>3*(1-e)**2*e*0+3*(1-e)*e**2*.75+e**3,a=e=>3*(1-e)**2*e*.75+3*(1-e)*e**2*0+e**3,n=e=>3*(1-e)**2*0+6*(1-e)*e*.75+3*e**2*.25,i=e;for(let c=0;c<8;c++){let c=r(i)-e;if(Math.abs(c)<t)return a(i);let s=n(i);if(1e-6>Math.abs(s))break;i-=c/s}let c=0,s=1;for(i=e;c<s;){let a=r(i);if(Math.abs(a-e)<t)break;a<e?c=i:s=i,i=(c+s)/2}return a(i)}(t/this.divisor),.05),i=document.createElement("span");i.className="char charInit",i.textContent=a||" ",this.charNodes.push({el:i,cp:r,currentClass:"char charInit"}),t+=1,e.appendChild(i)}this.element.appendChild(e)}}reset(e){this.stopLoop(),this.source=e,this.length=e.replace(/\s/g,"").length,this.divisor=this.length>1?this.length-1:1,this.frames=this.length?this.fps*(1+.01*this.length):0,this.denominator=this.frames-this.frames*this.cycleLength||1,this.frame=0,this.type="initial",this.build(),this.applyFrame(),this.element.dataset.typerType="initial"}in(){this.setType("in")}out(){this.setType("out")}inOut(){this.setType("inout")}setType(e){(e!==this.type||"inout"===e)&&(this.type=e,this.element.dataset.typerType=e,this.stopLoop(),this.frame=0,this.applyFrame(),"initial"!==e&&this.charNodes.length&&this.startLoop())}startLoop(){if(this.loop||this.delayTimer||!this.charNodes.length||"initial"===this.type)return;this.shuffle();let e=()=>{this.delayTimer=null,this.loop||"initial"===this.type||(this.applyFrame(),this.loop=window.setInterval(()=>this.tick(),1e3/this.fps))};this.delay>0?this.delayTimer=window.setTimeout(e,1e3*this.delay):e()}stopLoop(){this.delayTimer&&(window.clearTimeout(this.delayTimer),this.delayTimer=null),this.loop&&(window.clearInterval(this.loop),this.loop=null)}tick(){let e="inout"===this.type?2*this.frames:this.frames;this.frame+=1,this.frame=a(this.frame,0,e),this.applyFrame(),this.frame>=e&&(this.stopLoop(),this.type="done",this.element.dataset.typerType="done")}applyFrame(){if(!this.length||!this.charNodes.length)return;if("initial"===this.type)return void this.charNodes.forEach(e=>this.setClass(e,"char charInit"));let e="inout"===this.type&&this.frame>this.frames?"out":"inout"===this.type?"in":this.type,t=("inout"===this.type&&"out"===e?this.frame-this.frames:this.frame)/this.denominator;for(let r of this.charNodes){let c,s=t-r.cp;s=a(s=n(s,.1),0,1);let o="charInit";if(s>0){let e=Math.round(i(s,0,1,0,this.cycles));o=this.variations[e%this.variations.length]}s>=1&&(o="");let l=o?`char ${o}`:"char";c="in"===e?s<=0?"char charInit":s>=1?"char":l:s<=0?"char":s>=1?"char charInit":l,this.setClass(r,c)}}setClass(e,t){t!==e.currentClass&&(e.currentClass=t,e.el.className=t)}shuffle(){this.variations.sort(()=>.5-Math.random())}destroy(){this.stopLoop(),this.element.innerHTML=this.originalContent,delete this.element.dataset.typerType}}class o{typers=[];constructor(e,t={},r=.15){this.typers=e.map((e,a)=>new s(e,{...t,delay:a*r}))}in(){this.typers.forEach(e=>e.in())}out(){this.typers.forEach(e=>e.out())}destroy(){this.typers.forEach(e=>e.destroy())}}let l=`/* Typer — the styling for the character reveal. The engine (typer.ts) swaps each
   char's class between these states; the CSS is what makes a state look like a
   solid pill, an outlined pill, an accent block, and so on. The nicest trick is
   pill-merging: adjacent same-state chars round only at the two outer ends, so a
   run of them reads as one continuous rounded bar, not separate boxes.

   Everything is themed from four custom properties, so a preset can recolor the
   text, the pill fills, AND the borders all at once:
     --typer-fg          the base ink (plain letters, ink pills, ink borders)
     --typer-bg          the page / knockout color inside a filled pill
     --typer-accent      the accent surface (accent pill fills, accent borders)
     --typer-accent-ink  the text color that sits ON an accent fill
   Set them on the [data-typer] element or any ancestor. */

[data-typer] {
  --typer-fg: #1b1b1b;
  --typer-bg: #fcfcfc;
  --typer-accent: #12a150;
  --typer-accent-ink: #fcfcfc;
  --typer-radius: 5px;
}

/* before the reveal runs, the whole line is invisible (chars are charInit). */
[data-typer][data-typer-type="initial"] {
  opacity: 0;
}

[data-typer] .word {
  white-space: pre; /* keep intra-word spacing exact */
}

[data-typer] .word .char {
  box-sizing: content-box;
  display: inline-block;
  color: var(--typer-fg);
  background: transparent;
  transition: none; /* state changes are discrete frames, not tweened */
}

/* not yet revealed → transparent (holds the layout, shows nothing). */
[data-typer] .word .char.charInit {
  color: transparent;
}

/* ── Solid pill: ink block, knockout text. Adjacent fills merge into one bar. ── */
[data-typer] .word .char.charFill {
  color: var(--typer-bg);
  background: var(--typer-fg);
  border-radius: var(--typer-radius);
}
[data-typer] .word .char.charFill:has(+ .charFill) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
[data-typer] .word .char.charFill + .charFill {
  border-radius: 0;
}
[data-typer] .word .char.charFill + .charFill:last-child,
[data-typer] .word .char.charFill + .charFill:has(+ :not(.charFill)) {
  border-radius: 0 var(--typer-radius) var(--typer-radius) 0;
}

/* ── Inverse: ink knockout, no rounding (a hard block). ── */
[data-typer] .word .char.charInverse {
  color: var(--typer-bg);
  background: var(--typer-fg);
}

/* ── Accent: colored LETTERS on the page (no pill) — the accent reaching the
      text itself, not just a fill. ── */
[data-typer] .word .char.charAccent {
  color: var(--typer-accent);
  background: transparent;
}

/* ── Accent inverse: an accent PILL with knockout text sitting on it. Merges into
      a bar like the ink fill. ── */
[data-typer] .word .char.charAccentInverse {
  color: var(--typer-accent-ink);
  background: var(--typer-accent);
  border-radius: var(--typer-radius);
}
[data-typer] .word .char.charAccentInverse:has(+ .charAccentInverse) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
[data-typer] .word .char.charAccentInverse + .charAccentInverse {
  border-radius: 0;
}
[data-typer] .word .char.charAccentInverse + .charAccentInverse:last-child,
[data-typer]
  .word
  .char.charAccentInverse
  + .charAccentInverse:has(+ :not(.charAccentInverse)) {
  border-radius: 0 var(--typer-radius) var(--typer-radius) 0;
}

/* ── Accent fill: a briefly solid block of pure accent (both fill and text). ── */
[data-typer] .word .char.charAccentFill {
  color: var(--typer-accent);
  background: var(--typer-accent);
}

/* ── Outlined pill: an ACCENT border box around ink text; a run merges like the
      solid pill, but by dropping the inner vertical borders instead of the fill. ── */
[data-typer] .word .char.charBorder {
  position: relative;
  color: var(--typer-fg);
}
[data-typer] .word .char.charBorder::after {
  content: "";
  display: inline-block;
  position: absolute;
  inset: 0;
  border: 1px solid var(--typer-accent);
  border-radius: var(--typer-radius);
}
[data-typer] .word .char.charBorder:has(+ .charBorder)::after {
  border-right: 1px solid transparent;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
[data-typer] .word .char.charBorder + .charBorder::after {
  border-left: 1px solid transparent;
  border-right: 1px solid transparent;
  border-radius: 0;
}
[data-typer] .word .char.charBorder + .charBorder:last-child::after,
[data-typer] .word .char.charBorder + .charBorder:has(+ :not(.charBorder))::after {
  border-left: 1px solid transparent;
  border-right: 1px solid var(--typer-accent);
  border-radius: 0 var(--typer-radius) var(--typer-radius) 0;
}

@media (prefers-reduced-motion: reduce) {
  /* no reveal animation: show the text plainly. */
  [data-typer][data-typer-type="initial"] {
    opacity: 1;
  }
  [data-typer] .word .char.charInit {
    color: var(--typer-fg);
  }
}
`;e.s(["TyperLines",0,function({lines:e,fps:a=20,cycles:n=3,stagger:i=.15,variations:c,fg:s,bg:h,accent:d,accentInk:p,playKey:f=0,waitForView:y=!0,className:u="",lineClassName:m="",style:b}){let g=(0,r.useRef)(null),v=(0,r.useRef)([]),w=(0,r.useRef)(!1),k=(c??[]).join(",");(0,r.useEffect)(()=>{let e,t=g.current,r=v.current.filter(Boolean);if(!t||!r.length)return;let s=window.matchMedia("(prefers-reduced-motion: reduce)").matches,l=new o(r,{fps:a,cycles:n,variations:c,initVisible:s},i);if(s)return()=>l.destroy();let h=null,d=!1,p=()=>{d||(d=!0,w.current=!0,l.in())};return!y||w.current||(e=t.getBoundingClientRect()).top<window.innerHeight&&e.bottom>0?p():(h=new IntersectionObserver(e=>{e[0]?.isIntersecting&&p()},{threshold:.35})).observe(t),()=>{h?.disconnect(),l.destroy()}},[e,a,n,i,k,f,y]);let I={};return s&&(I["--typer-fg"]=s),h&&(I["--typer-bg"]=h),d&&(I["--typer-accent"]=d),p&&(I["--typer-accent-ink"]=p),(0,t.jsxs)("div",{ref:g,className:u,style:b,children:[(0,t.jsx)("style",{dangerouslySetInnerHTML:{__html:l}}),e.map((e,r)=>(0,t.jsx)("span",{ref:e=>{v.current[r]=e},"data-typer":!0,"data-typer-type":"initial",className:m,style:I,children:e},`${r}:${e}`))]})}],27143);let h=[{name:"Vapor",fg:"#6d5ac2",bg:"#e8fff6",accent:"#ff6ad5",accentInk:"#3a1052",pool:["charAccentInverse","charAccent","charAccentFill","charBorder"],fps:23,cycles:4},{name:"Signal",fg:"#0b160f",bg:"#f4faf5",accent:"#00d466",accentInk:"#04180c",pool:[...c],fps:20,cycles:3},{name:"Marker",fg:"#3a2412",bg:"#fdf3df",accent:"#ff7a1a",accentInk:"#fff8ee",pool:["charAccent","charAccentInverse","charBorder","charFill"],fps:22,cycles:3},{name:"Punch",fg:"#3a0a2e",bg:"#ffe9f7",accent:"#ff1e8e",accentInk:"#fff6c2",pool:["charAccent","charAccentInverse","charAccentFill","charBorder"],fps:24,cycles:4},{name:"Wire",fg:"#8fd4ff",bg:"#0a1230",accent:"#2f7bff",accentInk:"#eaf4ff",pool:["charBorder","charAccent","charAccentInverse"],fps:18,cycles:3},{name:"Glitch",fg:"#eef2ff",bg:"#070708",accent:"#ff2e5e",accentInk:"#070708",pool:[...c],fps:34,cycles:6},{name:"Neon",fg:"#e4ffd1",bg:"#06120a",accent:"#b6ff1a",accentInk:"#06120a",pool:["charAccent","charAccentInverse","charFill","charBorder"],fps:26,cycles:4},{name:"Sunset",fg:"#7a2b4e",bg:"#fff1e8",accent:"#7c3aed",accentInk:"#fff1e8",pool:["charAccent","charAccentInverse","charBorder","charFill"],fps:21,cycles:3},{name:"Gold",fg:"#f3e6c4",bg:"#0d0b07",accent:"#e6b325",accentInk:"#0d0b07",pool:["charAccent","charBorder","charFill","charInverse"],fps:18,cycles:3},{name:"Ocean",fg:"#9bebe0",bg:"#04262b",accent:"#ff7a59",accentInk:"#04262b",pool:["charAccent","charAccentInverse","charBorder"],fps:22,cycles:4},{name:"Blueprint",fg:"#bfe9ff",bg:"#0a1a33",accent:"#39c7ff",accentInk:"#06254a",pool:["charBorder","charAccent"],fps:16,cycles:2},{name:"Ember",fg:"#ffd9b3",bg:"#140a08",accent:"#ff5722",accentInk:"#140a08",pool:[...c],fps:30,cycles:5},{name:"Mono",fg:"#111111",bg:"#ffffff",accent:"#111111",accentInk:"#ffffff",pool:["charFill","charInverse","charBorder"],fps:20,cycles:2}];e.s(["PRESETS",0,h],84034)},31782,e=>{"use strict";var t=e.i(43476),r=e.i(71645),a=e.i(27143),n=e.i(84034),i=e.i(20268);let c=["design engineered by me :)"];e.s(["TyperCard",0,function({viewTransitionName:e}){let[s,o]=(0,r.useState)(0),[l,h]=(0,r.useState)(0),d=(0,r.useRef)(null);(0,r.useEffect)(()=>{let e=d.current;if(!e||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;let t=null,r=!1,a=!1,c=()=>{h(e=>(e+1)%n.PRESETS.length),o(e=>e+1),t=window.setTimeout(c,1800)},s=()=>{let e=r&&!a;e&&null===t?t=window.setTimeout(c,1800):e||null===t||(window.clearTimeout(t),t=null)},l=new IntersectionObserver(e=>{r=e[0]?.isIntersecting??!1,s()},{threshold:.3});l.observe(e);let p=(0,i.onTransitionChange)(e=>{a=e,s()});return()=>{l.disconnect(),p(),t&&window.clearTimeout(t)}},[]);let p=n.PRESETS[l];return(0,t.jsx)("div",{ref:d,"aria-label":`${c.join(" ")}, revealed character by character`,className:"relative mx-auto flex aspect-[1344/520] w-full select-none items-center justify-center overflow-hidden rounded-[12px] border border-[var(--border-line)] px-4 transition-colors duration-500 ease-[var(--ease-out)]",style:{viewTransitionName:e,background:p.bg},children:(0,t.jsx)(a.TyperLines,{lines:c,variations:p.pool,fps:p.fps,cycles:p.cycles,fg:p.fg,bg:p.bg,accent:p.accent,accentInk:p.accentInk,playKey:s,className:"flex flex-col items-center gap-1 text-center",lineClassName:"font-[family-name:var(--font-neue-montreal)] text-[clamp(1rem,3.4vw,1.9rem)] font-semibold leading-[1.12] tracking-[-0.01em]"})})}])},42538,e=>{e.n(e.i(31782))}]);