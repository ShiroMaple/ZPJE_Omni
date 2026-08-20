import { prisma } from '../lib/prisma';

async function main() {
  console.log('=== 测试业务角色分配与解除流程 ===');
  
  // 1. 查找 leader 角色
  const leaderRole = await prisma.role.findUnique({
    where: { key: 'leader' },
  });
  if (!leaderRole) throw new Error('leader role not found');

  // 2. 查找 3 个测试员工
  const members = await prisma.member.findMany({
    take: 3,
    select: { id: true, name: true, loginName: true },
  });
  console.log('选取测试员工:', members.map(m => `${m.name} (${m.loginName})`).join(', '));

  // 3. 批量分配到 leader 角色
  await prisma.memberRole.createMany({
    data: members.map(m => ({
      roleId: leaderRole.id,
      memberId: m.id,
    })),
    skipDuplicates: true,
  });

  const countAfterAdd = await prisma.memberRole.count({
    where: { roleId: leaderRole.id },
  });
  console.log(`- 批量添加后，【${leaderRole.name}】角色成员数: ${countAfterAdd}`);

  // 4. 从 leader 角色移除 1 人
  const removedMember = members[0];
  await prisma.memberRole.deleteMany({
    where: {
      roleId: leaderRole.id,
      memberId: removedMember.id,
    },
  });

  const countAfterRemove = await prisma.memberRole.count({
    where: { roleId: leaderRole.id },
  });
  console.log(`- 移除【${removedMember.name}】后，【${leaderRole.name}】角色成员数: ${countAfterRemove}`);

  // 5. 验证关联查询
  const roleWithMembers = await prisma.role.findUnique({
    where: { id: leaderRole.id },
    include: {
      members: {
        include: {
          member: {
            select: { name: true, loginName: true },
          },
        },
      },
      _count: {
        select: { members: true },
      },
    },
  });

  console.log(`- 最终角色: ${roleWithMembers?.name}, 统计人数: ${roleWithMembers?._count.members}`);
  console.log('  剩余成员:', roleWithMembers?.members.map(m => `${m.member.name} (@${m.member.loginName})`).join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
