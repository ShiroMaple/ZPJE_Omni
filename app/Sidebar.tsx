'use client';

import React, { useState, useEffect } from 'react';
import { LayoutGrid, Building2, ChevronLeft, ChevronRight } from 'lucide-react';


interface DepartmentFilter {
  id: string;
  name: string;
}

interface SidebarProps {
  departments: DepartmentFilter[];
  activeDeptId: string | null;
  onSelectDept: (deptId: string | null) => void;
  appsCountMap: Record<string, number>;
  totalAppsCount: number;
}

export default function Sidebar({
  departments,
  activeDeptId,
  onSelectDept,
  appsCountMap,
  totalAppsCount
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    localStorage.setItem('sidebar-collapsed', String(nextVal));
  };

  return (
    <aside className={`hidden lg:flex h-screen flex-col bg-zpje-brand text-white border-r border-card-border transition-all duration-300 ease-in-out shrink-0 ${isCollapsed ? 'w-16' : 'w-64'
      }`}>
      {/* Logo & Title */}
      <div className={`flex h-16 items-center border-b border-white/10 transition-all duration-300 ${isCollapsed ? 'justify-center px-0 gap-0' : 'px-4 gap-3'
        }`}>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-0.5 shrink-0 shadow-sm">
          <img
            src="/logo_zpje.jpg"
            alt="建安万维"
            className="rounded object-contain w-full h-full"
          />
        </div>
        <div className={`flex flex-col transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          }`}>
          <span className="text-lg font-bold tracking-wider whitespace-nowrap text-white">建安万维</span>
          <span className="text-[12px] font-bold text-white/50 tracking-widest -mt-1 font-sans">ZPJE_Omni</span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {/* All Applications */}
          <button
            onClick={() => onSelectDept(null)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-300 text-left cursor-pointer ${activeDeptId === null
              ? 'bg-zpje-accent border-transparent text-white shadow-sm dark:bg-zpje-accent/20 dark:text-zpje-accent dark:border-zpje-accent/30'
              : 'bg-transparent border-transparent text-white/80 dark:text-text-sec hover:text-white dark:hover:text-title hover:bg-white/10 dark:hover:bg-sidebar-hover'
              }`}
            title={isCollapsed ? '全部应用' : undefined}
          >
            <div className="flex items-center w-full min-w-0">
              <LayoutGrid className={`h-4 w-4 shrink-0 ${activeDeptId === null ? 'text-white' : 'text-white/70 dark:text-text-sec'
                }`} />
              <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'
                }`}>
                全部应用
              </span>
            </div>
            {!isCollapsed && (
              <span className={`text-xs px-1.5 py-0.5 rounded font-mono font-semibold shrink-0 ml-2 ${activeDeptId === null
                ? 'bg-white/20 text-white dark:bg-zpje-accent/25 dark:text-zpje-accent'
                : 'bg-white/10 text-white/80 dark:bg-sidebar-hover dark:text-text-sec'
                }`}>
                {totalAppsCount}
              </span>
            )}
          </button>

          {/* Departments */}
          {departments.map((dept) => {
            const count = appsCountMap[dept.id] || 0;
            const isActive = activeDeptId === dept.id;

            return (
              <button
                key={dept.id}
                onClick={() => onSelectDept(dept.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-300 text-left cursor-pointer ${isActive
                  ? 'bg-zpje-accent border-transparent text-white shadow-sm dark:bg-zpje-accent/20 dark:text-zpje-accent dark:border-zpje-accent/30'
                  : 'bg-transparent border-transparent text-white/80 dark:text-text-sec hover:text-white dark:hover:text-title hover:bg-white/10 dark:hover:bg-sidebar-hover'
                  }`}
                title={isCollapsed ? dept.name : undefined}
              >
                <div className="flex items-center w-full min-w-0">
                  <Building2 className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-white/70 dark:text-text-sec'
                    }`} />
                  <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'
                    }`}>
                    {dept.name}
                  </span>
                </div>
                {!isCollapsed && (
                  <span className={`text-xs px-1.5 py-0.5 rounded font-mono font-semibold shrink-0 ml-2 ${isActive
                    ? 'bg-white/20 text-white dark:bg-zpje-accent/25 dark:text-zpje-accent'
                    : 'bg-white/10 text-white/80 dark:bg-sidebar-hover dark:text-text-sec'
                    }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer controls */}
      <div className={`p-4 border-t border-white/10 flex flex-col gap-2 transition-all duration-300 ${isCollapsed && 'items-center px-2'
        }`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3 px-2 py-1.5 text-sm text-white/70 dark:text-text-sec transition-all duration-300">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
            <span className="truncate">系统运行正常</span>
          </div>
        )}
        {isCollapsed && (
          <div className="h-8 w-8 flex items-center justify-center rounded-md text-white/75 hover:text-white hover:bg-white/10 transition-all cursor-pointer" title="系统运行正常">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        )}

        <button
          onClick={toggleCollapse}
          className={`flex items-center justify-center rounded-lg text-white/75 hover:text-white hover:bg-white/10 transition-all cursor-pointer h-8 w-full border border-transparent ${isCollapsed ? 'w-8' : 'px-2 justify-start gap-3'
            }`}
          title={isCollapsed ? '展开菜单' : '收起菜单'}
        >
          {isCollapsed ? (
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
  );
}
