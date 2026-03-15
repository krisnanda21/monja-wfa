const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'Admin' } });
  console.log('ADMIN IS:', admin);
}
main().finally(() => prisma.$disconnect());
