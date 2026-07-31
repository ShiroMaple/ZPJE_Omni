import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { checkSystemAdmin } from '@/lib/auth';
import { recordSystemLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const isSysAdmin = await checkSystemAdmin();
  if (!isSysAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || ''; // 'admins' or 'search'

  try {
    if (type === 'admins') {
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

    if (!search.trim()) {
      return NextResponse.json([]);
    }

    const members = await prisma.member.findMany({
      where: {
        OR: [
          { name: { contains: search } },
          { loginName: { contains: search } }
        ]
      },
      include: {
        department: { select: { name: true } },
        unit: { select: { name: true } }
      },
      take: 30
    });

    return NextResponse.json(members);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const isSysAdmin = await checkSystemAdmin();
  if (!isSysAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { memberId, adminType } = await req.json();
    if (!memberId || !adminType) {
      return NextResponse.json({ error: 'memberId and adminType are required' }, { status: 400 });
    }

    const validTypes = ['NONE', 'SYS_ADMIN', 'OPS_ADMIN', 'DEPT_ADMIN'];
    if (!validTypes.includes(adminType)) {
      return NextResponse.json({ error: 'Invalid adminType' }, { status: 400 });
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { name: true, loginName: true }
    });
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const updated = await prisma.member.update({
      where: { id: memberId },
      data: { adminType }
    });

    const typeLabel = adminType === 'NONE' ? '普通成员 (撤销权限)'
      : adminType === 'SYS_ADMIN' ? '系统管理员'
      : adminType === 'OPS_ADMIN' ? '运维管理员' : '部门管理员';

    const headersList = await headers();
    const operator = headersList.get('x-user-id') || 'unknown';
    await recordSystemLog(operator, 'ADMIN_MANAGE', `配置成员 ${member.name} (${member.loginName}) 的管理员权限为: ${typeLabel}`);

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
