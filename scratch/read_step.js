const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('C:/Users/Raghu/.gemini/antigravity/brain/f36500f5-955e-45dc-821e-1e077a88305c/.system_generated/logs/transcript_full.jsonl'),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  if (line.includes('"step_index":7230') || line.includes('"step_index":7235')) {
    try {
      const p = JSON.parse(line);
      console.log(`=== STEP ${p.step_index} ===`);
      console.log(p.thinking ? p.thinking.slice(0, 3000) : p.content?.slice(0, 3000));
    } catch(e) {}
  }
});
