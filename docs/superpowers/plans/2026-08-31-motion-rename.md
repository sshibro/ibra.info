# Strongroom Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the verified interactive collection as Strongroom at `/strongroom/`, preserve every legacy `/ink/` URL through static redirects, and release it through PR #5.

**Architecture:** Keep `/vault/` as the no-index source-compatible runtime namespace. Generate one visitor-facing copy under `/strongroom/` with a focused identity/navigation shell, and replace the current `/ink/` entry files with static redirect documents. Extend the existing mirror script so future captures regenerate all three layers consistently.

**Tech Stack:** Static HTML, browser JavaScript, Node.js sync/contract scripts, GitHub Pages, GitHub pull requests.

---

## File structure

- Create `strongroom/strongroom.js`: Strongroom identity, metadata, and source-route mapping only.
- Create `strongroom/**/index.html`: generated visitor-facing runtime pages.
- Modify `ink/**/index.html`: legacy redirect documents; existing unused preview assets stay untouched.
- Modify `scripts/sync-arlan-vault.mjs`: generate no-index Vault source pages, Strongroom pages, and Ink redirects.
- Create `scripts/test-strongroom-routes.mjs`: deterministic static route/metadata contract.
- Create `robots.txt`: exclude the internal `/vault/` namespace from indexing.
- Modify `index.html`, `README.md`, `THIRD_PARTY_NOTICES.md`, and `design-qa.md`: public identity and release documentation.
- Modify `docs/superpowers/specs/2026-08-31-motion-rename-design.md`: only if implementation reveals a factual inconsistency; no scope expansion.

### Task 1: Add the failing Strongroom route contract

**Files:**
- Create: `scripts/test-strongroom-routes.mjs`

- [ ] **Step 1: Write the static contract test**

```js
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
if (!homepage.includes('href="/strongroom/">motion</a>')) {
  failures.push("homepage does not link the word motion to /strongroom/");
}

const shell = await read("motion/strongroom.js");
if (!shell.includes('"Strongroom — Ibragim Shirinov"')) {
  failures.push("Strongroom shell does not set the collection title");
}

for (const [legacySlug, motionSlug] of Object.entries(routes)) {
  const suffix = motionSlug ? `${motionSlug}/` : "";
  const motionPath = `strongroom/${suffix}index.html`;
  const inkPath = `ink/${legacySlug ? `${legacySlug}/` : ""}index.html`;
  const destination = `/strongroom/${suffix}`;
  const motionHtml = await read(motionPath);
  const inkHtml = await read(inkPath);

  if (!motionHtml.includes('/strongroom/strongroom.js')) {
    failures.push(`${motionPath} does not load the Strongroom shell`);
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

console.log(`Strongroom route contract passed for ${Object.keys(routes).length} canonical and legacy routes.`);
```

- [ ] **Step 2: Run the contract and confirm it fails before implementation**

Run: `node scripts/test-strongroom-routes.mjs`

Expected: non-zero exit with missing `strongroom/index.html`, `strongroom/strongroom.js`, `robots.txt`, and incorrect homepage/Ink route messages.

- [ ] **Step 3: Commit the failing contract**

```bash
git add scripts/test-strongroom-routes.mjs
git commit -m "test: define the Strongroom route contract"
```

### Task 2: Build the Strongroom identity shell

**Files:**
- Create: `strongroom/strongroom.js`
- Delete: `ink/ink-shell.js`

- [ ] **Step 1: Create the focused identity and navigation helper**

Create `strongroom/strongroom.js` with:

