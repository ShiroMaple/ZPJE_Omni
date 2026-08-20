import { prisma } from '../lib/prisma';

async function main() {
  console.log('=== 验证业务角色与成员数据 ===');
  const roles = await prisma.role.findMany({
    include: {
      _count: {
        select: {
          members: true,
        },
      },
    },
    orderBy: {
      key: 'asc',
    },
  });

  console.log('有效业务角色列表:');
  roles.forEach((r) => {
    console.log(`- ID: ${r.id} | Key: ${r.key} | 名称: ${r.name} | 描述: ${r.description || '无'} | 当前人数: ${r._count.members}`);
  });

  console.log('\n=== 验证管理员特权分布 ===');
  const adminMembers = await prisma.member.findMany({
    where: {
      adminType: {
        in: ['SYS_ADMIN', 'OPS_ADMIN', 'DEPT_ADMIN'],
      },
    },
    select: {
      name: true,
      loginName: true,
      adminType: true,
    },
  });
  adminMembers.forEach((m) => {
    console.log(`- 管理员: ${m.name} (@${m.loginName}) -> ${m.adminType}`);
  });

  console.log('\n=== 验证部门层级数量 ===');
  const unitsCount = await prisma.unit.count();
  const deptCount = await prisma.department.count();
  console.log(`- 单位数: ${unitsCount}, 部门数: ${deptCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
