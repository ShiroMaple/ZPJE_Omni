import React from 'react';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/auth';
import AdminAppRegistry from './AdminAppRegistry';
import { ShieldAlert, Home } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const isAdmin = await checkAdmin();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6 text-text-main font-sans">
        <div className="w-full max-w-md p-8 bg-card-surface rounded-lg border border-card-border shadow-md text-center flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold tracking-tight text-title">访问被拒绝</h1>
            <p className="text-sm text-text-sec leading-relaxed">
              您的账户没有管理员权限，无法访问应用注册中心。如有疑问，请联系系统管理员进行授权。
            </p>
          </div>
          <a
            href="/"
            className="w-full py-2.5 rounded-full border border-input-border bg-card-surface hover:bg-sidebar-hover transition-all font-semibold text-sm flex items-center justify-center gap-2 text-title"
          >
            <Home className="w-4 h-4" />
            <span>返回门户首页</span>
          </a>
        </div>
      </div>
    );
  }

  // Fetch initial apps and departments tree with visibility permissions
  const apps = await prisma.app.findMany({
    include: {
      mainDept: {
        select: {
          id: true,
          name: true,
        }
      },
      rolePermissions: {
        select: { roleId: true }
      },
      deptPermissions: {
        select: { departmentId: true }
      }
    },
    orderBy: {
      sortOrder: 'asc',
    },
  });

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

  const accessLogs = await prisma.accessLog.findMany({
    include: {
      app: {
        select: {
          name: true,
          key: true
        }
      }
    },
    orderBy: {
      timestamp: 'desc'
    }
  });

  const roles = await prisma.role.findMany({
    orderBy: {
      key: 'asc'
    }
  });

  const widgets = await prisma.widget.findMany({
    include: {
      app: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      sortOrder: 'asc'
    }
  });

  // Serialize models safely for client
  const serializedApps = apps.map((app) => ({
    id: app.id,
    key: app.key,
    name: app.name,
    description: app.description || null,
    url: app.url,
    icon: app.icon || null,
    category: app.category,
    isMaintenance: app.isMaintenance,
    sortOrder: app.sortOrder,
    mainDeptId: app.mainDeptId || null,
    mainDept: app.mainDept ? { id: app.mainDept.id, name: app.mainDept.name } : null,
    visibleToAll: app.visibleToAll,
    roleIds: app.rolePermissions.map(rp => rp.roleId),
    deptIds: app.deptPermissions.map(dp => dp.departmentId),
  }));

  const serializedUnits = units.map((unit) => ({
    id: unit.id,
    name: unit.name,
    departments: unit.departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
    })),
  }));

  const serializedAccessLogs = accessLogs.map((log) => ({
    id: log.id,
    loginName: log.loginName,
    appId: log.appId,
    ip: log.ip,
    userAgent: log.userAgent,
    timestamp: log.timestamp.toISOString(),
    app: {
      name: log.app?.name || '未知应用',
      key: log.app?.key || 'unknown'
    }
  }));

  const serializedRoles = roles.map((role) => ({
    id: role.id,
    key: role.key,
    name: role.name
  }));

  const serializedWidgets = widgets.map((w) => ({
    id: w.id,
    title: w.title,
    appId: w.appId || null,
    appName: w.app?.name || null,
    type: w.type,
    url: w.url,
    widthClass: w.widthClass,
    sortOrder: w.sortOrder
  }));

  return (
    <AdminAppRegistry 
      initialApps={serializedApps} 
      departmentsTree={serializedUnits} 
      accessLogs={serializedAccessLogs}
      roles={serializedRoles}
      initialWidgets={serializedWidgets}
    />
  );
}
