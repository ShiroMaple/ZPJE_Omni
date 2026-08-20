import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkOpsAdminOrAbove } from '@/lib/auth';
import { headers } from 'next/headers';
import { recordSystemLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/admin/roles/[id]/members - 获取指定角色下的成员列表
export async function GET(req: NextRequest, context: RouteContext) {
  const isAllowed = await checkOpsAdminOrAbove();
  if (!isAllowed) {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 });
  }

  const { id: roleId } = await context.params;
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get('keyword')?.trim() || '';

  try {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true, key: true, name: true, description: true },
    });

    if (!role) {
      return NextResponse.json({ error: '角色不存在' }, { status: 404 });
    }

    const whereCondition: any = {
      roleId: roleId,
    };

    if (keyword) {
      whereCondition.member = {
        OR: [
          { name: { contains: keyword } },
          { loginName: { contains: keyword } },
          { code: { contains: keyword } },
        ],
      };
    }

    const memberRoles = await prisma.memberRole.findMany({
      where: whereCondition,
      include: {
        member: {
          select: {
            id: true,
            name: true,
            loginName: true,
            code: true,
            adminType: true,
            unit: {
              select: {
                id: true,
                name: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const members = memberRoles.map((mr) => ({
      id: mr.member.id,
      name: mr.member.name,
      loginName: mr.member.loginName,
      code: mr.member.code || '',
      adminType: mr.member.adminType,
      unitName: mr.member.unit?.name || '未知单位',
      deptName: mr.member.department?.name || '未分配部门',
      joinedAt: mr.createdAt,
    }));

    return NextResponse.json(members);
  } catch (err: any) {
    console.error('Failed to fetch role members:', err);
    return NextResponse.json({ error: '获取角色成员失败' }, { status: 500 });
  }
}

// POST /api/admin/roles/[id]/members - 批量添加成员到指定角色
export async function POST(req: NextRequest, context: RouteContext) {
  const isAllowed = await checkOpsAdminOrAbove();
  if (!isAllowed) {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 });
  }

  const { id: roleId } = await context.params;

  try {
    const body = await req.json();
    const { memberIds } = body;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: '请选择至少一名员工' }, { status: 400 });
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true, name: true, key: true },
    });

    if (!role) {
      return NextResponse.json({ error: '角色不存在' }, { status: 404 });
    }

    // 过滤有效的 memberIds
    const existingMembers = await prisma.member.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, name: true, loginName: true },
    });

    if (existingMembers.length === 0) {
      return NextResponse.json({ error: '未找到选中的有效员工' }, { status: 400 });
    }

    const dataToInsert = existingMembers.map((m) => ({
      roleId: role.id,
      memberId: m.id,
    }));

    // 使用 createMany 幂等插入
    const result = await prisma.memberRole.createMany({
      data: dataToInsert,
      skipDuplicates: true,
    });

    // 重新获取该角色成员总数
    const newMemberCount = await prisma.memberRole.count({
      where: { roleId: role.id },
    });

    const memberNames = existingMembers.slice(0, 5).map((m) => m.name).join('、') + (existingMembers.length > 5 ? ` 等${existingMembers.length}人` : '');
    const headersList = await headers();
    const operator = headersList.get('x-user-id') || 'system';
    await recordSystemLog(operator, 'ROLE_MANAGE', `向业务角色【${role.name}】批量添加成员 (${memberNames})，成功新增 ${result.count} 人，当前共 ${newMemberCount} 人`);

    return NextResponse.json({
      success: true,
      addedCount: result.count,
      totalCount: newMemberCount,
      roleId: role.id,
    });
  } catch (err: any) {
    console.error('Failed to add members to role:', err);
    return NextResponse.json({ error: '添加成员失败' }, { status: 500 });
  }
}
