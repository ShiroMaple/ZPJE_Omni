'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Eye,
  EyeOff,
  Shield,
  Search,
  User,
  Moon,
  Sun,
  LogOut
} from 'lucide-react';

interface DBApp {
  id: string;
  key: string;
  name: string;
  description: string | null;
  url: string;
  icon: string | null;
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

interface DeptOption {
  id: string;
  name: string;
}

interface UnitOption {
  id: string;
  name: string;
  departments: DeptOption[];
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
  actionType: string; // 'SSO_LOGIN' | 'LOGOUT' | 'APP_ACCESS' | 'APP_MANAGE' | 'WIDGET_MANAGE' | 'ADMIN_MANAGE'
  detail: string;
  ip: string | null;
  userAgent: string | null;
  timestamp: string;
}

interface AdminAppRegistryProps {
  initialApps: DBApp[];
  departmentsTree: UnitOption[];
  accessLogs: AccessLog[];
  roles: RoleOption[];
  initialWidgets: WidgetConfig[];
  isSystemAdmin: boolean;
  initialAdminMembers: AdminMember[];
  initialSystemLogs: SystemLog[];
  userId: string;
  userInfo: { name: string; loginName: string; unitName: string; deptName: string; } | null;
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

export default function AdminAppRegistry({
  initialApps,
  departmentsTree,
  accessLogs,
  roles,
  initialWidgets,
  isSystemAdmin,
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
  
  // Tab 4 (访问与审计) Sub-tabs: 'access' (用户访问统计) | 'system' (系统审计日志)
  const [statsSubTab, setStatsSubTab] = useState<'access' | 'system'>('access');
  const [systemLogSearch, setSystemLogSearch] = useState('');
  const [systemLogPage, setSystemLogPage] = useState(1);
  const [logTypeFilter, setLogTypeFilter] = useState<string>('all');
  const logsPerPage = 15;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<DBApp | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Unit and Department 2-level selection state
  const [selectedUnitId, setSelectedUnitId] = useState('');

  const handleUnitChange = (unitId: string) => {
    setSelectedUnitId(unitId);
    setMainDeptId('');
  };

  const renderIcon = (iconName: string | null, className = "w-4 h-4") => {
    switch (iconName) {
      case 'Zap': return <Zap className={className} />;
      case 'Calculator': return <Calculator className={className} />;
      case 'LayoutDashboard': return <LayoutDashboard className={className} />;
      case 'FileText': return <FileText className={className} />;
      case 'Activity': return <Activity className={className} />;
      case 'Leaf': return <Leaf className={className} />;
      case 'Clock': return <Clock className={className} />;
      case 'Hammer': return <Hammer className={className} />;
      default: return <LayoutDashboard className={className} />;
    }
  };

  // Theme, Sidebar Collapse & Session logout hooks
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initialTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark' || 'light';
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
      // Redirect back to the homepage (SSO logout / guest view)
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

  // Stats Log Pagination
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
  const [visibleToAll, setVisibleToAll] = useState(true);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);

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

  // Member Search State
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<any[]>([]);
  const [memberSearchLoading, setMemberSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openAddModal = () => {
    setEditingApp(null);
    setKey('');
    setName('');
    setDescription('');
    setUrl('');
    setIcon('LayoutDashboard');
    setIsMaintenance(false);
    setSortOrder(0);
    setMainDeptId('');

    // Default unit to '镇海石化建安工程股份有限公司'
    const defaultUnit = departmentsTree.find(u => u.name === '镇海石化建安工程股份有限公司');
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
    setIsMaintenance(app.isMaintenance);
    setSortOrder(app.sortOrder);
    setMainDeptId(app.mainDeptId || '');

    // Find parent unit containing the app's mainDeptId
    if (app.mainDeptId) {
      const parentUnit = departmentsTree.find((u) =>
        u.departments.some((d) => d.id === app.mainDeptId)
      );
      setSelectedUnitId(parentUnit ? parentUnit.id : '');
    } else {
      const defaultUnit = departmentsTree.find(u => u.name === '镇海石化建安工程股份有限公司');
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
        isMaintenance,
        sortOrder,
        mainDeptId: mainDeptId || null,
        visibleToAll,
        roleIds: selectedRoleIds,
        deptIds: selectedDeptIds
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

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '保存失败');
      }

      // Re-fetch all apps to get updated list
      const listRes = await fetch('/api/admin/apps');
      if (listRes.ok) {
        const freshApps = await listRes.json();
        // Map roles and depts for fresh app array
        setApps(freshApps.map((a: any) => ({
          ...a,
          roleIds: a.rolePermissions?.map((rp: any) => rp.roleId) || [],
          deptIds: a.deptPermissions?.map((dp: any) => dp.departmentId) || []
        })));
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/admin/apps/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setApps(apps.filter(app => app.id !== id));
      } else {
        const data = await res.json();
        alert(`删除失败: ${data.error}`);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(null);
    }
  };

  // Toggle roles / departments in selection
  const toggleRoleSelection = (roleId: string) => {
    setSelectedRoleIds(prev =>
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const toggleDeptSelection = (deptId: string) => {
    setSelectedDeptIds(prev =>
      prev.includes(deptId) ? prev.filter(id => id !== deptId) : [...prev, deptId]
    );
  };

  // Widget Actions
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
    if (!widgetTitle || !widgetUrl) {
      setWidgetError('标题和链接地址为必填项');
      return;
    }

    setWidgetSubmitting(true);
    setWidgetError('');

    try {
      const payload = {
        title: widgetTitle,
        appId: widgetAppId || null,
        type: widgetType,
        url: widgetUrl,
        widthClass: widgetWidthClass,
        sortOrder: Number(widgetSortOrder)
      };

      let res;
      if (editingWidget) {
        res = await fetch(`/api/admin/widgets/${editingWidget.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/admin/widgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '保存 Widget 失败');
      }

      // Re-fetch widgets
      const widgetListRes = await fetch('/api/admin/widgets');
      if (widgetListRes.ok) {
        const freshWidgets = await widgetListRes.json();
        setWidgets(freshWidgets.map((w: any) => ({
          id: w.id,
          title: w.title,
          appId: w.appId,
          appName: w.app?.name || null,
          type: w.type,
          url: w.url,
          widthClass: w.widthClass,
          sortOrder: w.sortOrder
        })));
      }

      setIsWidgetModalOpen(false);
    } catch (err: any) {
      setWidgetError(err.message);
    } finally {
      setWidgetSubmitting(false);
    }
  };

  const handleWidgetDelete = async (id: string) => {
    setIsDeletingWidget(id);
    try {
      const res = await fetch(`/api/admin/widgets/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setWidgets(widgets.filter(w => w.id !== id));
      } else {
        const data = await res.json();
        alert(`删除 Widget 失败: ${data.error}`);
      }
    } catch (err) {
      console.error('Delete widget failed:', err);
    } finally {
      setIsDeletingWidget(null);
    }
  };

  // Member Search Actions
  const triggerMemberSearch = (val: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!val.trim()) {
      setMemberSearchResults([]);
      return;
    }

    setMemberSearchLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/members?search=${encodeURIComponent(val)}`);
        if (res.ok) {
          const data = await res.json();
          const adminIds = adminMembers.map(a => a.id);
          setMemberSearchResults(data.map((m: any) => ({
            id: m.id,
            name: m.name,
            loginName: m.loginName,
            unitName: m.unit?.name || '无单位',
            deptName: m.department?.name || '无部门'
          })).filter((m: any) => !adminIds.includes(m.id)));
        }
      } catch (err) {
        console.error('Search members failed:', err);
      } finally {
        setMemberSearchLoading(false);
      }
    }, 400);
  };

  const handleAdminTypeChange = async (
    memberId: string,
    adminType: 'NONE' | 'SYS_ADMIN' | 'OPS_ADMIN' | 'DEPT_ADMIN',
    searchMemberObj?: any
  ) => {
    try {
      const res = await fetch('/api/admin/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, adminType })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '分配管理员权限失败');
      }

      if (adminType === 'NONE') {
        setAdminMembers(prev => prev.filter(a => a.id !== memberId));
      } else {
        const exists = adminMembers.some(a => a.id === memberId);
        if (exists) {
          setAdminMembers(prev => prev.map(a => a.id === memberId ? { ...a, adminType } : a));
        } else if (searchMemberObj) {
          const newAdmin: AdminMember = {
            id: searchMemberObj.id,
            name: searchMemberObj.name,
            loginName: searchMemberObj.loginName,
            adminType,
            deptName: searchMemberObj.deptName,
            unitName: searchMemberObj.unitName
          };
          setAdminMembers(prev => [...prev, newAdmin].sort((a, b) => a.name.localeCompare(b.name)));
          setMemberSearchResults(prev => prev.filter(m => m.id !== memberId));
        } else {
          const listRes = await fetch('/api/admin/members?type=admins');
          if (listRes.ok) {
            const data = await listRes.json();
            setAdminMembers(data.map((m: any) => ({
              id: m.id,
              name: m.name,
              loginName: m.loginName,
              adminType: m.adminType,
              deptName: m.department?.name || '无部门',
              unitName: m.unit?.name || '无单位'
            })));
          }
        }
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filter logs by selected time filter
  const getFilteredLogs = () => {
    if (timeFilter === 'all') return accessLogs;
    const now = new Date();
    const filterMs =
      timeFilter === '24h' ? 24 * 60 * 60 * 1000 :
        timeFilter === '7d' ? 7 * 24 * 60 * 60 * 1000 :
          30 * 24 * 60 * 60 * 1000;
    return accessLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return now.getTime() - logDate.getTime() <= filterMs;
    });
  };

  const filteredLogs = getFilteredLogs();

  // Aggregate stats per application
  const appVisitsMap: Record<string, number> = {};
  filteredLogs.forEach(log => {
    const appName = log.app?.name || '未知系统';
    appVisitsMap[appName] = (appVisitsMap[appName] || 0) + 1;
  });

  const rankList = Object.entries(appVisitsMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const maxCount = rankList[0]?.count || 1;
  const totalVisits = filteredLogs.length;
  const activeUsersCount = new Set(filteredLogs.map(l => l.loginName)).size;
  const topApp = rankList[0]?.name || '无';

  // Stats Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  // System Logs Filtering and Pagination
  const filteredSystemLogs = systemLogs.filter(log => {
    const matchesSearch =
      log.loginName.toLowerCase().includes(systemLogSearch.toLowerCase()) ||
      (log.userName || '').toLowerCase().includes(systemLogSearch.toLowerCase()) ||
      log.detail.toLowerCase().includes(systemLogSearch.toLowerCase());
    
    const matchesType = logTypeFilter === 'all' || log.actionType === logTypeFilter;
    return matchesSearch && matchesType;
  });

  const totalLogPages = Math.ceil(filteredSystemLogs.length / logsPerPage);
  const paginatedSystemLogs = filteredSystemLogs.slice(
    (systemLogPage - 1) * logsPerPage,
    systemLogPage * logsPerPage
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas text-text-main font-sans transition-colors duration-200">
      {/* Left Sidebar */}
      <aside className={`hidden lg:flex h-screen flex-col bg-zpje-brand text-white border-r border-card-border transition-all duration-300 ease-in-out shrink-0 z-40 ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
        {/* Logo & Title */}
        <div className={`flex h-16 items-center border-b border-white/10 transition-all duration-300 ${isSidebarCollapsed ? 'justify-center px-0 gap-0' : 'px-4 gap-3'} shrink-0`}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-0.5 shrink-0 shadow-sm">
            <img
              src="/logo_zpje.jpg"
              className="rounded object-contain w-full h-full"
              alt="建安万维"
            />
          </div>
          <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <span className="text-lg font-bold tracking-wider whitespace-nowrap text-white">建安万维</span>
            <span className="text-[12px] font-bold text-white/50 tracking-widest -mt-1 font-sans">管理后台</span>
          </div>
        </div>

        {/* Tab switches */}
        <nav className="flex-1 py-6 px-3 flex flex-col gap-1.5 overflow-y-auto">
          <button
            onClick={() => setActiveTab('apps')}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-300 text-left cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''} ${activeTab === 'apps'
              ? 'bg-zpje-accent border-transparent text-white shadow-sm'
              : 'bg-transparent border-transparent text-white/80 hover:text-white hover:bg-white/10'
              }`}
          >
            <Layers className="h-4 w-4 shrink-0" />
            <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isSidebarCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'}`}>应用管理</span>
          </button>

          <button
            onClick={() => setActiveTab('widgets')}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-300 text-left cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''} ${activeTab === 'widgets'
              ? 'bg-zpje-accent border-transparent text-white shadow-sm'
              : 'bg-transparent border-transparent text-white/80 hover:text-white hover:bg-white/10'
              }`}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isSidebarCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'}`}>Widget 配置</span>
          </button>

