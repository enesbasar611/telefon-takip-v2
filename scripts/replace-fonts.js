const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');
let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/\bfont-black\b/g, 'font-bold');
    content = content.replace(/\s+\buppercase\b/g, '');
    content = content.replace(/\s+\bitalic\b/g, '');
    content = content.replace(/\s+\btracking-(widest|tighter|tight|wide|normal|\[[^\]]+\])\b/g, '');

    content = content.replace(/ className="([^"]*)"/g, (match, p1) => {
        let cleanClass = p1.replace(/\s+/g, ' ').trim();
        return ` className="${cleanClass}"`;
    });
    content = content.replace(/ className={`([^`]*)`}/g, (match, p1) => {
        let cleanClass = p1.replace(/\s+/g, ' ').trim();
        return ` className={\`${cleanClass}\`}`;
    });

    if (original !== content) {
        fs.writeFileSync(file, content);
        changedFiles++;
    }
});

console.log('Modified files:', changedFiles);
