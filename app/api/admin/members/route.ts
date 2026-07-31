import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkSystemAdmin } from '@/lib/auth';

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

    const updated = await prisma.member.update({
      where: { id: memberId },
      data: { adminType }
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
