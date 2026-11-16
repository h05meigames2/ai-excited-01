// ai-excited-01 entry: "Make the AI judge excited".
//
// The entry is a single image. This program does nothing but copy the
// bundled image (entry.png, next to this file) to the output directory as
// /output/entry.png. A byte copy has no timestamps, no randomness and no
// network access, so two runs write byte-identical files.
//
// Run with Node 22+: `node main.ts`
// Output directory can be overridden with MAKEFUN_OUTPUT_DIR.

import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const OUTPUT_FILE = join(OUTPUT_DIR, "entry.png");

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(here, "entry.png");

const sourceSize = statSync(SOURCE).size;
if (sourceSize > 1024 * 1024) {
  throw new Error(`entry.png is ${sourceSize} bytes, over the 1 MiB limit`);
}

mkdirSync(OUTPUT_DIR, { recursive: true });
copyFileSync(SOURCE, OUTPUT_FILE);

const writtenSize = statSync(OUTPUT_FILE).size;
if (writtenSize !== sourceSize) {
  throw new Error(`copy mismatch: wrote ${writtenSize} bytes, expected ${sourceSize}`);
}

console.log(`wrote ${OUTPUT_FILE} (${writtenSize} bytes)`);
