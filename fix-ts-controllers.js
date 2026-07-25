const fs = require('fs');
const path = require('path');

const modules = ['pembayaran', 'jadwal-kuliah', 'krs', 'pesan'];

function fixController(mod) {
  const ctrlPath = path.join(__dirname, 'src', mod, `${mod}.controller.ts`);
  if (!fs.existsSync(ctrlPath)) return;
  let content = fs.readFileSync(ctrlPath, 'utf8');

  // change @CurrentUser() user: any to @CurrentUser() user?: any
  content = content.replace(/@CurrentUser\(\) user: any/g, '@CurrentUser() user?: any');

  fs.writeFileSync(ctrlPath, content, 'utf8');
}

modules.forEach(mod => {
  fixController(mod);
  console.log(`Fixed TS error in ${mod}`);
});
