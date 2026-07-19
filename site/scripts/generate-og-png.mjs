import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const ogDir = join(rootDir, "public/og");
const names = ["og-default", "og-sim", "og-hikari", "og-trouble"];

for (const name of names) {
  const svgPath = join(ogDir, `${name}.svg`);
  const pngPath = join(ogDir, `${name}.png`);
  const svg = readFileSync(svgPath);
  await sharp(svg).png({ quality: 90 }).toFile(pngPath);
  console.log(`Generated ${pngPath}`);
}
