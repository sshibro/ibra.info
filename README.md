# ibra.info

Static personal site. No build step.

GitHub Pages serves the files from the `main` branch root. `CNAME` is `ibra.info`.

`/ink/` mirrors the complete Arlan Vault interaction collection with the section identity changed to **ink**. The landing page, all 41 prompt studies, all 18 named studies, their playgrounds, source panels, motion, fonts, and media run locally from this repository.

The captured runtime lives in `/vault/`; `/ink/` adds local identity and route handling without replacing the original animation code. GitHub Pages needs the checked-in `.nojekyll` file so the mirrored `/_next/` assets are served.

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
