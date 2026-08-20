import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export interface DepartmentTreeNode {
  id: string;
  name: string;
  code: string | null;
  parentId: string | null;
  orgAccountId: string;
  unitName?: string;
  memberCount?: number;
  children: DepartmentTreeNode[];
}

export interface UnitTreeNode {
  id: string;
  name: string;
  code: string | null;
  departments: DepartmentTreeNode[];
}

// GET /api/admin/departments/tree - 获取带层级树形结构的组织单位与部门列表
export async function GET() {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: '无权限访问' }, { status: 403 });
  }

  try {
    const units = await prisma.unit.findMany({
      include: {
        departments: {
          select: {
            id: true,
            name: true,
            code: true,
            parentId: true,
            orgAccountId: true,
            _count: {
              select: {
                members: true,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const treeData: UnitTreeNode[] = units.map((unit) => {
      const deptMap = new Map<string, DepartmentTreeNode>();
      const rootDepts: DepartmentTreeNode[] = [];

      // 1. 初始化所有部门节点
      unit.departments.forEach((d) => {
        deptMap.set(d.id, {
          id: d.id,
          name: d.name,
          code: d.code,
          parentId: d.parentId,
          orgAccountId: d.orgAccountId,
          unitName: unit.name,
          memberCount: d._count.members,
          children: [],
        });
      });

      // 2. 组装父子树形结构
      unit.departments.forEach((d) => {
        const node = deptMap.get(d.id)!;
        if (d.parentId && deptMap.has(d.parentId)) {
          const parentNode = deptMap.get(d.parentId)!;
          parentNode.children.push(node);
        } else {
          rootDepts.push(node);
        }
      });

      return {
        id: unit.id,
        name: unit.name,
        code: unit.code,
        departments: rootDepts,
      };
    });

    return NextResponse.json(treeData);
  } catch (err: any) {
    console.error('Failed to fetch departments tree:', err);
    return NextResponse.json({ error: '获取组织架构树失败' }, { status: 500 });
  }
}
