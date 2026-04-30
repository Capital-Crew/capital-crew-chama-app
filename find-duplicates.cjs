const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const excludeDirs = ['node_modules', '.next', '.git'];

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      if (!excludeDirs.includes(file)) {
        filelist = walkSync(filepath, filelist);
      }
    } else {
      if (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) {
        filelist.push(filepath);
      }
    }
  }
  return filelist;
}

const allFiles = walkSync('.');
const hashMap = new Map();

for (const file of allFiles) {
  const content = fs.readFileSync(file);
  const hash = crypto.createHash('md5').update(content).digest('hex');
  if (!hashMap.has(hash)) {
    hashMap.set(hash, []);
  }
  hashMap.get(hash).push(file);
}

for (const [hash, files] of hashMap.entries()) {
  if (files.length > 1) {
    console.log('DUPLICATE_GROUP:');
    files.forEach(f => console.log('  ' + f));
  }
}
