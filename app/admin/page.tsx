import React from 'react';
import { prisma } from '@/lib/prisma';
import { checkAdmin, checkSystemAdmin, checkOpsAdminOrAbove } from '@/lib/auth';
import { headers } from 'next/headers';
import AdminAppRegistry from './AdminAppRegistry';
import { ShieldAlert, Home } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id') || 'guest';
  const isAdmin = await checkAdmin();
  const isSystemAdmin = await checkSystemAdmin();
  const isOpsAdmin = await checkOpsAdminOrAbove();

  let currentUserInfo = null;
  if (userId !== 'guest') {
    const member = await prisma.member.findUnique({
      where: { loginName: userId },
      include: {
        unit: { select: { name: true } },
        department: { select: { name: true } }
      }
    });
    if (member) {
      currentUserInfo = {
        name: member.name,
        loginName: member.loginName,
        unitName: member.unit?.name || '未知单位',
        deptName: member.department?.name || '未知部门',
      };
    }
  }

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
              您的账户没有管理员权限，无法访问管理后台。如有疑问，请联系系统管理员进行授权。
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
          code: true,
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

  const uniqueLoginNames = Array.from(new Set(accessLogs.map(l => l.loginName)));
  const logMembers = await prisma.member.findMany({
    where: { loginName: { in: uniqueLoginNames } },
    select: { loginName: true, name: true }
  });
  const memberNameMap = new Map(logMembers.map(m => [m.loginName, m.name]));

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

  const systemLogs = await prisma.systemLog.findMany({
    orderBy: {
      timestamp: 'desc'
    }
  });

  const adminMembers = await prisma.member.findMany({
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

  const initialRoleAssignedMembers = await prisma.member.findMany({
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

  // Serialize models safely for client
  const serializedApps = apps.map((app) => ({
    id: app.id,
    key: app.key,
    name: app.name,
    description: app.description || null,
    url: app.url,
    icon: app.icon || null,
    color: app.color || null,
    isMaintenance: app.isMaintenance,
    sortOrder: app.sortOrder,
    mainDeptId: app.mainDeptId || null,
    mainDept: app.mainDept ? { id: app.mainDept.id, name: app.mainDept.name } : null,
    visibleToAll: app.visibleToAll,
    roleIds: app.rolePermissions.map(rp => rp.roleId),
    deptIds: app.deptPermissions.map(dp => dp.departmentId),
  }));

  const serializedUnits = units
    .map((unit) => {
      const filteredDepts = unit.departments
        .filter((dept) => dept.code && dept.code.startsWith('JA'))
        .map((dept) => ({
          id: dept.id,
          name: dept.name,
        }));
      return {
        id: unit.id,
        name: unit.name,
        departments: filteredDepts,
      };
    })
    .filter((unit) => unit.departments.length > 0);

  const serializedAccessLogs = accessLogs.map((log) => ({
    id: log.id,
    loginName: log.loginName,
    userName: memberNameMap.get(log.loginName) || '',
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

  const serializedAdminMembers = adminMembers.map((m) => ({
    id: m.id,
    name: m.name,
    loginName: m.loginName,
    adminType: m.adminType,
    deptName: m.department?.name || '无部门',
    unitName: m.unit?.name || '无单位'
  }));

  const serializedRoleAssignedMembers = initialRoleAssignedMembers.map((m) => ({
    id: m.id,
    name: m.name,
    loginName: m.loginName,
    deptName: m.department?.name || '无部门',
    unitName: m.unit?.name || '无单位',
    roles: m.roles.map(r => ({
      id: r.role.id,
      key: r.role.key,
      name: r.role.name
    }))
  }));

  const serializedSystemLogs = systemLogs.map((log) => ({
    id: log.id,
    loginName: log.loginName,
    userName: log.userName || '',
    actionType: log.actionType,
    detail: log.detail,
    ip: log.ip,
    userAgent: log.userAgent,
    timestamp: log.timestamp.toISOString()
  }));

  return (
    <AdminAppRegistry
      initialApps={serializedApps}
      departmentsTree={serializedUnits}
      accessLogs={serializedAccessLogs}
      roles={serializedRoles}
      initialWidgets={serializedWidgets}
      isSystemAdmin={isSystemAdmin}
      isOpsAdmin={isOpsAdmin}
      initialAdminMembers={serializedAdminMembers}
      initialRoleAssignedMembers={serializedRoleAssignedMembers}
      initialSystemLogs={serializedSystemLogs}
      userId={userId}
      userInfo={currentUserInfo}
      isAdmin={isAdmin}
    />
  );
}
