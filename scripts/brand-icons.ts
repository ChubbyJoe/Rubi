// One off: draws the Rubi app icons (a Madder dot on Snow) with sharp.
// Run `npx tsx scripts/brand-icons.ts` after changing the artwork, then commit
// the PNGs. The favicon is src/app/icon.svg.
import sharp from "sharp";
import { WARM_LIGHT } from "../src/lib/design/tokens";

const dotOnSnow = (size: number, dotShare: number) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
      `<rect width="${size}" height="${size}" fill="${WARM_LIGHT.background}"/>` +
      `<circle cx="${size / 2}" cy="${size / 2}" r="${(size * dotShare) / 2}" fill="${WARM_LIGHT.primary}"/>` +
      `</svg>`,
  );

const ICONS = [
  { file: "src/app/apple-icon.png", size: 180, dotShare: 0.6 },
  { file: "public/icons/icon-192.png", size: 192, dotShare: 0.6 },
  { file: "public/icons/icon-512.png", size: 512, dotShare: 0.6 },
  // Maskable: launchers crop to a circle or squircle, so the dot stays in the safe zone.
  { file: "public/icons/icon-maskable-512.png", size: 512, dotShare: 0.4 },
] as const;

async function main() {
  await Promise.all(
    ICONS.map(({ file, size, dotShare }) =>
      sharp(dotOnSnow(size, dotShare)).png({ compressionLevel: 9 }).toFile(file),
    ),
  );
  console.log(ICONS.map((i) => i.file).join("\n"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
