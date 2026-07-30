// app/Dashboard.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ArrowRight, 
  Leaf, 
  Clock, 
  LayoutDashboard, 
  FileText, 
  Hammer,
  User,
  ShieldCheck,
  ExternalLink,
  Laptop,
  LogOut,
  Zap,
  Calculator,
  Activity,
  SlidersHorizontal,
  Settings,
  X,
  AlertTriangle,
  Sun,
  Moon,
  Star,
  Command
} from 'lucide-react';
import Sidebar from './Sidebar';

interface AppConfig {
  id: string;
  name: string;
  description: string;
  url: string;
  status: 'active' | 'maintenance' | 'offline';
  icon: React.ComponentType<{ className?: string }>;
  color: {
    iconBg: string;
    iconText: string;
    borderHover: string;
  };
  tag: string;
  mainDeptId: string | null;
}

interface DBApp {
  id: string;
  key: string;
  name: string;
  description: string | null;
  url: string;
  icon: string | null;
  category: string;
  isMaintenance: boolean;
  healthStatus: string;
  mainDeptId: string | null;
}

interface Department {
  id: string;
  name: string;
}

interface UserInfo {
  name: string;
  loginName: string;
  unitName: string;
  deptName: string;
}

interface DashboardProps {
  userId: string;
  initialApps: DBApp[];
  departments: Department[];
  isAdmin: boolean;
  userInfo: UserInfo | null;
  initialFavoriteIds: string[];
}

interface CommandItem {
  id: string;
  type: 'app' | 'action';
  name: string;
  description: string;
  action?: () => void;
  url?: string;
  appObject?: AppConfig;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap: Zap,
  Calculator: Calculator,
  LayoutDashboard: LayoutDashboard,
  FileText: FileText,
  Activity: Activity,
  Leaf: Leaf,
  Clock: Clock,
  Hammer: Hammer,
};

const COLOR_MAP: Record<string, { iconBg: string, iconText: string, borderHover: string }> = {
  CarbonPlatform: {
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    borderHover: 'hover:border-emerald-500/40 dark:hover:border-emerald-500/60 shadow-emerald-500/2 hover:shadow-emerald-500/10'
  },
  FabFlow: {
    iconBg: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    iconText: 'text-blue-600 dark:text-blue-400',
    borderHover: 'hover:border-blue-500/40 dark:hover:border-blue-500/60 shadow-blue-500/2 hover:shadow-blue-500/10'
  },
  supos_Kanban: {
    iconBg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
    iconText: 'text-amber-600 dark:text-amber-400',
    borderHover: 'hover:border-amber-500/40 dark:hover:border-amber-500/60 shadow-amber-500/2 hover:shadow-amber-500/10'
  },
  DocEx: {
    iconBg: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
    iconText: 'text-purple-600 dark:text-purple-400',
    borderHover: 'hover:border-purple-500/40 dark:hover:border-purple-500/60 shadow-purple-500/2 hover:shadow-purple-500/10'
  },
  WeldSnap: {
    iconBg: 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400',
    iconText: 'text-cyan-600 dark:text-cyan-400',
    borderHover: 'hover:border-cyan-500/40 dark:hover:border-cyan-500/60 shadow-cyan-500/2 hover:shadow-cyan-500/10'
  },
};

const DEFAULT_ICON = LayoutDashboard;
const DEFAULT_COLOR = {
  iconBg: 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400',
  iconText: 'text-slate-600 dark:text-slate-400',
  borderHover: 'hover:border-slate-500/40 dark:hover:border-slate-500/60 shadow-slate-500/2 hover:shadow-slate-500/10'
};

