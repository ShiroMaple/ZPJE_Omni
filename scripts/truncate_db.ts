import { prisma } from '../lib/prisma';

async function main() {
  console.log('Truncating tables to clear warnings...');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
  
  await prisma.$executeRawUnsafe('DELETE FROM access_logs;');
  await prisma.$executeRawUnsafe('DELETE FROM user_favorites;');
  await prisma.$executeRawUnsafe('DELETE FROM member_roles;');
  await prisma.$executeRawUnsafe('DELETE FROM app_role_permissions;');
  await prisma.$executeRawUnsafe('DELETE FROM app_department_permissions;');
  await prisma.$executeRawUnsafe('DELETE FROM widgets;');
  await prisma.$executeRawUnsafe('DELETE FROM members;');
  await prisma.$executeRawUnsafe('DELETE FROM departments;');
  await prisma.$executeRawUnsafe('DELETE FROM units;');
  
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
  console.log('All transient tables truncated successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
