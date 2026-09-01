# ibra.info

Static personal site. No build step.

GitHub Pages serves the files from the `main` branch root. `CNAME` is `ibra.info`.

`/motion/` is the public collection of motion and interaction studies. It preserves the complete Arlan Vault runtime: 41 prompt studies, 18 named studies, playgrounds, source panels, fonts, media, and animation code, plus the Drawably study at `/motion/drawably/`.

`/vault/` stores the source-compatible captured runtime and is excluded from indexing. It also serves the 41 local prompt-copy payloads used by the collection. `/ink/` contains compatibility redirects to the matching Motion routes. GitHub Pages needs the checked-in `.nojekyll` file so the mirrored `/_next/` assets are served.

The Drawably study vendors [drawably](https://www.npmjs.com/package/drawably) `0.3.10` as a classic IIFE plus CSS under `motion/drawably/vendor/`, so the sandboxed Motion grid preview works without a runtime install. Refresh the vendor with:

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
