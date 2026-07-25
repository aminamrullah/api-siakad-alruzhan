const fs = require('fs');
const path = require('path');

// Walk all .controller.ts files in src/ and remove @Roles(...) + @UseGuards(RolesGuard) 
// since we now use dynamic permissions instead of hardcoded role checks
function walkDir(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (entry.name.endsWith('.controller.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

const srcDir = path.join(__dirname, 'src');
const controllers = walkDir(srcDir);

let totalFixed = 0;

for (const filePath of controllers) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Remove @Roles(...) decorator lines
  content = content.replace(/\s*@Roles\([^)]*\)\n/g, '\n');

  // Remove @UseGuards(RolesGuard) decorator lines  
  content = content.replace(/\s*@UseGuards\(RolesGuard\)\n/g, '\n');

  // Remove import of Roles decorator
  content = content.replace(/import\s*{\s*Roles\s*}\s*from\s*'[^']*';\n?/g, '');
  
  // Remove import of RolesGuard
  content = content.replace(/import\s*{\s*RolesGuard\s*}\s*from\s*'[^']*';\n?/g, '');

  // Remove UseGuards from import if it's no longer used
  if (!content.includes('@UseGuards')) {
    // Remove UseGuards from the import list
    content = content.replace(/,\s*UseGuards/g, '');
    content = content.replace(/UseGuards,\s*/g, '');
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalFixed++;
    console.log(`Cleaned: ${path.relative(srcDir, filePath)}`);
  }
}

console.log(`\nDone. Fixed ${totalFixed} controller(s).`);
