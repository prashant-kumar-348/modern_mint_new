const sharp = require('../frontend/node_modules/sharp');
const fs = require('fs');

async function extractHardFromSuperHard() {
  // Super Hard is 97 x 20
  // 'H' starts around col 56
  // let's check exact pixels
  const { data, info } = await sharp('frontend/public/lobby/create/Super Hard.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  // find first non-zero alpha in the 'Hard' section (after col 50)
  let startX = 0;
  for (let x = 50; x < info.width; x++) {
    for (let y = 0; y < info.height; y++) {
      if (data[(y * info.width + x) * 4 + 3] > 10) {
        startX = x;
        break;
      }
    }
    if (startX) break;
  }

  // find last non-zero alpha
  let endX = info.width - 1;
  for (let x = info.width - 1; x >= startX; x--) {
    let has = false;
    for (let y = 0; y < info.height; y++) {
      if (data[(y * info.width + x) * 4 + 3] > 10) {
        has = true;
        break;
      }
    }
    if (has) {
      endX = x;
      break;
    }
  }

  console.log('Hard bounding box in Super Hard: startX =', startX, 'endX =', endX);
  const width = endX - startX + 1;
  console.log('Extracted Hard width:', width, 'height:', info.height);

  // Extract Hard with 1px padding on left and right, full 20px height
  const hardCrop = await sharp('frontend/public/lobby/create/Super Hard.png')
    .extract({ left: startX, top: 0, width: width, height: info.height })
    .png()
    .toBuffer();

  fs.writeFileSync('scratch/extracted_Hard.png', hardCrop);
  console.log('Saved scratch/extracted_Hard.png');
}

extractHardFromSuperHard();
