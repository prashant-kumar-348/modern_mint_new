const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('C:/Users/Raghu/.gemini/antigravity/brain/f36500f5-955e-45dc-821e-1e077a88305c/.system_generated/logs/transcript_full.jsonl'),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  if (line.includes('"step_index":5745')) {
    try {
      const p = JSON.parse(line);
      const content = p.content || '';
      const idxO = content.indexOf('**O.13**');
      if (idxO !== -1) {
        console.log("=== SCENARIO O.12 - O.15 ===");
        console.log(content.substring(idxO - 200, idxO + 1200));
      }
    } catch(e) {}
  }
});
