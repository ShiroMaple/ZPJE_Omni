'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Home,
  Check,
  X,
  AlertTriangle,
  Zap,
  Calculator,
  LayoutDashboard,
  FileText,
  Activity,
  Leaf,
  Clock,
  Hammer,
  BarChart3,
  Users,
  MousePointerClick,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Shield,
  Search,
  User,
  Moon,
  Sun,
  LogOut,
  Folder,
  FolderOpen,
  UserPlus,
  UserMinus,
  CheckSquare,
  Square,
  MinusSquare,
  Filter,
  Sparkles,
  Info
} from 'lucide-react';

interface DBApp {
  id: string;
  key: string;
  name: string;
  description: string | null;
  url: string;
  icon: string | null;
  color?: string | null;
  isMaintenance: boolean;
  sortOrder: number;
  mainDeptId: string | null;
  mainDept?: {
    id: string;
    name: string;
  } | null;
  visibleToAll: boolean;
  roleIds?: string[];
  deptIds?: string[];
}

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

interface AccessLog {
  id: string;
  loginName: string;
  userName: string;
  appId: string;
  ip: string | null;
  userAgent: string | null;
  timestamp: string;
  app: {
    name: string;
    key: string;
  };
}

interface RoleOption {
  id: string;
  key: string;
  name: string;
  description: string | null;
  memberCount?: number;
}

interface WidgetConfig {
  id: string;
  title: string;
  appId: string | null;
  appName: string | null;
  type: string;
  url: string;
  widthClass: string;
  sortOrder: number;
}

interface AdminMember {
  id: string;
  name: string;
  loginName: string;
  adminType: 'SYS_ADMIN' | 'OPS_ADMIN' | 'DEPT_ADMIN' | 'NONE';
  deptName: string;
  unitName: string;
}

interface SystemLog {
  id: string;
  loginName: string;
  userName: string;
  actionType: string;
  detail: string;
  ip: string | null;
  userAgent: string | null;
  timestamp: string;
}

interface RoleMemberItem {
  id: string;
  name: string;
  loginName: string;
  code?: string;
  adminType: string;
  unitName: string;
  deptName: string;
  joinedAt?: string;
}

interface AdminAppRegistryProps {
  initialApps: DBApp[];
  departmentsTree: UnitTreeNode[];
  accessLogs: AccessLog[];
  roles: RoleOption[];
  initialWidgets: WidgetConfig[];
  isSystemAdmin: boolean;
  isOpsAdmin?: boolean;
  initialAdminMembers: AdminMember[];
  initialRoleAssignedMembers?: any[];
  initialSystemLogs: SystemLog[];
  userId: string;
  userInfo: { name: string; loginName: string; unitName: string; deptName: string } | null;
  isAdmin: boolean;
}

const ICON_PRESETS = [
  'Zap',
  'Calculator',
  'LayoutDashboard',
  'FileText',
  'Activity',
  'Leaf',
  'Clock',
  'Hammer'
];

const APP_COLORS_PRESETS = [
  { value: '#10B981', label: '翡翠绿' },
  { value: '#3B82F6', label: '宝石蓝' },
  { value: '#F59E0B', label: '琥珀黄' },
  { value: '#8B5CF6', label: '丁香紫' },
  { value: '#06B6D4', label: '青蓝色' },
  { value: '#64748B', label: '板岩灰' }
];

const LEGACY_COLOR_HEX: Record<string, string> = {
  emerald: '#10B981',
  blue: '#3B82F6',
  amber: '#F59E0B',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
  slate: '#64748B',
  CarbonPlatform: '#10B981',
  FabFlow: '#3B82F6',
  supos_Kanban: '#F59E0B',
  DocEx: '#8B5CF6',
  WeldSnap: '#06B6D4'
};

const getAppHexColor = (color: string | null | undefined, key: string): string => {
  if (color && color.startsWith('#')) return color;
  return LEGACY_COLOR_HEX[color || ''] || LEGACY_COLOR_HEX[key] || '#64748B';
};

