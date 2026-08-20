<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Omni 项目协作准则

> 本项目使用 Project Cairn 组织项目知识：`AGENTS.md` 是规则与导航入口，`cairn/` 是项目知识与状态层。

## 项目一句话介绍

建安万维企业统一门户系统 (Next.js 16 + Prisma MySQL + Seeyon OA SSO)

## 初始化配置

- 沉淀提供方: 暂缓对接（首次沉淀时连接外部知识库）
- 知识库索引: 尚未配置
- 沉淀目标: 尚未配置

## 进入项目后的阅读顺序

1. 优先阅读本文件（`AGENTS.md`）。
2. 若存在 `cairn/ROADMAP.md`，阅读其路线图、当前重点与待决问题。
3. 阅读 `cairn/LOG.md` 顶部的最新记录（倒序排列），了解近期进展与关键决策。
4. 按当前任务按需查阅 `cairn/` 下的相关主题笔记。

## 文档职责分工

| 文件 | 角色 | 维护方式 |
|---|---|---|
| `AGENTS.md` (根目录) | 规则与导航 | 极少变动，≤ 60 行 |
| `CLAUDE.md` (根目录) | 单行 `@AGENTS.md` 存根 | 一次性写入 |
| `cairn/ROADMAP.md` | 路线图与进展 | 原地更新，保持精炼 |
| `cairn/LOG.md` | 时间线日志 | 顶部新增（最新优先），每条 ≤ 20 行，摘要 + 指针 |
| `cairn/<topic>.md` | 知识主题笔记（当前事实） | 原地更新；踩坑经验记录于 Lessons 并标注 `contains: [lesson]` |
| `cairn/Reference/` | 外部原始输入 | 按需创建；仅追加 |
| `cairn/Cited.md` | 知识库引用清单 | 仅存指针，不复制正文 |

## 冲突仲裁规则

- 优先级：**主题笔记 (topic notes) > LOG 历史**；规则级冲突由本文件裁定。
- 业务与设计结论以 `cairn/` 主题笔记的最新记录为准。

## 知识萃取与完成准则

- 每次取得实质性进展后，在 `cairn/LOG.md` 顶部追加一条记录（摘要 + 指针），并将结论沉淀至 `cairn/` 主题笔记中。
- **完成回复门禁 (Completion reply gate)：** 在声明工作完成或测试通过前，执行 Cairn 检查点，更新并验证变动记录后再行回复。
