const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    await prisma.project.count();
    console.log('✅ Project table exists');
  } catch (e) {
    if (e.message.includes('does not exist')) {
      console.log('❌ Project table MISSING');
    } else {
      console.log('⚠️ Error: ' + e.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

check();
