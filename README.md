# ibra.info

Static personal site. No build step on the server.

GitHub Pages serves the files from the `main` branch root. `CNAME` is `ibra.info`.

`/ink/` is the live-copy collection: iframe previews on a grid, studies open a customize page, toys copy their snippet. New studies land here. `/motion/` still publishes the mirrored Arlan interaction collection. `/vault/` is the source-compatible captured runtime and is excluded from indexing.

GitHub Pages needs the checked-in `.nojekyll` file so the mirrored `/_next/` assets are served.

## Deploy the static tree

Copy the repository root onto any static host. There is nothing to `npm install` on the server.

GitHub Pages: push `main`. The branch root is the site.

A VPS can rsync the same files behind nginx:

```sh
rsync -av --delete \
  --exclude .git \
  ./ user@server:/var/www/ibra.info/
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name ibra.info www.ibra.info;
    root /var/www/ibra.info;
    index index.html;

    location / {
        try_files $uri $uri/ $uri.html =404;
    }
}
```

Directory URLs such as `/ink/drawably/` resolve through `index.html`.

To refresh the Motion mirror from Browser asset inventories:

```sh
node scripts/sync-arlan-vault.mjs landing-inventory.json . detail-inventories.json
```

The drawably study vendors [drawably](https://www.npmjs.com/package/drawably) `0.3.10` as a classic IIFE plus CSS under `ink/drawably/vendor/`, so sandboxed previews work without a runtime install. Refresh the vendor with:

```sh
node scripts/vendor-drawably.mjs 0.3.10
```

See `THIRD_PARTY_NOTICES.md` for source and license details.
