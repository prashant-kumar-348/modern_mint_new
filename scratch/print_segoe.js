const sharp = require('../frontend/node_modules/sharp');

async function compareAscii() {
  const { data, info } = await sharp('scratch/segoe_test.png').raw().toBuffer({ resolveWithObject: true });
  console.log('=== Segoe Test (Normal & Bold) ===');
  for (let y = 0; y < 40; y += 2) {
    let line = '';
    for (let x = 0; x < 150; x += 1) {
      const a = data[(y * info.width + x) * 4 + 3];
      line += a > 120 ? '#' : (a > 40 ? '.' : ' ');
    }
    if (line.trim().length > 0) console.log(line);
  }
}

compareAscii();
