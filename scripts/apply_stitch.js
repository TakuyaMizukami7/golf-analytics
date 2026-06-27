const fs = require('fs');
const path = require('path');

const htmlPath = path.join(process.env.USERPROFILE || 'C:\\Users\\tkmiz', '.gemini', 'antigravity-ide', 'brain', 'f1045302-a948-4946-83ee-dadc1a8f6930', '.system_generated', 'steps', '374', 'content.md');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Extract theme JSON
const match = htmlContent.match(/tailwind\.config\s*=\s*(\{[\s\S]*?\})\n/);
let themeObj = {};
if (match) {
    const config = eval(`(${match[1]})`);
    themeObj = config.theme.extend;
}

// Write to globals.css
const cssVars = [];
if (themeObj.colors) {
    for (const [key, val] of Object.entries(themeObj.colors)) {
        cssVars.push(`  --color-${key}: ${val};`);
    }
}
const cssFile = path.join(__dirname, '..', 'src', 'app', 'globals.css');
let cssContent = fs.readFileSync(cssFile, 'utf8');
cssContent = cssContent.replace(/@theme\s*\{[\s\S]*?\}/, `@theme {\n${cssVars.join('\n')}\n}`);
fs.writeFileSync(cssFile, cssContent);

console.log("Updated globals.css with Stitch colors.");
