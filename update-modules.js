const fs = require('fs');
const path = require('path');

const modules = ['pembayaran', 'jadwal-kuliah', 'krs', 'pesan'];

function updateController(mod) {
  const ctrlPath = path.join(__dirname, 'src', mod, `${mod}.controller.ts`);
  if (!fs.existsSync(ctrlPath)) return;
  let content = fs.readFileSync(ctrlPath, 'utf8');

  // Add import if missing
  if (!content.includes('CurrentUser')) {
    content = `import { CurrentUser } from '../auth/current-user.decorator';\n` + content;
  }

  // Update findAll signature
  content = content.replace(
    /findAll\((.*?)\)\s*{/,
    'findAll($1, @CurrentUser() user: any) {'
  );

  // Update findAll call
  content = content.replace(
    /return this\.service\.findAll\((.*?)\);/,
    'return this.service.findAll($1, user);'
  );

  fs.writeFileSync(ctrlPath, content, 'utf8');
}

function updateService(mod) {
  const svcPath = path.join(__dirname, 'src', mod, `${mod}.service.ts`);
  if (!fs.existsSync(svcPath)) return;
  let content = fs.readFileSync(svcPath, 'utf8');

  // Update findAll signature
  content = content.replace(
    /async findAll\((.*?)\)\s*{/,
    'async findAll($1, user?: any) {'
  );

  fs.writeFileSync(svcPath, content, 'utf8');
}

modules.forEach(mod => {
  updateController(mod);
  updateService(mod);
  console.log(`Updated ${mod}`);
});
