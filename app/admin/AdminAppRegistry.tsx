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
    <div className="min-h-screen bg-[#f0f0f3] text-[#1c2024] font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e0e1e6] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight text-black">Omni 管理后台</span>
            <span className="text-xs px-2 py-0.5 rounded bg-black/5 text-slate-500 font-medium">应用注册中心</span>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="/" 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#d9d9e0] bg-white hover:bg-slate-50 transition-colors text-sm font-medium text-slate-600"
            >
              <Home className="w-4 h-4" />
              <span>返回门户</span>
            </a>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-black text-white hover:bg-black/90 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>新增应用</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-black">应用注册中心</h1>
          <p className="text-sm text-slate-500">动态维护系统卡片，配置所属部门、分类、探活状态及维护状态。</p>
        </div>

        {/* Apps List Table */}
        <div className="bg-white rounded-lg border border-[#e0e1e6] overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-[#e0e1e6] text-[#60646c] font-medium">
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
                  <tr key={app.id} className="border-b border-[#e0e1e6] hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-center font-mono text-slate-400">{app.sortOrder}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded bg-slate-100 text-slate-600">
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
                          <div className="font-semibold text-black">{app.name}</div>
                          <div className="text-xs font-mono text-slate-500">{app.key}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="truncate max-w-[240px] text-slate-600 font-mono text-xs">{app.url}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{app.category}</div>
                    </td>
                    <td className="p-4">
                      {app.mainDept ? (
                        <span className="px-2.5 py-1 rounded bg-[#f0f0f3] border border-[#e0e1e6] text-xs font-medium text-slate-700">
                          {app.mainDept.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">未分类</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        {app.isMaintenance ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            维护中
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
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
                          className="p-1.5 rounded hover:bg-slate-200/60 text-slate-600 hover:text-black transition-colors"
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
                          className="p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
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
                  <td colSpan={6} className="p-12 text-center text-slate-400 italic">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-lg border border-[#e0e1e6] shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#e0e1e6] flex items-center justify-between">
              <h2 className="text-lg font-bold text-black">
                {editingApp ? '编辑子应用' : '新增子应用'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                {errorMessage && (
                  <div className="p-3 rounded bg-red-50 border border-red-200 text-red-600 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Key (Only editable on create) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    键标识 (Unique Key) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingApp}
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="例如: CarbonPlatform (不可重复)"
                    className="px-3 py-2 rounded border border-[#d9d9e0] text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black disabled:bg-slate-100 font-mono"
                  />
                  <p className="text-xs text-slate-400">应用的唯一字符标识，建立后不可修改。</p>
                </div>

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    应用名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例如: 能碳管理平台"
                    className="px-3 py-2 rounded border border-[#d9d9e0] text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                  />
                </div>

                {/* Entrance URL */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    入口 URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="例如: https://energy.izpje.com"
                    className="px-3 py-2 rounded border border-[#d9d9e0] text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-mono"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    应用简介
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="简短描述该系统的主要功能"
                    rows={3}
                    className="px-3 py-2 rounded border border-[#d9d9e0] text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black resize-none"
                  />
                </div>

                {/* Grid Fields */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      分类类别
                    </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="如: 生产管理"
                      className="px-3 py-2 rounded border border-[#d9d9e0] text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                    />
                  </div>

                  {/* Sort Order */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      排序权值 (正整数)
                    </label>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(Number(e.target.value))}
                      className="px-3 py-2 rounded border border-[#d9d9e0] text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-mono"
                    />
                  </div>
                </div>

                {/* Main Department Association */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    所属部门 (用于侧边栏筛选) <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={mainDeptId}
                    onChange={(e) => setMainDeptId(e.target.value)}
                    className="px-3 py-2 rounded border border-[#d9d9e0] text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                  >
                    <option value="">-- 请选择关联单位与部门 --</option>
                    {departmentsTree.map((unit) => (
                      <optgroup key={unit.id} label={unit.name}>
                        {unit.departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Preset Icon Dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    图标预设 (Icon)
                  </label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="px-3 py-2 rounded border border-[#d9d9e0] text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-mono"
                  >
                    {ICON_PRESETS.map((iconName) => (
                      <option key={iconName} value={iconName}>
                        {iconName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Maintenance switch */}
                <div className="flex items-center gap-3 p-3 rounded-lg border border-[#e0e1e6] bg-slate-50 mt-2">
                  <input
                    type="checkbox"
                    id="isMaintenance"
                    checked={isMaintenance}
                    onChange={(e) => setIsMaintenance(e.target.checked)}
                    className="w-4 h-4 accent-black cursor-pointer"
                  />
                  <label htmlFor="isMaintenance" className="text-sm font-semibold cursor-pointer select-none">
                    开启应用维护模式 (开启后禁止非管理员点击跳转)
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-[#e0e1e6] bg-slate-50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#d9d9e0] bg-white hover:bg-slate-100 transition-colors text-xs font-bold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-full bg-black text-white hover:bg-black/90 transition-colors text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
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
