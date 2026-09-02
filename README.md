# ibra.info

Static personal site. No build step.

GitHub Pages serves the files from the `main` branch root. `CNAME` is `ibra.info`.

`/strongroom/` is the public collection of interaction studies, prompts and working code. It preserves the complete Arlan Vault runtime: 41 prompt studies, 18 named studies, playgrounds, source panels, fonts, media, and animation code, plus the Drawably study at `/strongroom/drawably/`, which leads the grid as the newest deposit.

The Strongroom identity lives in two files that every page loads after the mirrored runtime: `strongroom/strongroom.css` (warm paper palette, mono catalogue chips, numbered cards, brass accent) and `strongroom/strongroom.js` (collection name, metadata, rewritten study copy, the Drawably hero card, and route mapping). Both apply after Next hydration finishes. Text that must change inside the mirrored pages themselves (Arlan's name, handle, metadata, the Holo card copy) is swapped by `scripts/strongroom-identity.mjs`, which rewrites the Next Flight payload and recomputes each text record's byte length so hydration stays intact. Regenerate every `/strongroom/` page from the `/vault/` mirror with:

```sh
node scripts/apply-strongroom-identity.mjs
node scripts/test-strongroom-routes.mjs && node scripts/test-strongroom-drawably.mjs
```

`/motion/` and `/ink/` are the previous public prefixes and only hold redirects.

`/vault/` stores the source-compatible captured runtime and is excluded from indexing. It also serves the 41 local prompt-copy payloads used by the collection. `/ink/` contains compatibility redirects to the matching Strongroom routes. GitHub Pages needs the checked-in `.nojekyll` file so the mirrored `/_next/` assets are served.

The Drawably study vendors [drawably](https://www.npmjs.com/package/drawably) `0.3.10` as a classic IIFE plus CSS under `strongroom/drawably/vendor/`, so the sandboxed Strongroom grid preview works without a runtime install. Refresh the vendor with:

```sh
node scripts/vendor-drawably.mjs 0.3.10
```

To refresh the mirror from Browser asset inventories:

```sh
node scripts/sync-arlan-vault.mjs landing-inventory.json . detail-inventories.json
```

See `THIRD_PARTY_NOTICES.md` for source and license details.

The same files can be copied onto a VPS at `/var/www/ibra.info` behind nginx:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name ibra.info www.ibra.info;
    root /var/www/ibra.info;
    index index.html;
}
```
