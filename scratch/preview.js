const sharp = require('../frontend/node_modules/sharp');
const fs = require('fs');

async function createPreview() {
  const easy = await sharp('frontend/public/lobby/create/Easy.png').toBuffer();
  const med = await sharp('scratch/matched_Medium.png').toBuffer();
  const hard = await sharp('scratch/matched_Hard.png').toBuffer();
  const superHard = await sharp('frontend/public/lobby/create/Super Hard.png').toBuffer();

  // Create a dark teal background like the lobby
  const bgWidth = 140;
  const bgHeight = 120; // 4 rows of 30px each

  const composite = await sharp({
    create: {
      width: bgWidth,
      height: bgHeight,
      channels: 4,
      background: { r: 10, g: 30, b: 25, alpha: 1 }
    }
  })
  .composite([
    { input: easy, left: 10, top: 5 },
    { input: med, left: 10, top: 35 },
    { input: hard, left: 10, top: 65 },
    { input: superHard, left: 10, top: 95 }
  ])
  .png()
  .toBuffer();

  fs.writeFileSync('scratch/all_four_preview.png', composite);
  console.log('Preview generated at scratch/all_four_preview.png');
}

createPreview();
