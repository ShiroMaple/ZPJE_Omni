import { prisma } from '../lib/prisma';

async function main() {
  console.log('=== 测试业务角色的完整生命周期：创建 -> 编辑 -> 删除 ===');

  // 1. 创建一个临时测试角色
  const testKey = `test_role_${Date.now()}`;
  const created = await prisma.role.create({
    data: {
      key: testKey,
      name: '测试质检专员',
      description: '临时测试角色的业务描述',
    },
  });
  console.log('1. 创建角色成功:', created);

  // 2. 修改 key、name、description
  const updatedKey = `${testKey}_updated`;
  const updated = await prisma.role.update({
    where: { id: created.id },
    data: {
      key: updatedKey,
      name: '高级焊接与质检专员',
      description: '已更新的业务职能说明：负责现场焊缝探伤与返修审核',
    },
  });
  console.log('2. 更新角色成功:', updated);

  // 3. 删除该角色
  await prisma.role.delete({
    where: { id: created.id },
  });
  console.log('3. 删除角色成功:', updated.id);

  // 4. 验证不存在
  const checked = await prisma.role.findUnique({
    where: { id: created.id },
  });
  console.log('4. 验证已从数据库中彻底移除:', checked === null ? '已确认清除' : '异常');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
