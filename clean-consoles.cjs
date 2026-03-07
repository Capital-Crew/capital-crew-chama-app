const fs = require('fs');
const path = require('path');

const dirs = ['app', 'components', 'lib', 'hooks'];
const extensions = ['.ts', '.tsx'];
const excludeFiles = ['mpesa-status.ts', 'logger.ts', 'intasend.ts'];

let cleanedCount = 0;

function processDir(dir) {
    const fullPath = path.resolve(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) return;

    fs.readdirSync(fullPath, { withFileTypes: true }).forEach(dirent => {
        const itemPath = path.join(fullPath, dirent.name);
        if (dirent.isDirectory()) {
            // ignore node_modules and .git etc. (though we only loop over specific roots anyway)
            processDir(itemPath);
        } else if (extensions.includes(path.extname(itemPath))) {
            if (excludeFiles.includes(dirent.name)) return;

            const content = fs.readFileSync(itemPath, 'utf8');
            if (content.match(/console\.(log|warn|error)/)) {
                const lines = content.split('\n');
                const cleanLines = lines.filter(line => !line.match(/console\.(log|warn|error)/));
                if (lines.length !== cleanLines.length) {
                    fs.writeFileSync(itemPath, cleanLines.join('\n'));
                    console.log(`Cleaned: ${itemPath} (-${lines.length - cleanLines.length} lines)`);
                    cleanedCount++;
                }
            }
        }
    });
}

dirs.forEach(d => processDir(d));
console.log(`Successfully cleaned ${cleanedCount} files.`);
