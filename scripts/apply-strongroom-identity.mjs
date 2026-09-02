/* Regenerate every /strongroom/ page from the /vault/ mirror.
   Run after editing scripts/strongroom-identity.mjs:
     node scripts/apply-strongroom-identity.mjs */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { localStudySlugs, strongroomPage } from "./strongroom-identity.mjs";

const root = process.cwd();
const stripNoIndex = (html) =>
  html.replace('<meta name="robots" content="noindex, nofollow">', "");

async function build(sourcePath, outputPath, pathname, isIndex = false) {
  const source = stripNoIndex(await readFile(path.join(root, sourcePath), "utf8"));
  await mkdir(path.dirname(path.join(root, outputPath)), { recursive: true });
  await writeFile(path.join(root, outputPath), strongroomPage(source, pathname, isIndex));
}

await build("vault/index.html", "strongroom/index.html", "/strongroom/", true);
for (const [source, local] of Object.entries(localStudySlugs)) {
  await build(`vault/${source}/index.html`, `strongroom/${local}/index.html`, `/strongroom/${local}/`);
}
console.log(`regenerated ${Object.keys(localStudySlugs).length + 1} strongroom pages`);
