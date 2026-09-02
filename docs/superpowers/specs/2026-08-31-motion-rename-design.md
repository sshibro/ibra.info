# Strongroom Rename Design

## Goal

Rename the public interactive-study collection from **Ink** to **Strongroom**. Make `/strongroom/` the single canonical public route, preserve existing `/ink/` links through static redirects, and keep the mirrored Vault runtime out of the public identity.

The visual design, card order, study content, assets, animations, and playground behavior remain unchanged.

## Public identity

- The collection heading is `Strongroom`.
- The homepage sentence reads: “On the side, I build different visuals I love over in motion.”
- The homepage word `motion` links to `/strongroom/`.
- The collection title is `Strongroom — Ibragim Shirinov`.
- Study titles use the pattern `<Study name> — Strongroom`.
- Descriptions refer to the collection as Strongroom, not Ink or Vault.
- Canonical and Open Graph URLs use the matching `https://ibra.info/strongroom/...` path.

## Canonical routes

The existing short study slugs are preserved under the new public prefix:

| Study | Canonical route |
| --- | --- |
| Landing | `/strongroom/` |
| Arcade pixel | `/strongroom/arcade-pixel/` |
| Holo | `/strongroom/holo/` |
| Pixel brushes | `/strongroom/pixel-brushes/` |
| Fade motion | `/strongroom/fade-motion/` |
| Liquid UI | `/strongroom/liquid-ui/` |
| Kinetic typography | `/strongroom/kinetic/` |
| Apple's corners | `/strongroom/squircle/` |
| Ransom note | `/strongroom/ransom/` |
| Chromatic glow | `/strongroom/chroma/` |
| Realistic emboss | `/strongroom/emboss/` |
| The typer | `/strongroom/typer/` |
| The art of color depth | `/strongroom/color-depth/` |
| Ghosty reveal | `/strongroom/ghost/` |
| Symbols effect | `/strongroom/symbols/` |
| Dia Browser's gradient | `/strongroom/dia-gradient/` |
| Figma vector editor | `/strongroom/vector/` |
| Amo hover button | `/strongroom/amo/` |
| Midjourney Medical's ASCII | `/strongroom/ascii/` |

## Legacy Ink redirects

Every currently published Ink route becomes a small compatibility page:

- `/ink/` redirects to `/strongroom/`.
- Each `/ink/<slug>/` redirects to the matching `/strongroom/<slug>/` page.
- Redirect pages use an immediate HTML refresh and a normal anchor fallback so they work on static GitHub Pages without server configuration or JavaScript.
- Redirect pages declare the Strongroom destination as canonical and do not duplicate the interactive runtime.

## Runtime organization

- `/vault/` remains the source-compatible runtime namespace required by the captured Next output and asset paths.
- `/strongroom/` contains the visitor-facing copies generated from that runtime with the Strongroom identity helper attached.
- The identity helper changes only the collection name, ibra.info metadata, canonical URLs, and navigation destinations after hydration.
- Source study links are mapped to the corresponding short `/strongroom/` routes.
- Detail-page close links return to `/strongroom/`; the landing close link returns to `/`.
- `/vault/` is removed from public navigation, marked `noindex`, and disallowed in `robots.txt` to avoid duplicate searchable pages.
- The sync script regenerates the source runtime, canonical Strongroom pages, and Ink redirect pages in one repeatable operation.
- Mirrored JavaScript, CSS, fonts, images, videos, audio, and 3D assets remain local and unchanged.

## Repository and pull request updates

- Replace Ink-specific helper naming with Strongroom-specific naming.
- Update the homepage, README, third-party notice where relevant, sync-script terminology, QA record, and evidence filenames where necessary.
- Update PR #5's title and description to describe the complete Strongroom collection at `/strongroom/`.
- Keep the implementation on `codex/ink-vault-exact`; a branch rename is unnecessary.

## Compatibility and failure behavior

- If JavaScript is unavailable, the captured study content remains readable and a `noscript` identity fallback shows Strongroom with usable navigation.
- If HTML refresh is disabled, every Ink redirect exposes a clickable Strongroom link.
- Existing external `/ink/` bookmarks continue to reach the corresponding study.
- There is one canonical public copy of each interactive page.
- A failed GitHub Pages deployment stops the release verification; the PR is not reported as live until `https://ibra.info/strongroom/` returns successfully.

## Verification

- Confirm the homepage link and all visitor-facing identity text say Strongroom.
- Confirm all 19 canonical Strongroom routes return HTTP 200 locally.
- Confirm all 19 legacy Ink routes target the intended Strongroom destinations.
- Load and scroll the Strongroom landing page and all 18 studies with zero console errors.
- Exercise named-card navigation, detail close navigation, prompt controls, and a representative playground.
- Compare desktop and mobile screenshots against the captured source; only the Strongroom identity and ibra.info metadata may differ.
- Recheck the 194-file local asset inventory and confirm no R2 hotlinks remain.
- Update `design-qa.md` with final Strongroom URLs and evidence.
- Commit and push the implementation to PR #5, merge it into `main`, then verify GitHub Pages serves the homepage, `/strongroom/`, a representative detail page, and an `/ink/` redirect.

## Out of scope

- Changing the visual design or motion behavior.
- Renaming individual studies.
- Reordering cards or changing source copy.
