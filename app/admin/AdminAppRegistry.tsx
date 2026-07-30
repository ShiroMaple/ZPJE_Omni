'use client';

import React, { useState } from 'react';
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
  Monitor
} from 'lucide-react';

interface DBApp {
  id: string;
  key: string;
  name: string;
  description: string | null;
  url: string;
  icon: string | null;
  category: string;
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

interface AdminAppRegistryProps {
  initialApps: DBApp[];
  departmentsTree: UnitOption[];
  accessLogs: AccessLog[];
  roles: RoleOption[];
  initialWidgets: WidgetConfig[];
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
  initialWidgets 
}: AdminAppRegistryProps) {
  const [apps, setApps] = useState<DBApp[]>(initialApps);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(initialWidgets);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<DBApp | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'apps' | 'stats' | 'widgets'>('apps');

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
  const [category, setCategory] = useState('通用应用');
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

  const openAddModal = () => {
    setEditingApp(null);
    setKey('');
    setName('');
    setDescription('');
    setUrl('');
    setIcon('LayoutDashboard');
    setCategory('通用应用');
    setIsMaintenance(false);
    setSortOrder(0);
    setMainDeptId('');
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
    setCategory(app.category);
    setIsMaintenance(app.isMaintenance);
    setSortOrder(app.sortOrder);
    setMainDeptId(app.mainDeptId || '');
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
        category,
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

  return (
    <div className="min-h-screen bg-canvas text-text-main font-sans transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card-surface border-b border-card-border shadow-sm transition-colors duration-200">
        <div className="max-w-[1800px] w-full mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded bg-white overflow-hidden border border-card-border">
              <img src="/logo_zpje.jpg" alt="建安万维" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-bold tracking-tight text-title">建安万维 管理后台</span>
            <span className="text-xs px-2 py-0.5 rounded bg-sidebar-hover text-text-sec font-medium">配置面板</span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Tab switchers in header */}
            <div className="flex bg-sidebar-hover/40 p-1 rounded-full border border-card-border">
              <button
                onClick={() => setActiveTab('apps')}
                className={`px-4 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'apps' 
                    ? 'bg-card-surface text-title shadow-sm border border-card-border' 
                    : 'text-text-sec hover:text-title'
                }`}
              >
                应用管理
              </button>
              <button
                onClick={() => {
                  setActiveTab('widgets');
                }}
                className={`px-4 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'widgets' 
                    ? 'bg-card-surface text-title shadow-sm border border-card-border' 
                    : 'text-text-sec hover:text-title'
                }`}
              >
                Widget 配置
              </button>
              <button
                onClick={() => {
                  setActiveTab('stats');
                  setCurrentPage(1);
                }}
                className={`px-4 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'stats' 
                    ? 'bg-card-surface text-title shadow-sm border border-card-border' 
                    : 'text-text-sec hover:text-title'
                }`}
              >
                访问统计
              </button>
            </div>

            <a 
              href="/" 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-input-border bg-card-surface hover:bg-sidebar-hover transition-colors text-sm font-medium text-text-sec hover:text-title"
            >
              <Home className="w-4 h-4" />
              <span>返回门户</span>
            </a>

            {activeTab === 'apps' && (
              <button
                onClick={openAddModal}
                className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-title text-card-surface hover:opacity-90 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>新增应用</span>
              </button>
            )}

            {activeTab === 'widgets' && (
              <button
                onClick={openAddWidgetModal}
                className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-title text-card-surface hover:opacity-90 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>新增 Widget</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1800px] w-full mx-auto px-6 md:px-12 py-10 flex flex-col gap-8">
        
        {/* Tab 1: Apps Management */}
        {activeTab === 'apps' && (
          <>
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-title">应用注册中心</h1>
              <p className="text-sm text-text-sec">控制应用显隐及分发策略，支持配置维护模式与精细的部门/角色可见性隔离。</p>
            </div>

            <div className="bg-card-surface rounded-lg border border-card-border overflow-hidden shadow-sm transition-colors duration-200">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-sidebar-hover/40 border-b border-card-border text-text-sec font-medium">
                    <th className="p-4 w-12 text-center">排序</th>
                    <th className="p-4">应用名称 / 键标识</th>
                    <th className="p-4">入口 URL / 分类</th>
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
                            <div className="p-2 rounded bg-sidebar-hover text-text-sec">
                              {app.icon === 'Zap' && <Zap className="w-4 h-4" />}
                              {app.icon === 'Calculator' && <Calculator className="w-4 h-4" />}
                              {app.icon === 'LayoutDashboard' && <LayoutDashboard className="w-4 h-4" />}
                              {app.icon === 'FileText' && <FileText className="w-4 h-4" />}
                              {app.icon === 'Activity' && <Activity className="w-4 h-4" />}
                              {app.icon === 'Leaf' && <Leaf className="w-4 h-4" />}
                              {app.icon === 'Clock' && <Clock className="w-4 h-4" />}
                              {app.icon === 'Hammer' && <Hammer className="w-4 h-4" />}
                              {!ICON_PRESETS.includes(app.icon || '') && <LayoutDashboard className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-semibold text-title">{app.name}</div>
                              <div className="text-xs font-mono text-text-sec">{app.key}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="truncate max-w-[240px] text-text-sec font-mono text-xs">{app.url}</div>
                          <div className="text-xs text-text-sec/80 mt-0.5">{app.category}</div>
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
                                if (confirm(`确定要删除应用 “${app.name}” 吗？`)) {
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
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-title">数据看板 Widget 配置</h1>
              <p className="text-sm text-text-sec">在门户首页引入子系统的微缩视图，支持网页 iframe 嵌入或对接标准 API 异步渲染指标格。</p>
            </div>

            <div className="bg-card-surface rounded-lg border border-card-border overflow-hidden shadow-sm transition-colors duration-200">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-sidebar-hover/40 border-b border-card-border text-text-sec font-medium">
                    <th className="p-4 w-12 text-center">排序</th>
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
                                if (confirm(`确定要删除看板 “${w.title}” 吗？`)) {
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

        {/* Tab 3: Access stats and audits */}
        {activeTab === 'stats' && (
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
                    className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                      timeFilter === f 
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
                        <th className="p-3 w-32">用户账号</th>
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
                            <td className="p-3 font-semibold text-title">{log.loginName}</td>
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
                          <td colSpan={5} className="p-12 text-center text-text-sec italic bg-card-surface">
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
        )}
      </main>

      {/* App Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-card-surface rounded-lg border border-card-border shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 text-text-main">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-card-border flex items-center justify-between bg-sidebar-hover/10">
              <h2 className="text-lg font-bold text-title">
                {editingApp ? '编辑子应用' : '新增子应用'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-sidebar-hover text-text-sec hover:text-title transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                {errorMessage && (
                  <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* Key */}
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

                  {/* Name */}
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

                {/* Entrance URL */}
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

                {/* Description */}
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

                {/* Grid Fields */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                      分类类别
                    </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="如: 生产管理"
                      className="px-3 py-2 rounded border border-input-border bg-card-surface text-title text-sm focus:outline-none focus:ring-1 focus:ring-title focus:border-title"
                    />
                  </div>

                  {/* Sort Order */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                      排序权值 (正整数)
                    </label>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(Number(e.target.value))}
                      className="px-3 py-2 rounded border border-input-border bg-card-surface text-title text-sm focus:outline-none focus:ring-1 focus:ring-title focus:border-title font-mono"
                    />
                  </div>
                </div>

                {/* Preset Icon & Associated Dept */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                      图标预设 (Icon)
                    </label>
                    <select
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="px-3 py-2 rounded border border-input-border bg-card-surface text-title text-sm bg-white focus:outline-none focus:ring-1 focus:ring-title focus:border-title font-mono"
                    >
                      {ICON_PRESETS.map((iconName) => (
                        <option key={iconName} value={iconName} className="bg-card-surface text-title font-mono">
                          {iconName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                      归属侧边栏分类部门 <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={mainDeptId}
                      onChange={(e) => setMainDeptId(e.target.value)}
                      className="px-3 py-2 rounded border border-input-border bg-card-surface text-title text-sm bg-white focus:outline-none focus:ring-1 focus:ring-title focus:border-title"
                    >
                      <option value="">-- 请选择所属分类部门 --</option>
                      {departmentsTree.map((unit) => (
                        <optgroup key={unit.id} label={unit.name} className="text-title font-bold bg-card-surface">
                          {unit.departments.map((dept) => (
                            <option key={dept.id} value={dept.id} className="text-title bg-card-surface">
                              {dept.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3.1 RBAC Visibility Permissions Group */}
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
                      {/* Allowed Roles */}
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

                      {/* Allowed Departments */}
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

              {/* Modal Footer */}
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

                {/* Title */}
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

                {/* Widget Type & Associated App */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                      展现形式 (Type)
                    </label>
                    <select
                      value={widgetType}
                      onChange={(e) => setWidgetType(e.target.value)}
                      className="px-3 py-2 rounded border border-input-border bg-card-surface text-title text-sm bg-white focus:outline-none focus:ring-1 focus:ring-title focus:border-title"
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
                      className="px-3 py-2 rounded border border-input-border bg-card-surface text-title text-sm bg-white focus:outline-none focus:ring-1 focus:ring-title focus:border-title"
                    >
                      <option value="">-- 不绑定 --</option>
                      {apps.map(app => (
                        <option key={app.id} value={app.id}>{app.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* URL */}
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
                      ? '支持接口异步渲染。API 应返回标准 JSON: { "metrics": [ { "label": "名称", "value": "数据", "change": "趋势", "trend": "up/down/stable" } ] }'
                      : '通过嵌入 iframe 技术在门户主板上完美呈现外部系统的可视化大屏网页。'}
                  </p>
                </div>

                {/* Grid Width & Sort Order */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                      横向占比 (Grid Width)
                    </label>
                    <select
                      value={widgetWidthClass}
                      onChange={(e) => setWidgetWidthClass(e.target.value)}
                      className="px-3 py-2 rounded border border-input-border bg-card-surface text-title text-sm bg-white focus:outline-none focus:ring-1 focus:ring-title focus:border-title"
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
