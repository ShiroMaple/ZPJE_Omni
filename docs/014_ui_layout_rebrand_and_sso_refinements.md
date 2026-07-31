# 开发总结：视觉重构、单点登录细节微调与管理后台侧栏重塑

- **归档日期**：2026-07-31
- **涉及模块/文件**：
  - [app/globals.css](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/globals.css) (颜色主题微调)
  - [app/Sidebar.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/Sidebar.tsx) (侧栏暗色背景适配)
  - [app/Dashboard.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/Dashboard.tsx) (主门户头部登录按钮、管理按钮高亮及条件渲染)
  - [app/api/sso/seeyon/route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/sso/seeyon/route.ts) (本地 Cookie 域名适配与开发模式 SSO 免密免握手越权通道)
  - [lib/auth.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/lib/auth.ts) (开发模式下的 zadmin 管理员角色直接判定特权)
  - [app/admin/page.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/admin/page.tsx) (管理端数据装载及会话透传)
  - [app/admin/AdminAppRegistry.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/admin/AdminAppRegistry.tsx) (管理后台全新双栏布局重构、新增按钮下沉及右上角控制栏)
  - [public/tip_entrance.png](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/public/tip_entrance.png) (新增的 OA SSO 菜单位置指引贴图)
- **阶段状态**：已完成

---

## 1. 本阶段完成工作 (What Was Done)

- **明暗主题色差统一**：以能碳平台为基准，将亮色和暗色模式下的建安蓝 (`--zpje-brand`) 统一设定为 `#004085`，建安橙 (`--zpje-accent`) 统一设定为 `#E65C00`。移除了大屏侧栏的 `dark:bg-card-surface` 属性，使左侧侧栏在暗色模式下也保持深蓝基准色。
- **登录状态联动与单点按钮优化**：
  * “通过OA登录”按钮及其悬浮说明图框仅在未登录（游客模式 `isGuest=true`）下渲染。
  * 用户登录后，该按钮隐藏，并在顶栏为“管理后台”按钮应用醒目的实心建安橙样式 (`bg-zpje-accent`)，增加品牌调性与功能引导。
- **SSO 本地开发友好与免密通道**：
  * **本地 Cookie 支持**：在 `/api/sso/seeyon` 路由中，若重定向基准域名包含 `localhost` 或 `127.0.0.1`，则自动不指定 Cookie 属性中的 `domain` 项，规避了浏览器丢弃非匹配根域名 Cookie 的阻碍，实现了本地开发的完美保持登录。
  * **开发免密通道**：在非 production 模式下，若票据为 `dev-zadmin`，跳过致远 OA 远程接口的握手，直接登录为 `zadmin`。
- **开发越权逻辑授权**：在 `lib/auth.ts` 中针对 `process.env.NODE_ENV !== 'production'` 运行态进行判定：若当前用户为 `zadmin`，免除数据库的角色查询判定（本地数据库同步中 `zadmin` 的特权为 NONE），直接判定拥有 `SYS_ADMIN` 系统管理员权限。
- **管理后台 `/admin` 双栏宽屏重构**：
  * **左侧蓝底侧栏**：移除了中置 header 结构，设计了包含 Logo 标题、垂直功能切换菜单（具有 Layers、Shield 等矢量图标）以及底部“返回门户”按键的 `w-64` 侧栏。
  * **操作按钮下沉**：将“新增应用”与“新增 Widget”按钮分别从公共顶栏中移出，放置在各自面板内容区的标题右侧。
  * **右上角控制栏与退出重定向**：在管理后台右上角增加了明暗色切换、当前管理员信息卡片和红底“退出”按钮。如果用户在管理员页面退出，将清空会话并由 `window.location.href = '/'` 强制拉回主门户首页（呈现游客状态），实施退出拦截。
  * **退出按钮暗色模式对齐**：使用统一的 `bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20`，并带有 `<LogOut />` 图标，消除明暗色下的边框白底违和感。
- **编辑应用弹窗与二级归属选择重构**：
  * **弹窗重命名**：将表单弹窗的标题由原来的“编辑子应用/新增子应用”统一更名为“编辑应用/新增应用”。
  * **图标实时预览**：在“图标预设 (Icon)”选择下拉框左侧添加了即时预览区块，基于 `renderIcon` 辅助渲染器根据选中项状态自动显示对应的 Lucide 矢量图标，大幅度改善录入体验。
  * **二级级联选择部门**：将原来扁平、杂乱的“归属侧边栏分类部门”下拉框，拆分为独立的“所属单位”与“归属分类部门”两级级联 `<select>`。先选择所属单位（公司/机构），级联下拉框则利用 React 状态联动动态过滤，仅显示该单位下属的二级部门，杜绝了跨单位错选。

---

## 2. 核心架构与实现细节 (Technical Decisions)

- **状态隔离**：利用 `process.env.NODE_ENV` 实现完全的环境硬切。越权登录和角色免密绕过仅在开发环境（本地 `pnpm dev`）激活，保证生产构建（`pnpm build` -> production）下的绝对安全性。
- **CSS 悬浮显示**：使用纯 CSS `group` 和 `group-hover:opacity-100 group-hover:visible` 进行 tooltip 的绝对定位显示。免去了 React `onMouseEnter` 维护坐标的渲染开销，并加入了 `pointer-events-none` 消除悬浮抖动。
- **多端路由同步**：管理端退出直接作用于全局 Token 清除，并结合客户端硬链接跳转，在清空上下文时完成全链路重定向。

---

## 3. 踩坑经验与避坑指南 (Pitfalls & Gotchas)

- **遇到问题**：本地开发环境 `http://localhost:3000` 登录后无法保持状态，一直显示游客模式。
- **解决方案**：由于 `.env` 配置文件中配置了 `COOKIE_DOMAIN=.izpje.com`，导致本地开发登录时后端仍坚持发送包含 `domain=.izpje.com` 的 Set-Cookie 响应头。现代浏览器会因安全规则丢弃该 Cookie。通过在 `route.ts` 中判断主机名是否包含 `localhost` / `127.0.0.1`，若是则动态删除 Domain 属性得以解决。
- **避坑提示**：**切勿在生产环境的代码路径中开放任何类似 `zadmin` 的直通账号校验。** 任何对数据库判定机制的绕过，必须严格包裹在 `process.env.NODE_ENV !== 'production'` 环境分流判定中。

---

## 4. 下一步交接指引 (Handover Notes)

- [ ] 在服务器上发布当前提交后，确认远程生产环境 of SSO 手续与管理员配置权限依然稳定正常。
- [ ] 观察在生产暗色模式下，新界面布局在各类复杂尺寸客户端上的表现。
- **关联依赖**：远程同步操作时请执行 `pnpm build` 来编译生产资源，并运行 `pm2 restart Omni` 确保服务顺利热重启。
