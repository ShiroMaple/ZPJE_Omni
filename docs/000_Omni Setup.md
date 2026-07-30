# Role & Goal
你是一位资深 Next.js / TypeScript 全栈架构师。请协助我搭建一个名为 **Omni** 的企业级统一门户 MVP 项目（域名：`omni.izpje.com`）。

该项目将作为公司（镇海石化建安工程股份有限公司）所有数字化应用的统一入口，负责处理来自致远 OA（`https://oa.izpje.com/`）的单点登录（SSO）Ticket 握手，并签发覆盖根域名 `.izpje.com` 的 JWT Cookie，实现子应用无感免登。

---

## 1. 技术栈与环境依赖
- **框架**：Next.js (App Router, TypeScript)
- **样式**：Tailwind CSS + Lucide React 图标库
- **JWT / 密码学**：`jose`（兼容 Edge Runtime，用于生成/解密 JWT）
- **包管理器**：pnpm

---

## 2. 请生成以下关键文件结构与代码

### ① 环境变量模板 `.env.example`
配置以下必需变量：
- `SHARED_JWT_SECRET`: 32位以上的强随机密钥（用于所有子系统与门户共享 JWT 校验）
- `SEEYON_OA_HOST`: `https://oa.izpje.com`
- `COOKIE_DOMAIN`: `.izpje.com`

### ② 致远 OA SSO 处理接口 `app/api/sso/seeyon/route.ts`
- **接收参数**：URLQuery `ticket`
- **校验逻辑**：
  1. 若缺少 `ticket`，返回 400 错误。
  2. 向致远 OA 服务器发起验证：`GET ${SEEYON_OA_HOST}/seeyon/thirdpartyController.do?ticket=${ticket}`
  3. 从响应头（如 `LoginName`）或响应 Body 中解析出登录账号 `loginName`（若校验失败，重定向至 `/login-failed`）。
  4. 使用 `jose` 库将 `{ loginName, issuer: 'omni' }` 签发为 JWT Token，有效期 8 小时。
  5. 设置 HTTP Cookie：
     - Name: `token`
     - Domain: `.izpje.com`
     - Path: `/`
     - HttpOnly: `true`, Secure: `true`, SameSite: `lax`
  6. 成功后重定向至门户首页 `/`。
- 相关文档：[单点登录(SSO) | 技术平台](https://open.seeyoncloud.com/v5devCTP/39/1858.html#实现方式一-关联系统-扩展栏目)

### ③ 门户鉴权中间件 `middleware.ts`
- 检查请求中的 `token` Cookie。
- 若存在且有效，将其解析到的用户信息注入请求头 `x-user-id`。
- 若无 Cookie 或无效，允许以游客身份浏览门户，但在 Header 或 Request 中标记未登录状态。

### ④ 门户看板首页 `app/page.tsx`
设计一个现代化、优雅且符合工控/企业级审美的门户工作台（包含 Header 和应用卡片网格）：
- **Header**：左侧显示 Omni Logo 与系统标题；右侧显示当前登录用户账号（如 `登录账号: zb180056` 或 `未登录(演示模式)`）。
- **应用网格（App Grid）**：渲染预置的 6 个子系统卡片，点击在**新标签页**打开：
  1. **OA** | 建安协同管理软件 | `https://oa.izpje.com/` | 状态: 运行中
  2. **CarbonPlatform** | 能碳管理平台 | `https://carbonplatform.izpje.com/` | 状态: 运行中
  3. **FabFlow** | 制造标准工期计算工具 | `https://fabflow.izpje.com/` | 状态: 运行中
  4. **supos_Kanban** | SupOS数采看板 | `https://suposdata.izpje.com/` | 状态: 运行中
  5. **DocEx** | 智能结构化提取文档数据 | `https://docex.izpje.com/` | 状态: 运行中
  6. **WeldSnap** | 管道焊接过程质量管理工具 | `https://weldsnap.izpje.com/` | 状态: 运行中
- **卡片交互**：显示图标、系统名称、描述、实时响应状态圆点、以及“进入系统 →”按钮。

### ⑤ 子应用通用接入模板 `docs/child-app-middleware-template.ts`
提供一份给其他 Next.js 子应用（如 WeldSnap/FabFlow）直接复制粘贴使用的 `middleware.ts` 文件。
- 该文件读取 `.izpje.com` 下的 `token` Cookie。
- 使用相同的 `SHARED_JWT_SECRET` 校验合法性。
- 无效则自动跳转回 `https://omni.izpje.com`。

---

## 3. 输出要求
1. 请按目录结构依次输出上述文件的完整代码，注释清晰。
2. 在文件头部标注建议存放的文件路径（如 `// app/api/sso/seeyon/route.ts`）。
3. 确保代码语法无误、类型严谨（TypeScript Strict Mode）。