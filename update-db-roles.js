const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const anggota = await prisma.user.updateMany({
    where: { role: 'AnggotaTim' },
    data: { role: 'Anggota Tim' }
  });
  const ketua = await prisma.user.updateMany({
    where: { role: 'KetuaTim' },
    data: { role: 'Ketua Tim' }
  });
  console.log(`Updated ${anggota.count} Anggota Tim and ${ketua.count} Ketua Tim.`);
}
main().finally(() => prisma.$disconnect());