const getRgba = (hex: string, alpha: number) => {
  const cleanHex = hex.startsWith('#') ? hex : '#64748B';
  const r = parseInt(cleanHex.slice(1, 3), 16) || 100;
  const g = parseInt(cleanHex.slice(3, 5), 16) || 116;
  const b = parseInt(cleanHex.slice(5, 7), 16) || 139;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getRoleIconAndBadge = (roleKey: string) => {
  switch (roleKey) {
    case 'leader':
      return { icon: '🌟', badge: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400' };
    case 'operator':
      return { icon: '⚙️', badge: 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400' };
    case 'welder':
      return { icon: '🔧', badge: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30 dark:text-cyan-400' };
    default:
      return { icon: '🏷️', badge: 'bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400' };
  }
};

// 收集当前树节点及其所有子节点的 ID 列表（用于级联勾选）
function getAllDescendantDeptIds(node: DepartmentTreeNode): string[] {
  const ids = [node.id];
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      ids.push(...getAllDescendantDeptIds(child));
    }
  }
  return ids;
}

// 收集某个单位下所有部门的 ID 列表
function getAllDeptIdsInUnit(unit: UnitTreeNode): string[] {
  const ids: string[] = [];
  for (const dept of unit.departments) {
    ids.push(...getAllDescendantDeptIds(dept));
  }
  return ids;
}

export default function AdminAppRegistry({
  initialApps,
  departmentsTree,
  accessLogs,
  roles: initialRoles,
  initialWidgets,
  isSystemAdmin,
  isOpsAdmin,
  initialAdminMembers,
  initialSystemLogs,
  userId,
  userInfo,
  isAdmin
}: AdminAppRegistryProps) {
  const [apps, setApps] = useState<DBApp[]>(initialApps);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(initialWidgets);
  const [adminMembers, setAdminMembers] = useState<AdminMember[]>(initialAdminMembers);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(initialSystemLogs);

  // 业务角色列表状态
  const [rolesList, setRolesList] = useState<RoleOption[]>(initialRoles);
  const [activeRoleId, setActiveRoleId] = useState<string>(initialRoles[0]?.id || '');
  const [roleSearchTerm, setRoleSearchTerm] = useState<string>('');

  // 选定角色的成员列表状态
  const [selectedRoleMembers, setSelectedRoleMembers] = useState<RoleMemberItem[]>([]);
  const [roleMembersLoading, setRoleMembersLoading] = useState(false);
  const [roleMemberKeyword, setRoleMemberKeyword] = useState('');
  const [roleMembersPage, setRoleMembersPage] = useState(1);
  const roleMembersPerPage = 12;

  // 穿梭框/批量添加成员弹窗
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);

  // 管理员特权管理子标签页
  const [permissionSubTab, setPermissionSubTab] = useState<'roles' | 'admins'>('roles');

  // 管理员搜索
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<any[]>([]);
  const [memberSearchLoading, setMemberSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Tab 4 (访问与审计) Sub-tabs: 'access' (用户访问统计) | 'system' (系统审计日志)
  const [statsSubTab, setStatsSubTab] = useState<'access' | 'system'>('access');
  const [systemLogSearch, setSystemLogSearch] = useState('');
  const [systemLogPage, setSystemLogPage] = useState(1);
  const [logTypeFilter, setLogTypeFilter] = useState<string>('all');
  const logsPerPage = 15;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<DBApp | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Unit and Department 2-level selection state for App mainDeptId
  const [selectedUnitId, setSelectedUnitId] = useState('');

  const handleUnitChange = (unitId: string) => {
    setSelectedUnitId(unitId);
    setMainDeptId('');
  };

  const renderIcon = (iconName: string | null, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'Zap':
        return <Zap className={className} />;
      case 'Calculator':
        return <Calculator className={className} />;
      case 'LayoutDashboard':
        return <LayoutDashboard className={className} />;
      case 'FileText':
        return <FileText className={className} />;
      case 'Activity':
        return <Activity className={className} />;
      case 'Leaf':
        return <Leaf className={className} />;
      case 'Clock':
        return <Clock className={className} />;
      case 'Hammer':
        return <Hammer className={className} />;
      default:
        return <LayoutDashboard className={className} />;
    }
  };

  // Theme, Sidebar Collapse & Session logout hooks
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initialTheme = (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
    setTheme(initialTheme);

    const savedCollapse = localStorage.getItem('admin-sidebar-collapsed');
    if (savedCollapse === 'true') {
      setIsSidebarCollapsed(true);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const toggleSidebarCollapse = () => {
    const nextVal = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextVal);
    localStorage.setItem('admin-sidebar-collapsed', String(nextVal));
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (err) {
      console.error('Failed to log out:', err);
      setIsLoggingOut(false);
    }
  };

  // Tab State
  const [activeTab, setActiveTab] = useState<'apps' | 'stats' | 'widgets' | 'members'>('apps');

  // Time Range Filter for stats
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d' | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // App Form State
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('LayoutDashboard');
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [mainDeptId, setMainDeptId] = useState('');
  const [color, setColor] = useState('#10B981');
  const [visibleToAll, setVisibleToAll] = useState(true);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [deptTreeSearch, setDeptTreeSearch] = useState('');
  const [expandedDeptIds, setExpandedDeptIds] = useState<Set<string>>(new Set());

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Widget Form State
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<WidgetConfig | null>(null);
  const [widgetTitle, setWidgetTitle] = useState('');
  const [widgetAppId, setWidgetAppId] = useState('');
  const [widgetType, setWidgetType] = useState('api');
  const [widgetUrl, setWidgetUrl] = useState('');
  const [widgetWidthClass, setWidgetWidthClass] = useState('col-span-1');
  const [widgetSortOrder, setWidgetSortOrder] = useState(0);
  const [widgetError, setWidgetError] = useState('');
  const [widgetSubmitting, setWidgetSubmitting] = useState(false);
  const [isDeletingWidget, setIsDeletingWidget] = useState<string | null>(null);

  // New Role Form State
  const [newRoleKey, setNewRoleKey] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleSubmitting, setNewRoleSubmitting] = useState(false);
  const [newRoleError, setNewRoleError] = useState('');

  // ----------------------------------------------------
  // 加载当前激活角色的成员数据
  // ----------------------------------------------------
  const fetchRoleMembers = async (roleId: string) => {
    if (!roleId) return;
    setRoleMembersLoading(true);
    try {
      const res = await fetch(`/api/admin/roles/${roleId}/members`);
      if (res.ok) {
        const data = await res.json();
        setSelectedRoleMembers(data);
      }
    } catch (err) {
      console.error('Failed to fetch role members:', err);
    } finally {
      setRoleMembersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'members' && permissionSubTab === 'roles' && activeRoleId) {
      fetchRoleMembers(activeRoleId);
      setRoleMemberKeyword('');
      setRoleMembersPage(1);
    }
  }, [activeTab, permissionSubTab, activeRoleId]);

  // 从角色中移除成员
  const handleRemoveMemberFromRole = async (memberId: string, memberName: string) => {
    if (!confirm(`确定要将【${memberName}】从当前角色中移除吗？`)) return;

    try {
      const res = await fetch(`/api/admin/roles/${activeRoleId}/members/${memberId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // 1. 本地即时移除成员
        setSelectedRoleMembers((prev) => prev.filter((m) => m.id !== memberId));
        // 2. 本地即时更新左侧角色的人数
        setRolesList((prev) =>
          prev.map((r) =>
            r.id === activeRoleId ? { ...r, memberCount: Math.max(0, (r.memberCount || 1) - 1) } : r
          )
        );
      } else {
        const err = await res.json();
        alert(err.error || '移除失败');
      }
    } catch (err) {
      console.error('Failed to remove member from role:', err);
      alert('移除失败，请重试');
    }
  };

  // 创建新角色
  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleKey.trim() || !newRoleName.trim()) {
      setNewRoleError('角色标识和角色名称为必填项');
      return;
    }

    setNewRoleSubmitting(true);
    setNewRoleError('');

    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: newRoleKey.trim(),
          name: newRoleName.trim(),
          description: newRoleDesc.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setNewRoleError(data.error || '创建角色失败');
        setNewRoleSubmitting(false);
        return;
      }

      const createdRole = await res.json();
      const newRoleObj: RoleOption = {
        id: createdRole.id,
        key: createdRole.key,
        name: createdRole.name,
        description: createdRole.description || null,
        memberCount: 0,
      };

      setRolesList((prev) => [...prev, newRoleObj]);
      setActiveRoleId(newRoleObj.id);
      setIsCreateRoleModalOpen(false);
      setNewRoleKey('');
      setNewRoleName('');
      setNewRoleDesc('');
    } catch (err: any) {
      setNewRoleError(err.message || '网络异常');
    } finally {
      setNewRoleSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // 编辑与删除业务角色操作
  // ----------------------------------------------------
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState('');
  const [editRoleKey, setEditRoleKey] = useState('');
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDesc, setEditRoleDesc] = useState('');
  const [editRoleSubmitting, setEditRoleSubmitting] = useState(false);
  const [editRoleError, setEditRoleError] = useState('');
  const [isDeletingRole, setIsDeletingRole] = useState(false);

  const openEditRoleModal = (role: RoleOption) => {
    setEditingRoleId(role.id);
    setEditRoleKey(role.key);
    setEditRoleName(role.name);
    setEditRoleDesc(role.description || '');
    setEditRoleError('');
    setIsEditRoleModalOpen(true);
  };

  const handleEditRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRoleKey.trim() || !editRoleName.trim()) {
      setEditRoleError('角色标识和角色名称为必填项');
      return;
    }

    setEditRoleSubmitting(true);
    setEditRoleError('');

    try {
      const res = await fetch(`/api/admin/roles/${editingRoleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: editRoleKey.trim(),
          name: editRoleName.trim(),
          description: editRoleDesc.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setEditRoleError(data.error || '更新角色失败');
        setEditRoleSubmitting(false);
        return;
      }

      const updatedRole = await res.json();
      setRolesList((prev) =>
        prev.map((r) =>
          r.id === editingRoleId
            ? {
                ...r,
                key: updatedRole.key,
                name: updatedRole.name,
                description: updatedRole.description,
              }
            : r
        )
      );

      setIsEditRoleModalOpen(false);
    } catch (err: any) {
      setEditRoleError(err.message || '网络异常');
    } finally {
      setEditRoleSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: RoleOption) => {
    if (
      !confirm(
        `确定要删除业务角色【${role.name} (@${role.key})】吗？\n\n警告：删除后将解除该角色已绑定的所有员工（${role.memberCount || 0}人）及相关应用的角色可见性授权！`
      )
    ) {
      return;
    }

    setIsDeletingRole(true);
    try {
      const res = await fetch(`/api/admin/roles/${role.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || '删除角色失败');
        setIsDeletingRole(false);
        return;
      }

      const remainingRoles = rolesList.filter((r) => r.id !== role.id);
      setRolesList(remainingRoles);

      if (activeRoleId === role.id) {
        setActiveRoleId(remainingRoles[0]?.id || '');
      }
    } catch (err: any) {
      console.error(err);
      alert('删除角色失败');
    } finally {
      setIsDeletingRole(false);
    }
  };

  // ----------------------------------------------------
  // 应用编辑 / 新增 Modal 操作
  // ----------------------------------------------------
  const openAddModal = () => {
    setEditingApp(null);
    setKey('');
    setName('');
    setDescription('');
    setUrl('');
    setIcon('LayoutDashboard');

    const randomColor = APP_COLORS_PRESETS[Math.floor(Math.random() * APP_COLORS_PRESETS.length)].value;
    setColor(randomColor);

    setIsMaintenance(false);
    setSortOrder(0);
    setMainDeptId('');

    const defaultUnit = departmentsTree.find((u) => u.name === '镇海石化建安工程股份有限公司') || departmentsTree[0];
    setSelectedUnitId(defaultUnit ? defaultUnit.id : '');

    setVisibleToAll(true);
    setSelectedRoleIds([]);
    setSelectedDeptIds([]);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (app: DBApp) => {
    setEditingApp(app);
    setKey(app.key);
    setName(app.name);
    setDescription(app.description || '');
    setUrl(app.url);
    setIcon(app.icon || 'LayoutDashboard');
    setColor(getAppHexColor(app.color, app.key));
    setIsMaintenance(app.isMaintenance);
    setSortOrder(app.sortOrder);
    setMainDeptId(app.mainDeptId || '');

    if (app.mainDeptId) {
      const parentUnit = departmentsTree.find((u) =>
        u.departments.some((d) => d.id === app.mainDeptId || getAllDescendantDeptIds(d).includes(app.mainDeptId!))
      );
      setSelectedUnitId(parentUnit ? parentUnit.id : (departmentsTree[0]?.id || ''));
    } else {
      const defaultUnit = departmentsTree.find((u) => u.name === '镇海石化建安工程股份有限公司') || departmentsTree[0];
      setSelectedUnitId(defaultUnit ? defaultUnit.id : '');
    }

    setVisibleToAll(app.visibleToAll);
    setSelectedRoleIds(app.roleIds || []);
    setSelectedDeptIds(app.deptIds || []);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key || !name || !url) {
      setErrorMessage('键标识、应用名称和入口 URL 为必填项');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        key,
        name,
        description,
        url,
        icon,
        color,
        isMaintenance,
        sortOrder,
        mainDeptId: mainDeptId || null,
        visibleToAll,
        roleIds: selectedRoleIds,
        deptIds: selectedDeptIds,
      };

      let res;
      if (editingApp) {
        res = await fetch(`/api/admin/apps/${editingApp.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error || '操作失败');
        setIsSubmitting(false);
        return;
      }

      const savedApp = await res.json();

      if (editingApp) {
        setApps(apps.map((a) => (a.id === editingApp.id ? savedApp : a)));
      } else {
        setApps([...apps, savedApp]);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || '网络错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (appId: string) => {
    if (!confirm('确定要删除此应用吗？此操作无法撤销。')) return;

    setIsDeleting(appId);
    try {
      const res = await fetch(`/api/admin/apps/${appId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setApps(apps.filter((a) => a.id !== appId));
      } else {
        const data = await res.json();
        alert(data.error || '删除失败');
      }
    } catch (err) {
      console.error(err);
      alert('删除失败');
    } finally {
      setIsDeleting(null);
    }
  };

  // 部门树形选择递归级联切换
  const toggleDepartmentSelection = (deptNode: DepartmentTreeNode) => {
    const descendantIds = getAllDescendantDeptIds(deptNode);
    const isNodeSelected = selectedDeptIds.includes(deptNode.id);

    if (isNodeSelected) {
      // 取消选中该节点及其所有子节点
      setSelectedDeptIds((prev) => prev.filter((id) => !descendantIds.includes(id)));
    } else {
      // 级联选中该节点及其所有子节点
      setSelectedDeptIds((prev) => Array.from(new Set([...prev, ...descendantIds])));
    }
  };

  // 单位下全选/取消全选所有部门
  const toggleUnitSelection = (unit: UnitTreeNode) => {
    const unitDeptIds = getAllDeptIdsInUnit(unit);
    const isAllSelected = unitDeptIds.length > 0 && unitDeptIds.every((id) => selectedDeptIds.includes(id));

    if (isAllSelected) {
      setSelectedDeptIds((prev) => prev.filter((id) => !unitDeptIds.includes(id)));
    } else {
      setSelectedDeptIds((prev) => Array.from(new Set([...prev, ...unitDeptIds])));
    }
  };

  // 角色复选切换
  const toggleRoleSelection = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  // ----------------------------------------------------
  // 管理员特权分配检索与更新
  // ----------------------------------------------------
  const triggerMemberSearch = (query: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query.trim()) {
      setMemberSearchResults([]);
      return;
    }

    setMemberSearchLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/members?search=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setMemberSearchResults(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setMemberSearchLoading(false);
      }
    }, 300);
  };

  const handleUpdateAdminType = async (memberId: string, newType: string) => {
    try {
      const res = await fetch('/api/admin/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, adminType: newType }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAdminMembers((prev) => {
          const exists = prev.some((m) => m.id === memberId);
          if (newType === 'NONE') {
            return prev.filter((m) => m.id !== memberId);
          }
          const formatted: AdminMember = {
            id: updated.id,
            name: updated.name,
            loginName: updated.loginName,
            adminType: updated.adminType,
            deptName: updated.department?.name || '无部门',
            unitName: updated.unit?.name || '无单位',
          };
          if (exists) {
            return prev.map((m) => (m.id === memberId ? formatted : m));
          } else {
            return [...prev, formatted];
          }
        });
        setMemberSearchResults((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, adminType: newType } : m))
        );
      } else {
        const err = await res.json();
        alert(err.error || '更新管理员权限失败');
      }
    } catch (err) {
      console.error(err);
      alert('更新管理员权限失败');
    }
  };

  // ----------------------------------------------------
  // Widget Form
  // ----------------------------------------------------
  const openAddWidgetModal = () => {
    setEditingWidget(null);
    setWidgetTitle('');
    setWidgetAppId('');
    setWidgetType('api');
    setWidgetUrl('');
    setWidgetWidthClass('col-span-1');
    setWidgetSortOrder(0);
    setWidgetError('');
    setIsWidgetModalOpen(true);
  };

  const openEditWidgetModal = (w: WidgetConfig) => {
    setEditingWidget(w);
    setWidgetTitle(w.title);
    setWidgetAppId(w.appId || '');
    setWidgetType(w.type);
    setWidgetUrl(w.url);
    setWidgetWidthClass(w.widthClass);
    setWidgetSortOrder(w.sortOrder);
    setWidgetError('');
    setIsWidgetModalOpen(true);
  };

  const handleWidgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!widgetTitle.trim() || !widgetUrl.trim()) {
      setWidgetError('组件标题与嵌入URL为必填项');
      return;
    }
    setWidgetSubmitting(true);
    setWidgetError('');

    try {
      const payload = {
        title: widgetTitle.trim(),
        appId: widgetAppId || null,
        type: widgetType,
        url: widgetUrl.trim(),
        widthClass: widgetWidthClass,
        sortOrder: widgetSortOrder,
      };

      let res;
      if (editingWidget) {
        res = await fetch(`/api/admin/widgets/${editingWidget.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/widgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        setWidgetError(data.error || '保存组件失败');
        setWidgetSubmitting(false);
        return;
      }

      const saved = await res.json();
      const formatted: WidgetConfig = {
        id: saved.id,
        title: saved.title,
        appId: saved.appId || null,
        appName: saved.app?.name || null,
        type: saved.type,
        url: saved.url,
        widthClass: saved.widthClass,
        sortOrder: saved.sortOrder,
      };

      if (editingWidget) {
        setWidgets(widgets.map((w) => (w.id === editingWidget.id ? formatted : w)));
      } else {
        setWidgets([...widgets, formatted]);
      }
      setIsWidgetModalOpen(false);
    } catch (err: any) {
      setWidgetError(err.message || '网络错误');
    } finally {
      setWidgetSubmitting(false);
    }
  };

  const handleDeleteWidget = async (widgetId: string) => {
    if (!confirm('确定要移除此 Widget 组件吗？')) return;
    setIsDeletingWidget(widgetId);
    try {
      const res = await fetch(`/api/admin/widgets/${widgetId}`, { method: 'DELETE' });
      if (res.ok) {
        setWidgets(widgets.filter((w) => w.id !== widgetId));
      } else {
        alert('删除失败');
      }
    } catch (err) {
      console.error(err);
      alert('删除失败');
    } finally {
      setIsDeletingWidget(null);
    }
  };

  // ----------------------------------------------------
  // 过滤计算
  // ----------------------------------------------------
  const filteredRoles = useMemo(() => {
    if (!roleSearchTerm.trim()) return rolesList;
    const term = roleSearchTerm.trim().toLowerCase();
    return rolesList.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.key.toLowerCase().includes(term) ||
        (r.description && r.description.toLowerCase().includes(term))
    );
  }, [rolesList, roleSearchTerm]);

  const activeRole = useMemo(() => {
    return rolesList.find((r) => r.id === activeRoleId) || rolesList[0] || null;
  }, [rolesList, activeRoleId]);

  const filteredActiveRoleMembers = useMemo(() => {
    if (!roleMemberKeyword.trim()) return selectedRoleMembers;
    const kw = roleMemberKeyword.trim().toLowerCase();
    return selectedRoleMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(kw) ||
        m.loginName.toLowerCase().includes(kw) ||
        (m.code && m.code.toLowerCase().includes(kw)) ||
        m.deptName.toLowerCase().includes(kw) ||
        m.unitName.toLowerCase().includes(kw)
    );
  }, [selectedRoleMembers, roleMemberKeyword]);

  const paginatedRoleMembers = useMemo(() => {
    const start = (roleMembersPage - 1) * roleMembersPerPage;
    return filteredActiveRoleMembers.slice(start, start + roleMembersPerPage);
  }, [filteredActiveRoleMembers, roleMembersPage]);

  const totalRoleMemberPages = Math.ceil(filteredActiveRoleMembers.length / roleMembersPerPage) || 1;

  // 访问日志过滤
  const filteredAccessLogs = useMemo(() => {
    const now = new Date().getTime();
    return accessLogs.filter((log) => {
      const logTime = new Date(log.timestamp).getTime();
      if (timeFilter === '24h') return now - logTime <= 24 * 60 * 60 * 1000;
      if (timeFilter === '7d') return now - logTime <= 7 * 24 * 60 * 60 * 1000;
      if (timeFilter === '30d') return now - logTime <= 30 * 24 * 60 * 60 * 1000;
      return true;
    });
  }, [accessLogs, timeFilter]);

  const paginatedAccessLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAccessLogs.slice(start, start + itemsPerPage);
  }, [filteredAccessLogs, currentPage]);

  const totalPages = Math.ceil(filteredAccessLogs.length / itemsPerPage) || 1;

  // 系统审计日志过滤
  const filteredSystemLogs = useMemo(() => {
    return systemLogs.filter((log) => {
      if (logTypeFilter !== 'all' && log.actionType !== logTypeFilter) return false;
      if (systemLogSearch.trim()) {
        const kw = systemLogSearch.trim().toLowerCase();
        const matchUser = log.userName && log.userName.toLowerCase().includes(kw);
        const matchLogin = log.loginName.toLowerCase().includes(kw);
        const matchDetail = log.detail.toLowerCase().includes(kw);
        const matchIp = log.ip && log.ip.toLowerCase().includes(kw);
        return matchUser || matchLogin || matchDetail || matchIp;
      }
      return true;
    });
  }, [systemLogs, logTypeFilter, systemLogSearch]);

  const paginatedSystemLogs = useMemo(() => {
    const start = (systemLogPage - 1) * logsPerPage;
    return filteredSystemLogs.slice(start, start + logsPerPage);
  }, [filteredSystemLogs, systemLogPage]);

  const totalLogPages = Math.ceil(filteredSystemLogs.length / logsPerPage) || 1;

  return (
    <div className="h-screen overflow-hidden bg-canvas text-text-main flex flex-col md:flex-row antialiased font-sans">
      {/* Sidebar Navigation */}
      <div
        className={`${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        } h-full shrink-0 bg-sidebar border-r border-card-border p-4 flex flex-col justify-between transition-all duration-300 z-30 shadow-md overflow-y-auto`}
      >
        <div className="flex flex-col gap-6">
          {/* Brand Header */}
          <div className={`flex items-center gap-3 px-2 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-zpje-accent flex items-center justify-center text-white font-bold shadow-md shadow-zpje-accent/20 shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-title text-base tracking-tight truncate">
                  Omni 管理后台
                </span>
                <span className="text-[10px] text-text-sec font-mono truncate">
                  Enterprise Center
                </span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <button
              onClick={() => setActiveTab('apps')}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-300 text-left cursor-pointer ${
                isSidebarCollapsed ? 'justify-center' : ''
              } ${
                activeTab === 'apps'
                  ? 'bg-zpje-accent border-transparent text-white shadow-sm'
                  : 'bg-transparent border-transparent text-text-sec hover:text-title hover:bg-sidebar-hover'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span className="ml-3 truncate">应用管理中心</span>}
            </button>

            <button
              onClick={() => setActiveTab('widgets')}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-300 text-left cursor-pointer ${
                isSidebarCollapsed ? 'justify-center' : ''
              } ${
                activeTab === 'widgets'
                  ? 'bg-zpje-accent border-transparent text-white shadow-sm'
                  : 'bg-transparent border-transparent text-text-sec hover:text-title hover:bg-sidebar-hover'
              }`}
            >
              <Layers className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span className="ml-3 truncate">Widget 卡片配置</span>}
            </button>

            {(isSystemAdmin || isOpsAdmin) && (
              <button
                onClick={() => setActiveTab('members')}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-300 text-left cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center' : ''
                } ${
                  activeTab === 'members'
                    ? 'bg-zpje-accent border-transparent text-white shadow-sm'
                    : 'bg-transparent border-transparent text-text-sec hover:text-title hover:bg-sidebar-hover'
                }`}
              >
                <Shield className="h-4 w-4 shrink-0" />
                {!isSidebarCollapsed && <span className="ml-3 truncate">权限与角色分配</span>}
              </button>
            )}

            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-300 text-left cursor-pointer ${
                isSidebarCollapsed ? 'justify-center' : ''
              } ${
                activeTab === 'stats'
                  ? 'bg-zpje-accent border-transparent text-white shadow-sm'
                  : 'bg-transparent border-transparent text-text-sec hover:text-title hover:bg-sidebar-hover'
              }`}
            >
              <BarChart3 className="h-4 w-4 shrink-0" />
              {!isSidebarCollapsed && <span className="ml-3 truncate">访问与审计统计</span>}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="flex flex-col gap-2 pt-4 border-t border-card-border">
          <button
            onClick={toggleSidebarCollapse}
            className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg text-text-sec hover:text-title hover:bg-sidebar-hover transition-colors cursor-pointer ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span>收起侧边栏</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-canvas">
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-16 bg-card-surface/80 backdrop-blur-md border-b border-card-border px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-title">
              {activeTab === 'apps' && '应用管理中心'}
              {activeTab === 'widgets' && 'Widget 卡片配置'}
              {activeTab === 'members' && '权限与角色分配中心'}
              {activeTab === 'stats' && '访问与系统审计'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Return to Portal Frontpage */}
            <a
              href="/"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-card-border bg-card-surface hover:bg-sidebar-hover text-text-sec hover:text-title text-xs font-semibold transition-colors shadow-xs"
              title="返回门户前台"
            >
              <Home className="w-4 h-4 text-zpje-accent" />
              <span className="hidden sm:inline">返回门户前台</span>
            </a>

            {/* Theme Switcher */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl border border-card-border bg-card-surface hover:bg-sidebar-hover text-text-sec hover:text-title transition-colors cursor-pointer shadow-xs"
                title={theme === 'dark' ? '切换为亮色模式' : '切换为暗色模式'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
            )}

            {/* Current User Info */}
            <div className="flex items-center gap-2 pl-3 border-l border-card-border">
              <div className="w-8 h-8 rounded-full bg-zpje-accent/10 border border-zpje-accent/20 flex items-center justify-center text-zpje-accent font-bold text-xs">
                {userInfo?.name ? userInfo.name.charAt(0) : <User className="w-4 h-4" />}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-title leading-none">{userInfo?.name || userId}</span>
                <span className="text-[10px] text-text-sec leading-none mt-1">{userInfo?.deptName || '系统管理员'}</span>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="ml-2 p-1.5 rounded-lg text-text-sec hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="登出账号"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="p-6 flex-1 flex flex-col gap-6 max-w-7xl w-full mx-auto">
          {/* ========================================================================= */}
          {/* Tab 1: 应用管理中心 */}
          {/* ========================================================================= */}
          {activeTab === 'apps' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-title">已发布数字化应用 ({apps.length})</h2>
                  <p className="text-xs text-text-sec mt-0.5">
                    维护全司单点登录安全网关应用、主题配色及 RBAC 可见性隔离规则
                  </p>
                </div>
                <button
                  onClick={openAddModal}
                  className="px-4 py-2 rounded-xl bg-zpje-accent text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-zpje-accent/20 hover:opacity-90 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>新增应用</span>
                </button>
              </div>

              {/* Apps Table */}
              <div className="bg-card-surface border border-card-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-sidebar-hover/40 border-b border-card-border text-text-sec font-semibold">
                        <th className="p-3.5 w-16 text-center">图标</th>
                        <th className="p-3.5">应用名称 / 唯一键</th>
                        <th className="p-3.5">所属单位与主部门</th>
                        <th className="p-3.5">访问权限策略</th>
                        <th className="p-3.5 w-24 text-center">运行状态</th>
                        <th className="p-3.5 w-20 text-center">排序</th>
                        <th className="p-3.5 w-28 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border">
                      {apps.map((app) => {
                        const hex = getAppHexColor(app.color, app.key);
                        return (
                          <tr key={app.id} className="hover:bg-sidebar-hover/20 transition-colors">
                            <td className="p-3.5 text-center">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto border"
                                style={{
                                  backgroundColor: getRgba(hex, 0.12),
                                  borderColor: getRgba(hex, 0.3),
                                  color: hex,
                                }}
                              >
                                {renderIcon(app.icon, 'w-4 h-4')}
                              </div>
                            </td>
                            <td className="p-3.5">
                              <div className="font-bold text-title text-sm">{app.name}</div>
                              <div className="text-[10px] text-text-sec font-mono mt-0.5">@{app.key}</div>
                              <div className="text-[10px] text-text-sec/80 truncate max-w-xs mt-0.5" title={app.url}>
                                {app.url}
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] bg-sidebar-hover text-text-sec border border-card-border">
                                {app.mainDept?.name || '全司共享'}
                              </span>
                            </td>
                            <td className="p-3.5">
                              {app.visibleToAll ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400">
                                  <Eye className="w-3 h-3" /> 全员免检可见
                                </span>
                              ) : (
                                <div className="flex flex-wrap items-center gap-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:text-amber-400">
                                    <Shield className="w-3 h-3" /> 指定范围
                                  </span>
                                  {app.roleIds && app.roleIds.length > 0 && (
                                    <span className="text-[10px] text-text-sec">
                                      {app.roleIds.length} 个角色
                                    </span>
                                  )}
                                  {app.deptIds && app.deptIds.length > 0 && (
                                    <span className="text-[10px] text-text-sec">
                                      · {app.deptIds.length} 个部门
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="p-3.5 text-center">
                              {app.isMaintenance ? (
                                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                                  维护中
                                </span>
                              ) : (
                                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400">
                                  正常运行
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-center font-mono text-text-sec font-bold">
                              {app.sortOrder}
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openEditModal(app)}
                                  className="p-1.5 rounded-lg border border-input-border bg-card-surface hover:bg-sidebar-hover text-text-sec hover:text-title transition-colors cursor-pointer"
                                  title="编辑应用"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(app.id)}
                                  disabled={isDeleting === app.id}
                                  className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer disabled:opacity-50"
                                  title="删除应用"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* Tab 2: Widget 卡片配置 */}
          {/* ========================================================================= */}
          {activeTab === 'widgets' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-title">首页 Widget 卡片配置 ({widgets.length})</h2>
                  <p className="text-xs text-text-sec mt-0.5">
                    配置首页快捷微应用卡片与数据图表插件
                  </p>
                </div>
                <button
                  onClick={openAddWidgetModal}
                  className="px-4 py-2 rounded-xl bg-zpje-accent text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-zpje-accent/20 hover:opacity-90 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>新增 Widget</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {widgets.map((w) => (
                  <div
                    key={w.id}
                    className="p-5 rounded-2xl border border-card-border bg-card-surface shadow-sm flex flex-col justify-between gap-4 hover:border-zpje-accent transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-title text-sm">{w.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sidebar-hover text-text-sec border border-card-border">
                          {w.type}
                        </span>
                      </div>
                      <div className="text-[10px] text-text-sec font-mono mt-2 truncate" title={w.url}>
                        {w.url}
                      </div>
                      <div className="flex items-center gap-2 mt-3 text-xs text-text-sec">
                        <span>关联应用: {w.appName || '无'}</span>
                        <span>·</span>
                        <span className="font-mono">排序: {w.sortOrder}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-card-border">
                      <button
                        onClick={() => openEditWidgetModal(w)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-input-border hover:bg-sidebar-hover text-title transition-colors cursor-pointer"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteWidget(w.id)}
                        disabled={isDeletingWidget === w.id}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* Tab 3: 权限与角色分配 (Master-Detail 重构架构) */}
          {/* ========================================================================= */}
          {activeTab === 'members' && (isSystemAdmin || isOpsAdmin) && (
            <div className="flex flex-col gap-6">
              {/* Permission & Role Sub-tabs Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-card-border pb-3 shrink-0">
                <div className="flex border-b-2 border-transparent gap-6">
                  <button
                    onClick={() => setPermissionSubTab('roles')}
                    className={`pb-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                      permissionSubTab === 'roles'
                        ? 'border-zpje-accent text-zpje-accent'
                        : 'border-transparent text-text-sec hover:text-title'
                    }`}
                  >
                    业务角色分配 (前台应用可见性)
                  </button>
                  {isSystemAdmin && (
                    <button
                      onClick={() => setPermissionSubTab('admins')}
                      className={`pb-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                        permissionSubTab === 'admins'
                          ? 'border-zpje-accent text-zpje-accent'
                          : 'border-transparent text-text-sec hover:text-title'
                      }`}
                    >
                      管理员特权分配 (后台管理授权)
                    </button>
                  )}
                </div>

                <p className="text-xs text-text-sec">
                  {permissionSubTab === 'roles'
                    ? '控制员工前台可见应用组（如领导、高级操作员、管道质检组等）。普通员工为默认底色无需建组。'
                    : '管理后台特权分级（系统管理员、运维管理员、部门管理员），仅系统管理员可配置。'}
                </p>
              </div>

              {permissionSubTab === 'roles' ? (
                // ----------------------------------------------------
                // Master-Detail 左右分栏角色中心
                // ----------------------------------------------------
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Col (Master): 角色列表侧栏 */}
                  <div className="lg:col-span-4 bg-card-surface border border-card-border rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-card-border">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-zpje-accent" />
                        <span className="font-bold text-title text-sm">业务角色</span>
                        <span className="text-[10px] text-text-sec font-mono">({rolesList.length})</span>
                      </div>
                      <button
                        onClick={() => {
                          setNewRoleKey('');
                          setNewRoleName('');
                          setNewRoleDesc('');
                          setNewRoleError('');
                          setIsCreateRoleModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zpje-accent/10 border border-zpje-accent/30 text-zpje-accent text-xs font-bold hover:bg-zpje-accent hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>新建角色</span>
                      </button>
                    </div>

                    {/* Role Search Box */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-sec" />
                      <input
                        type="text"
                        placeholder="搜索角色名称或标识..."
                        value={roleSearchTerm}
                        onChange={(e) => setRoleSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-canvas border border-input-border text-title text-xs focus:outline-none focus:ring-1 focus:ring-zpje-accent"
                      />
                    </div>

                    {/* Roles Card List */}
                    <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-0.5">
                      {filteredRoles.length > 0 ? (
                        filteredRoles.map((role) => {
                          const isActive = activeRole?.id === role.id;
                          const { icon, badge } = getRoleIconAndBadge(role.key);
                          return (
                            <div
                              key={role.id}
                              onClick={() => setActiveRoleId(role.id)}
                              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                                isActive
                                  ? 'bg-zpje-accent/10 border-zpje-accent ring-1 ring-zpje-accent shadow-xs'
                                  : 'bg-canvas border-card-border hover:border-zpje-accent/50 hover:bg-sidebar-hover/40'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-base shrink-0">{icon}</span>
                                  <span className="font-bold text-title text-xs truncate">{role.name}</span>
                                  <span className="text-[10px] text-text-sec font-mono truncate">@{role.key}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${badge}`}>
                                  {role.memberCount || 0} 人
                                </span>
                              </div>
                              {role.description && (
                                <p className="text-[11px] text-text-sec line-clamp-2 leading-relaxed">
                                  {role.description}
                                </p>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-xs text-text-sec italic">
                          未找到匹配的角色
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Col (Detail): 选定角色的成员工作区 */}
                  <div className="lg:col-span-8 bg-card-surface border border-card-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
                    {/* Header Banner */}
                    <div className="p-4 border-b border-card-border bg-sidebar-hover/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{activeRole ? getRoleIconAndBadge(activeRole.key).icon : '🌟'}</span>
                          <h3 className="font-extrabold text-title text-sm">
                            【{activeRole?.name} ({activeRole?.key})】成员列表
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zpje-accent/10 text-zpje-accent border border-zpje-accent/20">
                            共 {selectedRoleMembers.length} 人
                          </span>
                        </div>
                        <p className="text-xs text-text-sec mt-1">
                          {activeRole?.description || '暂无业务职责描述。该角色绑定的员工在前台将解锁对应业务应用的访问权限。'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {activeRole && (
                          <>
                            <button
                              onClick={() => openEditRoleModal(activeRole)}
                              className="px-3 py-2 rounded-xl border border-input-border bg-card-surface text-title hover:bg-sidebar-hover text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                              title="编辑角色信息 (标识 / 名称 / 描述)"
                            >
                              <Edit className="w-3.5 h-3.5 text-text-sec" />
                              <span>编辑角色</span>
                            </button>

                            <button
                              onClick={() => handleDeleteRole(activeRole)}
                              disabled={isDeletingRole}
                              className="px-3 py-2 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                              title="删除此业务角色"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>删除角色</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setIsAddMemberModalOpen(true)}
                          disabled={!activeRole}
                          className="px-3.5 py-2 rounded-xl bg-zpje-accent text-white text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-zpje-accent/20 cursor-pointer shrink-0 disabled:opacity-50"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>批量添加成员</span>
                        </button>
                      </div>
                    </div>

                    {/* Search in Members Table */}
                    <div className="p-3 border-b border-card-border bg-card-surface flex items-center justify-between gap-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-sec" />
                        <input
                          type="text"
                          placeholder="过滤当前角色的成员 (姓名/账号/部门)..."
                          value={roleMemberKeyword}
                          onChange={(e) => {
                            setRoleMemberKeyword(e.target.value);
                            setRoleMembersPage(1);
                          }}
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-canvas border border-input-border text-title text-xs focus:outline-none focus:ring-1 focus:ring-zpje-accent"
                        />
                      </div>
                      <span className="text-xs text-text-sec font-mono">
                        匹配到 {filteredActiveRoleMembers.length} 人
                      </span>
                    </div>

                    {/* Members Table */}
                    <div className="overflow-x-auto min-h-[350px]">
                      {roleMembersLoading ? (
                        <div className="text-center py-16 text-xs text-text-sec animate-pulse">
                          正在加载角色成员列表...
                        </div>
                      ) : paginatedRoleMembers.length > 0 ? (
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-sidebar-hover/30 border-b border-card-border text-text-sec font-semibold">
                              <th className="p-3 w-36">员工姓名</th>
                              <th className="p-3 w-36 font-mono">登录账号 / 工号</th>
                              <th className="p-3">所属单位与部门</th>
                              <th className="p-3 w-32 font-mono">加入时间</th>
                              <th className="p-3 w-24 text-right">操作</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-card-border">
                            {paginatedRoleMembers.map((member) => (
                              <tr key={member.id} className="hover:bg-sidebar-hover/20 transition-colors">
                                <td className="p-3 font-bold text-title">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-sidebar-hover flex items-center justify-center text-[10px] text-text-sec">
                                      {member.name.charAt(0)}
                                    </div>
                                    <span>{member.name}</span>
                                  </div>
                                </td>
                                <td className="p-3 font-mono text-text-sec">
                                  <div>@{member.loginName}</div>
                                  {member.code && (
                                    <div className="text-[10px] text-text-sec/60">{member.code}</div>
                                  )}
                                </td>
                                <td className="p-3 text-text-sec">
                                  <div className="font-medium text-title">{member.deptName}</div>
                                  <div className="text-[10px] text-text-sec/70">{member.unitName}</div>
                                </td>
                                <td className="p-3 text-text-sec font-mono text-[10px]">
                                  {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '-'}
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => handleRemoveMemberFromRole(member.id, member.name)}
                                    className="px-2 py-1 rounded text-red-500 hover:bg-red-500/10 font-medium transition-colors cursor-pointer text-xs"
                                  >
                                    移除角色
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-center py-16 text-xs text-text-sec italic flex flex-col items-center gap-2">
                          <Users className="w-8 h-8 text-text-sec/40" />
                          <span>当前角色暂未分配成员</span>
                          <button
                            onClick={() => setIsAddMemberModalOpen(true)}
                            className="mt-1 text-xs text-zpje-accent hover:underline font-bold"
                          >
                            立即点击批量添加成员
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Pagination */}
                    {totalRoleMemberPages > 1 && (
                      <div className="p-3 border-t border-card-border bg-sidebar-hover/10 flex items-center justify-between text-xs">
                        <span className="text-text-sec">
                          显示第 {(roleMembersPage - 1) * roleMembersPerPage + 1} 到{' '}
                          {Math.min(roleMembersPage * roleMembersPerPage, filteredActiveRoleMembers.length)} 条，共{' '}
                          {filteredActiveRoleMembers.length} 条
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setRoleMembersPage((p) => Math.max(1, p - 1))}
                            disabled={roleMembersPage === 1}
                            className="p-1.5 rounded border border-input-border bg-card-surface hover:bg-sidebar-hover disabled:opacity-40 disabled:cursor-not-allowed text-title"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 font-bold text-title">
                            {roleMembersPage} / {totalRoleMemberPages}
                          </span>
                          <button
                            onClick={() => setRoleMembersPage((p) => Math.min(totalRoleMemberPages, p + 1))}
                            disabled={roleMembersPage === totalRoleMemberPages}
                            className="p-1.5 rounded border border-input-border bg-card-surface hover:bg-sidebar-hover disabled:opacity-40 disabled:cursor-not-allowed text-title"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // ----------------------------------------------------
                // 管理员特权分配 (SYS_ADMIN)
                // ----------------------------------------------------
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
                  <div className="bg-card-surface border border-card-border p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
                    <h4 className="font-bold text-title text-sm border-b border-card-border pb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-zpje-brand" />
                      检索在职员工并赋予特权
                    </h4>

                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-sec" />
                        <input
                          type="text"
                          placeholder="输入姓名、工号或账号搜索..."
                          value={memberSearch}
                          onChange={(e) => {
                            setMemberSearch(e.target.value);
                            triggerMemberSearch(e.target.value);
                          }}
                          className="w-full pl-9 pr-4 py-2 rounded-xl bg-canvas border border-input-border text-title text-xs focus:outline-none focus:ring-1 focus:ring-title"
                        />
                      </div>

                      {memberSearchLoading ? (
                        <div className="text-center py-6 text-xs text-text-sec animate-pulse">正在查找在职员工...</div>
                      ) : memberSearchResults.length > 0 ? (
                        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto border border-card-border rounded-xl p-2.5 bg-sidebar-hover/10">
                          {memberSearchResults.map((m) => (
                            <div
                              key={m.id}
                              className="p-3 rounded-xl bg-card-surface border border-card-border flex flex-col gap-2 shadow-xs"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-title text-xs">{m.name}</div>
                                  <div className="text-[10px] text-text-sec font-mono">@{m.loginName}</div>
                                </div>
                                <span className="text-[10px] text-text-sec/80 bg-sidebar-hover px-2 py-0.5 rounded truncate max-w-[120px]">
                                  {m.department?.name || '无部门'}
                                </span>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-card-border/60">
                                <span className="text-[10px] text-text-sec font-bold">特权级别:</span>
                                <select
                                  value={m.adminType || 'NONE'}
                                  onChange={(e) => handleUpdateAdminType(m.id, e.target.value)}
                                  className="px-2 py-1 rounded text-[11px] font-bold border border-input-border bg-card-surface text-title focus:outline-none focus:ring-1 focus:ring-title cursor-pointer"
                                >
                                  <option value="NONE">普通成员 (无特权)</option>
                                  <option value="SYS_ADMIN">系统管理员 (最高特权)</option>
                                  <option value="OPS_ADMIN">运维管理员 (常规特权)</option>
                                  <option value="DEPT_ADMIN">部门管理员 (部门维护)</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : memberSearch.trim() !== '' ? (
                        <div className="text-center py-6 text-xs text-text-sec italic">未找到匹配的在职员工</div>
                      ) : (
                        <div className="text-center py-6 text-[10px] text-text-sec italic">
                          在上方输入字符即可检索 6000+ OA 关联员工并进行管理员授权
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Col: 特权管理员列表 */}
                  <div className="lg:col-span-2 bg-card-surface border border-card-border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="p-4 border-b border-card-border bg-sidebar-hover/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-zpje-brand" />
                          <span className="font-bold text-title text-sm">已配置特权管理员清单</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sidebar-hover text-text-sec border border-card-border">
                            {adminMembers.length} 人
                          </span>
                        </div>
                        <p className="text-[11px] text-text-sec">管理后台权限即时生效</p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-sidebar-hover/40 border-b border-card-border text-text-sec font-semibold font-mono">
                              <th className="p-3">姓名 (账号)</th>
                              <th className="p-3">所属单位与部门</th>
                              <th className="p-3">特权类型</th>
                              <th className="p-3 w-28 text-right">操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminMembers.map((m) => (
                              <tr key={m.id} className="border-b border-card-border hover:bg-sidebar-hover/20 transition-colors">
                                <td className="p-3">
                                  <div className="font-bold text-title text-xs">{m.name}</div>
                                  <div className="text-[10px] font-mono text-text-sec">@{m.loginName}</div>
                                </td>
                                <td className="p-3 text-text-sec">
                                  <div>{m.deptName}</div>
                                  <div className="text-[10px] text-text-sec/60">{m.unitName}</div>
                                </td>
                                <td className="p-3">
                                  <select
                                    value={m.adminType}
                                    onChange={(e) => handleUpdateAdminType(m.id, e.target.value)}
                                    className="px-2 py-1 rounded text-xs font-bold border border-input-border bg-card-surface text-title focus:outline-none focus:ring-1 focus:ring-title cursor-pointer"
                                  >
                                    <option value="SYS_ADMIN">系统管理员</option>
                                    <option value="OPS_ADMIN">运维管理员</option>
                                    <option value="DEPT_ADMIN">部门管理员</option>
                                    <option value="NONE">移除特权 (降为普通成员)</option>
                                  </select>
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => handleUpdateAdminType(m.id, 'NONE')}
                                    className="px-2.5 py-1 text-xs text-red-500 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                                  >
                                    移除特权
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* Tab 4: 访问与审计统计 */}
          {/* ========================================================================= */}
          {activeTab === 'stats' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-card-border pb-3">
                <div className="flex border-b-2 border-transparent gap-6">
                  <button
                    onClick={() => setStatsSubTab('access')}
                    className={`pb-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                      statsSubTab === 'access'
                        ? 'border-zpje-accent text-zpje-accent'
                        : 'border-transparent text-text-sec hover:text-title'
                    }`}
                  >
                    子系统访问统计
                  </button>
                  <button
                    onClick={() => setStatsSubTab('system')}
                    className={`pb-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                      statsSubTab === 'system'
                        ? 'border-zpje-accent text-zpje-accent'
                        : 'border-transparent text-text-sec hover:text-title'
                    }`}
                  >
                    系统审计日志
                  </button>
                </div>

                {/* Sub-tab Filters */}
                {statsSubTab === 'access' ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-sec font-semibold">时间跨度:</span>
                    <div className="flex items-center rounded-xl bg-card-surface border border-card-border p-1">
                      {(['all', '24h', '7d', '30d'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => {
                            setTimeFilter(filter);
                            setCurrentPage(1);
                          }}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            timeFilter === filter
                              ? 'bg-zpje-accent text-white shadow-xs'
                              : 'text-text-sec hover:text-title'
                          }`}
                        >
                          {filter === 'all' && '全部'}
                          {filter === '24h' && '24小时'}
                          {filter === '7d' && '7天'}
                          {filter === '30d' && '30天'}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-sec" />
                      <input
                        type="text"
                        placeholder="搜索操作人、详情或IP..."
                        value={systemLogSearch}
                        onChange={(e) => {
                          setSystemLogSearch(e.target.value);
                          setSystemLogPage(1);
                        }}
                        className="pl-8 pr-3 py-1.5 rounded-xl bg-card-surface border border-input-border text-title text-xs focus:outline-none focus:ring-1 focus:ring-zpje-accent"
                      />
                    </div>
                    <select
                      value={logTypeFilter}
                      onChange={(e) => {
                        setLogTypeFilter(e.target.value);
                        setSystemLogPage(1);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-card-surface border border-input-border text-title text-xs font-medium focus:outline-none focus:ring-1 focus:ring-zpje-accent cursor-pointer"
                    >
                      <option value="all">全部操作类型</option>
                      <option value="SSO_LOGIN">SSO_LOGIN (单点登录)</option>
                      <option value="LOGOUT">LOGOUT (退出登录)</option>
                      <option value="APP_ACCESS">APP_ACCESS (访问应用)</option>
                      <option value="APP_MANAGE">APP_MANAGE (应用管理)</option>
                      <option value="WIDGET_MANAGE">WIDGET_MANAGE (看板管理)</option>
                      <option value="ADMIN_MANAGE">ADMIN_MANAGE (特权管理)</option>
                      <option value="ROLE_MANAGE">ROLE_MANAGE (业务角色)</option>
                    </select>
                  </div>
                )}
              </div>

              {statsSubTab === 'access' ? (
                // 访问统计
                <div className="bg-card-surface border border-card-border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between min-h-[400px]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-sidebar-hover/40 border-b border-card-border text-text-sec font-semibold">
                          <th className="p-3 w-40">访问时间</th>
                          <th className="p-3 w-40">访问人员</th>
                          <th className="p-3">目标应用</th>
                          <th className="p-3 w-32">来源 IP</th>
                          <th className="p-3 w-48">客户端环境</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-card-border">
                        {paginatedAccessLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-sidebar-hover/20 transition-colors">
                            <td className="p-3 text-text-sec font-mono">
                              {new Date(log.timestamp).toLocaleString('zh-CN', { hour12: false })}
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-title">{log.userName || log.loginName}</div>
                              <div className="text-[10px] text-text-sec font-mono">@{log.loginName}</div>
                            </td>
                            <td className="p-3 font-semibold text-title">{log.app?.name}</td>
                            <td className="p-3 text-text-sec font-mono">{log.ip || '-'}</td>
                            <td className="p-3 text-text-sec truncate max-w-xs" title={log.userAgent || ''}>
                              {log.userAgent || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination for Access Logs */}
                  <div className="p-3.5 border-t border-card-border bg-sidebar-hover/10 flex items-center justify-between text-xs">
                    <span className="text-text-sec font-medium">
                      {filteredAccessLogs.length > 0
                        ? `显示第 ${(currentPage - 1) * itemsPerPage + 1} 到 ${Math.min(
                            currentPage * itemsPerPage,
                            filteredAccessLogs.length
                          )} 条，共 ${filteredAccessLogs.length} 条访问记录`
                        : '暂无访问记录'}
                    </span>
                    {totalPages > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-1.5 rounded-lg border border-input-border bg-card-surface hover:bg-sidebar-hover disabled:opacity-40 disabled:cursor-not-allowed text-title cursor-pointer"
                          title="上一页"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 font-bold text-title font-mono">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="p-1.5 rounded-lg border border-input-border bg-card-surface hover:bg-sidebar-hover disabled:opacity-40 disabled:cursor-not-allowed text-title cursor-pointer"
                          title="下一页"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // 系统审计日志
                <div className="bg-card-surface border border-card-border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between min-h-[400px]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-sidebar-hover/40 border-b border-card-border text-text-sec font-semibold">
                          <th className="p-3 w-40">发生时间</th>
                          <th className="p-3 w-36">操作人</th>
                          <th className="p-3 w-32">操作类型</th>
                          <th className="p-3">日志详情</th>
                          <th className="p-3 w-32">IP 地址</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-card-border">
                        {paginatedSystemLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-sidebar-hover/20 transition-colors">
                            <td className="p-3 text-text-sec font-mono">
                              {new Date(log.timestamp).toLocaleString('zh-CN', { hour12: false })}
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-title">{log.userName || log.loginName}</div>
                              <div className="text-[10px] text-text-sec font-mono">@{log.loginName}</div>
                            </td>
                            <td className="p-3">
                              <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-mono bg-sidebar-hover text-text-sec border border-card-border">
                                {log.actionType}
                              </span>
                            </td>
                            <td className="p-3 text-title">{log.detail}</td>
                            <td className="p-3 text-text-sec font-mono">{log.ip || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination for System Audit Logs */}
                  <div className="p-3.5 border-t border-card-border bg-sidebar-hover/10 flex items-center justify-between text-xs">
                    <span className="text-text-sec font-medium">
                      {filteredSystemLogs.length > 0
                        ? `显示第 ${(systemLogPage - 1) * logsPerPage + 1} 到 ${Math.min(
                            systemLogPage * logsPerPage,
                            filteredSystemLogs.length
                          )} 条，共 ${filteredSystemLogs.length} 条审计日志`
                        : '暂无审计日志'}
                    </span>
                    {totalLogPages > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSystemLogPage((p) => Math.max(1, p - 1))}
                          disabled={systemLogPage === 1}
                          className="p-1.5 rounded-lg border border-input-border bg-card-surface hover:bg-sidebar-hover disabled:opacity-40 disabled:cursor-not-allowed text-title cursor-pointer"
                          title="上一页"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 font-bold text-title font-mono">
                          {systemLogPage} / {totalLogPages}
                        </span>
                        <button
                          onClick={() => setSystemLogPage((p) => Math.min(totalLogPages, p + 1))}
                          disabled={systemLogPage === totalLogPages}
                          className="p-1.5 rounded-lg border border-input-border bg-card-surface hover:bg-sidebar-hover disabled:opacity-40 disabled:cursor-not-allowed text-title cursor-pointer"
                          title="下一页"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Modal 1: 批量添加成员弹窗 (AddMemberModal) */}
      {/* ========================================================================= */}
      {isAddMemberModalOpen && activeRole && (
        <AddMemberModal
          role={activeRole}
          departmentsTree={departmentsTree}
          existingMemberIds={selectedRoleMembers.map((m) => m.id)}
          onClose={() => setIsAddMemberModalOpen(false)}
          onSuccess={(addedMembers) => {
            setSelectedRoleMembers((prev) => [...prev, ...addedMembers]);
            setRolesList((prev) =>
              prev.map((r) =>
                r.id === activeRole.id
                  ? { ...r, memberCount: (r.memberCount || 0) + addedMembers.length }
                  : r
              )
            );
            setIsAddMemberModalOpen(false);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* Modal 2: 新建业务角色弹窗 (CreateRoleModal) */}
      {/* ========================================================================= */}
      {isCreateRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card-surface rounded-2xl border border-card-border shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-card-border flex items-center justify-between bg-sidebar-hover/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-zpje-accent" />
                <h3 className="font-bold text-title text-sm">创建新业务角色</h3>
              </div>
              <button
                onClick={() => setIsCreateRoleModalOpen(false)}
                className="p-1 rounded-lg text-text-sec hover:text-title hover:bg-sidebar-hover transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoleSubmit} className="p-6 flex flex-col gap-4">
              {newRoleError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                  {newRoleError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                  角色标识 Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newRoleKey}
                  onChange={(e) => setNewRoleKey(e.target.value)}
                  placeholder="例如: welder 或 quality_inspector"
                  className="px-3 py-2 rounded-xl border border-input-border bg-canvas text-title text-sm focus:outline-none focus:ring-1 focus:ring-zpje-accent font-mono"
                />
                <span className="text-[10px] text-text-sec">仅支持英文、数字与下划线</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                  角色名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="例如: 管道质检组"
                  className="px-3 py-2 rounded-xl border border-input-border bg-canvas text-title text-sm focus:outline-none focus:ring-1 focus:ring-zpje-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                  角色职能描述
                </label>
                <textarea
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="简述该角色的业务范围与授权用途..."
                  rows={3}
                  className="px-3 py-2 rounded-xl border border-input-border bg-canvas text-title text-sm focus:outline-none focus:ring-1 focus:ring-zpje-accent resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-card-border">
                <button
                  type="button"
                  onClick={() => setIsCreateRoleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-input-border text-xs font-bold text-text-sec hover:text-title hover:bg-sidebar-hover transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={newRoleSubmitting}
                  className="px-4 py-2 rounded-xl bg-zpje-accent text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {newRoleSubmitting ? '创建中...' : '确认创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal 2.5: 编辑业务角色弹窗 (EditRoleModal) */}
      {/* ========================================================================= */}
      {isEditRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card-surface rounded-2xl border border-card-border shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-card-border flex items-center justify-between bg-sidebar-hover/20">
              <div className="flex items-center gap-2">
                <Edit className="w-4 h-4 text-zpje-accent" />
                <h3 className="font-bold text-title text-sm">编辑业务角色</h3>
              </div>
              <button
                onClick={() => setIsEditRoleModalOpen(false)}
                className="p-1 rounded-lg text-text-sec hover:text-title hover:bg-sidebar-hover transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditRoleSubmit} className="p-6 flex flex-col gap-4">
              {editRoleError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                  {editRoleError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                  角色标识 Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editRoleKey}
                  onChange={(e) => setEditRoleKey(e.target.value)}
                  placeholder="例如: welder 或 quality_inspector"
                  className="px-3 py-2 rounded-xl border border-input-border bg-canvas text-title text-sm focus:outline-none focus:ring-1 focus:ring-zpje-accent font-mono"
                />
                <span className="text-[10px] text-text-sec">支持修改，仅限英文、数字与下划线</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                  角色名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  placeholder="例如: 管道质检组"
                  className="px-3 py-2 rounded-xl border border-input-border bg-canvas text-title text-sm focus:outline-none focus:ring-1 focus:ring-zpje-accent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                  角色职能描述
                </label>
                <textarea
                  value={editRoleDesc}
                  onChange={(e) => setEditRoleDesc(e.target.value)}
                  placeholder="简述该角色的业务范围与授权用途..."
                  rows={3}
                  className="px-3 py-2 rounded-xl border border-input-border bg-canvas text-title text-sm focus:outline-none focus:ring-1 focus:ring-zpje-accent resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-card-border">
                <button
                  type="button"
                  onClick={() => setIsEditRoleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-input-border text-xs font-bold text-text-sec hover:text-title hover:bg-sidebar-hover transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={editRoleSubmitting}
                  className="px-4 py-2 rounded-xl bg-zpje-accent text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {editRoleSubmitting ? '保存中...' : '保存修改'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal 3: 应用新增/编辑弹窗 (含应用权限与可见性隔离树形组件) */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-card-surface rounded-2xl border border-card-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-card-border flex items-center justify-between bg-sidebar-hover/20 shrink-0">
              <h2 className="text-base font-bold text-title">
                {editingApp ? '编辑应用' : '新增应用'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-sidebar-hover text-text-sec hover:text-title transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-1">
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                      键标识 (Unique Key) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!!editingApp}
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      placeholder="例如: CarbonPlatform"
                      className="px-3 py-2 rounded-xl border border-input-border bg-canvas text-title text-sm focus:outline-none focus:ring-1 focus:ring-zpje-accent disabled:opacity-50 font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                      应用名称 <span className="text-red-500">*</span>
                      <span className="text-text-sec/60 font-normal ml-1">(建议20字以内)</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="例如: 能碳管理平台"
                      className="px-3 py-2 rounded-xl border border-input-border bg-canvas text-title text-sm focus:outline-none focus:ring-1 focus:ring-zpje-accent"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                    入口 URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="例如: https://energy.izpje.com"
                    className="px-3 py-2 rounded-xl border border-input-border bg-canvas text-title text-sm focus:outline-none focus:ring-1 focus:ring-zpje-accent font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                    应用简介
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="简短描述该系统的主要功能与业务定位..."
                    rows={2}
                    className="px-3 py-2 rounded-xl border border-input-border bg-canvas text-title text-sm focus:outline-none focus:ring-1 focus:ring-zpje-accent resize-none"
                  />
                </div>

                {/* Theme Color, Icon & Sort */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                      应用主题色
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-input-border cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-input-border bg-canvas text-title text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zpje-accent uppercase"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                      图标预设
                    </label>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: getRgba(color, 0.1),
                          borderColor: getRgba(color, 0.3),
                          color: color,
                        }}
                      >
                        {renderIcon(icon, 'w-5 h-5')}
                      </div>
                      <select
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-input-border bg-canvas text-title text-sm focus:outline-none focus:ring-1 focus:ring-zpje-accent font-mono cursor-pointer"
                      >
                        {ICON_PRESETS.map((iconName) => (
                          <option key={iconName} value={iconName}>
                            {iconName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                      排序权值 (正整数)
                    </label>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(Number(e.target.value))}
                      className="px-3 py-2 rounded-xl border border-input-border bg-canvas text-title text-sm focus:outline-none focus:ring-1 focus:ring-zpje-accent font-mono"
                    />
                  </div>
                </div>

                {/* Unit and Department Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                      所属单位 <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={selectedUnitId}
                      onChange={(e) => handleUnitChange(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-input-border bg-canvas text-title text-sm focus:outline-none focus:ring-1 focus:ring-zpje-accent cursor-pointer"
                    >
                      <option value="">-- 请选择所属单位 --</option>
                      {departmentsTree.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                      所属部门 (选填)
                    </label>
                    <select
                      value={mainDeptId}
                      onChange={(e) => setMainDeptId(e.target.value)}
                      disabled={!selectedUnitId}
                      className="px-3 py-2 rounded-xl border border-input-border bg-canvas text-title text-sm focus:outline-none focus:ring-1 focus:ring-zpje-accent cursor-pointer disabled:opacity-50"
                    >
                      <option value="">-- 请选择所属部门 (允许为空) --</option>
                      {selectedUnitId &&
                        departmentsTree
                          .find((u) => u.id === selectedUnitId)
                          ?.departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                    </select>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* 🔒 应用权限与可见性隔离重构面板 */}
                {/* ========================================================= */}
                <div className="border-t border-card-border pt-4 mt-2 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-zpje-accent" />
                      <span className="font-bold text-title text-sm">应用权限与可见性隔离</span>
                    </div>
                    <span className="text-[11px] text-text-sec">
                      公式: 满足任一条件（Role OR Department）即可访问
                    </span>
                  </div>

                  {/* Radio Group: 全员可见 vs 指定范围可见 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        visibleToAll
                          ? 'bg-zpje-accent/10 border-zpje-accent ring-1 ring-zpje-accent'
                          : 'bg-canvas border-card-border hover:bg-sidebar-hover/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="visibilityType"
                        checked={visibleToAll}
                        onChange={() => setVisibleToAll(true)}
                        className="w-4 h-4 accent-zpje-accent cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-title">全员免检可见</span>
                        <span className="text-[10px] text-text-sec">
                          所有通过 OA 登录的人员均可访问
                        </span>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        !visibleToAll
                          ? 'bg-zpje-accent/10 border-zpje-accent ring-1 ring-zpje-accent'
                          : 'bg-canvas border-card-border hover:bg-sidebar-hover/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="visibilityType"
                        checked={!visibleToAll}
                        onChange={() => setVisibleToAll(false)}
                        className="w-4 h-4 accent-zpje-accent cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-title">指定范围可见</span>
                        <span className="text-[10px] text-text-sec">
                          按业务角色或组织部门授权
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* 细分授权工作区 (当且仅当 !visibleToAll 时展开) */}
                  {!visibleToAll && (
                    <div className="flex flex-col gap-4 border border-card-border rounded-2xl p-4 bg-sidebar-hover/10 animate-in fade-in duration-200 mt-1">
                      {/* 1. 按业务角色授权 */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-title flex items-center gap-1.5">
                            <span>1. 按业务角色授权 (满足所选角色之一):</span>
                          </span>
                          <span className="text-[10px] text-text-sec font-mono">
                            已选 {selectedRoleIds.length} 个角色
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 p-2.5 rounded-xl border border-card-border bg-card-surface">
                          {rolesList.map((role) => {
                            const isSelected = selectedRoleIds.includes(role.id);
                            const { icon } = getRoleIconAndBadge(role.key);
                            return (
                              <button
                                key={role.id}
                                type="button"
                                onClick={() => toggleRoleSelection(role.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isSelected
                                    ? 'bg-zpje-accent text-white border-zpje-accent shadow-xs'
                                    : 'bg-canvas text-text-sec border-input-border hover:text-title hover:border-card-border'
                                }`}
                              >
                                {isSelected ? <Check className="w-3.5 h-3.5" /> : <span>{icon}</span>}
                                <span>{role.name}</span>
                                <span className="opacity-60 text-[10px] font-mono">@{role.key}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. 按组织部门授权 (带级联与搜索的折叠树) */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-title">
                            2. 按组织部门授权 (所选部门全员可见):
                          </span>
                          <div className="flex items-center gap-2">
                            {selectedDeptIds.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setSelectedDeptIds([])}
                                className="text-[10px] text-red-500 hover:underline cursor-pointer"
                              >
                                清空已选 ({selectedDeptIds.length})
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 部门折叠树组件 */}
                        <div className="border border-card-border rounded-xl bg-card-surface overflow-hidden flex flex-col max-h-64">
                          {/* 树顶部搜索栏 */}
                          <div className="p-2 border-b border-card-border bg-sidebar-hover/20 flex items-center gap-2">
                            <Search className="w-3.5 h-3.5 text-text-sec shrink-0" />
                            <input
                              type="text"
                              placeholder="搜索部门名称或编码过滤..."
                              value={deptTreeSearch}
                              onChange={(e) => setDeptTreeSearch(e.target.value)}
                              className="w-full bg-transparent text-xs text-title focus:outline-none"
                            />
                            {deptTreeSearch && (
                              <button
                                type="button"
                                onClick={() => setDeptTreeSearch('')}
                                className="text-text-sec hover:text-title"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* 树形列表 */}
                          <div className="p-2 overflow-y-auto flex flex-col gap-1 text-xs">
                            {departmentsTree.map((unit) => (
                              <UnitTreeNodeView
                                key={unit.id}
                                unit={unit}
                                selectedDeptIds={selectedDeptIds}
                                toggleDepartmentSelection={toggleDepartmentSelection}
                                toggleUnitSelection={toggleUnitSelection}
                                searchTerm={deptTreeSearch}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-card-border flex items-center justify-end gap-3 bg-sidebar-hover/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-input-border text-xs font-bold text-text-sec hover:text-title hover:bg-sidebar-hover transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-zpje-accent text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? '保存中...' : '保存应用配置'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal 4: Widget 新增/编辑弹窗 */}
      {/* ========================================================================= */}
      {isWidgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card-surface rounded-2xl border border-card-border shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-card-border flex items-center justify-between bg-sidebar-hover/20">
              <h3 className="font-bold text-title text-sm">
                {editingWidget ? '编辑 Widget' : '新增 Widget'}
              </h3>
              <button
                onClick={() => setIsWidgetModalOpen(false)}
                className="p-1 rounded-lg text-text-sec hover:text-title hover:bg-sidebar-hover transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWidgetSubmit} className="p-6 flex flex-col gap-4">
              {widgetError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                  {widgetError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                  组件标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={widgetTitle}
                  onChange={(e) => setWidgetTitle(e.target.value)}
                  placeholder="例如: 能碳实时大屏"
                  className="px-3 py-2 rounded-xl border border-input-border bg-canvas text-title text-sm focus:outline-none focus:ring-1 focus:ring-zpje-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                    关联应用 (选填)
                  </label>
                  <select
                    value={widgetAppId}
                    onChange={(e) => setWidgetAppId(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-input-border bg-canvas text-title text-sm focus:outline-none focus:ring-1 focus:ring-zpje-accent cursor-pointer"
                  >
                    <option value="">-- 无关联 --</option>
                    {apps.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                    排版宽度
                  </label>
                  <select
                    value={widgetWidthClass}
                    onChange={(e) => setWidgetWidthClass(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-input-border bg-canvas text-title text-sm focus:outline-none focus:ring-1 focus:ring-zpje-accent cursor-pointer"
                  >
                    <option value="col-span-1">单列宽度 (1格)</option>
                    <option value="col-span-2">双列宽度 (2格)</option>
                    <option value="col-span-3">三列宽度 (3格)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                  嵌入 URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={widgetUrl}
                  onChange={(e) => setWidgetUrl(e.target.value)}
                  placeholder="例如: https://screen.izpje.com"
                  className="px-3 py-2 rounded-xl border border-input-border bg-canvas text-title text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zpje-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-card-border">
                <button
                  type="button"
                  onClick={() => setIsWidgetModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-input-border text-xs font-bold text-text-sec hover:text-title hover:bg-sidebar-hover transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={widgetSubmitting}
                  className="px-4 py-2 rounded-xl bg-zpje-accent text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {widgetSubmitting ? '保存中...' : '保存 Widget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------
// 辅助子组件: 单位及部门折叠树节点视图 (支持搜索过滤与级联选择)
// ---------------------------------------------------------------------------------
function UnitTreeNodeView({
  unit,
  selectedDeptIds,
  toggleDepartmentSelection,
  toggleUnitSelection,
  searchTerm
}: {
  unit: UnitTreeNode;
  selectedDeptIds: string[];
  toggleDepartmentSelection: (dept: DepartmentTreeNode) => void;
  toggleUnitSelection: (unit: UnitTreeNode) => void;
  searchTerm: string;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const unitDeptIds = getAllDeptIdsInUnit(unit);
  const isAllUnitSelected = unitDeptIds.length > 0 && unitDeptIds.every((id) => selectedDeptIds.includes(id));
  const isSomeUnitSelected = unitDeptIds.some((id) => selectedDeptIds.includes(id)) && !isAllUnitSelected;

  return (
    <div className="flex flex-col gap-1 border-b border-card-border/40 pb-1.5 last:border-b-0">
      {/* Unit Level Header */}
      <div className="flex items-center justify-between p-1 rounded hover:bg-sidebar-hover/40 transition-colors">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 text-text-sec hover:text-title"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          <div
            onClick={() => toggleUnitSelection(unit)}
            className="flex items-center gap-1.5 cursor-pointer select-none"
          >
            {isAllUnitSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-zpje-accent" />
            ) : isSomeUnitSelected ? (
              <MinusSquare className="w-3.5 h-3.5 text-zpje-accent" />
            ) : (
              <Square className="w-3.5 h-3.5 text-text-sec" />
            )}
            <span className="font-bold text-title text-xs truncate">{unit.name}</span>
          </div>
        </div>
        <span className="text-[10px] text-text-sec font-mono">{unit.departments.length} 个根部门</span>
      </div>

      {/* Child Departments */}
      {isExpanded && (
        <div className="pl-5 flex flex-col gap-0.5 border-l border-card-border/60 ml-2">
          {unit.departments.map((dept) => (
            <DeptTreeNodeView
              key={dept.id}
              node={dept}
              selectedDeptIds={selectedDeptIds}
              toggleDepartmentSelection={toggleDepartmentSelection}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DeptTreeNodeView({
  node,
  selectedDeptIds,
  toggleDepartmentSelection,
  searchTerm
}: {
  node: DepartmentTreeNode;
  selectedDeptIds: string[];
  toggleDepartmentSelection: (dept: DepartmentTreeNode) => void;
  searchTerm: string;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const descendantIds = getAllDescendantDeptIds(node);
  const isNodeSelected = selectedDeptIds.includes(node.id);
  const isAllDescendantSelected = descendantIds.every((id) => selectedDeptIds.includes(id));
  const isSomeDescendantSelected = descendantIds.some((id) => selectedDeptIds.includes(id)) && !isAllDescendantSelected;

  const hasChildren = node.children && node.children.length > 0;

  // Search filtering
  const isMatched =
    !searchTerm.trim() ||
    node.name.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
    (node.code && node.code.toLowerCase().includes(searchTerm.trim().toLowerCase()));

  if (!isMatched && !descendantIds.some((id) => selectedDeptIds.includes(id))) {
    // Hide if not matched and no child selected
    return null;
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between p-1 rounded hover:bg-sidebar-hover/40 transition-colors">
        <div className="flex items-center gap-1.5 min-w-0">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0.5 text-text-sec hover:text-title"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          ) : (
            <div className="w-4" />
          )}

          <div
            onClick={() => toggleDepartmentSelection(node)}
            className="flex items-center gap-1.5 cursor-pointer select-none truncate"
          >
            {isAllDescendantSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-zpje-accent" />
            ) : isSomeDescendantSelected ? (
              <MinusSquare className="w-3.5 h-3.5 text-zpje-accent" />
            ) : (
              <Square className="w-3.5 h-3.5 text-text-sec" />
            )}
            <span
              className={`text-xs truncate ${
                isNodeSelected ? 'font-bold text-zpje-accent' : 'text-title'
              }`}
            >
              {node.name}
            </span>
            {node.code && <span className="text-[10px] text-text-sec font-mono truncate">({node.code})</span>}
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="pl-4 flex flex-col gap-0.5 border-l border-card-border/40 ml-2">
          {node.children.map((child) => (
            <DeptTreeNodeView
              key={child.id}
              node={child}
              selectedDeptIds={selectedDeptIds}
              toggleDepartmentSelection={toggleDepartmentSelection}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------
// 辅助子组件: 批量添加成员穿梭/多选弹窗 (AddMemberModal)
// ---------------------------------------------------------------------------------
function AddMemberModal({
  role,
  departmentsTree,
  existingMemberIds,
  onClose,
  onSuccess
}: {
  role: RoleOption;
  departmentsTree: UnitTreeNode[];
  existingMemberIds: string[];
  onClose: () => void;
  onSuccess: (addedMembers: RoleMemberItem[]) => void;
}) {
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [memberList, setMemberList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 检索人员
  const fetchMembers = (query: string, deptId: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setLoading(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.append('search', query.trim());
        if (deptId) params.append('deptId', deptId);

        const res = await fetch(`/api/admin/members?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setMemberList(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);
  };

  useEffect(() => {
    fetchMembers(searchQuery, selectedDeptId);
  }, [searchQuery, selectedDeptId]);

  const toggleSelectMember = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSelectAllCurrent = () => {
    const availableIds = memberList
      .filter((m) => !existingMemberIds.includes(m.id))
      .map((m) => m.id);

    const isAllSelected = availableIds.length > 0 && availableIds.every((id) => selectedMemberIds.includes(id));

    if (isAllSelected) {
      setSelectedMemberIds((prev) => prev.filter((id) => !availableIds.includes(id)));
    } else {
      setSelectedMemberIds((prev) => Array.from(new Set([...prev, ...availableIds])));
    }
  };

  const handleSubmit = async () => {
    if (selectedMemberIds.length === 0) {
      setErrorMessage('请至少选择一名员工');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/admin/roles/${role.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: selectedMemberIds }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error || '添加成员失败');
        setSubmitting(false);
        return;
      }

      // 构造新添加成员对象供即时视图响应
      const addedObjects: RoleMemberItem[] = memberList
        .filter((m) => selectedMemberIds.includes(m.id))
        .map((m) => ({
          id: m.id,
          name: m.name,
          loginName: m.loginName,
          code: m.code,
          adminType: m.adminType,
          deptName: m.department?.name || '无部门',
          unitName: m.unit?.name || '无单位',
          joinedAt: new Date().toISOString(),
        }));

      onSuccess(addedObjects);
    } catch (err: any) {
      setErrorMessage(err.message || '网络异常');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-card-surface rounded-2xl border border-card-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-card-border flex items-center justify-between bg-sidebar-hover/20">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-zpje-accent" />
            <h3 className="font-bold text-title text-base">
              向【{role.name} ({role.key})】批量添加成员
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-sec hover:text-title hover:bg-sidebar-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Depts + Right Members */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Left: Department Tree Selector */}
          <div className="md:col-span-4 border-r border-card-border p-4 bg-sidebar-hover/10 flex flex-col gap-3 overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-title">按致远 OA 部门快速筛选</span>
              {selectedDeptId && (
                <button
                  type="button"
                  onClick={() => setSelectedDeptId('')}
                  className="text-[10px] text-zpje-accent hover:underline font-bold"
                >
                  查看全部
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <div
                onClick={() => setSelectedDeptId('')}
                className={`p-2 rounded-xl border cursor-pointer transition-all ${
                  selectedDeptId === ''
                    ? 'bg-zpje-accent/10 border-zpje-accent text-zpje-accent font-bold'
                    : 'bg-card-surface border-card-border hover:bg-sidebar-hover text-title'
                }`}
              >
                全部部门与员工
              </div>

              {departmentsTree.map((unit) => (
                <div key={unit.id} className="flex flex-col gap-1 mt-1">
                  <div className="text-[10px] font-bold text-text-sec uppercase px-2 py-1">
                    {unit.name}
                  </div>
                  {unit.departments.map((dept) => (
                    <div
                      key={dept.id}
                      onClick={() => setSelectedDeptId(dept.id)}
                      className={`px-3 py-1.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                        selectedDeptId === dept.id
                          ? 'bg-zpje-accent/10 border-zpje-accent text-zpje-accent font-bold'
                          : 'bg-card-surface border-card-border hover:bg-sidebar-hover text-title'
                      }`}
                    >
                      <span className="truncate">{dept.name}</span>
                      {dept.memberCount !== undefined && (
                        <span className="text-[10px] text-text-sec font-mono">{dept.memberCount}人</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Search & Member Selection List */}
          <div className="md:col-span-8 p-4 flex flex-col gap-3 overflow-hidden bg-card-surface">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-sec" />
                <input
                  type="text"
                  placeholder="输入姓名、账号或工号搜索员工..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-canvas border border-input-border text-title text-xs focus:outline-none focus:ring-1 focus:ring-zpje-accent"
                />
              </div>
              <button
                type="button"
                onClick={handleSelectAllCurrent}
                className="px-3 py-2 rounded-xl border border-input-border hover:bg-sidebar-hover text-title text-xs font-bold shrink-0 transition-colors"
              >
                全选列表
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Member Selection List */}
            <div className="flex-1 overflow-y-auto border border-card-border rounded-xl p-2 flex flex-col gap-1.5 max-h-[380px]">
              {loading ? (
                <div className="text-center py-16 text-xs text-text-sec animate-pulse">
                  正在检索员工数据...
                </div>
              ) : memberList.length > 0 ? (
                memberList.map((member) => {
                  const isAlreadyInRole = existingMemberIds.includes(member.id);
                  const isSelected = selectedMemberIds.includes(member.id);

                  return (
                    <div
                      key={member.id}
                      onClick={() => !isAlreadyInRole && toggleSelectMember(member.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                        isAlreadyInRole
                          ? 'bg-sidebar-hover/40 border-card-border opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-zpje-accent/10 border-zpje-accent shadow-xs cursor-pointer'
                          : 'bg-canvas border-card-border hover:border-zpje-accent/40 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isAlreadyInRole ? (
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : isSelected ? (
                          <CheckSquare className="w-4 h-4 text-zpje-accent shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-text-sec shrink-0" />
                        )}
                        <div className="truncate min-w-0">
                          <div className="font-bold text-title text-xs flex items-center gap-2">
                            <span>{member.name}</span>
                            <span className="text-[10px] font-mono text-text-sec font-normal">
                              @{member.loginName}
                            </span>
                            {isAlreadyInRole && (
                              <span className="text-[10px] text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                                已在该角色中
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-text-sec mt-0.5 truncate">
                            {member.department?.name || '无部门'} · {member.unit?.name || '无单位'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-16 text-xs text-text-sec italic">
                  未找到匹配的员工。请在上方输入姓名/账号检索。
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-card-border bg-sidebar-hover/10 flex items-center justify-between">
          <span className="text-xs font-bold text-title">
            已勾选 <span className="text-zpje-accent font-mono text-sm">{selectedMemberIds.length}</span> 名员工
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-input-border text-xs font-bold text-text-sec hover:text-title hover:bg-sidebar-hover transition-all"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || selectedMemberIds.length === 0}
              className="px-5 py-2 rounded-xl bg-zpje-accent text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {submitting ? '添加中...' : `确认添加 (${selectedMemberIds.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
