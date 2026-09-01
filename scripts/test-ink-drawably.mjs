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

const inkIndex = await read("ink/index.html");
if (!inkIndex.includes("<h1>ink</h1>") || !inkIndex.includes("Ink.mountGrid")) {
  failures.push("ink landing is not the live collection");
}
if (/\bvault\b/i.test(inkIndex)) {
  failures.push("ink landing mentions vault");
}

const catalog = await read("ink/ink.js");
if (!catalog.includes('slug: "drawably"') || !catalog.includes('kind: "study"')) {
  failures.push("ink.js does not register the drawably study");
}
if (!catalog.includes('data-resketch')) {
  failures.push("ink.js does not handle resketch");
}

for (const slug of [
  "arcade-pixel",
  "liquid-ui",
  "pixel-brushes",
  "holo",
  "spray-burst",
]) {
  const preview = await read(`ink/${slug}/preview.html`);
  if (preview.length < 80) failures.push(`ink/${slug}/preview.html is empty`);
}

const detail = await read("ink/drawably/index.html");
for (const needle of ["roughness", "boil", "seed", "data-resketch", "data-copy-detail"]) {
  if (!detail.includes(needle)) failures.push(`drawably customize page missing ${needle}`);
}
if (/\bvault\b/i.test(detail)) failures.push("drawably customize page mentions vault");

const preview = await read("ink/drawably/preview.html");
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
  "import \"drawably/style.css\"",
  "resketch",
  "destroy()",
]) {
  if (!preview.includes(needle)) failures.push(`drawably preview missing ${needle}`);
}

const vendor = await read("ink/drawably/vendor/drawably.js");
const css = await read("ink/drawably/vendor/drawably.css");
const version = (await read("ink/drawably/vendor/VERSION")).trim();
if (version !== "0.3.10") failures.push(`vendored drawably is ${version || "missing"}, expected 0.3.10`);
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

console.log("ink drawably study contract passed");
