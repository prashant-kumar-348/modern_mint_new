const sharp = require('../frontend/node_modules/sharp');
const fs = require('fs');

async function testMatch() {
  const easy = await sharp('frontend/public/lobby/create/Easy.png').raw().toBuffer({ resolveWithObject: true });
  console.log('Easy orig:', easy.info.width, 'x', easy.info.height);

  for (let size of [14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5, 18]) {
    for (let weight of ['normal', '500', '600', 'bold', '700']) {
      const svg = `
        <svg width="60" height="25" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="16" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" fill="white">
            Easy
          </text>
        </svg>
      `;
      const buf = await sharp(Buffer.from(svg)).trim().png().toBuffer();
      const meta = await sharp(buf).metadata();
      if (meta.width >= 33 && meta.width <= 38 && meta.height >= 17 && meta.height <= 21) {
        console.log(`Size: ${size}, Weight: ${weight} -> ${meta.width} x ${meta.height}`);
      }
    }
  }
}

testMatch();
