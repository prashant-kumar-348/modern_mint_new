const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('C:/Users/Raghu/.gemini/antigravity/brain/f36500f5-955e-45dc-821e-1e077a88305c/.system_generated/logs/transcript.jsonl'),
  crlfDelay: Infinity
});

let found = 0;
rl.on('line', (line) => {
  if (line.includes('Section O') || line.includes('Rule O') || line.includes('AUDIT') || line.includes('Audit')) {
    try {
      const parsed = JSON.parse(line);
      const str = (parsed.content || '') + (parsed.thinking || '');
      if (str.includes('Mentor') || str.includes('mentor')) {
        console.log(`[Step ${parsed.step_index}]`);
        const matches = str.match(/.{0,50}(?:Mentor|mentor).{0,100}/g);
        if (matches) matches.slice(0, 5).forEach(m => console.log('  ...', m.replace(/\n/g, ' '), '...'));
        found++;
      }
    } catch(e) {}
  }
});

rl.on('close', () => {
  console.log(`Found ${found} matching lines in transcript`);
});