```js
(() => {
  const localStudies = {
    "/vault/arcade-pixel": "/strongroom/arcade-pixel/",
    "/vault/holo": "/strongroom/holo/",
    "/vault/pixel-brushes": "/strongroom/pixel-brushes/",
    "/vault/fade-motion": "/strongroom/fade-motion/",
    "/vault/liquid-ui": "/strongroom/liquid-ui/",
    "/vault/kinetic-typography": "/strongroom/kinetic/",
    "/vault/squircle": "/strongroom/squircle/",
    "/vault/ransom-note": "/strongroom/ransom/",
    "/vault/chroma-glow": "/strongroom/chroma/",
    "/vault/emboss": "/strongroom/emboss/",
    "/vault/typer": "/strongroom/typer/",
    "/vault/color-depth": "/strongroom/color-depth/",
    "/vault/ghosty-reveal": "/strongroom/ghost/",
    "/vault/sandbox": "/strongroom/symbols/",
    "/vault/dia-gradient": "/strongroom/dia-gradient/",
    "/vault/vector-editor": "/strongroom/vector/",
    "/vault/amo": "/strongroom/amo/",
    "/vault/midjourney": "/strongroom/ascii/",
  };

  function setMeta(selector, attribute, value) {
    const element = document.querySelector(selector);
    if (element) element.setAttribute(attribute, value);
  }

  function applyStrongroomIdentity() {
    const heading = document.querySelector("main h1");
    const isIndex = window.location.pathname.replace(/\/+$/, "") === "/motion";
    if (isIndex && heading && heading.textContent !== "Strongroom") heading.textContent = "Strongroom";

    document.title = isIndex
      ? "Strongroom — Ibragim Shirinov"
      : `${heading?.textContent || "Study"} — Strongroom`;
    setMeta('meta[name="description"]', "content", "Strongroom and interaction studies by Ibragim Shirinov.");
    setMeta('link[rel="canonical"]', "href", `https://ibra.info${window.location.pathname}`);
    setMeta('meta[property="og:title"]', "content", document.title);
    setMeta('meta[property="og:url"]', "content", `https://ibra.info${window.location.pathname}`);
  }

  document.addEventListener(
    "click",
    (event) => {
      const anchor = event.target.closest("a[href]");
      if (!anchor) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const destination = localStudies[url.pathname];
      if (!destination && url.pathname !== "/" && url.pathname !== "/vault") return;

      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign(destination || (url.pathname === "/vault" ? "/strongroom/" : "/"));
    },
    true
  );

  setTimeout(applyStrongroomIdentity, 600);
  setTimeout(applyStrongroomIdentity, 1800);
})();
```

- [ ] **Step 2: Remove the obsolete Ink helper**

Delete `ink/ink-shell.js`; redirect pages must not load a copy of the interactive runtime.

- [ ] **Step 3: Check JavaScript syntax**

Run: `node --check motion/strongroom.js`

Expected: exit 0 and no output.

- [ ] **Step 4: Commit the identity helper**

```bash
git add motion/strongroom.js ink/ink-shell.js
git commit -m "feat: add the Strongroom identity shell"
```

### Task 3: Generate canonical Strongroom pages and Ink redirects

**Files:**
- Modify: `scripts/sync-arlan-vault.mjs`
- Create/Modify: `strongroom/**/index.html`
- Modify: `ink/**/index.html`
- Modify: `vault/**/index.html`
- Create: `robots.txt`

- [ ] **Step 1: Add generation helpers to the sync script**

Add these helpers after `localStudySlugs`:

```js
function withNoIndex(html) {
  return html.replace(
    "<head>",
    '<head><meta name="robots" content="noindex, nofollow">'
  );
}

