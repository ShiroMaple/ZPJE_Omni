# Project Cairn Log

This file records substantive progress in reverse-chronological order — newest entry at the top, right below this line. Keep each entry short — summary and pointer only; conclusions settle into `cairn/<topic>.md`.

## 2026-08-20 · 前台应用卡片现代轻量极简重构与角落弥散径向渐变（Radial Ambient Glow）
- **角落弥散径向渐变（Radial Ambient Glow）**：卡片主体保持纯净底色（亮/暗模式自适应），右上角（`circle at 100% 0%`）隐约透出系统专属主题色光晕（默认 7%~12%），Hover 状态平滑增强（14%~24%）并产生对应主题色的环境漫反射投影（`0 12px 24px -6px rgba(theme-rgb, 0.2)`）。
- **顶部排版升级**：
  - 左侧：44×44px 渐变浅底圆角 Duotone 图标（`linear-gradient` 微渐变浅色背景 + 主题色高质感图标）。
  - 右侧：运行状态精简化（正常运行仅保留呼吸微绿点，异常/维护才展示文字药丸），收藏 ⭐ 按钮支持默认低透明度灰色与高亮金黄切换。
- **中部信息聚焦**：
  - 部门标签升级为轻量描边微胶囊（Tag）位于标题上方。
  - 应用标题 16px 加粗并配置 `line-clamp-2` 防超长截断，搭配精炼应用描述。
- **底部触发器精简化**：
  - 移除冗余“进入系统”文字，精简为主题色“访问 →”并在 Hover 时附带微移动动效。
- 代码推送到 GitHub，自动化部署生产服务器并编译验证通过。

## 2026-08-20 · 管理后台深海蓝风格统一、Header 四段式重构与审计表格全高自适应
- **侧边栏统一深海蓝**：管理后台全面采用前台深蓝底色（`bg-zpje-brand` / `#004085`），统一企业 Logo（`建安万维` + `Omni 管理后台`），底部常驻“系统运行正常”呼吸灯与收起侧边栏控制器。
- **Header 四段式布局**：标准化为 `[返回门户前台] -> [明暗切换] -> [绿点+姓名+Popover] -> [退出登录]`。
- **审计表格全高视口自适应与底部分页置底固定**：卡片采用 `flex-1 min-h-0 overflow-hidden`，表头 Sticky 置顶，仅 `tbody` 内部滚动，底部分页栏与每页条数下拉在任何缩放（100%/80%）及分辨率下始终可见。
- **数据呈现与审计功能大升级**：
  - User-Agent 智能语义化解析（OS 图标标签 + 浏览器图标标签，悬浮查看原始完整 UA）。
  - 访客身份分级（`guest` 浅灰弱化胶囊，正式员工彩色头像微标，并支持“全部/仅员工/仅访客”快速过滤）。
  - 访问时间与 IP 等宽字体（`font-mono tabular-nums`）对齐。
  - 顶部集成综合 Toolbar：支持关键词搜索、目标应用下拉筛选、时间跨度快捷切换、一键导出 UTF-8 BOM CSV 与即时刷新。
- 代码已推送到 GitHub 并自动部署至生产服务器，构建成功且 PM2 正常在线。

## 2026-08-20 · 管理后台侧边栏固定、入口迁移与统计翻页控件恢复
- 优化管理后台布局为 `h-screen overflow-hidden`，侧边栏高度独立固定不随工作区滚动。
- “返回门户前台”入口迁移至页面顶部右上角明暗切换按钮左侧。
- 完整恢复“访问与审计统计”标签页下子系统访问统计（时间跨度与翻页）和系统审计日志（关键词搜索、操作类型下拉与翻页）的筛选与分页控件。
- 自动化部署并同步至生产服务器，构建并通过验证（PM2 online）。

## 2026-08-20 · 生产服务器部署完成
- 代码同步并推送到 GitHub 远程仓库 `ShiroMaple/ZPJE_Omni`。
- 生产服务器（192.168.103.191）完成代码同步、Prisma 客户端重新生成、角色表迁移与预置数据同步、生产环境打包构建（`pnpm build`）与 PM2 服务平滑重启（`pm2 restart Omni`）。
- 生产环境服务状态已验证（HTTP 200 OK，Ready in 218ms）。

## 2026-08-20 · 角色权限体系解耦与 Master-Detail 角色中心重构
- 彻底解耦后台管理特权（`Member.adminType`）与业务访问角色（`roles` / `member_roles`），清洗废弃角色字典。
- 业务角色管理重构为 Master-Detail 左右分栏工作台，支持管理员编辑业务角色的 key、name、description 与安全删除角色。
- 支持按致远 OA 部门快速穿梭批量加人与单人移除，各处人数与状态实时响应。
- 应用编辑弹窗升级为 Radio 显式授权与多层级部门折叠树（带搜索与父子级联全选）。
- 详见主题笔记：`cairn/rbac_decoupling_and_master_detail_center.md` 与交接文档 `docs/017_master_detail_role_center_and_tree_permissions.md`。

## 2026-08-20 · 环境依赖与子代理鉴权准则沉淀

- 确认并复盘本地 Docker MySQL 依赖中断与浏览器子代理无法获取 OA SSO 管理权限的问题。
- 确立环境依赖即时提示原则与强鉴权页面测试规范，避免静默重试。
- 详见主题笔记：`cairn/local_dev_and_subagent_testing_reflex.md`。

## 2026-08-20 · Project Cairn 初始化

- 初始化 Project Cairn 知识结构与规范配置。
- 迁移策略: `start_fresh`，语言: `zh`。
- 详见 `AGENTS.md`、`.cairn/config.yaml`。
