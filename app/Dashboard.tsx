// app/Dashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import Sidebar from './Sidebar';

interface AppConfig {
  id: string;
  name: string;
  description: string;
  url: string;
  status: 'active' | 'maintenance' | 'offline';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
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

interface DashboardProps {
  userId: string;
  initialApps: DBApp[];
  departments: Department[];
  isAdmin: boolean;
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

const COLOR_MAP: Record<string, string> = {
  CarbonPlatform: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30 shadow-emerald-500/5 hover:border-emerald-500/60',
  FabFlow: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30 shadow-blue-500/5 hover:border-blue-500/60',
  supos_Kanban: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30 shadow-amber-500/5 hover:border-amber-500/60',
  DocEx: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30 shadow-purple-500/5 hover:border-purple-500/60',
  WeldSnap: 'from-cyan-500/20 to-sky-500/20 text-cyan-400 border-cyan-500/30 shadow-cyan-500/5 hover:border-cyan-500/60',
};

const DEFAULT_ICON = LayoutDashboard;
const DEFAULT_COLOR = 'from-slate-500/20 to-slate-600/20 text-slate-400 border-slate-500/30 shadow-slate-500/5 hover:border-slate-500/60';

export default function Dashboard({ userId, initialApps, departments, isAdmin }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDeptId, setActiveDeptId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeAlertApp, setActiveAlertApp] = useState<AppConfig | null>(null);
  const isGuest = userId === 'guest';

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

  // Client-side auto-logout detection via non-HttpOnly session_active cookie
  useEffect(() => {
    if (isGuest) return;

    const checkSession = () => {
      const activeCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('session_active='));
      
      if (!activeCookie) {
        console.warn('检测到致远 OA 单点登录会话已过期。执行自动单点登出...');
        handleLogout();
      }
    };

    // 立即检测，随后每 30 秒执行一次
    checkSession();
    const interval = setInterval(checkSession, 30000);
    return () => clearInterval(interval);
  }, [isGuest]);

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

  // Filter apps by both Search Query and Active Department
  const filteredApps = mappedApps.filter((app) => {
    const matchesSearch = 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesDept = activeDeptId === null || app.mainDeptId === activeDeptId;

    return matchesSearch && matchesDept;
  });

  const selectDept = (deptId: string | null) => {
    setActiveDeptId(deptId);
    setIsMobileSidebarOpen(false); // Close mobile drawer on selection
  };

