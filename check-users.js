const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ include: { role: true, mahasiswa: true } });
  console.log(users.filter(u => u.role.name === 'MAHASISWA').map(u => ({ email: u.email, hasMhs: !!u.mahasiswa })));
}
main().finally(() => prisma.$disconnect());
