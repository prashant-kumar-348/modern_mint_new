const sharp = require('../frontend/node_modules/sharp');
const fs = require('fs');

async function compareWithFont(fontFamily, weight, fontSize) {
  const svgEasy = `
    <svg width="60" height="20" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="15" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${weight}" fill="white">
        Easy
      </text>
    </svg>
  `;
  const buf = await sharp(Buffer.from(svgEasy)).png().toBuffer();
  fs.writeFileSync(`scratch/render_${fontFamily}_${weight}_${fontSize}.png`, buf);
}

async function run() {
  const families = ['Inter', 'Jost', 'Segoe UI', 'Arial', 'Roboto', 'System-UI'];
  const weights = ['500', '600', 'bold'];
  const sizes = ['16', '17', '18', '19'];
  
  for (const f of families) {
    for (const w of weights) {
      await compareWithFont(f, w, '18');
    }
  }
}

run();
