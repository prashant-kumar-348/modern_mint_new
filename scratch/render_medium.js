const sharp = require('../frontend/node_modules/sharp');
const fs = require('fs');

async function renderWord(text, font, weight, size, filename) {
  // We want a canvas 20px high, text baseline around y=15
  const svg = `
    <svg width="100" height="20" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="15" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="white">
        ${text}
      </text>
    </svg>
  `;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  // trim transparent left/right, keep height 20
  const trimmed = await sharp(buf).trim().toBuffer();
  // Get trimmed dimensions
  const meta = await sharp(trimmed).metadata();
  console.log(`${font} ${weight} ${size}: ${meta.width}x${meta.height}`);
  fs.writeFileSync('scratch/' + filename, buf);
}

async function testAll() {
  const fonts = ['Inter', 'Segoe UI', 'Arial', 'Roboto', 'Jost', 'Helvetica', 'sans-serif'];
  for (const f of fonts) {
    await renderWord('Medium', f, '600', '16', `medium_${f}_600_16.png`);
    await renderWord('Medium', f, '500', '16', `medium_${f}_500_16.png`);
    await renderWord('Medium', f, '600', '15', `medium_${f}_600_15.png`);
    await renderWord('Medium', f, '500', '15', `medium_${f}_500_15.png`);
  }
}

testAll();
