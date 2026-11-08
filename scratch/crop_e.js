const sharp = require('../frontend/node_modules/sharp');
const fs = require('fs');

async function testLetterE() {
  // Extract 'e' from Super Hard (cols 33 to 42, y from 0 to 20)
  const eCrop = await sharp('frontend/public/lobby/create/Super Hard.png')
    .extract({ left: 33, top: 0, width: 10, height: 20 })
    .png()
    .toBuffer();
  fs.writeFileSync('scratch/e_from_super.png', eCrop);
  console.log('Extracted e from Super Hard');
}

testLetterE();
