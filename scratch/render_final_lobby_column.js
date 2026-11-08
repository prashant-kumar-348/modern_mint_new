const sharp = require('../frontend/node_modules/sharp');
const fs = require('fs');
const path = require('path');

async function renderFinalLobby() {
  const dir = path.join(__dirname, '../frontend/public/lobby');
  const createDir = path.join(dir, 'create');

  // Load toggle switches
  const toggleActive = await sharp(path.join(dir, 'Group 357.png')).resize(47, 17).toBuffer();
  const toggleInactive = await sharp(path.join(dir, 'Group 347.png')).resize(47, 17).toBuffer();

  // Load difficulty header
  const header = await sharp(path.join(createDir, 'DIFFICULTY LEVEL.png')).toBuffer();

  // Load all 4 difficulty images (resized to 20px height max)
  const easy = await sharp(path.join(createDir, 'Easy.png')).resize({ height: 20, fit: 'inside' }).toBuffer();
  const medium = await sharp(path.join(createDir, 'Medium.png')).resize({ height: 20, fit: 'inside' }).toBuffer();
  const hard = await sharp(path.join(createDir, 'Hard.png')).resize({ height: 20, fit: 'inside' }).toBuffer();
  const superHard = await sharp(path.join(createDir, 'Super Hard.png')).resize({ height: 20, fit: 'inside' }).toBuffer();

  // Background matching lobby style
  const comp = await sharp({
    create: {
      width: 240,
      height: 250,
      channels: 4,
      background: { r: 5, g: 15, b: 12, alpha: 1 }
    }
  })
  .composite([
    // Header
    { input: header, left: 20, top: 20 },

    // Easy (Active)
    { input: toggleActive, left: 35, top: 70 },
    { input: easy, left: 95, top: 69 },

    // Medium (Inactive)
    { input: toggleInactive, left: 35, top: 110 },
    { input: medium, left: 95, top: 108 },

    // Hard (Inactive)
    { input: toggleInactive, left: 35, top: 150 },
    { input: hard, left: 95, top: 148 },

    // Super Hard (Inactive)
    { input: toggleInactive, left: 35, top: 190 },
    { input: superHard, left: 95, top: 188 }
  ])
  .png()
  .toBuffer();

  const outPath = path.join(__dirname, 'final_lobby_column.png');
  fs.writeFileSync(outPath, comp);
  console.log('Saved final lobby column preview to', outPath);
}

renderFinalLobby();
