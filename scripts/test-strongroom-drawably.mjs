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
if (!homepage.includes('href="/strongroom/">strongroom</a>')) {
  failures.push("homepage does not link the word strongroom to /strongroom/");
}
if (!homepage.includes("locked away in the")) {
  failures.push("homepage strongroom sentence changed");
}

const inkIndex = await read("ink/index.html");
if (!inkIndex.includes("url=/strongroom/") || !inkIndex.includes('href="/strongroom/"')) {
  failures.push("ink landing is not a redirect to /strongroom/");
}
if (inkIndex.includes("Ink.mountGrid") || inkIndex.includes("<h1>ink</h1>")) {
  failures.push("ink landing was restored as a public collection");
}

const inkStudy = await read("ink/drawably/index.html");
if (
  !inkStudy.includes("url=/strongroom/drawably/") ||
  !inkStudy.includes('href="/strongroom/drawably/"')
) {
  failures.push("ink/drawably is not a redirect to /strongroom/drawably/");
}
if (inkStudy.includes("preview.html") || inkStudy.includes("Ink.detail")) {
  failures.push("ink/drawably still hosts the public study");
}

const shell = await read("strongroom/strongroom.js");
for (const needle of [
  'srStudy = "drawably"',
  "`${ROOT}/drawably/`",
  "`${ROOT}/drawably/hero.html`",
  'sandbox", "allow-scripts"',
  "motion-visible",
  "injectHero",
  "grid.insertBefore(card, first)",
]) {
  if (!shell.includes(needle)) {
    failures.push(`strongroom.js missing ${needle}`);
  }
}

const hero = await read("strongroom/drawably/hero.html");
for (const needle of [
  "drawablyBadge",
  "drawablyCircle",
  "drawablyHighlight",
  "drawablyUnderline",
  "drawablyButton",
  "drawablyCheckbox",
  "drawablyRadio",
  "drawablyToggle",
  "motion-visible",
  "prefers-reduced-motion",
  "innerWidth >= 8",
]) {
  if (!hero.includes(needle)) failures.push(`drawably hero missing ${needle}`);
}

const detail = await read("strongroom/drawably/index.html");
for (const needle of [
  "Drawably — Strongroom",
  'rel="canonical" href="https://ibra.info/strongroom/drawably/"',
  'name="author" content="Ibragim Shirinov"',
  "roughness",
  "boil",
  "seed",
  "data-resketch",
  "data-copy-detail",
  "/strongroom/strongroom.js",
]) {
  if (!detail.includes(needle)) failures.push(`drawably customize page missing ${needle}`);
}
if (/\/vault\b/i.test(detail) || /\/ink\//i.test(detail) || /Back to (Ink|Vault)/i.test(detail)) {
  failures.push("drawably customize page links the old ink or vault routes");
}

const preview = await read("strongroom/drawably/preview.html");
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

const vendor = await read("strongroom/drawably/vendor/drawably.js");
const css = await read("strongroom/drawably/vendor/drawably.css");
const version = (await read("strongroom/drawably/vendor/VERSION")).trim();
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

console.log("strongroom drawably study contract passed");
