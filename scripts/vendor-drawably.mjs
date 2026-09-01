#!/usr/bin/env node
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp } from "node:fs/promises";

const exec = promisify(execFile);
const version = process.argv[2] || "0.3.10";
const root = process.cwd();
const outDir = path.join(root, "ink", "drawably", "vendor");

const work = await mkdtemp(path.join(tmpdir(), "drawably-vendor-"));
await exec("npm", ["pack", `drawably@${version}`], { cwd: work });
await exec("tar", ["-xzf", `drawably-${version}.tgz`], { cwd: work });

const pkg = path.join(work, "package");
const pkgJson = JSON.parse(await readFile(path.join(pkg, "package.json"), "utf8"));
if (pkgJson.version !== version) {
  throw new Error(`expected drawably@${version}, got ${pkgJson.version}`);
}

await mkdir(outDir, { recursive: true });
await exec("npx", [
  "--yes",
  "esbuild@0.25.9",
  path.join(pkg, "dist", "index.js"),
  "--bundle",
  "--format=iife",
  "--global-name=Drawably",
  `--banner:js=/* drawably ${version} — MIT — https://www.npmjs.com/package/drawably */`,
  `--outfile=${path.join(outDir, "drawably.js")}`,
]);
await copyFile(path.join(pkg, "style.css"), path.join(outDir, "drawably.css"));
await copyFile(path.join(pkg, "LICENSE"), path.join(outDir, "LICENSE"));
await writeFile(
  path.join(outDir, "VERSION"),
  `${version}\n`,
  "utf8"
);

console.log(`Vendored drawably@${version} into ink/drawably/vendor/`);
