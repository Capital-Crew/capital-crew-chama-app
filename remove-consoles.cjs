const fs = require('fs');
const path = require('path');

const DIRS = ['app', 'components', 'lib', 'hooks'];
const targetExts = ['.ts', '.tsx'];
const root = path.join(__dirname);

let totalFound = 0;
let totalRemoved = 0;
let totalKept = 0;
let filesChanged = new Set();

function walk(dir, callback) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const p = path.join(dir, f);
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
            walk(p, callback);
        } else if (targetExts.includes(path.extname(p))) {
            callback(p);
        }
    }
}

function processFile(filePath) {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    let content = originalContent;
    
    let modified = false;
    let newLines = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Check for standard logs to remove
        if (/^\s*console\.(log|warn|info|debug|table)\s*\(/.test(line)) {
            totalFound++;
            totalRemoved++;
            modified = true;
            // Skip this line
            
            // if it spans multiple lines, we need to handle that. A simple heuristic is that if it finishes with ); then it's one line.
            // If not, we skip lines until we see the closing parenthesis.
            let parenthesisCount = (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
            while (parenthesisCount > 0 && i < lines.length - 1) {
                i++;
                line = lines[i];
                parenthesisCount += (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
            }
            continue;
        }
        
        // Handle inline logs like: something || console.log('foo')
        if (/\bconsole\.(log|warn|info|debug|table)\b/.test(line)) {
           // We might not safely remove inline ones with pure regex line-by-line easily without breaking syntax.
           // However, if we just let them be manually inspected or try a raw replace
           if (!/^\s*\/\//.test(line)) {
               console.log(`[MANUAL REVIEW NEEDED] ${filePath}:${i+1} : ${line.trim()}`);
           }
        }
        
        // Handle console.error
        if (/\bconsole\.error\b/.test(line)) {
            totalFound++;
            totalKept++;
            // Check if the previous line already has the TODO
            if (newLines.length > 0 && !newLines[newLines.length - 1].includes('TODO: replace with structured logger')) {
                const match = line.match(/^(\s*)/);
                const indent = match ? match[1] : '';
                newLines.push(indent + '// TODO: replace with structured logger');
                modified = true;
            }
        }
        
        newLines.push(line);
    }
    
    if (modified) {
        fs.writeFileSync(filePath, newLines.join('\n'));
        const relativePath = path.relative(root, filePath);
        filesChanged.add(relativePath.replace(/\\/g, '/'));
    }
}

DIRS.forEach(dir => {
    walk(path.join(root, dir), processFile);
});

console.log(JSON.stringify({
    totalFound,
    totalRemoved,
    totalKept,
    filesChanged: Array.from(filesChanged)
}, null, 2));
