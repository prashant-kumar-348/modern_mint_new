const sharp = require('../frontend/node_modules/sharp');
const fs = require('fs');
const path = require('path');

async function applyFix() {
  const dir = path.join(__dirname, '../frontend/public/lobby/create');

  // 1. Back up existing files if not already backed up
  const hardPath = path.join(dir, 'Hard.png');
  const hardBak = path.join(dir, 'Hard.png.bak');
  if (!fs.existsSync(hardBak)) {
    fs.copyFileSync(hardPath, hardBak);
    console.log('Backed up Hard.png to Hard.png.bak');
  }

  const medPath = path.join(dir, 'Medium.png');
  const medBak = path.join(dir, 'Medium.png.bak');
  if (!fs.existsSync(medBak)) {
    fs.copyFileSync(medPath, medBak);
    console.log('Backed up Medium.png to Medium.png.bak');
  }

  // 2. Extract Hard directly from Super Hard.png
  // Super Hard is 97 x 20. Hard is at x: 56, width: 40, height: 20
  const superHardPath = path.join(dir, 'Super Hard.png');
  const hardBuf = await sharp(superHardPath)
    .extract({ left: 56, top: 0, width: 40, height: 20 })
    .png()
    .toBuffer();
  fs.writeFileSync(hardPath, hardBuf);
  console.log('Wrote new Hard.png (40x20)');

  // 3. Generate Medium.png matching font (Arial, sans-serif, size 18, weight normal, white)
  const svgMedium = `
    <svg width="64" height="20" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="15.5" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="normal" fill="white">Medium</text>
    </svg>
  `;
  const medBuf = await sharp(Buffer.from(svgMedium)).png().toBuffer();
  fs.writeFileSync(medPath, medBuf);
  console.log('Wrote new Medium.png (64x20)');

  // 4. Verify all 4 images
  for (const name of ['Easy.png', 'Medium.png', 'Hard.png', 'Super Hard.png']) {
    const meta = await sharp(path.join(dir, name)).metadata();
    console.log(`${name.padEnd(15)}: ${meta.width} x ${meta.height}`);
  }
}

applyFix();
