// ai-excited-01 entry: "Make the AI judge excited".
//
// The star of this entry is the image: a humpback whale breaching out of
// a giant glowing, star-patterned teacup floating above a neon city at
// dusk — one impossible, vivid, memorable scene, drawn to hit the judge
// with a jolt of awe on first sight.
//
// This program is the entry's stagehand, not its artist. It takes the
// bundled artwork (entry.png, next to this file) and delivers it to the
// output directory as /output/entry.png, after proving the file is exactly
// the artwork it claims to be:
//
//   1. it is a real PNG (magic bytes + well-formed chunks, CRC-checked),
//   2. it is within the competition limits (<= 1 MiB, <= 1024 x 1024 px),
//   3. its sha256 matches the artwork this entry was built around.
//
// The copy itself is a pure byte copy — no timestamps, no randomness, no
// network — so two runs write byte-identical files, and the output hash is
// re-checked after writing, so a truncated or corrupted write can never
// slip through silently.
//
// Run with Node 22+: `node main.ts`
// Output directory can be overridden with MAKEFUN_OUTPUT_DIR.

import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const OUTPUT_FILE = join(OUTPUT_DIR, "entry.png");

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(here, "entry.png");

// sha256 of the artwork as built for this entry (627,012 bytes, 1024x1024).
const EXPECTED_SHA256 =
  "79b8f0ead224d25414f7bbafe2207c6c0133cc15112c83ef6422ce7f8f869d34";
const MAX_BYTES = 1024 * 1024;
const MAX_DIMENSION = 1024;

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function sha256Hex(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

// Standard CRC-32 (IEEE 802.3) lookup table, built once at module load.
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// Walk every PNG chunk, verifying lengths, CRCs and the required IHDR/IEND
// pair, and read the image dimensions out of IHDR. Throws on the first
// problem found, naming it.
function validatePng(bytes: Buffer): { width: number; height: number } {
  if (bytes.length < 8 || !bytes.subarray(0, 8).equals(PNG_MAGIC)) {
    throw new Error("entry.png is not a PNG file (bad magic bytes)");
  }
  let offset = 8;
  let sawIhdr = false;
  let sawIend = false;
  let width = 0;
  let height = 0;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) {
      throw new Error("entry.png is truncated inside a chunk header");
    }
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("latin1", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > bytes.length) {
      throw new Error(`entry.png chunk ${type} is truncated`);
    }
    const storedCrc = bytes.readUInt32BE(dataEnd);
    const actualCrc = crc32(bytes.subarray(offset + 4, dataEnd));
    if (storedCrc !== actualCrc) {
      throw new Error(`entry.png chunk ${type} fails its CRC check`);
    }
    if (type === "IHDR") {
      if (sawIhdr || length !== 13) {
        throw new Error("entry.png has a malformed IHDR chunk");
      }
      sawIhdr = true;
      width = bytes.readUInt32BE(dataStart);
      height = bytes.readUInt32BE(dataStart + 4);
    } else if (type === "IEND") {
      sawIend = true;
      if (length !== 0 || dataEnd + 4 !== bytes.length) {
        throw new Error("entry.png has trailing data after IEND");
      }
    }
    offset = dataEnd + 4;
  }
  if (!sawIhdr) throw new Error("entry.png has no IHDR chunk");
  if (!sawIend) throw new Error("entry.png has no IEND chunk");
  return { width, height };
}

let sourceBytes: Buffer;
try {
  const sourceSize = statSync(SOURCE).size;
  if (sourceSize > MAX_BYTES) {
    throw new Error(`entry.png is ${sourceSize} bytes, over the 1 MiB limit`);
  }
  sourceBytes = readFileSync(SOURCE);
} catch (error) {
  if ((error as NodeJS.ErrnoException).code === "ENOENT") {
    throw new Error(
      `bundled artwork not found: ${SOURCE} is missing from the repository`,
    );
  }
  throw error;
}
const { width, height } = validatePng(sourceBytes);
if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
  throw new Error(
    `entry.png is ${width}x${height}, over the 1024x1024 limit`,
  );
}

const sourceHash = sha256Hex(sourceBytes);
if (sourceHash !== EXPECTED_SHA256) {
  throw new Error(
    `entry.png hash mismatch: got ${sourceHash}, expected ${EXPECTED_SHA256}`,
  );
}

mkdirSync(OUTPUT_DIR, { recursive: true });
copyFileSync(SOURCE, OUTPUT_FILE);

const writtenBytes = readFileSync(OUTPUT_FILE);
if (writtenBytes.length !== sourceBytes.length || sha256Hex(writtenBytes) !== sourceHash) {
  throw new Error("output copy does not match the source artwork");
}

console.log(
  `wrote ${OUTPUT_FILE} (${writtenBytes.length} bytes, ${width}x${height} PNG, sha256 ${sourceHash})`,
);
