const fs = require('fs');
const cp = require('child_process');
const dir = 'C:/Users/Raghu/.gemini/antigravity/brain/f36500f5-955e-45dc-821e-1e077a88305c/.user_uploaded';

fs.readdirSync(dir).forEach(f => {
  if (f.endsWith('.zip')) {
    try {
      const fullPath = dir + '/' + f;
      const out = cp.execSync(`tar -tf "${fullPath}"`).toString();
      console.log(`=== ${f} ===`);
      console.log(out.slice(0, 300));
    } catch (e) {}
  }
});
