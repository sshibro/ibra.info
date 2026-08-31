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

function localizeHtml(html) {
  const flightPayloadPattern =
    /<script>self\.__next_f\.push\(\[1,([\s\S]*?)\]\)<\/script>/g;
  const flightStream = [...html.matchAll(flightPayloadPattern)]
    .map((match) => JSON.parse(match[1]))
    .join("");
  const textRecordPattern = /([0-9a-f]+):T([0-9a-f]+),/g;
  const lengthAdjustments = [];
  let match;

  while ((match = textRecordPattern.exec(flightStream))) {
    const declaredBytes = Number.parseInt(match[2], 16);
    const contentStart = match.index + match[0].length;
    const content = Buffer.from(flightStream.slice(contentStart))
      .subarray(0, declaredBytes)
      .toString("utf8");
    const localizedContent = content.replaceAll(r2Origin, "/r2");

    if (localizedContent !== content) {
      lengthAdjustments.push({
        before: `${match[1]}:T${match[2]},`,
        after: `${match[1]}:T${Buffer.byteLength(localizedContent).toString(16)},`,
      });
    }

    textRecordPattern.lastIndex = contentStart + content.length;
  }

  let localized = html.replaceAll(r2Origin, "/r2");
  for (const { before, after } of lengthAdjustments) {
    localized = localized.replace(before, after);
  }
  return localized;
}

function escapeAttribute(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function withMotionMetadata(html, pathname, isIndex = false) {
  const sourceTitle = html.match(/<title>([^<]+)<\/title>/)?.[1] || "Study";
  const title = isIndex ? "Motion — Ibragim Shirinov" : `${sourceTitle} — Motion`;
  const canonical = `https://ibra.info${pathname}`;
  const description = "Motion and interaction studies by Ibragim Shirinov.";
  const structuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@type": isIndex ? "CollectionPage" : "CreativeWork",
    name: isIndex ? "Motion" : sourceTitle,
    url: canonical,
    author: {
      "@type": "Person",
      name: "Ibragim Shirinov",
      url: "https://ibra.info/",
    },
    ...(isIndex
      ? {}
      : {
          isPartOf: {
            "@type": "CollectionPage",
            name: "Motion",
            url: "https://ibra.info/motion/",
          },
        }),
  });

  let updated = html
    .replace(/<title>[^<]+<\/title>/, `<title>${escapeAttribute(title)}</title>`)
    .replace(/<link rel="author"[^>]*>/, '<link rel="author" href="https://ibra.info/"/>')
    .replace(/<meta name="author"[^>]*>/, '<meta name="author" content="Ibragim Shirinov"/>')
    .replace(/<meta name="creator"[^>]*>/, '<meta name="creator" content="Ibragim Shirinov"/>')
    .replace(/<meta name="publisher"[^>]*>/, '<meta name="publisher" content="Ibragim Shirinov"/>')
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${canonical}"/>`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${escapeAttribute(title)}"/>`)
    .replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${canonical}"/>`)
    .replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${escapeAttribute(title)}"/>`);

  if (/<meta name="description"[^>]*>/.test(updated)) {
    updated = updated.replace(
      /<meta name="description"[^>]*>/,
      `<meta name="description" content="${description}"/>`
    );
  } else {
    updated = updated.replace(
      "<head>",
      `<head><meta name="description" content="${description}"/>`
    );
  }

  return updated.replace(
    "<head>",
    `<head><script type="application/ld+json">${structuredData}</script>`
  );
}

function promptSlugsFrom(html) {
  const marker = '\\"promptSlugs\\":';
  const start = html.indexOf(marker);
  if (start === -1) return [];
  const valueStart = start + marker.length;
  const valueEnd = html.indexOf("]", valueStart) + 1;
  return JSON.parse(html.slice(valueStart, valueEnd).replaceAll('\\"', '"'));
}

function withNoIndex(html) {
  return html.replace("<head>", '<head><meta name="robots" content="noindex, nofollow">');
}

function withMotionShell(html, isIndex = false) {
  const noscript = isIndex
    ? '<noscript><style>main h1{font-size:0}main h1::after{content:"Motion";font-size:15px}</style></noscript>'
    : '<noscript><p><a href="/motion/">Back to Motion</a></p></noscript>';
  return html.replace(
    "</body>",
    `${noscript}<script src="/motion/motion-shell.js"></script></body>`
  );
}

function redirectHtml(destination) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="refresh" content="0; url=${destination}">
    <meta name="robots" content="noindex">
    <link rel="canonical" href="https://ibra.info${destination}">
    <title>Moved to Motion</title>
  </head>
  <body><p>Moved to <a href="${destination}">Motion</a>.</p></body>
