# 开发总结：双主题 (Theme Toggle) 适配实现

- **归档日期**：2026-07-30
- **涉及模块/文件**：
  - [app/globals.css](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/globals.css)（变量及主题定义）
  - [app/layout.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/layout.tsx)（注入无闪烁脚本及 SEO 优化）
  - [app/Dashboard.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/Dashboard.tsx)（Header 切换按钮及样式重构）
  - [app/Sidebar.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/Sidebar.tsx)（侧边栏样式）
  - [app/admin/page.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/admin/page.tsx) / [AdminAppRegistry.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/admin/AdminAppRegistry.tsx)（管理后台主题适配）
- **阶段状态**：已完成

---

## 1. 本阶段完成工作 (What Was Done)
*   **CSS 主题令牌变量定义**：在 [globals.css](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/globals.css) 中定义了 `[data-theme="light"]`（默认）与 `[data-theme="dark"]` 两套颜色自定义属性，涵盖背景 canvas、前景文本、卡片、边框及悬停背景等。在 `@theme inline` 中映射为 Tailwind 4 实用类（如 `bg-canvas`, `text-title`, `border-card-border`）。
*   **无闪烁首屏渲染**：在 `layout.tsx` 的 `<head>` 中嵌入同步执行的 script，在页面加载及 React 水合前，优先从 `localStorage` / 系统偏好读取主题并写入 `data-theme` 属性至 `<html>`，完美消除了主题切换闪烁（FOUC）。
*   **主页与侧边栏样式适配**：重构了 [Dashboard.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/Dashboard.tsx) 中的应用卡片设计，移除了全卡片亮色渐变，改为严格对齐 `DESIGN_Expo.md` 的轻量化单色卡片。只有应用图标容器保留高饱和度的软品牌颜色。
*   **管理后台全面适配**：对 `/admin` 中的所有组件（列表表格、按钮、选择器、表单域和新建模态框）进行了双主题绑定，使其在明暗模式下表现同样细腻。

## 2. 核心架构与实现细节 (Technical Decisions)
*   **状态同步机制**：为了避免 Next.js 服务端渲染和客户端水合状态不一致引起的 Hydration Mismatch 警告，我们在 Dashboard 中使用了 `mounted` 布尔值，当组件在客户端就绪后再渲染主题切换按钮。
*   **Tailwind 4 主题继承**：借助 Tailwind 4 `@theme` 特性，我们可以直接使用 `border-card-border`、`bg-canvas` 等原生类。相较于在 JS 层面编写样式计算，此方式拥有极佳的 CSS 编译性能。

## 3. 踩坑经验与避坑指南 (Pitfalls & Gotchas)
*   **遇到问题**：在最初引入双主题切换时，若直接使用 Next.js 路由跳转或刷新页面，由于服务端输出的页面默认处于 light 状态，而客户端渲染出 dark 状态，会出现短暂的“白屏闪烁”现象。
*   **解决方案**：通过在 `layout.tsx` 页面头块植入原生的 blocking `<script>` 并在客户端做 `mounted` 锁解决此问题。
*   **避坑提示**：今后在扩充卡片或写后台新组件时，千万不要使用 `bg-slate-900` 或 `border-neutral-200` 等硬编码的 TailWind 颜色类，务必使用自定义的主题变量类（如 `bg-card-surface` 或 `border-card-border`），以确保持续适配双主题。

## 4. 下一步交接指引 (Handover Notes)
- [ ] 继续推进第二阶段体验升级，启动常用应用收藏模块（§2.1）的开发。
- [ ] 添加全局搜索组件（§2.2）。
- **关联依赖**：在开发新数据库结构时，可阅读 [007_app_registry_and_sidebar_filter.md](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/docs/007_app_registry_and_sidebar_filter.md) 了解模型定义和同步脚本。
