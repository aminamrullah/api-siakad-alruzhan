const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkDir(fullPath));
    else if (entry.name.endsWith('.controller.ts')) files.push(fullPath);
  }
  return files;
}

const srcDir = path.join(__dirname, 'src');
let fixed = 0;

for (const filePath of walkDir(srcDir)) {
  let content = fs.readFileSync(filePath, 'utf8');
  const orig = content;

  // Replace @UseGuards(JwtAuthGuard, RolesGuard) with nothing (global guard handles it)
  content = content.replace(/@UseGuards\(JwtAuthGuard,\s*RolesGuard\)\n/g, '');

  // Also remove @UseGuards(JwtAuthGuard) since it's global now
  content = content.replace(/@UseGuards\(JwtAuthGuard\)\n/g, '');

  // Clean up unused imports of JwtAuthGuard
  content = content.replace(/import\s*{\s*JwtAuthGuard\s*}\s*from\s*'[^']*';\n?/g, '');

  // Clean up UseGuards from import if no longer used
  if (!content.includes('@UseGuards')) {
    content = content.replace(/,\s*UseGuards/g, '');
    content = content.replace(/UseGuards,\s*/g, '');
  }

  if (content !== orig) {
    fs.writeFileSync(filePath, content, 'utf8');
    fixed++;
    console.log(`Fixed: ${path.relative(srcDir, filePath)}`);
  }
}
console.log(`\nDone. Fixed ${fixed} file(s).`);