</html>\n`;
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

const declaredMediaDownloads = new Map();
const declaredMediaDestinations = new Set();

async function mirrorDeclaredMedia(html) {
  const escapedOrigin = r2Origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const candidates = [
    ...html.matchAll(new RegExp(`${escapedOrigin}/[^"'<>\\\\\\s]+`, "g")),
  ]
    .map((match) => match[0].replaceAll("\\u0026", "&"))
    .filter((url) => /\.(?:webm|mp4)(?:\?|$)/i.test(url));

  await Promise.all(
    [...new Set(candidates)].map((url) => {
      if (!declaredMediaDownloads.has(url)) {
        const destination = localPathFor(url);
        declaredMediaDestinations.add(destination);
        declaredMediaDownloads.set(url, download(url, destination));
      }
      return declaredMediaDownloads.get(url);
    })
  );
}

async function mirrorPromptPayloads(html) {
  const slugs = promptSlugsFrom(html);
  const queue = [...slugs];
  const promptFailures = [];
  const destination = path.join(projectRoot, "vault", "prompt");
  await mkdir(destination, { recursive: true });

  async function promptWorker() {
    while (queue.length) {
      const slug = queue.shift();
      const url = `${sourceUrl}/prompt/${slug}`;
      try {
        const response = await fetch(url, {
          headers: { "user-agent": "ibra.info vault mirror" },
        });
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        await writeFile(path.join(destination, slug), await response.text());
      } catch (error) {
        promptFailures.push({ url, message: error.message });
      }
    }
  }

  await Promise.all(Array.from({ length: 8 }, promptWorker));
  if (promptFailures.length) {
    throw new Error(
      `Failed to mirror ${promptFailures.length} prompt payloads:\n${JSON.stringify(promptFailures, null, 2)}`
    );
  }
  return slugs.length;
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
await mirrorDeclaredMedia(html);
const localizedHtml = localizeHtml(html);
await mkdir(path.join(projectRoot, "vault"), { recursive: true });
const mirroredPrompts = await mirrorPromptPayloads(html);
await writeFile(path.join(projectRoot, "vault", "index.html"), withNoIndex(localizedHtml));

await mkdir(path.join(projectRoot, "motion"), { recursive: true });
await writeFile(
  path.join(projectRoot, "motion", "index.html"),
  withMotionShell(withMotionMetadata(localizedHtml, "/motion/", true), true)
);

await mkdir(path.join(projectRoot, "ink"), { recursive: true });
await writeFile(path.join(projectRoot, "ink", "index.html"), redirectHtml("/motion/"));

await Promise.all(
  detailCapture.pages.map(async ({ slug }) => {
    const response = await fetch(`${sourceUrl}/${slug}`, {
      headers: { "user-agent": "ibra.info vault mirror" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${sourceUrl}/${slug}: ${response.status}`);
    }

    const rawHtml = await response.text();
    await mirrorDeclaredMedia(rawHtml);
    const sourceHtml = localizeHtml(rawHtml);
    const localSlug = localStudySlugs[slug] || slug;
    const motionDestination = `/motion/${localSlug}/`;
    const motionHtml = withMotionShell(
      withMotionMetadata(sourceHtml, motionDestination)
    );

    await mkdir(path.join(projectRoot, "vault", slug), { recursive: true });
    await writeFile(
      path.join(projectRoot, "vault", slug, "index.html"),
      withNoIndex(sourceHtml)
    );
    await mkdir(path.join(projectRoot, "motion", localSlug), { recursive: true });
    await writeFile(path.join(projectRoot, "motion", localSlug, "index.html"), motionHtml);
    await mkdir(path.join(projectRoot, "ink", localSlug), { recursive: true });
    await writeFile(
      path.join(projectRoot, "ink", localSlug, "index.html"),
      redirectHtml(motionDestination)
    );
  })
);

await writeFile(
  path.join(projectRoot, "robots.txt"),
  "User-agent: *\nDisallow: /vault/\n"
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
      mirroredAssets: new Set([
        ...downloadable.map((asset) => asset.destination),
        ...declaredMediaDestinations,
      ]).size,
      declaredMediaAssets: declaredMediaDestinations.size,
      mirroredPrompts,
      scripts: downloadable.filter((asset) => asset.destination.endsWith(".js")).length,
      sourceRuntime: path.join(projectRoot, "vault", "index.html"),
      motionEntry: path.join(projectRoot, "motion", "index.html"),
      legacyRedirects: detailCapture.pages.length + 1,
      mirroredStudies: detailCapture.pages.length,
    },
    null,
    2
  )
);
