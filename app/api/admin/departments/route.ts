import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/auth';

export async function GET() {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // 获取所有单位，且包含它们关联的部门
    const units = await prisma.unit.findMany({
      include: {
        departments: {
          select: {
            id: true,
            name: true,
            parentId: true,
          },
          orderBy: {
            name: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(units);
  } catch (err: any) {
    console.error('Failed to fetch departments tree:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
