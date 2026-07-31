import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/auth';
import { recordSystemLog } from '@/lib/audit';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
      isMaintenance,
      sortOrder,
      mainDeptId,
      visibleToAll,
      roleIds,
      deptIds
    } = body;

    // Check if app exists
    const app = await prisma.app.findUnique({
      where: { id }
    });
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // If key is changed, make sure it is not taken
    if (key && key !== app.key) {
      const existing = await prisma.app.findUnique({
        where: { key }
      });
      if (existing) {
        return NextResponse.json({ error: 'Application key already exists' }, { status: 400 });
      }
    }

    const [_, __, updatedApp] = await prisma.$transaction([
      prisma.appRolePermission.deleteMany({ where: { appId: id } }),
      prisma.appDepartmentPermission.deleteMany({ where: { appId: id } }),
      prisma.app.update({
        where: { id },
        data: {
          key: key !== undefined ? key : app.key,
          name: name !== undefined ? name : app.name,
          description: description !== undefined ? description : app.description,
          url: url !== undefined ? url : app.url,
          icon: icon !== undefined ? icon : app.icon,
          isMaintenance: isMaintenance !== undefined ? !!isMaintenance : app.isMaintenance,
          sortOrder: sortOrder !== undefined ? Number(sortOrder) : app.sortOrder,
          mainDeptId: mainDeptId !== undefined ? (mainDeptId || null) : app.mainDeptId,
          visibleToAll: visibleToAll !== undefined ? !!visibleToAll : app.visibleToAll,
          rolePermissions: {
            create: (roleIds || []).map((roleId: string) => ({ roleId }))
          },
          deptPermissions: {
            create: (deptIds || []).map((departmentId: string) => ({ departmentId }))
          }
        },
      })
    ]);

    const headersList = await headers();
    const operator = headersList.get('x-user-id') || 'unknown';
    await recordSystemLog(operator, 'APP_MANAGE', `更新应用: ${updatedApp.name} (${updatedApp.key})`);

    return NextResponse.json(updatedApp);
  } catch (err: any) {
    console.error(`Failed to update app ${id}:`, err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const app = await prisma.app.findUnique({
      where: { id }
    });
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    await prisma.app.delete({
      where: { id }
    });

    const headersList = await headers();
    const operator = headersList.get('x-user-id') || 'unknown';
    await recordSystemLog(operator, 'APP_MANAGE', `删除应用: ${app.name} (${app.key})`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`Failed to delete app ${id}:`, err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
