'use client';

import React from 'react';
import { LayoutGrid, Building2 } from 'lucide-react';

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
  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="bg-zpje-brand dark:bg-card-surface border border-card-border p-5 rounded-2xl shadow-sm flex flex-col gap-4 transition-colors duration-200">
        <h3 className="text-[10px] font-bold text-white/60 dark:text-text-sec uppercase tracking-widest px-1">
          部门筛选
        </h3>
        
        {/* Navigation list */}
        <nav className="flex flex-col gap-1">
          {/* All Applications option */}
          <button
            onClick={() => onSelectDept(null)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold transition-all duration-200 text-left ${
              activeDeptId === null
                ? 'bg-zpje-accent border-transparent text-white shadow-sm dark:bg-zpje-accent/20 dark:text-zpje-accent dark:border-zpje-accent/30'
                : 'bg-transparent border-transparent text-white/80 dark:text-text-sec hover:text-white dark:hover:text-title hover:bg-white/10 dark:hover:bg-sidebar-hover'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span>全部应用</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeDeptId === null
                ? 'bg-white/20 text-white dark:bg-zpje-accent/20 dark:text-zpje-accent'
                : 'bg-white/15 text-white/90 dark:bg-sidebar-hover dark:text-text-sec'
            }`}>
              {totalAppsCount}
            </span>
          </button>

          {/* Department options */}
          {departments.map((dept) => {
            const count = appsCountMap[dept.id] || 0;
            const isActive = activeDeptId === dept.id;

            return (
              <button
                key={dept.id}
                onClick={() => onSelectDept(dept.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-zpje-accent border-transparent text-white shadow-sm dark:bg-zpje-accent/20 dark:text-zpje-accent dark:border-zpje-accent/30'
                    : 'bg-transparent border-transparent text-white/80 dark:text-text-sec hover:text-white dark:hover:text-title hover:bg-white/10 dark:hover:bg-sidebar-hover'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">{dept.name}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ml-2 ${
                  isActive
                    ? 'bg-white/20 text-white dark:bg-zpje-accent/20 dark:text-zpje-accent'
                    : 'bg-white/15 text-white/90 dark:bg-sidebar-hover dark:text-text-sec'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