function withStrongroomShell(html, isIndex = false) {
  const noscript = isIndex
    ? '<noscript><style>main h1{font-size:0}main h1::after{content:"Strongroom";font-size:15px}</style></noscript>'
    : '<noscript><p><a href="/strongroom/">Back to Strongroom</a></p></noscript>';
  return html.replace(
    "</body>",
    `${noscript}<script src="/strongroom/strongroom.js"></script></body>`
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
    <title>Moved to Strongroom</title>
  </head>
  <body><p>Moved to <a href="${destination}">Strongroom</a>.</p></body>
</html>\n`;
}
```

- [ ] **Step 2: Generate the three route layers**

For the landing page, write:

```js
await writeFile(path.join(projectRoot, "vault", "index.html"), withNoIndex(localizedHtml));
await mkdir(path.join(projectRoot, "motion"), { recursive: true });
await writeFile(
  path.join(projectRoot, "motion", "index.html"),
  withStrongroomShell(localizedHtml, true)
);
await writeFile(path.join(projectRoot, "ink", "index.html"), redirectHtml("/strongroom/"));
```

For each detail page, use `localStudySlugs[slug] || slug` and write:

```js
const publicHtml = withStrongroomShell(sourceHtml);
await writeFile(
  path.join(projectRoot, "vault", slug, "index.html"),
  withNoIndex(sourceHtml)
);
await mkdir(path.join(projectRoot, "motion", localSlug), { recursive: true });
await writeFile(path.join(projectRoot, "motion", localSlug, "index.html"), publicHtml);
await writeFile(
  path.join(projectRoot, "ink", localSlug, "index.html"),
  redirectHtml(`/strongroom/${localSlug}/`)
);
```

Remove all generation references to `/ink/ink-shell.js` and report `motionEntry` plus `legacyRedirects: detailCapture.pages.length + 1` in the final JSON summary.

- [ ] **Step 3: Add crawler exclusion for the source namespace**

Create `robots.txt`:

```text
User-agent: *
Disallow: /vault/
```

- [ ] **Step 4: Regenerate from the captured browser inventories**

Run:

```bash
node scripts/sync-arlan-vault.mjs \
  /var/folders/wx/522_d_sj1cz3gy5mbnvd36tw0000gn/T/ibra-vault-capture/source-assets-inventory-final.json \
  . \
  /tmp/arlan-vault-detail-inventories.json
```

Expected JSON: `mirroredAssets: 194`, `mirroredStudies: 18`, `legacyRedirects: 19`, and a `motionEntry` ending in `strongroom/index.html`.

- [ ] **Step 5: Run syntax and route contracts**

```bash
node --check scripts/sync-arlan-vault.mjs
node --check motion/strongroom.js
node scripts/test-strongroom-routes.mjs
```

Expected: both syntax checks exit 0; route contract reports 19 canonical and legacy routes.

- [ ] **Step 6: Commit generated routing**

```bash
git add scripts/sync-arlan-vault.mjs motion ink vault robots.txt
git commit -m "feat: publish the collection as Strongroom"
```

### Task 4: Update public copy and documentation

**Files:**
- Modify: `index.html`
- Modify: `README.md`
- Modify: `THIRD_PARTY_NOTICES.md`
- Modify: `design-qa.md`

- [ ] **Step 1: Update the homepage sentence**

Replace:

```html
<a class="pill" href="/ink/">ink</a>
```

with:

```html
<a class="pill" href="/strongroom/">motion</a>
```

- [ ] **Step 2: Update repository documentation**

Replace the collection description in `README.md` with:

```markdown
`/strongroom/` is the public collection of motion and interaction studies. It preserves the complete Arlan Vault runtime: 41 prompt studies, 18 named studies, playgrounds, source panels, fonts, media, and animation code.

`/vault/` stores the source-compatible captured runtime and is excluded from indexing. `/ink/` contains compatibility redirects to the matching Strongroom routes. GitHub Pages needs the checked-in `.nojekyll` file so the mirrored `/_next/` assets are served.
```

Replace “The Ink interaction collection” in `THIRD_PARTY_NOTICES.md` with “The Strongroom interaction collection.”

- [ ] **Step 3: Update the QA record**

Apply these exact report changes in `design-qa.md`:

```markdown
# Strongroom / Vault design QA
```

Replace visitor-facing `Ink` with `Strongroom`, replace visitor-facing `/ink/` URLs with `/strongroom/`, and add this functional result:

```markdown
- The static route contract passed for 19 canonical Strongroom routes and 19 legacy Ink redirects; `/vault/` is no-index and excluded by `robots.txt`.
```

- [ ] **Step 4: Run documentation and route checks**

```bash
node scripts/test-strongroom-routes.mjs
git diff --check
rg -n 'href="/ink/">ink|ink — Ibragim|Ink interaction collection' index.html README.md THIRD_PARTY_NOTICES.md design-qa.md motion
```

Expected: route contract passes; `git diff --check` exits 0; the final `rg` returns no matches.

- [ ] **Step 5: Commit public identity copy**

```bash
git add index.html README.md THIRD_PARTY_NOTICES.md design-qa.md
git commit -m "docs: rename the collection to Strongroom"
```

### Task 5: Run local functional and visual verification

**Files:**
- Modify only if QA exposes a defect.

- [ ] **Step 1: Verify all static routes over HTTP**

Run the existing server or start `python3 -m http.server 4173 --bind 127.0.0.1`, then run:

```bash
for route in motion motion/arcade-pixel motion/holo motion/pixel-brushes motion/fade-motion motion/liquid-ui motion/kinetic motion/squircle motion/ransom motion/chroma motion/emboss motion/typer motion/color-depth motion/ghost motion/symbols motion/dia-gradient motion/vector motion/amo motion/ascii; do
  test "$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:4173/$route/")" = 200 || exit 1
done
```

Expected: 19 successful responses.

- [ ] **Step 2: Verify legacy redirects**

Run: `node scripts/test-strongroom-routes.mjs`

Expected: 19 correct redirect documents.

- [ ] **Step 3: Verify browser behavior**

Using the approved browser surface:

- Load `/strongroom/` and confirm heading `Strongroom` with zero console errors.
- Scroll the entire landing page.
- Open a named study and confirm the destination uses `/strongroom/`.
- Use the detail close control and confirm it returns to `/strongroom/`.
- Exercise one prompt control and the Arcade playground.
- Load all 18 detail routes and confirm expected headings with zero console errors.

- [ ] **Step 4: Verify responsive fidelity**

Capture `/strongroom/` at 1440×1000 and 390×844, combine each implementation capture with its existing source capture, and inspect typography, margins, card width, radii, assets, and footer. The only intended difference is the `Strongroom` heading and ibra.info metadata.

- [ ] **Step 5: Verify local assets and crawler rules**

Run:

```bash
node scripts/test-strongroom-routes.mjs
test "$(rg -o 'https://pub-58a0dfd4417141169bd84ab545cd7830\.r2\.dev' motion vault _next | wc -l | tr -d ' ')" = 0
test "$(find r2 pixel _next/static/media -type f | wc -l | tr -d ' ')" -ge 63
```

Run this inventory verifier and confirm `observedReferences: 849`, `uniqueLocalAssets: 194`, and `missing: []`:

```bash
node - <<'NODE'
const fs = require("fs");
const path = require("path");
const landing = JSON.parse(fs.readFileSync("/var/folders/wx/522_d_sj1cz3gy5mbnvd36tw0000gn/T/ibra-vault-capture/source-assets-inventory-final.json", "utf8"));
const details = JSON.parse(fs.readFileSync("/tmp/arlan-vault-detail-inventories.json", "utf8"));
const assets = [...landing.assets, ...details.pages.flatMap((page) => page.inventory.assets)];
const r2 = "https://pub-58a0dfd4417141169bd84ab545cd7830.r2.dev";
const expected = [];
for (const asset of assets) {
  if (!["script", "font", "image", "stylesheet", "video"].includes(asset.kind) && !/\.(glb|mp3|ogg|wasm)(\?|$)/i.test(asset.url)) continue;
  const url = new URL(asset.url);
  const pathname = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  if (url.origin === "https://www.arlan.me") expected.push(path.join(process.cwd(), pathname));
  if (url.origin === r2) expected.push(path.join(process.cwd(), "r2", pathname));
}
const unique = [...new Set(expected)];
const missing = unique.filter((file) => !fs.existsSync(file));
console.log(JSON.stringify({ observedReferences: assets.length, uniqueLocalAssets: unique.length, missing }, null, 2));
if (missing.length) process.exit(1);
NODE
```

- [ ] **Step 6: Commit QA-only fixes if needed**

If no fixes are needed, do not create an empty commit. If fixes are required:

```bash
git add motion ink vault scripts index.html README.md THIRD_PARTY_NOTICES.md design-qa.md robots.txt
git commit -m "fix: resolve Strongroom QA findings"
```

### Task 6: Update PR #5 and release Strongroom

**Files:**
- No local file changes expected.

- [ ] **Step 1: Push all implementation commits**

Run: `git push`

Expected: `origin/codex/ink-vault-exact` advances to the local HEAD.

- [ ] **Step 2: Update PR #5**

Set the title to `Publish the complete Strongroom interaction collection` and update the body with the canonical `/strongroom/` route, 19 Ink redirects, 18 full studies, local assets, and final QA results.

- [ ] **Step 3: Re-read PR state and checks**

Confirm PR #5 is open, non-draft, targets `main`, uses `codex/ink-vault-exact`, and its head SHA equals local HEAD. Inspect reviews, review threads, combined status, and workflow runs.

- [ ] **Step 4: Merge PR #5**

Merge with the repository-supported squash method only after the head SHA is revalidated. Record the merge SHA returned by GitHub.

- [ ] **Step 5: Monitor publication**

Poll GitHub Pages/workflow state and the public site without intervals longer than 60 seconds. Continue until:

- `https://ibra.info/` links to `/strongroom/`.
- `https://ibra.info/strongroom/` returns successfully and displays `Strongroom`.
- A representative detail route returns successfully.
- `https://ibra.info/ink/` reaches `/strongroom/`.

- [ ] **Step 6: Final handoff**

Return the live Strongroom URL, PR link, merge SHA, and concise verification summary. Do not report the release as live before all four public checks pass.
