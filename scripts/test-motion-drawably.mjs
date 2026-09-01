import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const failures = [];

async function read(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return await readFile(path.join(root, relativePath), "utf8");
  } catch {
    failures.push(`missing ${relativePath}`);
    return "";
  }
}

const homepage = await read("index.html");
if (!homepage.includes("also shibro")) {
  failures.push("homepage alias is not shibro");
}
if (homepage.includes("shibro°") || homepage.includes("shibro&deg;")) {
  failures.push("homepage alias includes a degree symbol");
}
if (!homepage.includes('href="/motion/">motion</a>')) {
  failures.push("homepage does not link the word motion to /motion/");
}
if (!homepage.includes("On the side, I build different visuals I love over in")) {
  failures.push("homepage motion sentence changed");
}

const inkIndex = await read("ink/index.html");
if (!inkIndex.includes("url=/motion/") || !inkIndex.includes('href="/motion/"')) {
  failures.push("ink landing is not a redirect to /motion/");
}
if (inkIndex.includes("Ink.mountGrid") || inkIndex.includes("<h1>ink</h1>")) {
  failures.push("ink landing was restored as a public collection");
}

const inkStudy = await read("ink/drawably/index.html");
if (
  !inkStudy.includes("url=/motion/drawably/") ||
  !inkStudy.includes('href="/motion/drawably/"')
) {
  failures.push("ink/drawably is not a redirect to /motion/drawably/");
}
if (inkStudy.includes("preview.html") || inkStudy.includes("Ink.detail")) {
  failures.push("ink/drawably still hosts the public study");
}

const shell = await read("motion/motion-shell.js");
for (const needle of [
  'data-motion-study="drawably"',
  "/motion/drawably/",
  'sandbox", "allow-scripts"',
  "motion-visible",
  "injectDrawablyStudy",
]) {
  if (!shell.includes(needle)) {
    failures.push(`motion-shell.js missing ${needle}`);
  }
}
if (shell.includes("setTimeout(applyMotionIdentity")) {
  failures.push("Motion shell mutates React-managed content on a fixed hydration timer");
}

const detail = await read("motion/drawably/index.html");
for (const needle of [
  "Drawably — Motion",
  'rel="canonical" href="https://ibra.info/motion/drawably/"',
  'name="author" content="Ibragim Shirinov"',
  "roughness",
  "boil",
  "seed",
  "data-resketch",
  "data-copy-detail",
  "/motion/motion-shell.js",
]) {
  if (!detail.includes(needle)) failures.push(`drawably customize page missing ${needle}`);
}
if (/\bvault\b/i.test(detail) || /\bink\b/i.test(detail.replace(/drawably/gi, ""))) {
  failures.push("drawably customize page mentions ink or vault");
}

const preview = await read("motion/drawably/preview.html");
for (const needle of [
  'variant: "outline"',
  'variant: "solid"',
  'variant: "scribble"',
  "drawablyCheckbox",
  "drawablyToggle",
  "drawablyUnderline",
  "drawablyHighlight",
  "drawablyCircle",
  "innerWidth >= 8",
  "prefers-reduced-motion",
  "npm i drawably",
  "drawablyButton",
  'import "drawably/style.css"',
  "resketch",
  "destroy()",
]) {
  if (!preview.includes(needle)) failures.push(`drawably preview missing ${needle}`);
}

const vendor = await read("motion/drawably/vendor/drawably.js");
const css = await read("motion/drawably/vendor/drawably.css");
const version = (await read("motion/drawably/vendor/VERSION")).trim();
if (version !== "0.3.10") {
  failures.push(`vendored drawably is ${version || "missing"}, expected 0.3.10`);
}
if (!vendor.includes("drawably 0.3.10") || !vendor.includes("var Drawably")) {
  failures.push("vendored drawably.js is not the 0.3.10 IIFE");
}
if (!css.includes("@keyframes drawably-boil") || !css.includes("prefers-reduced-motion")) {
  failures.push("vendored drawably.css is missing boil or reduced-motion rules");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("motion drawably study contract passed");