  return (
    <div className="relative min-h-screen text-slate-100 font-sans flex flex-col justify-between overflow-x-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 -z-10 bg-[#07070a]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/15 via-zinc-950 to-black" />
      <div className="absolute top-0 right-1/4 w-[40rem] h-[40rem] bg-indigo-500/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/4 left-1/4 w-[40rem] h-[40rem] bg-emerald-500/5 rounded-full blur-[120px] -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-slate-950/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/25">
              <Laptop className="w-5 h-5 text-white" />
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl blur-sm opacity-50 -z-10" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-wider text-white">OMNI</span>
              <span className="text-xs block text-slate-400 font-medium tracking-widest -mt-1">PORTAL</span>
            </div>
          </div>

          {/* User Status & Admin Controls */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <a
                href="/admin"
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20 flex items-center gap-2 transition-all text-sm font-medium"
                title="管理应用注册中心"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">管理后台</span>
              </a>
            )}

            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 transition-all hover:bg-white/10">
              <div className="relative flex items-center justify-center">
                <span className={`w-2.5 h-2.5 rounded-full ${isGuest ? 'bg-amber-400 shadow-amber-400/50' : 'bg-emerald-400 shadow-emerald-400/50'} animate-pulse`} />
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${isGuest ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-200">
                  {isGuest ? '游客模式' : `${userId}`}
                </span>
              </div>
              {isGuest && (
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-medium border border-amber-500/20">
                  Demo
                </span>
              )}
            </div>

            {!isGuest && (
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 flex items-center gap-2 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full flex flex-col gap-12">
        {/* Banner Section */}
        <div className="text-center md:text-left md:flex md:items-center md:justify-between gap-6 border-b border-white/5 pb-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              统一数字化应用工作台
            </h1>
            <p className="mt-4 text-lg text-slate-400 leading-relaxed">
              欢迎使用 Omni 门户。此处汇集了公司核心数字化生产与管理系统，实现单点登录与无感访问切换。
            </p>
          </div>

          {/* Search Bar + Mobile Filter Trigger */}
          <div className="mt-8 md:mt-0 flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="搜索应用名称或功能..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm backdrop-blur-sm hover:border-white/20"
              />
            </div>
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm text-slate-300 flex items-center gap-1.5 backdrop-blur-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>部门</span>
            </button>
          </div>
        </div>

        {/* Content Layout: Sidebar + Grid */}
        <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
          {/* Desktop Sidebar (hidden on mobile) */}
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
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              <div className="relative w-72 h-full bg-[#0d0d12] border-l border-white/10 p-6 flex flex-col gap-6 shadow-2xl animate-in slide-in-from-right duration-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white">选择所属部门</h3>
                  <button 
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-1 rounded-full hover:bg-white/5 text-slate-400 hover:text-white"
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
          <div className="flex-1 w-full flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-wide text-slate-300">
                可用子系统 ({filteredApps.length})
              </h2>
            </div>

            {filteredApps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredApps.map((app) => {
                  const IconComponent = app.icon;
                  const isMaintenanceMode = app.status === 'maintenance';
                  const isOffline = app.status === 'offline';
                  
                  return (
                    <a
                      key={app.id}
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (isMaintenanceMode || isOffline) {
                          e.preventDefault();
                          // Show custom warning dialogue
                          setActiveAlertApp(app);
                        }
                      }}
                      className={`group relative flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-br ${app.color} border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg backdrop-blur-md ${
                        isMaintenanceMode ? 'opacity-40 select-none' : ''
                      } ${isOffline ? 'opacity-50' : ''}`}
                    >
                      <div>
                        {/* Icon & Status */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="p-3 rounded-xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform">
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-slate-300">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              app.status === 'active' ? 'bg-emerald-400 animate-pulse' :
                              app.status === 'maintenance' ? 'bg-amber-400' : 'bg-red-400 animate-pulse'
                            }`} />
                            <span>
                              {app.status === 'active' ? '运行中' :
                               app.status === 'maintenance' ? '维护中' : '已离线'}
                            </span>
                          </div>
                        </div>

                        {/* Info */}
                        <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors flex items-center gap-1.5">
                          {app.name}
                        </h3>
                        <div className="text-xs text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                          {app.tag}
                        </div>
                        <p className="mt-3 text-sm text-slate-400 leading-relaxed min-h-[4.5rem]">
                          {app.description}
                        </p>
                      </div>

                      {/* Footer Trigger */}
                      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-sm font-semibold">
                        <span className="text-slate-400 group-hover:text-white transition-colors">
                          {isMaintenanceMode ? '系统维护中' : (isOffline ? '服务已离线' : '进入系统')}
                        </span>
                        {!isMaintenanceMode && !isOffline && (
                          <div className="flex items-center gap-1.5 text-blue-400 group-hover:text-blue-300 transition-colors">
                            <span>访问</span>
                            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                          </div>
                        )}
                        {isAdmin && (isMaintenanceMode || isOffline) && (
                          <span className="text-xs text-blue-400 group-hover:text-blue-300 font-medium">
                            点击管理配置
                          </span>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm text-center px-4">
                <ShieldCheck className="w-12 h-12 text-slate-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-300">未找到匹配的系统</h3>
                <p className="text-sm text-slate-400 mt-2">
                  请尝试更换搜索词或重置筛选条件。
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950/60 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © 2026 Omni Portal. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <a href="https://oa.izpje.com/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors flex items-center gap-1">
              致远 OA <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-700">|</span>
            <span>统一身份认证安全托管</span>
          </div>
        </div>
      </footer>

      {/* System Warning Modal Dialogue */}
      {activeAlertApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-lg border border-[#e0e1e6] shadow-xl p-6 text-[#1c2024] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-full ${
                activeAlertApp.status === 'maintenance' 
                  ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-black">
                {activeAlertApp.status === 'maintenance' ? '系统维护中' : '系统已离线'}
              </h3>
            </div>
            
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              {activeAlertApp.status === 'maintenance'
                ? `应用 “${activeAlertApp.name}” 当前处于维护模式。为了保障您的正常使用及数据安全，请稍后再试。`
                : `系统检测到应用 “${activeAlertApp.name}” 的后台服务或接口当前响应超时。工程师正在紧急抢修中，请稍后再试。`}
            </p>
            
            <div className="flex items-center justify-end gap-3">
              {isAdmin ? (
                <>
                  <button
                    onClick={() => setActiveAlertApp(null)}
                    className="px-4 py-2 rounded-full border border-[#d9d9e0] bg-white hover:bg-slate-100 transition-colors text-xs font-bold text-slate-700"
                  >
                    取消
                  </button>
                  <a
                    href={activeAlertApp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setActiveAlertApp(null)}
                    className="px-4 py-2 rounded-full bg-black text-white hover:bg-black/90 transition-colors text-xs font-bold flex items-center gap-1"
                  >
                    <span>强制访问 (管理员)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </>
              ) : (
                <button
                  onClick={() => setActiveAlertApp(null)}
                  className="px-5 py-2 rounded-full bg-black text-white hover:bg-black/90 transition-colors text-xs font-bold"
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
