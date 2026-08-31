import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const routes = {
  "": "",
  "arcade-pixel": "arcade-pixel",
  holo: "holo",
  "pixel-brushes": "pixel-brushes",
  "fade-motion": "fade-motion",
  "liquid-ui": "liquid-ui",
  kinetic: "kinetic",
  squircle: "squircle",
  ransom: "ransom",
  chroma: "chroma",
  emboss: "emboss",
  typer: "typer",
  "color-depth": "color-depth",
  ghost: "ghost",
  symbols: "symbols",
  "dia-gradient": "dia-gradient",
  vector: "vector",
  amo: "amo",
  ascii: "ascii",
};

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
if (!homepage.includes('href="/motion/">motion</a>')) {
  failures.push("homepage does not link the word motion to /motion/");
}

const shell = await read("motion/motion-shell.js");
if (!shell.includes('"Motion — Ibragim Shirinov"')) {
  failures.push("Motion shell does not set the collection title");
}

for (const [legacySlug, motionSlug] of Object.entries(routes)) {
  const suffix = motionSlug ? `${motionSlug}/` : "";
  const motionPath = `motion/${suffix}index.html`;
  const inkPath = `ink/${legacySlug ? `${legacySlug}/` : ""}index.html`;
  const destination = `/motion/${suffix}`;
  const motionHtml = await read(motionPath);
  const inkHtml = await read(inkPath);

  if (!motionHtml.includes('/motion/motion-shell.js')) {
    failures.push(`${motionPath} does not load the Motion shell`);
  }
  if (!inkHtml.includes(`url=${destination}`) || !inkHtml.includes(`href="${destination}"`)) {
    failures.push(`${inkPath} does not redirect and link to ${destination}`);
  }
}

const robots = await read("robots.txt");
if (!robots.includes("Disallow: /vault/")) {
  failures.push("robots.txt does not exclude /vault/");
}

const vault = await read("vault/index.html");
if (!vault.includes('name="robots" content="noindex, nofollow"')) {
  failures.push("Vault runtime landing page is not marked noindex");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Motion route contract passed for ${Object.keys(routes).length} canonical and legacy routes.`);
