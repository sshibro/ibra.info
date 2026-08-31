# Motion Rename Design

## Goal

Rename the public interactive-study collection from **Ink** to **Motion**. Make `/motion/` the single canonical public route, preserve existing `/ink/` links through static redirects, and keep the mirrored Vault runtime out of the public identity.

The visual design, card order, study content, assets, animations, and playground behavior remain unchanged.

## Public identity

- The collection heading is `Motion`.
- The homepage sentence reads: “On the side, I build different visuals I love over in motion.”
- The homepage word `motion` links to `/motion/`.
- The collection title is `Motion — Ibragim Shirinov`.
- Study titles use the pattern `<Study name> — Motion`.
- Descriptions refer to the collection as Motion, not Ink or Vault.
- Canonical and Open Graph URLs use the matching `https://ibra.info/motion/...` path.

## Canonical routes

The existing short study slugs are preserved under the new public prefix:

| Study | Canonical route |
| --- | --- |
| Landing | `/motion/` |
| Arcade pixel | `/motion/arcade-pixel/` |
| Holo | `/motion/holo/` |
| Pixel brushes | `/motion/pixel-brushes/` |
| Fade motion | `/motion/fade-motion/` |
| Liquid UI | `/motion/liquid-ui/` |
| Kinetic typography | `/motion/kinetic/` |
| Apple's corners | `/motion/squircle/` |
| Ransom note | `/motion/ransom/` |
| Chromatic glow | `/motion/chroma/` |
| Realistic emboss | `/motion/emboss/` |
| The typer | `/motion/typer/` |
| The art of color depth | `/motion/color-depth/` |
| Ghosty reveal | `/motion/ghost/` |
| Symbols effect | `/motion/symbols/` |
| Dia Browser's gradient | `/motion/dia-gradient/` |
| Figma vector editor | `/motion/vector/` |
| Amo hover button | `/motion/amo/` |
| Midjourney Medical's ASCII | `/motion/ascii/` |

## Legacy Ink redirects

Every currently published Ink route becomes a small compatibility page:

- `/ink/` redirects to `/motion/`.
- Each `/ink/<slug>/` redirects to the matching `/motion/<slug>/` page.
- Redirect pages use an immediate HTML refresh and a normal anchor fallback so they work on static GitHub Pages without server configuration or JavaScript.
- Redirect pages declare the Motion destination as canonical and do not duplicate the interactive runtime.

## Runtime organization

- `/vault/` remains the source-compatible runtime namespace required by the captured Next output and asset paths.
- `/motion/` contains the visitor-facing copies generated from that runtime with the Motion identity helper attached.
- The identity helper changes only the collection name, ibra.info metadata, canonical URLs, and navigation destinations after hydration.
- Source study links are mapped to the corresponding short `/motion/` routes.
- Detail-page close links return to `/motion/`; the landing close link returns to `/`.
- `/vault/` is removed from public navigation, marked `noindex`, and disallowed in `robots.txt` to avoid duplicate searchable pages.
- The sync script regenerates the source runtime, canonical Motion pages, and Ink redirect pages in one repeatable operation.
- Mirrored JavaScript, CSS, fonts, images, videos, audio, and 3D assets remain local and unchanged.

## Repository and pull request updates

- Replace Ink-specific helper naming with Motion-specific naming.
- Update the homepage, README, third-party notice where relevant, sync-script terminology, QA record, and evidence filenames where necessary.
- Update PR #5's title and description to describe the complete Motion collection at `/motion/`.
- Keep the implementation on `codex/ink-vault-exact`; a branch rename is unnecessary.

## Compatibility and failure behavior

- If JavaScript is unavailable, the captured study content remains readable and a `noscript` identity fallback shows Motion with usable navigation.
- If HTML refresh is disabled, every Ink redirect exposes a clickable Motion link.
- Existing external `/ink/` bookmarks continue to reach the corresponding study.
- There is one canonical public copy of each interactive page.
- A failed GitHub Pages deployment stops the release verification; the PR is not reported as live until `https://ibra.info/motion/` returns successfully.

## Verification

- Confirm the homepage link and all visitor-facing identity text say Motion.
- Confirm all 19 canonical Motion routes return HTTP 200 locally.
- Confirm all 19 legacy Ink routes target the intended Motion destinations.
- Load and scroll the Motion landing page and all 18 studies with zero console errors.
- Exercise named-card navigation, detail close navigation, prompt controls, and a representative playground.
- Compare desktop and mobile screenshots against the captured source; only the Motion identity and ibra.info metadata may differ.
- Recheck the 194-file local asset inventory and confirm no R2 hotlinks remain.
- Update `design-qa.md` with final Motion URLs and evidence.
- Commit and push the implementation to PR #5, merge it into `main`, then verify GitHub Pages serves the homepage, `/motion/`, a representative detail page, and an `/ink/` redirect.

## Out of scope

- Changing the visual design or motion behavior.
- Renaming individual studies.
- Reordering cards or changing source copy.
