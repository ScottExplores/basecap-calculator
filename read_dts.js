const fs = require('fs');
const path = require('path');
const filePath = path.join('node_modules', '@zoralabs', 'coins-sdk', 'dist', 'actions', 'tradeCoin.d.ts');
try {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(content.slice(0, 1000)); // Read first 1000 chars
} catch (e) {
    console.error(e);
}
