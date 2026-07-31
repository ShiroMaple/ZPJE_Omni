# 开发总结：管理后台操作审计与访问统计日志展示系统

- **归档日期**：2026-07-31
- **涉及模块/文件**：
  - [prisma/schema.prisma](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/prisma/schema.prisma) (增加 SystemLog 统一审计模型)
  - [lib/audit.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/lib/audit.ts) (创建通用的审计日志服务 recordSystemLog)
  - [app/admin/page.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/admin/page.tsx) (查询并序列化操作日志，反查用户真实姓名)
  - [app/admin/AdminAppRegistry.tsx](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/admin/AdminAppRegistry.tsx) (增加折叠侧边栏状态交互、整合次级 Tab 切换、重构日志表格)
  - [app/api/sso/seeyon/route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/sso/seeyon/route.ts) (加入单点登录日志)
  - [app/api/auth/logout/route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/auth/logout/route.ts) (加入用户登出日志)
  - [app/api/user/access-logs/route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/user/access-logs/route.ts) (加入子系统访问日志)
  - [app/api/admin/apps/route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/admin/apps/route.ts) (加入创建应用操作日志)
  - [app/api/admin/apps/[id]/route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/admin/apps/[id]/route.ts) (加入修改、删除应用操作日志)
  - [app/api/admin/widgets/route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/admin/widgets/route.ts) (加入创建 Widget 日志)
  - [app/api/admin/widgets/[id]/route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/admin/widgets/[id]/route.ts) (加入修改、删除 Widget 日志)
  - [app/api/admin/members/route.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/app/api/admin/members/route.ts) (加入配置管理员分配日志)
- **阶段状态**：已完成

---

## 1. 本阶段完成工作 (What Was Done)
- **管理后台体验与布局微调**：
  - 侧边栏折叠交互：在管理后台左侧增加了折叠/展开功能并持久化到本地 `localStorage`，收起后收缩至 `64px` 仅显示图标。
  - “返回门户”按钮位置微调：移出侧边栏，转换为头部高质感控制按钮，完美嵌置在“明暗切换”按钮的右侧。
  - 按钮样式统一：将管理后台与首页的明暗主题切换按钮在盒模型尺寸与图标色彩上完全对齐。
- **应用管理表列补充**：
  - 在应用列表表格中补充展示“所属部门”列，若无部门则显示为 `通用应用`。
- **操作审计日志展示系统 (System Audit Logs)**：
  - **Prisma 层面**：增加 `SystemLog` 模型用于追踪全部操作记录，并部署到远程数据库。
  - **后端拦截层面**：编写通用 recordSystemLog 异步封装，并在 Seeyon 单点登录、用户登出、系统访问、应用增删改、Widget增删改、特权管理员权限变更时进行全场景审计记录。
  - **访问统计升级**：重构“用户访问审计与统计”列表，反查数据库匹配展示“用户姓名”，将“用户账号”列更名为“用户登录名”。
  - **审计展示层面**：在后台“统计与审计”Tab 下引入双子 Tab 面板，包含完整的审计日志检索、根据类型过滤器分类、分页器以及多彩类型标签渲染。

## 2. 核心架构与实现细节 (Technical Decisions)
- **解耦的用户姓名反查**：
  - 审计流水日志模型本身只存有账号名（`loginName`），为避免大量 Join 关联导致数据库性能受损，在 Node 服务端层面采取了在内存中建立 Hash 映射（由 `prisma.member` 集合提取）的形式，动态在服务端反查用户的真实中文姓名并序列化后下发。
- **主题切换样式对齐**：
  - 纠正了管理后台的主题按钮尺寸（改为固定的 `w-10 h-10`）和文字类（改为 `text-title`），确保不论是在亮色主题下（呈现标准深灰）还是暗色主题下（呈现标准纯白）都与首页具有一致的色度与质感。

## 3. 踩坑经验与避坑指南 (Pitfalls & Gotchas)
- **遇到问题**：Next.js Client 组件的 Hydration（注水）严格模式下，在 onClick 事件处理器中使用隐式的全局 `confirm()`，会导致浏览器运行时报 `ReferenceError` 或注水引用异常，阻断了删除等操作。
- **解决方案**：全部调用强绑定为 `window.confirm(...)`。
- **避坑提示**：后续开发 Client 侧逻辑时，凡是调用系统原生 Confirm 或 Alert，必须写成 **`window.confirm(...)`**，避免隐式调用。

## 4. 下一步交接指引 (Handover Notes)
- [ ] 随着 SystemLog 数据库记录逐渐增多，可考虑增加定时任务或数据库清理策略，定期清理超过 180 天的审计日志。
- [ ] 后续可以扩充图表，以更直观的折线图展示登录记录和操作频度趋势。
- **关联依赖**：每次本地及远程数据库表字段变更后，必须在终端执行 `npx prisma generate` 重新生成 client 依赖包，否则会导致 TypeScript 编译检查无法读取新模型定义而失败。
