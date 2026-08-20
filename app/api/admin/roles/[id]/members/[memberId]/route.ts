import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkOpsAdminOrAbove } from '@/lib/auth';
import { headers } from 'next/headers';
import { recordSystemLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string; memberId: string }>;
}

// DELETE /api/admin/roles/[id]/members/[memberId] - 将指定成员从角色中移除
export async function DELETE(req: NextRequest, context: RouteContext) {
  const isAllowed = await checkOpsAdminOrAbove();
  if (!isAllowed) {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 });
  }

  const { id: roleId, memberId } = await context.params;

  try {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true, name: true, key: true },
    });

    if (!role) {
      return NextResponse.json({ error: '角色不存在' }, { status: 404 });
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true, name: true, loginName: true },
    });

    if (!member) {
      return NextResponse.json({ error: '员工不存在' }, { status: 404 });
    }

    const deleteResult = await prisma.memberRole.deleteMany({
      where: {
        roleId: role.id,
        memberId: member.id,
      },
    });

    const currentMemberCount = await prisma.memberRole.count({
      where: { roleId: role.id },
    });

    const headersList = await headers();
    const operator = headersList.get('x-user-id') || 'system';
    await recordSystemLog(operator, 'ROLE_MANAGE', `从业务角色【${role.name}】中移除成员: ${member.name} (${member.loginName})，当前该角色剩余 ${currentMemberCount} 人`);

    return NextResponse.json({
      success: true,
      removed: deleteResult.count > 0,
      totalCount: currentMemberCount,
      roleId: role.id,
      memberId: member.id,
    });
  } catch (err: any) {
    console.error('Failed to remove member from role:', err);
    return NextResponse.json({ error: '移除成员失败' }, { status: 500 });
  }
}
