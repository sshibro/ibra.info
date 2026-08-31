# ibra.info

Static personal site. No build step.

GitHub Pages serves the files from the `main` branch root. `CNAME` is `ibra.info`.

`/motion/` is the public collection of motion and interaction studies. It preserves the complete Arlan Vault runtime: 41 prompt studies, 18 named studies, playgrounds, source panels, fonts, media, and animation code.

`/vault/` stores the source-compatible captured runtime and is excluded from indexing. `/ink/` contains compatibility redirects to the matching Motion routes. GitHub Pages needs the checked-in `.nojekyll` file so the mirrored `/_next/` assets are served.

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
