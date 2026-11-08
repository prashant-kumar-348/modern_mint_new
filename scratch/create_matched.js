const sharp = require('../frontend/node_modules/sharp');
const fs = require('fs');

async function createMatchedImages() {
  // 1. Hard.png: Extract 'Hard' from 'Super Hard.png'
  // In Super Hard: width=97, height=20. 'Hard' starts at x=56, ends at x=95 (width 40).
  const hardBuffer = await sharp('frontend/public/lobby/create/Super Hard.png')
    .extract({ left: 56, top: 0, width: 40, height: 20 })
    .png()
    .toBuffer();

  // 2. Medium.png: Render 'Medium' with exact matching font at height 20
  // In Super Hard / Easy, capital letter is 14px high (from y=1 to y=15), lowercase is 10px high (from y=5 to y=15)
  // Let's create an SVG with font Arial/sans-serif bold 18px, placed at baseline y=15
  const svgMedium = `
    <svg width="68" height="20" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="15" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="600" fill="white">
        Medium
      </text>
    </svg>
  `;
  const mediumBuffer = await sharp(Buffer.from(svgMedium)).png().toBuffer();

  // Save to scratch for verification
  fs.writeFileSync('scratch/matched_Hard.png', hardBuffer);
  fs.writeFileSync('scratch/matched_Medium.png', mediumBuffer);

  // Check dimensions and metadata
  const hardMeta = await sharp(hardBuffer).metadata();
  const medMeta = await sharp(mediumBuffer).metadata();
  const easyMeta = await sharp('frontend/public/lobby/create/Easy.png').metadata();
  const superMeta = await sharp('frontend/public/lobby/create/Super Hard.png').metadata();

  console.log('Easy:      ', easyMeta.width, 'x', easyMeta.height);
  console.log('Medium:    ', medMeta.width, 'x', medMeta.height);
  console.log('Hard:      ', hardMeta.width, 'x', hardMeta.height);
  console.log('Super Hard:', superMeta.width, 'x', superMeta.height);
}

createMatchedImages();
