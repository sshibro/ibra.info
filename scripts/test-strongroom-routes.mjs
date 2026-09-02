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
  drawably: "drawably",
};

const failures = [];
const checkedMedia = new Set();

async function read(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return await readFile(path.join(root, relativePath), "utf8");
  } catch {
    failures.push(`missing ${relativePath}`);
    return "";
  }
}

function verifyFlightTextRecords(relativePath, html) {
  const payloadPattern = /<script>self\.__next_f\.push\(\[1,([\s\S]*?)\]\)<\/script>/g;
  const stream = [...html.matchAll(payloadPattern)]
    .map((match) => JSON.parse(match[1]))
    .join("");
  const textRecordPattern = /([0-9a-f]+):T([0-9a-f]+),/g;
  let match;

  while ((match = textRecordPattern.exec(stream))) {
    const declaredBytes = Number.parseInt(match[2], 16);
    const contentStart = match.index + match[0].length;
    const content = Buffer.from(stream.slice(contentStart))
      .subarray(0, declaredBytes)
      .toString("utf8");
    const remainder = stream.slice(contentStart + content.length);

    if (remainder && !/^(?:\n)?[0-9a-f]+:/.test(remainder)) {
      failures.push(`${relativePath} has an invalid Flight text-record length at ${match[1]}`);
      return;
    }

    textRecordPattern.lastIndex = contentStart + content.length;
  }
}

function promptSlugsFrom(html) {
  const marker = '\\"promptSlugs\\":';
  const start = html.indexOf(marker);
  if (start === -1) return [];
  const valueStart = start + marker.length;
  const valueEnd = html.indexOf("]", valueStart) + 1;
  return JSON.parse(html.slice(valueStart, valueEnd).replaceAll('\\"', '"'));
}

async function verifyDeclaredMedia(relativePath, html) {
  const references = [...html.matchAll(/\/r2\/[^"'<>\\\s]+\.(?:webm|mp4)(?:\?[^"'<>\\\s]*)?/g)]
    .map((match) => match[0].split("?")[0]);

  for (const reference of references) {
    if (checkedMedia.has(reference)) continue;
    checkedMedia.add(reference);
    try {
      await access(path.join(root, decodeURIComponent(reference).replace(/^\/+/, "")));
    } catch {
      failures.push(`${relativePath} references missing media ${reference}`);
    }
  }
}

const homepage = await read("index.html");
if (!homepage.includes('href="/strongroom/">strongroom</a>')) {
  failures.push("homepage does not link the word strongroom to /strongroom/");
}

const shell = await read("strongroom/strongroom.js");
if (!shell.includes('const NAME = "Strongroom"') || !shell.includes("— Ibragim Shirinov`")) {
  failures.push("Strongroom shell does not set the collection title");
}
if (!shell.includes('template[data-dgst]')) {
  failures.push("Strongroom shell does not wait for Next hydration markers to clear");
}
if (!shell.includes('srStudy = "drawably"') || !shell.includes("`${ROOT}/drawably/`")) {
  failures.push("Strongroom shell does not register the drawably study on the grid");
}
const stylesheet = await read("strongroom/strongroom.css");
if (!stylesheet.includes("--bg-page: #f4f4f0") || !stylesheet.includes(".sr-hero")) {
  failures.push("Strongroom stylesheet is missing the identity tokens or hero rules");
}

for (const [legacySlug, motionSlug] of Object.entries(routes)) {
  const suffix = motionSlug ? `${motionSlug}/` : "";
  const motionPath = `strongroom/${suffix}index.html`;
  const inkPath = `ink/${legacySlug ? `${legacySlug}/` : ""}index.html`;
  const legacyMotionPath = `motion/${suffix}index.html`;
  const destination = `/strongroom/${suffix}`;
  const motionHtml = await read(motionPath);
  const inkHtml = await read(inkPath);
  const legacyMotionHtml = await read(legacyMotionPath);

  if (!motionHtml.includes('/strongroom/strongroom.js')) {
    failures.push(`${motionPath} does not load the Strongroom shell`);
  }
  if (motionSlug !== "drawably" && !motionHtml.includes('/strongroom/strongroom.css')) {
    failures.push(`${motionPath} does not load the Strongroom stylesheet`);
  }
  if (!motionSlug && !motionHtml.includes('id="strongroom-index-heading"')) {
    failures.push(`${motionPath} does not render the Strongroom heading before hydration`);
  }
  const title = motionHtml.match(/<title>([^<]+)<\/title>/)?.[1];
  const validTitle = motionSlug
    ? title?.endsWith(" — Strongroom")
    : title === "Strongroom — Ibragim Shirinov";
  if (!validTitle) {
    failures.push(`${motionPath} does not expose a server-rendered Strongroom title`);
  }
  if (!motionHtml.includes(`rel="canonical" href="https://ibra.info${destination}"`)) {
    failures.push(`${motionPath} does not expose the Strongroom canonical URL`);
  }
  if (!motionHtml.includes('name="author" content="Ibragim Shirinov"')) {
    failures.push(`${motionPath} does not expose the Strongroom author`);
  }
  verifyFlightTextRecords(motionPath, motionHtml);
  await verifyDeclaredMedia(motionPath, motionHtml);
  if (!inkHtml.includes(`url=${destination}`) || !inkHtml.includes(`href="${destination}"`)) {
    failures.push(`${inkPath} does not redirect and link to ${destination}`);
  }
  if (
    !legacyMotionHtml.includes(`url=${destination}`) ||
    !legacyMotionHtml.includes(`href="${destination}"`)
  ) {
    failures.push(`${legacyMotionPath} does not redirect and link to ${destination}`);
  }
}

const promptSlugs = promptSlugsFrom(await read("strongroom/index.html"));
if (promptSlugs.length !== 41) {
  failures.push(`expected 41 prompt payloads, found ${promptSlugs.length}`);
}
for (const slug of promptSlugs) {
  const prompt = await read(`vault/prompt/${slug}`);
  if (prompt.length < 100) failures.push(`vault/prompt/${slug} is not a complete prompt payload`);
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
