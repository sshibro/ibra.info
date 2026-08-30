# ibra.info

Static personal site. No build step.

GitHub Pages serves the files from the `main` branch root. `CNAME` is `ibra.info`.

`/ink/` is a single-column stack of live studies and canvas toys. Named studies open a playground. Untitled toys copy their source.

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
