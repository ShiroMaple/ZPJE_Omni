import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkOpsAdminOrAbove } from '@/lib/auth';
import { headers } from 'next/headers';
import { recordSystemLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/admin/roles/[id] - 获取单个业务角色详情
export async function GET(req: NextRequest, context: RouteContext) {
  const isAllowed = await checkOpsAdminOrAbove();
  if (!isAllowed) {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 });
  }

  const { id: roleId } = await context.params;

  try {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            members: true,
            permissions: true,
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ error: '角色不存在' }, { status: 404 });
    }

    return NextResponse.json({
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description,
      memberCount: role._count.members,
      appCount: role._count.permissions,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    });
  } catch (err: any) {
    console.error('Failed to fetch role:', err);
    return NextResponse.json({ error: '获取角色信息失败' }, { status: 500 });
  }
}

// PUT /api/admin/roles/[id] - 编辑业务角色的 key、name、description
export async function PUT(req: NextRequest, context: RouteContext) {
  const isAllowed = await checkOpsAdminOrAbove();
  if (!isAllowed) {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 });
  }

  const { id: roleId } = await context.params;

  try {
    const body = await req.json();
    const { key, name, description } = body;

    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      return NextResponse.json({ error: '角色不存在' }, { status: 404 });
    }

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: '角色名称不能为空' }, { status: 400 });
    }

    const trimmedName = String(name).trim();
    let trimmedKey = existingRole.key;

    if (key !== undefined) {
      trimmedKey = String(key).trim().toLowerCase();
      if (!/^[a-zA-Z0-9_-]{2,32}$/.test(trimmedKey)) {
        return NextResponse.json({ error: '角色标识仅支持 2-32 位字母、数字、下划线或短横线' }, { status: 400 });
      }

      // 如果 key 发生变更，检查是否冲突
      if (trimmedKey !== existingRole.key) {
        const conflict = await prisma.role.findUnique({
          where: { key: trimmedKey },
        });
        if (conflict && conflict.id !== roleId) {
          return NextResponse.json({ error: `角色标识 "${trimmedKey}" 已被其他角色占用` }, { status: 409 });
        }
      }
    }

    const trimmedDesc = description !== undefined ? (description ? String(description).trim() : null) : existingRole.description;

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        key: trimmedKey,
        name: trimmedName,
        description: trimmedDesc,
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    const headersList = await headers();
    const operator = headersList.get('x-user-id') || 'system';
    await recordSystemLog(
      operator,
      'ROLE_MANAGE',
      `修改业务角色: 原【${existingRole.name} (@${existingRole.key})】更新为【${updatedRole.name} (@${updatedRole.key})】`
    );

    return NextResponse.json({
      id: updatedRole.id,
      key: updatedRole.key,
      name: updatedRole.name,
      description: updatedRole.description,
      memberCount: updatedRole._count.members,
      createdAt: updatedRole.createdAt,
      updatedAt: updatedRole.updatedAt,
    });
  } catch (err: any) {
    console.error('Failed to update role:', err);
    return NextResponse.json({ error: '更新角色失败' }, { status: 500 });
  }
}

// DELETE /api/admin/roles/[id] - 移除/删除业务角色
export async function DELETE(req: NextRequest, context: RouteContext) {
  const isAllowed = await checkOpsAdminOrAbove();
  if (!isAllowed) {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 });
  }

  const { id: roleId } = await context.params;

  try {
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            members: true,
            permissions: true,
          },
        },
      },
    });

    if (!existingRole) {
      return NextResponse.json({ error: '角色不存在' }, { status: 404 });
    }

    // 级联物理删除角色（MemberRole 与 AppRolePermission 均已配置 onDelete: Cascade）
    await prisma.role.delete({
      where: { id: roleId },
    });

    const headersList = await headers();
    const operator = headersList.get('x-user-id') || 'system';
    await recordSystemLog(
      operator,
      'ROLE_MANAGE',
      `删除业务角色【${existingRole.name} (@${existingRole.key})】，同时解除 ${existingRole._count.members} 名关联员工与 ${existingRole._count.permissions} 个应用授权`
    );

    return NextResponse.json({
      success: true,
      id: roleId,
      name: existingRole.name,
      key: existingRole.key,
    });
  } catch (err: any) {
    console.error('Failed to delete role:', err);
    return NextResponse.json({ error: '删除角色失败' }, { status: 500 });
  }
}
