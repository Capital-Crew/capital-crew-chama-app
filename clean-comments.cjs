const fs = require('fs');
const path = require('path');

const DIRECTORIES_TO_SCAN = ['app', 'components', 'lib', 'hooks'];
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const EXCLUDE_DIRS = ['node_modules', '.next', '.git'];

// Matches lines that start with // and then a common JS/TS keyword
// e.g., // const x = 1;
//       //   return false;
//       //import { foo } from 'bar';
const CODE_COMMENT_REGEX = /^\s*\/\/\s*(?:const|let|var|function|class|interface|type|import|export|if\s*\(|for\s*\(|return|console\.|switch\s*\(|try\s*\{|catch\s*\(|await\s+|yield\s+)[^\n]*$/gm;

// Matches multi-line block comments that look entirely like code
// It's harder to reliably regex block comments for purely code, so we focus on line comments

let totalFilesCleaned = 0;
let totalLinesRemoved = 0;

function cleanComments(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    let linesRemovedInFile = 0;

    const lines = content.split('\n');
    const cleanedLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (CODE_COMMENT_REGEX.test(line + '\n')) { // test on a string with newline to match ^ and $
            linesRemovedInFile++;
            // Don't push to cleanedLines (removes it)
        } else {
            cleanedLines.push(line);
        }

        // Reset regex state (since we use 'g' flag, though we test on isolated strings)
        CODE_COMMENT_REGEX.lastIndex = 0;
    }

    if (linesRemovedInFile > 0) {
        fs.writeFileSync(filePath, cleanedLines.join('\n'), 'utf8');
        console.log(`Cleaned ${filePath} (Removed ${linesRemovedInFile} lines of commented code)`);
        totalFilesCleaned++;
        totalLinesRemoved += linesRemovedInFile;
    }
}

function processDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;

    const items = fs.readdirSync(dirPath);

    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!EXCLUDE_DIRS.includes(item)) {
                processDirectory(fullPath);
            }
        } else if (stat.isFile()) {
            const ext = path.extname(fullPath);
            if (EXTENSIONS.includes(ext)) {
                cleanComments(fullPath);
            }
        }
    }
}

console.log('--- Starting Commented-Out Code Cleanup ---');
for (const dir of DIRECTORIES_TO_SCAN) {
    processDirectory(path.join(__dirname, dir));
}

console.log('--- Cleanup Finished ---');
console.log(`Cleaned ${totalFilesCleaned} files.`);
console.log(`Removed ${totalLinesRemoved} lines of commented-out code.`);
