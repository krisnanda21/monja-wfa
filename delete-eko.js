const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.user.deleteMany({
    where: {
      name: { contains: 'Eko' },
      role: 'Koordinator'
    }
  });
  console.log('Deleted:', result);
}
main().finally(() => prisma.$disconnect());
