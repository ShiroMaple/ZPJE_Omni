// app/Dashboard.tsx
'use client';

import React, { useState } from 'react';
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
  Activity
} from 'lucide-react';

interface AppConfig {
  id: string;
  name: string;
  description: string;
  url: string;
  status: 'active' | 'maintenance' | 'offline';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  tag: string;
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
}

interface DashboardProps {
  userId: string;
  initialApps: DBApp[];
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

export default function Dashboard({ userId, initialApps }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isGuest = userId === 'guest';

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      // Reload page to clear session state and redirect
      window.location.reload();
    } catch (err) {
      console.error('Failed to log out:', err);
      setIsLoggingOut(false);
    }
  };

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
    };
  });

  const filteredApps = mappedApps.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-screen text-slate-100 font-sans flex flex-col justify-between overflow-x-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 -z-10 bg-[#07070a]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/15 via-zinc-950 to-black" />
      <div className="absolute top-0 right-1/4 w-[40rem] h-[40rem] bg-indigo-500/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/4 left-1/4 w-[40rem] h-[40rem] bg-emerald-500/5 rounded-full blur-[120px] -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-950/40 backdrop-blur-md">
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

          {/* User Status */}
          <div className="flex items-center gap-3">
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

          {/* Search bar */}
          <div className="mt-8 md:mt-0 relative w-full md:w-80">
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
        </div>

        {/* Cards Grid */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-wide text-slate-300">
              可用子系统 ({filteredApps.length})
            </h2>
          </div>

          {filteredApps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApps.map((app) => {
                const IconComponent = app.icon;
                return (
                  <a
                    key={app.id}
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group relative flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-br ${app.color} border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg backdrop-blur-md`}
                  >
                    <div>
                      {/* Icon & Status */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-slate-300">
                          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                            app.status === 'active' ? 'bg-emerald-400' :
                            app.status === 'maintenance' ? 'bg-amber-400' : 'bg-red-400'
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
                        进入系统
                      </span>
                      <div className="flex items-center gap-1.5 text-blue-400 group-hover:text-blue-300 transition-colors">
                        <span>访问</span>
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                      </div>
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
                请尝试更换搜索词，或联系管理员获取应用授权。
              </p>
            </div>
          )}
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
    </div>
  );
}
