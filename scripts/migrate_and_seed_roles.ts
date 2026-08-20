import { prisma } from '../lib/prisma';

async function main() {
  console.log('--- Step 1: Ensure description column in roles table ---');
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE `roles` ADD COLUMN `description` TEXT NULL;');
    console.log('Added description column to roles table successfully.');
  } catch (e: any) {
    if (e.message?.includes('Duplicate column') || e.message?.includes('already exists')) {
      console.log('Column description already exists.');
    } else {
      console.warn('Note on alter table:', e.message);
    }
  }

  console.log('\n--- Step 2: Clean up old non-business roles (admin, user) ---');
  // First find if admin or user role exist
  const oldRoles = await prisma.role.findMany({
    where: { key: { in: ['admin', 'user'] } }
  });
  if (oldRoles.length > 0) {
    const oldRoleIds = oldRoles.map(r => r.id);
    console.log(`Found ${oldRoles.length} obsolete roles to remove:`, oldRoles.map(r => r.key));

    // Delete permissions and member associations for these obsolete roles
    await prisma.appRolePermission.deleteMany({
      where: { roleId: { in: oldRoleIds } }
    });
    await prisma.memberRole.deleteMany({
      where: { roleId: { in: oldRoleIds } }
    });
    await prisma.role.deleteMany({
      where: { id: { in: oldRoleIds } }
    });
    console.log('Cleaned up obsolete roles (admin, user) and their associations.');
  } else {
    console.log('No obsolete roles found.');
  }

  console.log('\n--- Step 3: Seed business roles (leader, operator, welder) ---');
  const businessRoles = [
    {
      key: 'leader',
      name: '领导',
      description: '公司领导/分管领导决策看板与跨部门核心应用权限'
    },
    {
      key: 'operator',
      name: '高级操作员',
      description: '生产、运营等业务子系统核心操作与调度人员'
    },
    {
      key: 'welder',
      name: '管道质检组',
      description: '现场管道焊接作业、探伤与施工质量数据填报人员'
    }
  ];

  for (const r of businessRoles) {
    await prisma.role.upsert({
      where: { key: r.key },
      update: { name: r.name, description: r.description },
      create: { key: r.key, name: r.name, description: r.description }
    });
    console.log(`Upserted business role: ${r.name} (${r.key})`);
  }

  console.log('\n--- Step 4: Verify current business roles ---');
  const allRoles = await prisma.role.findMany({
    include: {
      _count: {
        select: { members: true }
      }
    }
  });
  console.table(allRoles.map(r => ({
    id: r.id,
    key: r.key,
    name: r.name,
    description: r.description,
    members: r._count.members
  })));
}

main()
  .catch(e => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
