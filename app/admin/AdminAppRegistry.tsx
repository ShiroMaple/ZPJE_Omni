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
  Hammer 
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

interface AdminAppRegistryProps {
  initialApps: DBApp[];
  departmentsTree: UnitOption[];
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

export default function AdminAppRegistry({ initialApps, departmentsTree }: AdminAppRegistryProps) {
  const [apps, setApps] = useState<DBApp[]>(initialApps);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<DBApp | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Form State
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('LayoutDashboard');
  const [category, setCategory] = useState('通用应用');
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [mainDeptId, setMainDeptId] = useState('');
  
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      };

      let res;
      if (editingApp) {
        // Edit mode
        res = await fetch(`/api/admin/apps/${editingApp.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create mode
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

      // Refresh list
      const listRes = await fetch('/api/admin/apps');
      if (listRes.ok) {
        const freshApps = await listRes.json();
        setApps(freshApps);
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

  return (
    <div className="min-h-screen bg-canvas text-text-main font-sans transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card-surface border-b border-card-border shadow-sm transition-colors duration-200">
        <div className="max-w-[1800px] w-full mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo image in admin header too */}
            <div className="relative flex items-center justify-center w-8 h-8 rounded bg-white overflow-hidden border border-card-border">
              <img src="/logo_zpje.jpg" alt="建安万维" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-bold tracking-tight text-title">建安万维 管理后台</span>
            <span className="text-xs px-2 py-0.5 rounded bg-sidebar-hover text-text-sec font-medium">应用注册中心</span>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="/" 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-input-border bg-card-surface hover:bg-sidebar-hover transition-colors text-sm font-medium text-text-sec hover:text-title"
            >
              <Home className="w-4 h-4" />
              <span>返回门户</span>
            </a>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-title text-card-surface hover:opacity-90 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>新增应用</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1800px] w-full mx-auto px-6 md:px-12 py-10 flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-title">应用注册中心</h1>
          <p className="text-sm text-text-sec">动态维护系统卡片，配置所属部门、分类、探活状态及维护状态。</p>
        </div>

        {/* Apps List Table */}
        <div className="bg-card-surface rounded-lg border border-card-border overflow-hidden shadow-sm transition-colors duration-200">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-sidebar-hover/40 border-b border-card-border text-text-sec font-medium">
                <th className="p-4 w-12 text-center">排序</th>
                <th className="p-4">应用名称 / 键标识</th>
                <th className="p-4">入口 URL / 分类</th>
                <th className="p-4">所属部门</th>
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
                      {app.mainDept ? (
                        <span className="px-2.5 py-1 rounded bg-canvas border border-card-border text-xs font-medium text-text-main">
                          {app.mainDept.name}
                        </span>
                      ) : (
                        <span className="text-xs text-text-sec italic">未分类</span>
                      )}
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
      </main>

      {/* App Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-card-surface rounded-lg border border-card-border shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 text-text-main">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-card-border flex items-center justify-between">
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

                {/* Key (Only editable on create) */}
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
                    placeholder="例如: CarbonPlatform (不可重复)"
                    className="px-3 py-2 rounded border border-input-border bg-card-surface text-title text-sm focus:outline-none focus:ring-1 focus:ring-title focus:border-title disabled:bg-sidebar-hover font-mono"
                  />
                  <p className="text-xs text-text-sec/80">应用的唯一字符标识，建立后不可修改。</p>
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
                    rows={3}
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

                {/* Main Department Association */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-text-sec uppercase tracking-wider">
                    所属部门 (用于侧边栏筛选) <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={mainDeptId}
                    onChange={(e) => setMainDeptId(e.target.value)}
                    className="px-3 py-2 rounded border border-input-border bg-card-surface text-title text-sm bg-white focus:outline-none focus:ring-1 focus:ring-title focus:border-title"
                  >
                    <option value="" className="text-text-sec">-- 请选择关联单位与部门 --</option>
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

                {/* Preset Icon Dropdown */}
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
                    开启应用维护模式 (开启后禁止非管理员点击跳转)
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
    </div>
  );
}
