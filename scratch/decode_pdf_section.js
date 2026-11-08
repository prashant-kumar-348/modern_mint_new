const fs = require('fs');

const raw = fs.readFileSync('scratch/extracted_pdf_raw.txt', 'utf8');
const start = 4303000;
const end = 4310000;
const slice = raw.substring(start, end);

// Let's decode hex strings like <00330044...> using standard character mapping or font encoding
// In PDF Type 0 / CID fonts, each 4 hex digits is a character code.
// Let's see what character codes are in this PDF.
// Often standard ASCII offset: 0x0033 is '3', 0x0044 is 'D', 0x005C is '\' or offset by some value.
console.log(slice.substring(0, 3000));
