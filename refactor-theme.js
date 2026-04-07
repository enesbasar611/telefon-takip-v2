const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function walk(dir, done) {
    let results = [];
    fs.readdir(dir, function (err, list) {
        if (err) return done(err);
        let pending = list.length;
        if (!pending) return done(null, results);
        list.forEach(function (file) {
            file = path.resolve(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (err, res) {
                        results = results.concat(res);
                        if (!--pending) done(null, results);
                    });
                } else {
                    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                        results.push(file);
                    }
                    if (!--pending) done(null, results);
                }
            });
        });
    });
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // We do exact class replacements
    const replacements = [
        [/\bbg-slate-950\b/g, 'bg-background'],
        [/\bbg-slate-900\/50\b/g, 'bg-card/50'],
        [/\bbg-slate-900\/80\b/g, 'bg-card/80'],
        [/\bbg-slate-900\b/g, 'bg-card'],
        [/\bbg-slate-800\/50\b/g, 'bg-muted/50'],
        [/\bbg-slate-800\/20\b/g, 'bg-muted/20'],
        [/\bbg-slate-800\b/g, 'bg-muted'],

        [/\btext-slate-400\b/g, 'text-muted-foreground'],
        [/\btext-slate-500\b/g, 'text-muted-foreground/80'],

        [/\btext-slate-200\b/g, 'text-foreground/90'],
        [/\btext-slate-300\b/g, 'text-foreground'],

        // Let's NOT replace text-white blindly because it breaks primary buttons!
        // But let's replace text-slate-50
        [/\btext-slate-50\b/g, 'text-foreground'],

        [/\bborder-white\/5\b/g, 'border-border/50'],
        [/\bborder-white\/10\b/g, 'border-border'],
        [/\bborder-slate-800\b/g, 'border-border'],
        [/\bborder-slate-700\b/g, 'border-border/80'],
        [/\bborder-slate-700\/50\b/g, 'border-border/50'],
    ];

    replacements.forEach(([regex, replacement]) => {
        content = content.replace(regex, replacement);
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

walk(directoryPath, function (err, results) {
    if (err) throw err;
    results.forEach(file => processFile(file));
    console.log('Refactor complete!');
});
