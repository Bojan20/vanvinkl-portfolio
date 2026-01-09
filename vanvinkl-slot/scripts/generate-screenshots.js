const sharp = require('sharp');

async function generateScreenshots() {
  // Wide screenshot
  const wideSvg = `
    <svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
      <rect width="1280" height="720" fill="#0a0a0c"/>
      <text x="640" y="320" font-family="Arial" font-size="80" font-weight="bold" fill="#FFD700" text-anchor="middle">VanVinkl Casino Lounge</text>
      <text x="640" y="420" font-family="Arial" font-size="36" fill="#4a9eff" text-anchor="middle">High-Performance Audio Experience</text>
    </svg>
  `;

  await sharp(Buffer.from(wideSvg))
    .png()
    .toFile('public/screenshot-wide.png');

  console.log('Generated screenshot-wide.png');

  // Narrow screenshot
  const narrowSvg = `
    <svg width="750" height="1334" xmlns="http://www.w3.org/2000/svg">
      <rect width="750" height="1334" fill="#0a0a0c"/>
      <text x="375" y="600" font-family="Arial" font-size="60" font-weight="bold" fill="#FFD700" text-anchor="middle">VanVinkl</text>
      <text x="375" y="700" font-family="Arial" font-size="50" font-weight="bold" fill="#FFD700" text-anchor="middle">Casino</text>
      <text x="375" y="800" font-family="Arial" font-size="28" fill="#4a9eff" text-anchor="middle">High-Performance</text>
      <text x="375" y="850" font-family="Arial" font-size="28" fill="#4a9eff" text-anchor="middle">Audio Experience</text>
    </svg>
  `;

  await sharp(Buffer.from(narrowSvg))
    .png()
    .toFile('public/screenshot-narrow.png');

  console.log('Generated screenshot-narrow.png');
}

generateScreenshots().catch(console.error);
