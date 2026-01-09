const sharp = require('sharp');

const sizes = [192, 512];

async function generateIcons() {
  for (const size of sizes) {
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="#0a0a0c"/>
        <text
          x="${size / 2}"
          y="${size * 0.65}"
          font-family="Arial, sans-serif"
          font-size="${size * 0.45}"
          font-weight="bold"
          fill="#FFD700"
          text-anchor="middle"
        >V</text>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .png()
      .toFile(`public/icon-${size}x${size}.png`);

    console.log(`Generated icon-${size}x${size}.png`);
  }
}

generateIcons().catch(console.error);
