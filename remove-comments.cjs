const fs = require('fs');
const path = require('path');

const DIRS = ['app', 'components', 'lib', 'hooks'];
const targetExts = ['.ts', '.tsx'];
const root = path.join(__dirname);

let linesRemoved = 0;
let filesChanged = new Set();
let todos = [];

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
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    const relativePath = path.relative(root, filePath).replace(/\\/g, '/');

    // 1. Collect TODOs and FIXMEs
    const lines = content.split('\n');
    lines.forEach((line, i) => {
        if (line.match(/\/\/\s*(TODO|FIXME):/i)) {
            todos.push(`${relativePath}:${i + 1} -> ${line.trim()}`);
        }
    });

    // 2. Remove /* ... */ (but keep /** ... */)
    // Non-greedy match for /* ... */ that doesn't start with /**
    // Need to use careful tracking, Regex for multiline comments:
    let prevLength = content.length;
    content = content.replace(/\/\*(?!\*)[^]*?\*\//g, (match) => {
        const removedLines = match.split('\n').length - 1;
        linesRemoved += removedLines + 1; // approximate
        return '';
    });

    // 3. Remove JSX {/* ... */} spans
    content = content.replace(/\{\/\*[^]*?\*\/\}/g, (match) => {
        const removedLines = match.split('\n').length - 1;
        linesRemoved += removedLines + 1;
        return '';
    });

    // 4. Remove consecutive // lines (>= 3 lines) that do NOT have TODO/FIXME
    let newLines = [];
    let currentBlock = [];
    const currentSplit = content.split('\n');
    
    for (let i = 0; i < currentSplit.length; i++) {
        const line = currentSplit[i];
        if (/^\s*\/\//.test(line) && !line.match(/\/\/\s*(TODO|FIXME)/i)) {
            currentBlock.push(line);
        } else {
            if (currentBlock.length >= 3) {
                // Delete the block
                linesRemoved += currentBlock.length;
            } else {
                newLines.push(...currentBlock);
            }
            currentBlock = [];
            newLines.push(line);
        }
    }
    // Flush remaining
    if (currentBlock.length >= 3) {
        linesRemoved += currentBlock.length;
    } else {
        newLines.push(...currentBlock);
    }
    
    content = newLines.join('\n');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        filesChanged.add(relativePath);
    }
}

DIRS.forEach(dir => walk(path.join(root, dir), processFile));

console.log(JSON.stringify({
    linesRemoved,
    filesChanged: Array.from(filesChanged),
    todos
}, null, 2));
