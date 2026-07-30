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
    <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold text-text-sec uppercase tracking-widest px-3">
          部门筛选
        </h3>
        
        {/* Navigation list */}
        <nav className="flex flex-col gap-1">
          {/* All Applications option */}
          <button
            onClick={() => onSelectDept(null)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 text-left ${
              activeDeptId === null
                ? 'bg-card-surface border-card-border text-title shadow-sm'
                : 'bg-transparent border-transparent text-text-sec hover:text-title hover:bg-sidebar-hover'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span>全部应用</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-sidebar-hover text-text-sec">
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-card-surface border-card-border text-title shadow-sm'
                    : 'bg-transparent border-transparent text-text-sec hover:text-title hover:bg-sidebar-hover'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">{dept.name}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono shrink-0 ml-2 bg-sidebar-hover text-text-sec">
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
