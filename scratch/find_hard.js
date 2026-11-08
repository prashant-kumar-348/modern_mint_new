const sharp = require('../frontend/node_modules/sharp');

async function extractHard() {
  const { data, info } = await sharp('frontend/public/lobby/create/Super Hard.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Find column where 'H' starts (after the space between Super and Hard)
  // Super has S, u, p, e, r
  // let's scan columns for alpha
  let colHasAlpha = [];
  for (let x = 0; x < info.width; x++) {
    let has = false;
    for (let y = 0; y < info.height; y++) {
      if (data[(y * info.width + x) * 4 + 3] > 30) {
        has = true;
        break;
      }
    }
    colHasAlpha.push(has);
  }

  // Find space between Super and Hard
  console.log('Alpha columns:', colHasAlpha.map((h, i) => h ? '#' : '.').join(''));
}

extractHard();