export default function Dashboard({ userId, initialApps, departments, isAdmin, userInfo, initialFavoriteIds }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDeptId, setActiveDeptId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeAlertApp, setActiveAlertApp] = useState<AppConfig | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const isGuest = userId === 'guest';

  // Favorites state
  const [favoriteIds, setFavoriteIds] = useState<string[]>(initialFavoriteIds || []);

  // Command Palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [activeCmdIndex, setActiveCmdIndex] = useState(0);
  const paletteInputRef = useRef<HTMLInputElement>(null);

  // Initialize theme from HTML element
  useEffect(() => {
    setMounted(true);
    const initialTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark' || 'light';
    setTheme(initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.reload();
    } catch (err) {
      console.error('Failed to log out:', err);
      setIsLoggingOut(false);
    }
  };

  // Client-side auto-logout cookie probe
  useEffect(() => {
    if (isGuest) return;

    const checkSession = () => {
      const activeCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('session_active='));
      
      if (!activeCookie) {
        console.warn('检测到会话已过期。执行自动单点登出...');
        handleLogout();
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 30000);
    return () => clearInterval(interval);
  }, [isGuest]);

  // Global key listener for Ctrl+K command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        setCmdQuery('');
        setActiveCmdIndex(0);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus input when command palette opens
  useEffect(() => {
    if (isCommandPaletteOpen && paletteInputRef.current) {
      setTimeout(() => paletteInputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  const mappedApps: AppConfig[] = initialApps.map((app) => {
    const IconComponent = ICON_MAP[app.icon || ''] || DEFAULT_ICON;
    const colorClasses = COLOR_MAP[app.key] || DEFAULT_COLOR;
    const status: 'active' | 'maintenance' | 'offline' = app.isMaintenance 
      ? 'maintenance' 
      : (app.healthStatus === 'UNHEALTHY' ? 'offline' : 'active');

    return {
      id: app.id,
      name: app.name,
      description: app.description || '',
      url: app.url,
      status,
      icon: IconComponent,
      color: colorClasses,
      tag: app.category,
      mainDeptId: app.mainDeptId,
    };
  });

  // Calculate apps counts for sidebar filters
  const appsCountMap: Record<string, number> = {};
  mappedApps.forEach((app) => {
    if (app.mainDeptId) {
      appsCountMap[app.mainDeptId] = (appsCountMap[app.mainDeptId] || 0) + 1;
    }
  });

  const totalAppsCount = mappedApps.length;

  // Filter apps by Search Query and Department Filter
  const filteredApps = mappedApps.filter((app) => {
    const matchesSearch = 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesDept = activeDeptId === null || app.mainDeptId === activeDeptId;

    return matchesSearch && matchesDept;
  });

  // Split apps into favorites and others
  const favoriteApps = filteredApps.filter(app => favoriteIds.includes(app.id));

  const selectDept = (deptId: string | null) => {
    setActiveDeptId(deptId);
    setIsMobileSidebarOpen(false);
  };

  const toggleFavorite = async (e: React.MouseEvent, appId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const isFav = favoriteIds.includes(appId);
    const nextFavorites = isFav 
      ? favoriteIds.filter(id => id !== appId)
      : [...favoriteIds, appId];
    setFavoriteIds(nextFavorites);

    if (isGuest) return;

    try {
      if (isFav) {
        await fetch(`/api/user/favorites?appId=${appId}`, { method: 'DELETE' });
      } else {
        await fetch('/api/user/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appId })
        });
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      // Rollback
      setFavoriteIds(favoriteIds);
    }
  };

  const recordAccess = async (appId: string) => {
    try {
      await fetch('/api/user/access-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId })
      });
    } catch (err) {
      console.error('Failed to record access audit:', err);
    }
  };

  // Fuzzy match command items
  const getCommandItems = (): CommandItem[] => {
    const items: CommandItem[] = [];
    
    mappedApps.forEach(app => {
      items.push({
        id: `app-${app.id}`,
        type: 'app',
        name: app.name,
        description: `${app.tag} - ${app.description}`,
        url: app.url,
        appObject: app
      });
    });

    items.push({
      id: 'action-theme',
      type: 'action',
      name: '切换系统主题 (Toggle Dark/Light Theme)',
      description: `当前主题: ${theme === 'light' ? '亮色' : '暗色'}`,
      action: () => toggleTheme()
    });

    items.push({
      id: 'action-home',
      type: 'action',
      name: '返回门户首页 (Go to Portal Home)',
      description: '重置部门筛选与搜索栏',
      action: () => {
        setActiveDeptId(null);
        setSearchQuery('');
      }
    });

    if (isAdmin) {
      items.push({
        id: 'action-admin',
        type: 'action',
        name: '进入管理后台 (Go to Admin Panel)',
        description: '管理并配置公司子系统',
        action: () => { window.location.href = '/admin'; }
      });
    }

    if (!isGuest) {
      items.push({
        id: 'action-logout',
        type: 'action',
        name: '退出登录 (Log Out)',
        description: '安全注销此会话并释放致远会话',
        action: () => handleLogout()
      });
    }

    if (!cmdQuery) {
      return [...items.filter(i => i.type === 'app').slice(0, 5), ...items.filter(i => i.type === 'action')];
    }

    const queryWords = cmdQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter(item => {
      const text = `${item.name} ${item.description}`.toLowerCase();
      return queryWords.every(word => text.includes(word));
    });
  };

  const commandItems = getCommandItems();

  const handlePaletteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveCmdIndex(prev => (prev + 1) % Math.max(commandItems.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveCmdIndex(prev => (prev - 1 + commandItems.length) % Math.max(commandItems.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const activeItem = commandItems[activeCmdIndex];
      if (activeItem) {
        executeCommand(activeItem);
      }
    }
  };

  const executeCommand = (item: CommandItem) => {
    setIsCommandPaletteOpen(false);
    setCmdQuery('');
    setActiveCmdIndex(0);

    if (item.type === 'app' && item.appObject) {
      const app = item.appObject;
      if (app.status === 'maintenance' || app.status === 'offline') {
        setActiveAlertApp(app);
      } else {
        recordAccess(app.id);
        window.open(app.url, '_blank', 'noopener,noreferrer');
      }
    } else if (item.type === 'action' && item.action) {
      item.action();
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase()
            ? <mark key={i} className="bg-zpje-brand/15 text-zpje-brand font-semibold rounded px-0.5">{part}</mark>
            : part
        )}
      </span>
    );
  };

  const renderAppCard = (app: AppConfig, isFavoriteSection = false) => {
    const IconComponent = app.icon;
    const isMaintenanceMode = app.status === 'maintenance';
    const isOffline = app.status === 'offline';
    const colorClasses = app.color;
    const isFav = favoriteIds.includes(app.id);

    return (
      <a
        key={`${app.id}-${isFavoriteSection ? 'fav' : 'main'}`}
        href={app.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (isMaintenanceMode || isOffline) {
            e.preventDefault();
            setActiveAlertApp(app);
          } else {
            recordAccess(app.id);
          }
        }}
        className={`group relative flex flex-col justify-between p-4 rounded-xl bg-card-surface border border-card-border ${colorClasses.borderHover} transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
          isMaintenanceMode ? 'opacity-40 select-none' : ''
        } ${isOffline ? 'opacity-50' : ''}`}
      >
        <div>
          {/* Icon & Status & Favorite Button */}
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${colorClasses.iconBg} ${colorClasses.iconText} group-hover:scale-105 transition-transform`}>
              <IconComponent className="w-5 h-5" />
            </div>
            
            <div className="flex items-center gap-2">
              {/* Status Badge */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sidebar-hover text-[10px] text-text-sec">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  app.status === 'active' ? 'bg-emerald-500 animate-pulse' :
                  app.status === 'maintenance' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                <span>
                  {app.status === 'active' ? '运行中' :
                   app.status === 'maintenance' ? '维护中' : '已离线'}
                </span>
              </div>

              {/* Favorite Star Button */}
              <button
                onClick={(e) => toggleFavorite(e, app.id)}
                className={`p-1.5 rounded-lg border transition-all duration-200 ${
                  isFav 
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
                    : 'bg-sidebar-hover border-transparent text-text-sec hover:text-amber-500 hover:bg-amber-500/5'
                }`}
                title={isFav ? '取消收藏' : '收藏应用'}
              >
                <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Info */}
          <h3 className="text-base font-bold text-title group-hover:text-zpje-brand transition-colors flex items-center gap-1">
            {app.name}
          </h3>
          <div className="text-[10px] text-text-sec font-semibold tracking-wider uppercase mt-0.5">
            {app.tag}
          </div>
          <p className="mt-2 text-xs text-text-sec leading-relaxed min-h-[3rem] line-clamp-2">
            {app.description}
          </p>
        </div>

        {/* Footer Trigger */}
        <div className="mt-3 pt-2.5 border-t border-card-border flex items-center justify-between text-xs font-semibold">
          <span className="text-text-sec group-hover:text-title transition-colors">
            {isMaintenanceMode ? '系统维护中' : (isOffline ? '服务已离线' : '进入系统')}
          </span>
          {!isMaintenanceMode && !isOffline && (
            <div className="flex items-center gap-1 text-zpje-brand group-hover:opacity-80 transition-colors">
              <span>访问</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
            </div>
          )}
          {isAdmin && (isMaintenanceMode || isOffline) && (
            <span className="text-[10px] text-zpje-brand font-medium">
              点击管理配置
            </span>
          )}
        </div>
      </a>
    );
  };

  return (
    <div className="relative min-h-screen text-text-main font-sans flex flex-col justify-between overflow-x-hidden transition-colors duration-200">
      {/* Background canvas */}
      <div className="absolute inset-0 -z-10 bg-canvas transition-colors duration-200" />
      {mounted && theme === 'dark' && (
        <>
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-zinc-950 to-black" />
          <div className="absolute top-0 right-1/4 w-[40rem] h-[40rem] bg-indigo-500/5 rounded-full blur-[120px] -z-10" />
          <div className="absolute bottom-1/4 left-1/4 w-[40rem] h-[40rem] bg-emerald-500/5 rounded-full blur-[120px] -z-10" />
        </>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-card-border bg-nav-bg backdrop-blur-md transition-colors duration-200">
        <div className="max-w-[1800px] w-full mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden bg-white shadow-sm border border-card-border">
              <img src="/logo_zpje.jpg" alt="建安万维" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-wider text-title">建安万维</span>
              <span className="text-xs block text-text-sec font-medium tracking-widest -mt-1">PORTAL</span>
            </div>
          </div>

          {/* User Status & Controls */}
          <div className="flex items-center gap-3">
            {/* Command Palette Indicator badge */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card-surface border border-card-border text-xs text-text-sec hover:text-title hover:bg-sidebar-hover transition-all"
              title="打开全局指令面板"
            >
              <Command className="w-3.5 h-3.5" />
              <span className="font-mono">Ctrl K</span>
            </button>

            {/* Theme Toggle Button */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl bg-card-surface border border-card-border text-title hover:bg-sidebar-hover flex items-center justify-center transition-all"
                title={theme === 'light' ? '切换至暗色模式' : '切换至亮色模式'}
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            )}

            {isAdmin && (
              <a
                href="/admin"
                className="px-4 py-2 rounded-xl bg-card-surface border border-card-border text-title hover:bg-sidebar-hover flex items-center gap-2 transition-all text-sm font-medium"
                title="管理应用注册中心"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">管理后台</span>
              </a>
            )}

            {/* Hover details user status badge */}
            <div className="relative group">
              <div className="px-4 py-2 rounded-xl bg-card-surface border border-card-border flex items-center gap-3 transition-all hover:bg-sidebar-hover cursor-default">
                <div className="relative flex items-center justify-center">
                  <span className={`w-2.5 h-2.5 rounded-full ${isGuest ? 'bg-amber-400 shadow-amber-400/50' : 'bg-emerald-400 shadow-emerald-400/50'} animate-pulse`} />
                  <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${isGuest ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-text-sec" />
                  <span className="text-sm font-medium text-title">
                    {isGuest ? '游客模式' : (userInfo?.name || userId)}
                  </span>
                </div>
                {isGuest && (
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium border border-amber-500/20">
                    Demo
                  </span>
                )}
              </div>

              {/* Hover Popover Detail Card */}
              {!isGuest && userInfo && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-card-surface border border-card-border rounded-2xl shadow-xl p-4 text-text-main opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
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
                    
                    <div className="flex flex-col gap-2 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-text-sec shrink-0">所属单位:</span>
                        <span className="font-medium text-right text-title">{userInfo.unitName}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-text-sec shrink-0">所属部门:</span>
                        <span className="font-medium text-right text-title">{userInfo.deptName}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-text-sec shrink-0">权限角色:</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isAdmin 
                            ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                            : 'bg-zpje-brand/10 text-zpje-brand border-zpje-brand/20'
                        }`}>
                          {isAdmin ? '管理员' : '普通用户'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!isGuest && (
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 flex items-center gap-2 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title="退出登录并通知致远 OA"
              >
                <LogOut className="w-4 h-4" />
                <span>{isLoggingOut ? '注销中...' : '退出'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] w-full mx-auto px-6 md:px-12 py-12 flex-1 flex flex-col gap-12">
        {/* Banner Section */}
        <div className="text-center md:text-left md:flex md:items-center md:justify-between gap-6 border-b border-card-border pb-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight md:tracking-[-1.5px] text-title transition-colors duration-200">
              统一数字化应用工作台
            </h1>
            <p className="mt-4 text-lg text-text-sec leading-relaxed transition-colors duration-200">
              欢迎使用建安万维门户。此处汇集了公司核心数字化生产与管理系统，实现单点登录与无感访问切换。
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-8 md:mt-0 flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-text-sec" />
              </div>
              <input
                type="text"
                placeholder="搜索应用名称或功能..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-11 pr-16 py-3 rounded-2xl bg-card-surface border border-input-border text-title placeholder-text-sec focus:outline-none focus:ring-2 focus:ring-title/20 focus:border-title transition-all text-sm"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-input-border bg-sidebar-hover text-[10px] font-mono text-text-sec">
                  Ctrl K
                </kbd>
              </div>
            </div>
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden px-4 py-3 rounded-2xl bg-card-surface border border-input-border hover:bg-sidebar-hover transition-all text-sm text-title flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>部门</span>
            </button>
          </div>
        </div>

        {/* Content Layout: Sidebar + Grid */}
        <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-64 shrink-0">
            <Sidebar
              departments={departments}
              activeDeptId={activeDeptId}
              onSelectDept={selectDept}
              appsCountMap={appsCountMap}
              totalAppsCount={totalAppsCount}
            />
          </div>

          {/* Mobile Sidebar Drawer Overlay */}
          {isMobileSidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
              <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              <div className="relative w-72 h-full bg-card-surface border-l border-card-border p-6 flex flex-col gap-6 shadow-2xl animate-in slide-in-from-right duration-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-title">选择所属部门</h3>
                  <button 
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-1 rounded-full hover:bg-sidebar-hover text-text-sec hover:text-title"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="overflow-y-auto flex-1">
                  <Sidebar
                    departments={departments}
                    activeDeptId={activeDeptId}
                    onSelectDept={selectDept}
                    appsCountMap={appsCountMap}
                    totalAppsCount={totalAppsCount}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Apps Grid Panel */}
          <div className="flex-1 w-full flex flex-col gap-8">
            
            {/* 2.1.1 Favorite apps region */}
            {favoriteApps.length > 0 && (
              <div className="flex flex-col gap-4 border-b border-card-border pb-8">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <h2 className="text-lg font-bold tracking-wide text-title">我的收藏</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteApps.map(app => renderAppCard(app, true))}
                </div>
              </div>
            )}

            {/* Standard apps region */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-wide text-title">
                  可用子系统 ({filteredApps.length})
                </h2>
              </div>

              {filteredApps.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredApps.map(app => renderAppCard(app, false))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-card-surface rounded-2xl border border-card-border text-center px-4">
                  <ShieldCheck className="w-12 h-12 text-text-sec mb-4" />
                  <h3 className="text-lg font-semibold text-title">未找到匹配的系统</h3>
                  <p className="text-sm text-text-sec mt-2">
                    请尝试更换搜索词或重置筛选条件。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-card-border bg-card-surface py-8 text-center text-xs text-text-sec transition-colors duration-200">
        <div className="max-w-[1800px] w-full mx-auto px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © 2026 Omni Portal. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <a href="https://oa.izpje.com/" target="_blank" rel="noopener noreferrer" className="hover:text-title transition-colors flex items-center gap-1">
              致远 OA <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-card-border">|</span>
            <span>统一身份认证安全托管</span>
          </div>
        </div>
      </footer>

      {/* Command Palette Overlay Dialog */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4 bg-black/40 backdrop-blur-sm transition-all">
          <div 
            className="fixed inset-0 bg-transparent" 
            onClick={() => setIsCommandPaletteOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-card-surface border border-card-border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[60vh] animate-in fade-in slide-in-from-top-4 duration-200">
            {/* Input Header */}
            <div className="flex items-center gap-3 px-4 border-b border-card-border bg-sidebar-hover/20">
              <Search className="w-5 h-5 text-text-sec shrink-0" />
              <input
                ref={paletteInputRef}
                type="text"
                value={cmdQuery}
                onChange={(e) => {
                  setCmdQuery(e.target.value);
                  setActiveCmdIndex(0);
                }}
                onKeyDown={handlePaletteKeyDown}
                placeholder="键入应用名称、标签，或输入 `>` 查看系统指令..."
                className="w-full py-4 bg-transparent text-title placeholder-text-sec focus:outline-none text-sm"
              />
              <span className="hidden sm:inline px-1.5 py-0.5 rounded border border-input-border text-[9px] font-mono text-text-sec uppercase">
                ESC 关闭
              </span>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
              {commandItems.length > 0 ? (
                commandItems.map((item, idx) => {
                  const isActive = idx === activeCmdIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => executeCommand(item)}
                      onMouseEnter={() => setActiveCmdIndex(idx)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                        isActive 
                          ? 'bg-zpje-brand/10 text-zpje-brand font-medium' 
                          : 'bg-transparent text-text-main hover:bg-sidebar-hover/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.type === 'app' && item.appObject ? (
                          <div className={`p-1.5 rounded bg-sidebar-hover ${isActive ? 'text-zpje-brand' : 'text-text-sec'}`}>
                            {React.createElement(item.appObject.icon, { className: 'w-4 h-4' })}
                          </div>
                        ) : (
                          <div className={`p-1.5 rounded bg-sidebar-hover ${isActive ? 'text-zpje-brand' : 'text-text-sec'}`}>
                            {item.id.includes('theme') && <Sun className="w-4 h-4" />}
                            {item.id.includes('home') && <Laptop className="w-4 h-4" />}
                            {item.id.includes('admin') && <Settings className="w-4 h-4" />}
                            {item.id.includes('logout') && <LogOut className="w-4 h-4" />}
                          </div>
                        )}
                        <div className="truncate">
                          <div className={`text-sm ${isActive ? 'text-zpje-brand' : 'text-title'}`}>
                            {highlightMatch(item.name, cmdQuery)}
                          </div>
                          <div className="text-xs text-text-sec truncate">
                            {highlightMatch(item.description, cmdQuery)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-text-sec font-mono shrink-0 pl-3">
                        {item.type === 'app' ? (
                          <>
                            <span>跳转</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <span>执行</span>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center text-text-sec text-xs italic">
                  未匹配到子系统或可用指令。
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* System Warning Modal Dialogue */}
      {activeAlertApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card-surface rounded-lg border border-card-border shadow-xl p-6 text-text-main animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-full ${
                activeAlertApp.status === 'maintenance' 
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-title">
                {activeAlertApp.status === 'maintenance' ? '系统维护中' : '系统已离线'}
              </h3>
            </div>
            
            <p className="text-sm text-text-sec leading-relaxed mb-6">
              {activeAlertApp.status === 'maintenance'
                ? `应用 “${activeAlertApp.name}” 当前处于维护模式。为了保障您的正常使用及数据安全，请稍后再试。`
                : `系统检测到应用 “${activeAlertApp.name}” 的后台服务或接口当前响应超时。工程师正在紧急抢修中，请稍后再试。`}
            </p>
            
            <div className="flex items-center justify-end gap-3">
              {isAdmin ? (
                <>
                  <button
                    onClick={() => setActiveAlertApp(null)}
                    className="px-4 py-2 rounded-full border border-input-border bg-card-surface hover:bg-sidebar-hover transition-colors text-xs font-bold text-title"
                  >
                    取消
                  </button>
                  <a
                    href={activeAlertApp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      recordAccess(activeAlertApp.id);
                      setActiveAlertApp(null);
                    }}
                    className="px-4 py-2 rounded-full bg-title text-card-surface hover:opacity-90 transition-colors text-xs font-bold flex items-center gap-1"
                  >
                    <span>强制访问 (管理员)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </>
              ) : (
                <button
                  onClick={() => setActiveAlertApp(null)}
                  className="px-5 py-2 rounded-full bg-title text-card-surface hover:opacity-90 transition-colors text-xs font-bold"
                >
                  我知道了
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
