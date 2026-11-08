const sharp = require('../frontend/node_modules/sharp');
const fs = require('fs');

async function analyze() {
  const easyMeta = await sharp('frontend/public/lobby/create/Easy.png').metadata();
  const superMeta = await sharp('frontend/public/lobby/create/Super Hard.png').metadata();
  const hardMeta = await sharp('frontend/public/lobby/create/Hard.png').metadata();
  const mediumMeta = await sharp('frontend/public/lobby/create/Medium.png').metadata();

  console.log('Easy:', easyMeta.width, 'x', easyMeta.height);
  console.log('Super Hard:', superMeta.width, 'x', superMeta.height);
  console.log('Hard:', hardMeta.width, 'x', hardMeta.height);
  console.log('Medium:', mediumMeta.width, 'x', mediumMeta.height);
}

analyze();
