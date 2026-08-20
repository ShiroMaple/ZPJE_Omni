import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkOpsAdminOrAbove } from '@/lib/auth';
import { headers } from 'next/headers';
import { recordSystemLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET /api/admin/roles - 获取所有业务角色列表（带成员统计）
export async function GET() {
  const isAllowed = await checkOpsAdminOrAbove();
  if (!isAllowed) {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 });
  }

  try {
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const formattedRoles = roles.map((r) => ({
      id: r.id,
      key: r.key,
      name: r.name,
      description: r.description,
      memberCount: r._count.members,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return NextResponse.json(formattedRoles);
  } catch (err: any) {
    console.error('Failed to fetch roles:', err);
    return NextResponse.json({ error: '获取角色列表失败' }, { status: 500 });
  }
}

// POST /api/admin/roles - 新增自定义业务角色
export async function POST(req: NextRequest) {
  const isAllowed = await checkOpsAdminOrAbove();
  if (!isAllowed) {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { key, name, description } = body;

    if (!key || !name) {
      return NextResponse.json({ error: '角色唯一标识 (key) 和名称 (name) 不能为空' }, { status: 400 });
    }

    const trimmedKey = String(key).trim().toLowerCase();
    const trimmedName = String(name).trim();
    const trimmedDesc = description ? String(description).trim() : null;

    // 检查 key 格式（英文字母、数字、下划线）
    if (!/^[a-zA-Z0-9_-]{2,32}$/.test(trimmedKey)) {
      return NextResponse.json({ error: '角色标识仅支持 2-32 位字母、数字、下划线或短横线' }, { status: 400 });
    }

    // 检查 key 是否已存在
    const existing = await prisma.role.findUnique({
      where: { key: trimmedKey },
    });

    if (existing) {
      return NextResponse.json({ error: `角色标识 "${trimmedKey}" 已存在` }, { status: 409 });
    }

    const newRole = await prisma.role.create({
      data: {
        key: trimmedKey,
        name: trimmedName,
        description: trimmedDesc,
      },
    });

    const headersList = await headers();
    const operator = headersList.get('x-user-id') || 'system';
    await recordSystemLog(operator, 'ROLE_MANAGE', `创建自定义业务角色: ${newRole.name} (${newRole.key})`);

    return NextResponse.json({
      id: newRole.id,
      key: newRole.key,
      name: newRole.name,
      description: newRole.description,
      memberCount: 0,
      createdAt: newRole.createdAt,
      updatedAt: newRole.updatedAt,
    }, { status: 201 });
  } catch (err: any) {
    console.error('Failed to create role:', err);
    return NextResponse.json({ error: '创建角色失败' }, { status: 500 });
  }
}
