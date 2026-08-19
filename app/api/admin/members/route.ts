import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { checkSystemAdmin, checkOpsAdminOrAbove } from '@/lib/auth';
import { recordSystemLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const isOpsOrAbove = await checkOpsAdminOrAbove();
  if (!isOpsOrAbove) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const isSysAdmin = await checkSystemAdmin();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || ''; // 'admins', 'roles_data', or 'search'

  try {
    if (type === 'admins') {
      if (!isSysAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const admins = await prisma.member.findMany({
        where: {
          adminType: {
            in: ['SYS_ADMIN', 'OPS_ADMIN', 'DEPT_ADMIN']
          }
        },
        include: {
          department: { select: { name: true } },
          unit: { select: { name: true } }
        },
        orderBy: {
          name: 'asc'
        }
      });
      return NextResponse.json(admins);
    }

    if (type === 'roles_data') {
      const roles = await prisma.role.findMany({
        orderBy: { key: 'asc' }
      });
      const assignedMembers = await prisma.member.findMany({
        where: {
          roles: {
            some: {}
          }
        },
        include: {
          unit: { select: { name: true } },
          department: { select: { name: true } },
          roles: {
            include: {
              role: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });
      return NextResponse.json({ roles, assignedMembers });
    }

    if (!search.trim()) {
      return NextResponse.json([]);
    }

    const members = await prisma.member.findMany({
      where: {
        OR: [
          { name: { contains: search } },
          { loginName: { contains: search } },
          { code: { contains: search } }
        ]
      },
      include: {
        department: { select: { name: true } },
        unit: { select: { name: true } },
        roles: {
          include: {
            role: true
          }
        }
      },
      take: 30
    });

    return NextResponse.json(members);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const isOpsOrAbove = await checkOpsAdminOrAbove();
  if (!isOpsOrAbove) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const isSysAdmin = await checkSystemAdmin();

  try {
    const body = await req.json();
    const { memberId, adminType, roleIds } = body;

    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 });
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        unit: { select: { name: true } },
        department: { select: { name: true } },
        roles: { include: { role: true } }
      }
    });
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const headersList = await headers();
    const operator = headersList.get('x-user-id') || 'unknown';

    // 1. Update AdminType if provided (requires SYS_ADMIN)
    if (adminType !== undefined) {
      if (!isSysAdmin) {
        return NextResponse.json({ error: '只有系统管理员可分配管理员特权' }, { status: 403 });
      }
      const validTypes = ['NONE', 'SYS_ADMIN', 'OPS_ADMIN', 'DEPT_ADMIN'];
      if (!validTypes.includes(adminType)) {
        return NextResponse.json({ error: 'Invalid adminType' }, { status: 400 });
      }

      await prisma.member.update({
        where: { id: memberId },
        data: { adminType }
      });

      const typeLabel = adminType === 'NONE' ? '普通成员 (撤销特权)'
        : adminType === 'SYS_ADMIN' ? '系统管理员'
        : adminType === 'OPS_ADMIN' ? '运维管理员' : '部门管理员';

      await recordSystemLog(operator, 'ADMIN_MANAGE', `配置成员 ${member.name} (${member.loginName}) 的管理员特权为: ${typeLabel}`);
    }

    // 2. Update RoleIds if provided (SYS_ADMIN or OPS_ADMIN)
    if (roleIds !== undefined && Array.isArray(roleIds)) {
      await prisma.$transaction(async (tx) => {
        // Clear previous roles
        await tx.memberRole.deleteMany({
          where: { memberId }
        });

        // Insert selected roles
        if (roleIds.length > 0) {
          await tx.memberRole.createMany({
            data: roleIds.map((rId: string) => ({
              memberId,
              roleId: rId
            }))
          });
        }
      });

      const updatedRoles = await prisma.role.findMany({
        where: { id: { in: roleIds } }
      });
      const roleNames = updatedRoles.map(r => r.name).join('、') || '无';

      await recordSystemLog(operator, 'ROLE_MANAGE', `为成员 ${member.name} (${member.loginName}) 分配业务角色: ${roleNames}`);
    }

    // Return full updated member data
    const updatedMember = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        unit: { select: { name: true } },
        department: { select: { name: true } },
        roles: { include: { role: true } }
      }
    });

    return NextResponse.json(updatedMember);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
