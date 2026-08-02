const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, 'dist', '_expo', 'static', 'js', 'web');
const files = fs.readdirSync(bundlePath);
const jsFile = files.find(f => f.endsWith('.js'));
const js = fs.readFileSync(path.join(bundlePath, jsFile), 'utf8');

let idx = 0;
const results = [];
while ((idx = js.indexOf('import.meta', idx)) !== -1) {
    results.push(idx);
    idx++;
}

if (results.length === 0) {
    console.log('SUCCESS: No import.meta found in bundle!');
} else {
    console.log(`FAIL: Found ${results.length} import.meta usage(s)`);
    results.forEach(i => console.log(js.substring(Math.max(0,i-50), i+100)));
}
