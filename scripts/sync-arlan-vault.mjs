import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const [inventoryPath, projectRoot = process.cwd(), detailInventoryPath] = process.argv.slice(2);

if (!inventoryPath) {
  throw new Error(
    "Usage: node scripts/sync-arlan-vault.mjs <browser-inventory.json> [project-root] [detail-inventories.json]"
  );
}

const sourceUrl = "https://www.arlan.me/vault";
const r2Origin = "https://pub-58a0dfd4417141169bd84ab545cd7830.r2.dev";
const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
const detailCapture = detailInventoryPath
  ? JSON.parse(await readFile(detailInventoryPath, "utf8"))
  : { pages: [] };
const capturedAssets = [
  ...inventory.assets,
  ...detailCapture.pages.flatMap((page) => page.inventory.assets),
];

const localStudySlugs = {
  "arcade-pixel": "arcade-pixel",
  holo: "holo",
  "pixel-brushes": "pixel-brushes",
  "fade-motion": "fade-motion",
  "liquid-ui": "liquid-ui",
  "kinetic-typography": "kinetic",
  squircle: "squircle",
  "ransom-note": "ransom",
  "chroma-glow": "chroma",
  emboss: "emboss",
  typer: "typer",
  "color-depth": "color-depth",
  "ghosty-reveal": "ghost",
  sandbox: "symbols",
  "dia-gradient": "dia-gradient",
  "vector-editor": "vector",
  amo: "amo",
  midjourney: "ascii",
};

function localPathFor(assetUrl) {
  const url = new URL(assetUrl);
  const pathname = decodeURIComponent(url.pathname);

  if (url.origin === "https://www.arlan.me") {
    return path.join(projectRoot, pathname.replace(/^\/+/, ""));
  }

  if (url.origin === r2Origin) {
    return path.join(projectRoot, "r2", pathname.replace(/^\/+/, ""));
  }

  return null;
}

async function download(url, destination) {
  const response = await fetch(url, {
    headers: { "user-agent": "ibra.info vault mirror" },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }

  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
}

const downloadable = capturedAssets
  .filter((asset) =>
    ["script", "font", "image", "stylesheet", "video"].includes(asset.kind) ||
    /\.(?:glb|mp3|ogg|wasm)(?:\?|$)/i.test(asset.url)
  )
  .map((asset) => ({ url: asset.url, destination: localPathFor(asset.url) }))
  .filter((asset) => asset.destination)
  .filter((asset, index, assets) =>
    assets.findIndex((candidate) => candidate.destination === asset.destination) === index
  );

const queue = [...downloadable];
const failures = [];

async function worker() {
  while (queue.length) {
    const asset = queue.shift();
    try {
      await download(asset.url, asset.destination);
    } catch (error) {
      failures.push({ url: asset.url, message: error.message });
    }
  }
}

await Promise.all(Array.from({ length: 8 }, worker));

if (failures.length) {
  throw new Error(`Failed to mirror ${failures.length} assets:\n${JSON.stringify(failures, null, 2)}`);
}

const sourceResponse = await fetch(sourceUrl, {
  headers: { "user-agent": "ibra.info vault mirror" },
});

if (!sourceResponse.ok) {
  throw new Error(`Failed to fetch ${sourceUrl}: ${sourceResponse.status}`);
}

const html = await sourceResponse.text();
const localizedHtml = html.replaceAll(r2Origin, "/r2");
await mkdir(path.join(projectRoot, "vault"), { recursive: true });
await writeFile(path.join(projectRoot, "vault", "index.html"), localizedHtml);

const inkHtml = localizedHtml.replace(
  "</body>",
  '<script src="/ink/ink-shell.js"></script></body>'
);
await mkdir(path.join(projectRoot, "ink"), { recursive: true });
await writeFile(path.join(projectRoot, "ink", "index.html"), inkHtml);

await Promise.all(
  detailCapture.pages.map(async ({ slug }) => {
    const response = await fetch(`${sourceUrl}/${slug}`, {
      headers: { "user-agent": "ibra.info vault mirror" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${sourceUrl}/${slug}: ${response.status}`);
    }

    const sourceHtml = (await response.text()).replaceAll(r2Origin, "/r2");
    const localSlug = localStudySlugs[slug] || slug;
    const localHtml = sourceHtml.replace(
      "</body>",
      '<script src="/ink/ink-shell.js"></script></body>'
    );

    await mkdir(path.join(projectRoot, "vault", slug), { recursive: true });
    await writeFile(path.join(projectRoot, "vault", slug, "index.html"), sourceHtml);
    await mkdir(path.join(projectRoot, "ink", localSlug), { recursive: true });
    await writeFile(path.join(projectRoot, "ink", localSlug, "index.html"), localHtml);
  })
);

const textAssets = downloadable.filter((asset) => /\.(?:js|css)$/i.test(asset.destination));

for (const asset of textAssets) {
  const text = await readFile(asset.destination, "utf8");
  const rewritten = text.replaceAll(r2Origin, "/r2");
  if (rewritten !== text) {
    await writeFile(asset.destination, rewritten);
  }
}

console.log(
  JSON.stringify(
    {
      mirroredAssets: downloadable.length,
      scripts: downloadable.filter((asset) => asset.destination.endsWith(".js")).length,
      sourceRuntime: path.join(projectRoot, "vault", "index.html"),
      inkEntry: path.join(projectRoot, "ink", "index.html"),
      mirroredStudies: detailCapture.pages.length,
    },
    null,
    2
  )
);
