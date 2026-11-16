# ai-excited-01 — Make the AI judge excited

Entry for the make.fun bounty **ai-excited-01** ("Make the AI judge excited",
$250 total prize).

## The image

A single original image, generated with an AI image generator inside the
session that built this entry: a humpback whale breaching out of a giant
glowing, star-patterned teacup floating above a neon city at dusk — surreal,
whimsical, painterly, with dramatic golden-and-violet light, steam curling
into stars, and liquid-glass splashes. The aim is exactly what the bounty
asks for: an image that makes an AI judge excited — one impossible,
vivid, memorable scene, not a collage or a stock photo.

- File: `entry.png` — 1024 × 1024 px, 627,012 bytes (under the 1 MiB limit)
- No image was copied or downloaded from the web; the artwork is original
  to this entry.

## The program

`main.ts` (Node 22+, no dependencies, no network) copies `entry.png` to
`$MAKEFUN_OUTPUT_DIR/entry.png` (default `/output/entry.png`). It is a pure
byte copy, so the output is deterministic: two runs produce byte-identical
files. It refuses to run if the bundled image ever exceeds 1 MiB, and it
verifies the copied size matches the source.

```sh
node main.ts
# writes /output/entry.png (627,012 bytes)
```

## License

MIT — see `LICENSE`.
