# Strongroom / Vault design QA

## Final result

passed

## Source truth and implementation evidence

The combined files place the Arlan Vault reference on the left and the local Strongroom implementation on the right.

| Surface | Source truth | Implementation | Combined comparison |
| --- | --- | --- | --- |
| Landing, desktop top | `qa-evidence/source-final-desktop-1440x1000.png` | `qa-evidence/implementation-final-desktop-1440x1000.png` | `qa-evidence/comparison-final-desktop.png` |
| Landing, mobile top | `qa-evidence/source-final-mobile-390x844.png` | `qa-evidence/implementation-final-mobile-390x844.png` | `qa-evidence/comparison-final-mobile-top.png` |
| Named studies, mobile | `qa-evidence/source-final-mobile-named-cards.png` | `qa-evidence/implementation-final-mobile-named-cards.png` | `qa-evidence/comparison-final-mobile-named-cards.png` |
| Landing footer, mobile | `qa-evidence/source-final-mobile-bottom.png` | `qa-evidence/implementation-final-mobile-bottom.png` | `qa-evidence/comparison-final-mobile-bottom.png` |
| Arcade study, desktop | `qa-evidence/source-final-arcade-desktop.png` | `qa-evidence/implementation-final-arcade-desktop.png` | `qa-evidence/comparison-final-arcade-desktop.png` |

## Capture conditions

- Desktop viewport: 1440 × 1000 CSS px; screenshots: 1440 × 1000 px.
- Mobile viewport: 390 × 844 CSS px; screenshots: 390 × 844 px.
- Browser screenshot output was CSS-pixel sized, so comparisons use a 1:1 density normalization.
- States: fresh landing load, scrolled named-card region, page ending/footer, and fresh Arcade detail/playground load.
- The canvas, shader, video, and randomized studies remain live. Frame-specific colors and positions can differ between sequential captures; their rendering code, timing, easing, layout, and assets are the same runtime.

## Comparison findings

- P0: none.
- P1: none.
- P2: none.
- Layout, content order, margins, 528/342 px card widths, radii, borders, typography, colors, imagery, icons, and responsive behavior match the source at the tested viewports.
- The only intentional landing difference is the requested `Vault` → `Strongroom` heading and ibra.info metadata/routes.
- No replacement CSS art, handcrafted SVG approximation, placeholder imagery, or substituted animation was introduced.

## Functional and accessibility checks

- Loaded and scrolled all 18 mirrored study pages from clean navigations; every page rendered its expected heading with zero console errors.
- Verified prompt controls, named-card navigation, detail-page close navigation, the Arcade playground, and its Remix control through visible browser interaction.
- Source semantics, labels, alt text, keyboard-focus behavior, reduced-motion handling, and mobile control treatment are preserved because the original runtime is retained.
- Browser inventories covered 849 observed asset references / 194 unique local files. The mirror also includes six declared VP9/MP4 fallbacks that the capture browser did not select. The asset check reported zero missing files and zero remaining R2 hotlinks in the delivered HTML/runtime.
- The static route contract passed for 19 canonical Strongroom routes and 19 legacy Ink redirects; `/vault/` is no-index and excluded by `robots.txt`.
- All 41 prompt-copy payloads are served locally, and server-rendered titles, canonical URLs, authorship, and structured data identify the public collection as Strongroom.

## Iteration history

1. The initial direct text substitution mutated server-rendered Next data and caused hydration/runtime errors; it was discarded.
2. An iframe-preserving pass matched visually but produced an embed-only observer warning; it was replaced with a direct top-level runtime mount.
3. Full named-study pages replaced the repository's simplified detail pages. QA found one cache-hidden Squircle chunk; a fresh source inventory recovered it.
4. The final direct mount and all 18 studies passed visual, route, asset, responsive, and clean-console checks.
