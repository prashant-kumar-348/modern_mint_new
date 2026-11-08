const sharp = require('../frontend/node_modules/sharp');

async function testSuperHard() {
  const superOrig = await sharp('frontend/public/lobby/create/Super Hard.png').raw().toBuffer({ resolveWithObject: true });
  console.log('Super Hard orig:', superOrig.info.width, 'x', superOrig.info.height);

  for (let size of [16, 16.5, 17, 17.5, 18]) {
    for (let weight of ['normal', '500', '600', 'bold']) {
      const svg = `
        <svg width="120" height="25" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="16" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" fill="white">
            Super Hard
          </text>
        </svg>
      `;
      const buf = await sharp(Buffer.from(svg)).trim().png().toBuffer();
      const meta = await sharp(buf).metadata();
      if (meta.width >= 94 && meta.width <= 100) {
        console.log(`Size: ${size}, Weight: ${weight} -> ${meta.width} x ${meta.height}`);
      }
    }
  }
}

testSuperHard();