          {isSystemAdmin && (
            <button
              onClick={() => {
                setActiveTab('members');
                setMemberSearch('');
                setMemberSearchResults([]);
              }}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-300 text-left cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''} ${activeTab === 'members'
                ? 'bg-zpje-accent border-transparent text-white shadow-sm'
                : 'bg-transparent border-transparent text-white/80 hover:text-white hover:bg-white/10'
                }`}
            >
              <Shield className="h-4 w-4 shrink-0" />
              <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isSidebarCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'}`}>管理员分配</span>
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab('stats');
              setCurrentPage(1);
            }}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-300 text-left cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''} ${activeTab === 'stats'
              ? 'bg-zpje-accent border-transparent text-white shadow-sm'
              : 'bg-transparent border-transparent text-white/80 hover:text-white hover:bg-white/10'
              }`}
          >
            <BarChart3 className="h-4 w-4 shrink-0" />
            <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isSidebarCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'}`}>审计与统计</span>
          </button>
        </nav>

        {/* Footer controls with Collapse Toggle */}
        <div className={`p-4 border-t border-white/10 flex flex-col gap-2 transition-all duration-300 ${isSidebarCollapsed && 'items-center px-2'} shrink-0`}>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3 px-2 py-1.5 text-sm text-white/70 transition-all duration-300">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="truncate">系统运行正常</span>
            </div>
          )}
          {isSidebarCollapsed && (
            <div className="h-8 w-8 flex items-center justify-center rounded-md text-white/75 hover:text-white hover:bg-white/10 transition-all cursor-pointer" title="系统运行正常">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          )}

          <button
            onClick={toggleSidebarCollapse}
            className={`flex items-center justify-center rounded-lg text-white/75 hover:text-white hover:bg-white/10 transition-all cursor-pointer h-8 w-full border border-transparent ${isSidebarCollapsed ? 'w-8' : 'px-2 justify-start gap-3'}`}
            title={isSidebarCollapsed ? '展开菜单' : '收起菜单'}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span className="text-xs font-semibold whitespace-nowrap">收起菜单</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Right Content Pane */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Right Header */}
        <header className="w-full border-b border-card-border bg-nav-bg backdrop-blur-md transition-colors duration-200 h-16 shrink-0 z-40 flex items-center justify-between px-6 md:px-10">
          <div className="flex items-center gap-2 text-sm font-bold text-text-sec">
            <span className="text-title">管理后台</span>
            <span className="text-text-sec/50">/</span>
            <span className="text-text-sec">
              {activeTab === 'apps' ? '应用管理' :
                activeTab === 'widgets' ? 'Widget 配置' :
                  activeTab === 'members' ? '管理员分配' : '审计与统计'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme switcher */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl bg-card-surface border border-card-border text-title hover:bg-sidebar-hover flex items-center justify-center transition-all cursor-pointer"
                title={theme === 'light' ? '切换至暗色模式' : '切换至亮色模式'}
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            )}

            {/* Return to Portal Button next to Theme Toggle */}
            <a
              href="/"
              className="px-4 py-2 rounded-xl bg-card-surface border border-card-border hover:bg-sidebar-hover text-text-sec hover:text-title flex items-center gap-1.5 transition-all text-sm font-semibold cursor-pointer shrink-0"
              title="返回门户"
            >
              <Home className="w-4 h-4" />
              <span>返回门户</span>
            </a>

            {/* Hover details user status badge */}
            <div className="relative group/user">
              <div className="px-4 py-2 rounded-xl bg-card-surface border border-card-border flex items-center gap-3 transition-all hover:bg-sidebar-hover cursor-default">
                <div className="relative flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-emerald-400/50 animate-pulse" />
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping bg-emerald-400" />
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-text-sec" />
                  <span className="text-sm font-semibold text-title">
                    {userInfo?.name || userId}
                  </span>
                </div>
              </div>

              {/* Hover Popover Detail Card */}
              {userInfo && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-card-surface border border-card-border rounded-2xl shadow-xl p-4 text-text-main opacity-0 invisible group-hover/user:opacity-100 group-hover/user:visible transition-all duration-200 z-50">
                  <div className="flex flex-col gap-3">
                    <div className="border-b border-card-border pb-2 flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-zpje-brand/10 text-zpje-brand flex items-center justify-center font-bold text-sm">
                        {userInfo.name.slice(-2)}
                      </div>
                      <div>
                        <h4 className="font-bold text-title text-sm">{userInfo.name}</h4>
                        <span className="text-xs text-text-sec font-mono">@{userInfo.loginName}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-text-sec shrink-0">所属单位:</span>
                        <span className="text-title text-right font-medium">{userInfo.unitName}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-text-sec shrink-0">所属部门:</span>
                        <span className="text-title text-right font-medium">{userInfo.deptName}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-text-sec shrink-0">权限角色:</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold border bg-red-500/10 text-red-500 border-red-500/20">
                          管理员
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 flex items-center gap-2 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="退出登录"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLoggingOut ? '注销中...' : '退出'}</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Workspace */}
        <div className="flex-1 overflow-y-auto w-full px-6 md:px-10 py-8 flex flex-col gap-8 max-w-[1800px]">

          {/* Tab 1: Apps Management */}
          {activeTab === 'apps' && (
            <>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-card-border pb-6 shrink-0">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-title">应用管理中心</h1>
                  <p className="text-sm text-text-sec mt-1">控制应用显隐及分发策略，支持配置维护模式与精细化部门/角色的可见性隔离。</p>
                </div>

                <button
                  onClick={openAddModal}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zpje-accent text-white hover:opacity-90 transition-all text-sm font-bold shadow-sm cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>新增应用</span>
                </button>
              </div>

              <div className="bg-card-surface rounded-lg border border-card-border overflow-hidden shadow-sm transition-colors duration-200">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-sidebar-hover/40 border-b border-card-border text-text-sec font-medium">
                      <th className="p-4 w-16 text-center">排序</th>
                      <th className="p-4">应用名称 / 键标识</th>
                      <th className="p-4">所属部门</th>
                      <th className="p-4">入口 URL</th>
                      <th className="p-4">可见范围 / 权限策略</th>
                      <th className="p-4 w-32 text-center">状态</th>
                      <th className="p-4 w-28 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.length > 0 ? (
                      apps.map((app) => (
                        <tr key={app.id} className="border-b border-card-border hover:bg-sidebar-hover/20 transition-colors">
                          <td className="p-4 text-center font-mono text-text-sec/80">{app.sortOrder}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded bg-sidebar-hover text-text-sec flex items-center justify-center w-8 h-8 shrink-0">
                                {renderIcon(app.icon)}
                              </div>
                              <div>
                                <div className="font-semibold text-title">{app.name}</div>
                                <div className="text-xs font-mono text-text-sec">{app.key}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-text-sec font-medium">
                            {app.mainDept?.name || <span className="text-text-sec/50 italic">通用应用</span>}
                          </td>
                          <td className="p-4">
                            <div className="truncate max-w-[240px] text-text-sec font-mono text-xs">{app.url}</div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1.5">
                              {app.visibleToAll ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                                  <Eye className="w-3.5 h-3.5" />
                                  所有人可见
                                </span>
                              ) : (
                                <div className="flex flex-col gap-1">
                                  <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 font-semibold">
                                    <EyeOff className="w-3.5 h-3.5" />
                                    权限受限
                                  </span>
                                  <span className="text-[10px] text-text-sec block max-w-xs truncate">
                                    {`关联角色数: ${app.roleIds?.length || 0} | 关联部门数: ${app.deptIds?.length || 0}`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              {app.isMaintenance ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  维护中
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  正常
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditModal(app)}
                                className="p-1.5 rounded hover:bg-sidebar-hover text-text-sec hover:text-title transition-colors"
                                title="编辑"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`确定要删除应用 “${app.name}” 吗？`)) {
                                    handleDelete(app.id);
                                  }
                                }}
                                disabled={isDeleting === app.id}
                                className="p-1.5 rounded hover:bg-red-500/10 text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-text-sec italic bg-card-surface">
                          暂无注册应用，请点击“新增应用”开始配置。
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Tab 2: Widget Configuration */}
          {activeTab === 'widgets' && (
            <>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-card-border pb-6 shrink-0">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-title">数据看板 Widget 配置</h1>
                  <p className="text-sm text-text-sec mt-1">在门户首页引入子系统的微缩视图，支持网页 iframe 嵌入或对接标准 API 异步渲染指标格。</p>
                </div>

                <button
                  onClick={openAddWidgetModal}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zpje-accent text-white hover:opacity-90 transition-all text-sm font-bold shadow-sm cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>新增 Widget</span>
                </button>
              </div>

              <div className="bg-card-surface rounded-lg border border-card-border overflow-hidden shadow-sm transition-colors duration-200">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-sidebar-hover/40 border-b border-card-border text-text-sec font-medium">
                      <th className="p-4 w-16 text-center">排序</th>
                      <th className="p-4">看板标题 / 类型</th>
                      <th className="p-4">数据源 URL (API 端点 / 网页)</th>
                      <th className="p-4">网格跨度 (列数)</th>
                      <th className="p-4">关联子应用</th>
                      <th className="p-4 w-28 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {widgets.length > 0 ? (
                      widgets.map((w) => (
                        <tr key={w.id} className="border-b border-card-border hover:bg-sidebar-hover/20 transition-colors">
                          <td className="p-4 text-center font-mono text-text-sec/80">{w.sortOrder}</td>
                          <td className="p-4">
                            <div className="font-semibold text-title">{w.title}</div>
                            <div className="text-xs text-text-sec font-mono mt-0.5">
                              {w.type === 'api' ? 'API 异步渲染格' : '网页 Iframe'}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="truncate max-w-[360px] text-text-sec font-mono text-xs" title={w.url}>
                              {w.url}
                            </div>
                          </td>
                          <td className="p-4 font-mono text-xs">
                            {w.widthClass === 'col-span-3' ? 'col-span-3 (整行)' :
                              w.widthClass === 'col-span-2' ? 'col-span-2 (2/3 行)' : 'col-span-1 (1/3 行)'}
                          </td>
                          <td className="p-4 text-text-sec font-medium text-xs">
                            {w.appName || <span className="italic text-text-sec/60">未绑定</span>}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditWidgetModal(w)}
                                className="p-1.5 rounded hover:bg-sidebar-hover text-text-sec hover:text-title transition-colors"
                                title="编辑 Widget"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`确定要删除看板 “${w.title}” 吗？`)) {
                                    handleWidgetDelete(w.id);
                                  }
                                }}
                                disabled={isDeletingWidget === w.id}
                                className="p-1.5 rounded hover:bg-red-500/10 text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                                title="删除 Widget"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-text-sec italic bg-card-surface">
                          暂无配置的 Widget 看板，请点击“新增 Widget”开始创建。
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Tab 3: Admin Allocation (SYS_ADMIN only) */}
          {activeTab === 'members' && isSystemAdmin && (
            <>
              <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-bold tracking-tight text-title">管理员权限分配</h1>
                <p className="text-sm text-text-sec">搜索并授权组织内员工成为系统管理员、运维管理员或部门管理员。仅系统管理员拥有此分配权。</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
                {/* Search Pane */}
                <div className="bg-card-surface border border-card-border p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
                  <h4 className="font-bold text-title text-sm border-b border-card-border pb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-zpje-brand" />
                    搜索并添加管理员
                  </h4>

                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-sec" />
                      <input
                        type="text"
                        placeholder="输入姓名或登录账号搜索..."
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
                      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto border border-card-border rounded-xl p-2 bg-sidebar-hover/10">
                        {memberSearchResults.map(m => (
                          <div key={m.id} className="p-2 rounded-lg bg-card-surface border border-card-border flex items-center justify-between gap-3 text-xs">
                            <div className="truncate min-w-0">
                              <div className="font-bold text-title">{m.name}</div>
                              <div className="text-[10px] text-text-sec font-mono">@{m.loginName}</div>
                              <div className="text-[10px] text-text-sec/80 truncate">{m.unitName} - {m.deptName}</div>
                            </div>

                            <select
                              onChange={(e) => handleAdminTypeChange(m.id, e.target.value as any, m)}
                              defaultValue="NONE"
                              className="px-2 py-1 rounded border border-input-border bg-canvas text-title text-[10px] font-semibold focus:outline-none shrink-0"
                            >
                              <option value="NONE">普通员工</option>
                              <option value="SYS_ADMIN">系统管理员</option>
                              <option value="OPS_ADMIN">运维管理员</option>
                              <option value="DEPT_ADMIN">部门管理员</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    ) : memberSearch.trim() !== '' ? (
                      <div className="text-center py-6 text-xs text-text-sec italic">未找到匹配的在职员工</div>
                    ) : (
                      <div className="text-center py-6 text-[10px] text-text-sec italic">在上方输入字符即可检索 6000+ OA 关联员工</div>
                    )}
                  </div>
                </div>

                {/* Administrators Table */}
                <div className="lg:col-span-2 bg-card-surface border border-card-border rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-card-border bg-sidebar-hover/20 flex items-center justify-between">
                    <h4 className="font-bold text-title text-sm">当前管理员列表 ({adminMembers.length})</h4>
                  </div>

                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-sidebar-hover/40 border-b border-card-border text-text-sec font-semibold">
                        <th className="p-3">姓名 / 账号</th>
                        <th className="p-3">所属单位与部门</th>
                        <th className="p-3 w-44">管理员类型角色</th>
                        <th className="p-3 w-20 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminMembers.length > 0 ? (
                        adminMembers.map((admin) => (
                          <tr key={admin.id} className="border-b border-card-border hover:bg-sidebar-hover/10 transition-colors">
                            <td className="p-3">
                              <div className="font-bold text-title">{admin.name}</div>
                              <div className="text-[10px] font-mono text-text-sec">@{admin.loginName}</div>
                            </td>
                            <td className="p-3 text-text-sec">
                              <div>{admin.unitName}</div>
                              <div className="text-[10px] mt-0.5">{admin.deptName}</div>
                            </td>
                            <td className="p-3">
                              <select
                                value={admin.adminType}
                                onChange={(e) => handleAdminTypeChange(admin.id, e.target.value as any)}
                                className={`px-3 py-1 rounded-full border text-[10px] font-bold outline-none cursor-pointer ${admin.adminType === 'SYS_ADMIN' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                  admin.adminType === 'OPS_ADMIN' ? 'bg-zpje-brand/10 text-zpje-brand border-zpje-brand/20' :
                                    'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                  }`}
                              >
                                <option value="SYS_ADMIN" className="bg-card-surface text-title">系统管理员</option>
                                <option value="OPS_ADMIN" className="bg-card-surface text-title">运维管理员</option>
                                <option value="DEPT_ADMIN" className="bg-card-surface text-title">部门管理员</option>
                                <option value="NONE" className="bg-card-surface text-red-500 font-bold">撤销管理员 (NONE)</option>
                              </select>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  if (window.confirm(`确认撤销管理员 “${admin.name}” 的全部特权吗？`)) {
                                    handleAdminTypeChange(admin.id, 'NONE');
                                  }
                                }}
                                className="text-red-500 hover:text-red-600 font-semibold"
                              >
                                撤销
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-text-sec italic bg-card-surface">
                            暂无人工授权的管理员角色。
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Tab 4: Access stats and audits */}
          {activeTab === 'stats' && (
            <>
              {/* Stats & Audit Sub-tabs Selector */}
              <div className="flex border-b border-card-border pb-3 mb-6 gap-6 shrink-0">
                <button
                  onClick={() => setStatsSubTab('access')}
                  className={`pb-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${statsSubTab === 'access'
                    ? 'border-zpje-accent text-zpje-accent'
                    : 'border-transparent text-text-sec hover:text-title'
                    }`}
                >
                  用户访问审计与统计
                </button>
                <button
                  onClick={() => {
                    setStatsSubTab('system');
                    setSystemLogPage(1);
                  }}
                  className={`pb-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${statsSubTab === 'system'
                    ? 'border-zpje-accent text-zpje-accent'
                    : 'border-transparent text-text-sec hover:text-title'
                    }`}
                >
                  系统操作与审计日志
                </button>
              </div>

              {statsSubTab === 'access' ? (
                <>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex flex-col gap-1.5">
                      <h1 className="text-2xl font-bold tracking-tight text-title">系统访问统计</h1>
                      <p className="text-sm text-text-sec">审计用户点击访问日志，分析子系统活跃热度和安全访问量。</p>
                    </div>

                    {/* Time filters */}
                    <div className="flex bg-sidebar-hover/40 p-1 rounded-lg border border-card-border shrink-0">
                      {(['24h', '7d', '30d', 'all'] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => {
                            setTimeFilter(f);
                            setCurrentPage(1);
                          }}
                          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${timeFilter === f
                            ? 'bg-card-surface text-title shadow-sm'
                            : 'text-text-sec hover:text-title'
                            }`}
                        >
                          {f === '24h' ? '近 24 小时' : f === '7d' ? '近 7 天' : f === '30d' ? '近 30 天' : '全部'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Metric Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-card-surface border border-card-border p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                      <div className="p-3 bg-zpje-brand/10 text-zpje-brand rounded-xl">
                        <MousePointerClick className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs text-text-sec">系统总访问点击量</span>
                        <h3 className="text-2xl font-extrabold text-title mt-0.5 font-mono">{totalVisits}</h3>
                      </div>
                    </div>
                    <div className="bg-card-surface border border-card-border p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                      <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-xl">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs text-text-sec">活跃访问账号数</span>
                        <h3 className="text-2xl font-extrabold text-title mt-0.5 font-mono">{activeUsersCount}</h3>
                      </div>
                    </div>
                    <div className="bg-card-surface border border-card-border p-5 rounded-2xl flex items-center gap-4 shadow-sm">
                      <div className="p-3 bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded-xl">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs text-text-sec">最热门访问子系统</span>
                        <h3 className="text-lg font-bold text-title mt-1 truncate max-w-[200px]" title={topApp}>{topApp}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Split layout: Rank bar chart + Logs table */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">

                    {/* CSS Progress Rank Chart */}
                    <div className="bg-card-surface border border-card-border p-5 rounded-2xl flex flex-col gap-6 shadow-sm">
                      <div className="flex items-center gap-2 border-b border-card-border pb-3">
                        <BarChart3 className="w-4 h-4 text-zpje-brand" />
                        <h4 className="font-bold text-title text-sm">系统访问排行</h4>
                      </div>

                      <div className="flex flex-col gap-4">
                        {rankList.length > 0 ? (
                          rankList.map((item, idx) => {
                            const pct = Math.round((item.count / maxCount) * 100);
                            return (
                              <div key={item.name} className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between text-xs font-semibold">
                                  <span className="text-title truncate max-w-[200px] flex gap-1.5">
                                    <span className="text-text-sec font-mono">#{idx + 1}</span>
                                    {item.name}
                                  </span>
                                  <span className="text-text-sec font-mono">{item.count} 次</span>
                                </div>
                                <div className="w-full bg-sidebar-hover h-2.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-zpje-brand h-full rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-10 text-xs text-text-sec italic">
                            暂无访问点击数据。
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Log Records Table */}
                    <div className="lg:col-span-2 bg-card-surface border border-card-border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between min-h-[500px]">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-sidebar-hover/40 border-b border-card-border text-text-sec font-semibold">
                              <th className="p-3 w-40">时间</th>
                              <th className="p-3 w-32">用户姓名</th>
                              <th className="p-3 w-32">用户登录名</th>
                              <th className="p-3 w-40">访问系统</th>
                              <th className="p-3 w-32">来源 IP</th>
                              <th className="p-3">浏览器终端 (UserAgent)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedLogs.length > 0 ? (
                              paginatedLogs.map((log) => (
                                <tr key={log.id} className="border-b border-card-border hover:bg-sidebar-hover/10 transition-colors">
                                  <td className="p-3 text-text-sec font-mono whitespace-nowrap">
                                    {new Date(log.timestamp).toLocaleString('zh-CN', { hour12: false })}
                                  </td>
                                  <td className="p-3 font-semibold text-title">{log.userName || <span className="text-text-sec/40 italic">未知</span>}</td>
                                  <td className="p-3 text-text-sec font-mono">{log.loginName}</td>
                                  <td className="p-3">
                                    <div className="font-semibold text-title">{log.app?.name}</div>
                                    <div className="text-[10px] font-mono text-text-sec">{log.app?.key}</div>
                                  </td>
                                  <td className="p-3 text-text-sec font-mono">{log.ip || '未知'}</td>
                                  <td className="p-3 text-text-sec max-w-xs truncate" title={log.userAgent || ''}>
                                    {log.userAgent || '-'}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="p-12 text-center text-text-sec italic bg-card-surface">
                                  筛选期间内暂无审计日志。
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="p-3 border-t border-card-border bg-sidebar-hover/20 flex items-center justify-between text-xs">
                          <span className="text-text-sec">
                            显示第 {(currentPage - 1) * itemsPerPage + 1} 到 {Math.min(currentPage * itemsPerPage, filteredLogs.length)} 条，共 {filteredLogs.length} 条记录
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="p-1.5 rounded border border-input-border bg-card-surface hover:bg-sidebar-hover disabled:opacity-40 disabled:cursor-not-allowed text-title"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-3 font-bold text-title">
                              {currentPage} / {totalPages}
                            </span>
                            <button
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              className="p-1.5 rounded border border-input-border bg-card-surface hover:bg-sidebar-hover disabled:opacity-40 disabled:cursor-not-allowed text-title"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </>
              ) : (
                // statsSubTab === 'system': System operations & audit logs
                <div className="flex flex-col gap-6">
                  {/* Title & Filter Bar */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-card-border pb-5">
                    <div>
                      <h2 className="text-xl font-bold text-title">系统操作与审计日志</h2>
                      <p className="text-xs text-text-sec mt-1">审计用户单点登录、登出、以及管理员的应用管理、Widget配置和特权管理员分配记录。</p>
                    </div>

                    {/* Filters: Search & Type Select */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Search box */}
                      <div className="relative min-w-[240px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sec" />
                        <input
                          type="text"
                          placeholder="搜索操作人、登录名或详情..."
                          value={systemLogSearch}
                          onChange={(e) => {
                            setSystemLogSearch(e.target.value);
                            setSystemLogPage(1);
                          }}
                          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-card-border bg-card-surface text-title focus:outline-none focus:border-zpje-accent transition-colors"
                        />
                        {systemLogSearch && (
                          <button
                            onClick={() => {
                              setSystemLogSearch('');
                              setSystemLogPage(1);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sec hover:text-title"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Log Type Select */}
                      <select
                        value={logTypeFilter}
                        onChange={(e) => {
                          setLogTypeFilter(e.target.value);
                          setSystemLogPage(1);
                        }}
                        className="px-3 py-2 text-xs rounded-xl border border-card-border bg-card-surface text-title focus:outline-none focus:border-zpje-accent cursor-pointer"
                      >
                        <option value="all">所有日志类型</option>
                        <option value="SSO_LOGIN">用户单点登录 (SSO)</option>
                        <option value="LOGOUT">用户退出登录</option>
                        <option value="APP_ACCESS">子系统访问记录</option>
                        <option value="APP_MANAGE">应用管理操作</option>
                        <option value="WIDGET_MANAGE">Widget配置操作</option>
                        <option value="ADMIN_MANAGE">管理员分配操作</option>
                      </select>
                    </div>
                  </div>

                  {/* Log Records Table */}
                  <div className="bg-card-surface border border-card-border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between min-h-[500px]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-sidebar-hover/40 border-b border-card-border text-text-sec font-semibold font-mono">
                            <th className="p-3 w-40">发生时间</th>
                            <th className="p-3 w-48">操作人 (登录名)</th>
                            <th className="p-3 w-36">日志类型</th>
                            <th className="p-3">操作描述详情</th>
                            <th className="p-3 w-32">来源 IP</th>
                            <th className="p-3 w-44">浏览器终端 (UserAgent)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedSystemLogs.length > 0 ? (
                            paginatedSystemLogs.map((log) => {
                              // Style tag for action type
                              let typeColor = "bg-gray-500/10 text-gray-500 border-gray-500/20";
                              let typeText = log.actionType;
                              if (log.actionType === 'SSO_LOGIN') {
                                typeColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400";
                                typeText = "单点登录";
                              } else if (log.actionType === 'LOGOUT') {
                                typeColor = "bg-gray-500/10 text-text-sec border-card-border";
                                typeText = "退出登录";
                              } else if (log.actionType === 'APP_ACCESS') {
                                typeColor = "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400";
                                typeText = "子系统访问";
                              } else if (log.actionType === 'APP_MANAGE') {
                                typeColor = "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400";
                                typeText = "应用管理";
                              } else if (log.actionType === 'WIDGET_MANAGE') {
                                typeColor = "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400";
                                typeText = "Widget配置";
                              } else if (log.actionType === 'ADMIN_MANAGE') {
                                typeColor = "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400 font-bold";
                                typeText = "管理员分配";
                              }

                              return (
                                <tr key={log.id} className="border-b border-card-border hover:bg-sidebar-hover/10 transition-colors">
                                  <td className="p-3 text-text-sec font-mono whitespace-nowrap">
                                    {new Date(log.timestamp).toLocaleString('zh-CN', { hour12: false })}
                                  </td>
                                  <td className="p-3">
                                    <div className="font-semibold text-title">
                                      {log.userName || <span className="text-text-sec/40 italic">系统用户</span>}
                                    </div>
                                    <div className="text-[10px] font-mono text-text-sec">@{log.loginName}</div>
                                  </td>
                                  <td className="p-3">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] border ${typeColor}`}>
                                      {typeText}
                                    </span>
                                  </td>
                                  <td className="p-3 font-medium text-title max-w-sm truncate" title={log.detail}>
                                    {log.detail}
                                  </td>
                                  <td className="p-3 text-text-sec font-mono">{log.ip || '未知'}</td>
                                  <td className="p-3 text-text-sec max-w-xs truncate" title={log.userAgent || ''}>
                                    {log.userAgent || '-'}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-12 text-center text-text-sec italic bg-card-surface">
                                暂无匹配的系统审计日志。
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalLogPages > 1 && (
                      <div className="p-3 border-t border-card-border bg-sidebar-hover/20 flex items-center justify-between text-xs">
                        <span className="text-text-sec">
                          显示第 {(systemLogPage - 1) * logsPerPage + 1} 到 {Math.min(systemLogPage * logsPerPage, filteredSystemLogs.length)} 条，共 {filteredSystemLogs.length} 条记录
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSystemLogPage(p => Math.max(1, p - 1))}
                            disabled={systemLogPage === 1}
                            className="p-1.5 rounded border border-input-border bg-card-surface hover:bg-sidebar-hover disabled:opacity-40 disabled:cursor-not-allowed text-title"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="px-3 font-bold text-title">
                            {systemLogPage} / {totalLogPages}
                          </span>
                          <button
                            onClick={() => setSystemLogPage(p => Math.min(totalLogPages, p + 1))}
                            disabled={systemLogPage === totalLogPages}
                            className="p-1.5 rounded border border-input-border bg-card-surface hover:bg-sidebar-hover disabled:opacity-40 disabled:cursor-not-allowed text-title"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* App Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-card-surface rounded-lg border border-card-border shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 text-text-main">
            <div className="px-6 py-4 border-b border-card-border flex items-center justify-between bg-sidebar-hover/10">
              <h2 className="text-lg font-bold text-title">
                {editingApp ? '编辑应用' : '新增应用'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-sidebar-hover text-text-sec hover:text-title transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                {errorMessage && (
                  <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-start gap-2">
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
                      className="px-3 py-2 rounded border border-input-border bg-card-surface text-title text-sm focus:outline-none focus:ring-1 focus:ring-title focus:border-title disabled:bg-sidebar-hover font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                      应用名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="例如: 能碳管理平台"
                      className="px-3 py-2 rounded border border-input-border bg-card-surface text-title text-sm focus:outline-none focus:ring-1 focus:ring-title focus:border-title"
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
                    className="px-3 py-2 rounded border border-input-border bg-card-surface text-title text-sm focus:outline-none focus:ring-1 focus:ring-title focus:border-title font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                    应用简介
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="简短描述该系统的主要功能"
                    rows={2}
                    className="px-3 py-2 rounded border border-input-border bg-card-surface text-title text-sm focus:outline-none focus:ring-1 focus:ring-title focus:border-title resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                      图标预设 (Icon)
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-10 h-10 rounded border border-input-border bg-card-surface text-title shrink-0">
                        {renderIcon(icon, "w-5 h-5")}
                      </div>
                      <select
                        value={icon}
                        onChange={(e) => setIcon(e.target.value)}
                        className="flex-1 px-3 py-2 rounded border border-input-border bg-card-surface text-title text-sm focus:outline-none focus:ring-1 focus:ring-title focus:border-title font-mono h-10 cursor-pointer"
                      >
                        {ICON_PRESETS.map((iconName) => (
                          <option key={iconName} value={iconName} className="bg-card-surface text-title font-mono">
                            {iconName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                      排序权值 (正整数)
                    </label>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(Number(e.target.value))}
                      className="px-3 py-2 rounded border border-input-border bg-card-surface text-title text-sm focus:outline-none focus:ring-1 focus:ring-title focus:border-title font-mono h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                      所属单位 <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={selectedUnitId}
                      onChange={(e) => handleUnitChange(e.target.value)}
                      className="px-3 py-2 rounded border border-input-border bg-card-surface text-title text-sm focus:outline-none focus:ring-1 focus:ring-title focus:border-title h-10 cursor-pointer"
                    >
                      <option value="" className="bg-card-surface text-title">-- 请选择所属单位 --</option>
                      {departmentsTree
                        .filter((unit) => unit.departments.length > 0)
                        .map((unit) => (
                          <option key={unit.id} value={unit.id} className="text-title bg-card-surface">
                            {unit.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                      所属部门
                    </label>
                    <select
                      value={mainDeptId}
                      onChange={(e) => setMainDeptId(e.target.value)}
                      disabled={!selectedUnitId}
                      className="px-3 py-2 rounded border border-input-border bg-card-surface text-title text-sm focus:outline-none focus:ring-1 focus:ring-title focus:border-title h-10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="" className="bg-card-surface text-title">-- 请选择所属部门 (允许为空) --</option>
                      {selectedUnitId &&
                        departmentsTree
                          .find((u) => u.id === selectedUnitId)
                          ?.departments.map((dept) => (
                            <option key={dept.id} value={dept.id} className="text-title bg-card-surface">
                              {dept.name}
                            </option>
                          ))}
                    </select>
                  </div>
                </div>

                {/* RBAC Visibility Permissions Group */}
                <div className="border-t border-card-border pt-4 mt-2 flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-zpje-brand" />
                    <span className="font-bold text-title text-sm">应用权限与可见性隔离</span>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-lg border border-card-border bg-sidebar-hover/20">
                    <input
                      type="checkbox"
                      id="visibleToAll"
                      checked={visibleToAll}
                      onChange={(e) => setVisibleToAll(e.target.checked)}
                      className="w-4 h-4 accent-title cursor-pointer"
                    />
                    <label htmlFor="visibleToAll" className="text-xs font-bold cursor-pointer select-none text-title">
                      所有员工免检可见 (勾选后对所有登录人员开放，无需分配细分角色/部门权限)
                    </label>
                  </div>

                  {!visibleToAll && (
                    <div className="grid grid-cols-2 gap-4 border border-card-border rounded-xl p-3 bg-sidebar-hover/10 animate-in fade-in duration-200">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-text-sec uppercase tracking-wider">分配给角色可见:</span>
                        <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto border border-card-border bg-card-surface rounded-lg p-2.5">
                          {roles.map(role => (
                            <label key={role.id} className="flex items-center gap-2 cursor-pointer text-xs text-title font-medium">
                              <input
                                type="checkbox"
                                checked={selectedRoleIds.includes(role.id)}
                                onChange={() => toggleRoleSelection(role.id)}
                                className="w-3.5 h-3.5 accent-title"
                              />
                              <span>{role.name} ({role.key})</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-text-sec uppercase tracking-wider">分配给部门可见:</span>
                        <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto border border-card-border bg-card-surface rounded-lg p-2.5">
                          {departmentsTree.map(unit => (
                            <div key={unit.id} className="flex flex-col gap-1">
                              <span className="text-[9px] font-bold text-text-sec/60">{unit.name}</span>
                              {unit.departments.map(dept => (
                                <label key={dept.id} className="flex items-center gap-2 cursor-pointer text-xs text-title font-medium pl-1.5">
                                  <input
                                    type="checkbox"
                                    checked={selectedDeptIds.includes(dept.id)}
                                    onChange={() => toggleDeptSelection(dept.id)}
                                    className="w-3.5 h-3.5 accent-title"
                                  />
                                  <span>{dept.name}</span>
                                </label>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Maintenance switch */}
                <div className="flex items-center gap-3 p-3 rounded-lg border border-card-border bg-sidebar-hover/40 mt-2">
                  <input
                    type="checkbox"
                    id="isMaintenance"
                    checked={isMaintenance}
                    onChange={(e) => setIsMaintenance(e.target.checked)}
                    className="w-4 h-4 accent-title cursor-pointer"
                  />
                  <label htmlFor="isMaintenance" className="text-sm font-semibold cursor-pointer select-none text-title">
                    开启维护模式 (阻断跳转访问)
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-card-border bg-sidebar-hover/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-input-border bg-card-surface hover:bg-sidebar-hover transition-colors text-xs font-bold text-title"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-full bg-title text-card-surface hover:opacity-90 transition-colors text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <span>保存中...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>确认保存</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Widget Form Modal */}
      {isWidgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-card-surface rounded-lg border border-card-border shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 text-text-main">
            <div className="px-6 py-4 border-b border-card-border flex items-center justify-between bg-sidebar-hover/10">
              <h2 className="text-lg font-bold text-title">
                {editingWidget ? '编辑 Widget 看板' : '新增 Widget 看板'}
              </h2>
              <button
                onClick={() => setIsWidgetModalOpen(false)}
                className="p-1 rounded-full hover:bg-sidebar-hover text-text-sec hover:text-title"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWidgetSubmit}>
              <div className="p-6 flex flex-col gap-4">
                {widgetError && (
                  <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{widgetError}</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                    看板标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={widgetTitle}
                    onChange={(e) => setWidgetTitle(e.target.value)}
                    placeholder="例如: 能源平台实时负荷"
                    className="px-3 py-2 rounded border border-input-border bg-card-surface text-title text-sm focus:outline-none focus:ring-1 focus:ring-title focus:border-title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                      展现形式 (Type)
                    </label>
                    <select
                      value={widgetType}
                      onChange={(e) => setWidgetType(e.target.value)}
                      className="px-3 py-2 rounded border border-input-border bg-card-surface text-title text-sm focus:outline-none focus:ring-1 focus:ring-title focus:border-title"
                    >
                      <option value="api">API 异步指标格</option>
                      <option value="iframe">网页 Iframe 嵌入</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                      关联子系统 (可选)
                    </label>
                    <select
                      value={widgetAppId}
                      onChange={(e) => setWidgetAppId(e.target.value)}
                      className="px-3 py-2 rounded border border-input-border bg-card-surface text-title text-sm focus:outline-none focus:ring-1 focus:ring-title focus:border-title"
                    >
                      <option value="">-- 不绑定 --</option>
                      {apps.map(app => (
                        <option key={app.id} value={app.id}>{app.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                    {widgetType === 'api' ? '数据接口端点 (API Endpoint)' : '网页链接 (URL)'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={widgetUrl}
                    onChange={(e) => setWidgetUrl(e.target.value)}
                    placeholder={widgetType === 'api' ? '如: /api/widgets/mock?key=carbon' : '如: https://oa.izpje.com/stats'}
                    className="px-3 py-2 rounded border border-input-border bg-card-surface text-title text-sm focus:outline-none focus:ring-1 focus:ring-title focus:border-title font-mono"
                  />
                  <p className="text-[10px] text-text-sec leading-relaxed">
                    {widgetType === 'api'
                      ? '支持接口异步渲染。API 应返回 standard JSON: { "metrics": [ { "label": "名称", "value": "数据", "change": "趋势", "trend": "up/down/stable" } ] }'
                      : '通过嵌入 iframe 技术在门户主板上完美呈现外部系统的可视化大屏网页。'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                      横向占比 (Grid Width)
                    </label>
                    <select
                      value={widgetWidthClass}
                      onChange={(e) => setWidgetWidthClass(e.target.value)}
                      className="px-3 py-2 rounded border border-input-border bg-card-surface text-title text-sm focus:outline-none focus:ring-1 focus:ring-title focus:border-title"
                    >
                      <option value="col-span-1">col-span-1 (占 1/3 宽度)</option>
                      <option value="col-span-2">col-span-2 (占 2/3 宽度)</option>
                      <option value="col-span-3">col-span-3 (整行铺满)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                      排序权值 (正整数)
                    </label>
                    <input
                      type="number"
                      value={widgetSortOrder}
                      onChange={(e) => setWidgetSortOrder(Number(e.target.value))}
                      className="px-3 py-2 rounded border border-input-border bg-card-surface text-title text-sm focus:outline-none focus:ring-1 focus:ring-title focus:border-title font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-card-border bg-sidebar-hover/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsWidgetModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-input-border bg-card-surface hover:bg-sidebar-hover transition-colors text-xs font-bold text-title"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={widgetSubmitting}
                  className="px-5 py-2 rounded-full bg-title text-card-surface hover:opacity-90 transition-colors text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
                >
                  {widgetSubmitting ? (
                    <span>保存中...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>确认保存</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
