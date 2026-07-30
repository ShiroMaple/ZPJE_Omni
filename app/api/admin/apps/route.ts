import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/auth';

export async function GET() {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const apps = await prisma.app.findMany({
      include: {
        mainDept: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
    return NextResponse.json(apps);
  } catch (err: any) {
    console.error('Failed to fetch apps for admin:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      key,
      name,
      description,
      url,
      icon,
      category,
      isMaintenance,
      sortOrder,
      mainDeptId,
      visibleToAll,
      roleIds,
      deptIds
    } = body;

    if (!key || !name || !url) {
      return NextResponse.json({ error: 'Missing required fields: key, name, url' }, { status: 400 });
    }

    // Check if key is already taken
    const existing = await prisma.app.findUnique({
      where: { key }
    });
    if (existing) {
      return NextResponse.json({ error: 'Application key already exists' }, { status: 400 });
    }

    const newApp = await prisma.app.create({
      data: {
        key,
        name,
        description,
        url,
        icon,
        category: category || '通用应用',
        isMaintenance: !!isMaintenance,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
        mainDeptId: mainDeptId || null,
        visibleToAll: visibleToAll !== undefined ? !!visibleToAll : true,
        rolePermissions: {
          create: (roleIds || []).map((roleId: string) => ({ roleId }))
        },
        deptPermissions: {
          create: (deptIds || []).map((departmentId: string) => ({ departmentId }))
        }
      },
    });

    return NextResponse.json(newApp, { status: 201 });
  } catch (err: any) {
    console.error('Failed to create app:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
