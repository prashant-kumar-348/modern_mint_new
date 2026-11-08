const sharp = require('../frontend/node_modules/sharp');
const fs = require('fs');

async function testMedium() {
  const svg = `
    <svg width="100" height="25" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="16" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="600" fill="white">
        Medium
      </text>
    </svg>
  `;
  const buf = await sharp(Buffer.from(svg)).trim().png().toBuffer();
  const meta = await sharp(buf).metadata();
  console.log(`Medium (18, 600): ${meta.width} x ${meta.height}`);
  fs.writeFileSync('scratch/rendered_Medium.png', buf);
}

testMedium();
