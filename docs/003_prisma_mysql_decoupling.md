# 开发总结：Prisma 7 + MySQL 8.0 数据库单例客户端解耦与数据初始化

- **归档日期**：2026-07-30
- **涉及模块/文件**：
  - [lib/prisma.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/lib/prisma.ts) (新建)
  - [prisma/seed.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/prisma/seed.ts) (修改)
  - [prisma.config.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/prisma.config.ts) (验证)
- **阶段状态**：已完成

---

## 1. 本阶段完成工作

- **创建 Prisma 数据库单例客户端**：在 `lib/prisma.ts` 中实现客户端单例，使 Next.js 在开发模式热重载（Hot Reloading）时不因重复创建实例而耗尽连接池。
- **提取与保护敏感配置**：从 `process.env.DATABASE_URL` 中动态解析出 `host`, `port`, `user`, `password`, `database` 等配置，不在 TS 代码中硬编码任何敏感密码。
- **更新数据种子初始化脚本**：重构 `prisma/seed.ts` 以调用 `lib/prisma.ts` 的单例客户端，插入/更新 5 个核心预置应用数据并进行 `prisma.app.upsert` 幂等性写入。
- **重新编译类型与初始化执行**：在终端成功执行 `npx prisma generate` 重新生成客户端类型，并执行 `npx prisma db seed` 将种子数据成功导入本地 Docker 中的 MySQL 8.0 数据库中。

## 2. 核心架构与实现细节

### Prisma 单例客户端配置 (`lib/prisma.ts`)
我们使用 `@prisma/adapter-mariadb` 驱动适配器连接 MySQL 8.0。在 `lib/prisma.ts` 中做了以下设计：
```typescript
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in environment variables.');
  }

  // 1. 去除可能包裹在环境变量两端的物理双引号
  connectionString = connectionString.replace(/^"|"$/g, '');

  const dbUrl = new URL(connectionString);

  // 2. 将连接 URL 解析后配置给 MariaDB/MySQL 驱动适配器
  const adapter = new PrismaMariaDb({
    host: dbUrl.hostname || '127.0.0.1',
    port: Number(dbUrl.port) || 3306,
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.replace('/', ''),
    allowPublicKeyRetrieval: true, // 核心：开启允许公钥检索，防握手超时
    ssl: false,                    // 本地 Docker 环境禁用 SSL
    connectionLimit: 10,
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

## 3. 踩坑经验与避坑指南

- **遇到问题 1：MySQL 8.0 握手超时限制**
  - **报错/阻碍**：在本地 Docker 运行 MySQL 8.0 容器时，若不配置 SSL 且使用 caching_sha2_password 加密，直接使用常规连接很容易由于 RSA 公钥未获取导致连接挂起并超时报错。
  - **解决方案**：在驱动适配器参数中显式设置 `allowPublicKeyRetrieval: true` 且 `ssl: false`，使得客户端可以自动在非安全信道中向服务端拉取公钥完成认证。
- **遇到问题 2：环境变量的双引号包裹问题**
  - **报错/阻碍**：很多 `.env` 文件格式中将 `DATABASE_URL` 写成了带双引号的值：`DATABASE_URL="mysql://..."`。如果直接用 `new URL(process.env.DATABASE_URL)` 解析，URL 构造函数会将物理双引号视为协议或主机名的一部分，从而跑出 `Invalid URL` 异常。
  - **解决方案**：对传入的连接串进行了正则替换清理：`connectionString.replace(/^"|"$/g, '')`。
  - **避坑提示**：后续开发中如果涉及从其他环境变量动态解析 URL 的场景，请务必同样进行双引号清除。
- **遇到问题 3：PowerShell 中的命令行特殊字符解析**
  - **报错/阻碍**：在 Windows PowerShell 终端中执行包含 `$` 的脚本字符串（例如 `$disconnect`），PowerShell 会将其作为内部变量求值导致变量未定义错误（`VariableIsUndefined`）。
  - **解决方案**：避免在 PowerShell 中直接传复杂的 inline JS，或者通过临时 `verify-seed.ts` 文件执行，再由 shell 清理，避免跨平台转义地狱。

## 4. 下一步交接指引

- [ ] 门节点系统目前已支持多应用卡片的初始化写入，若后续增加或修改新的后台应用卡片，需在 [prisma/seed.ts](file:///c:/Users/gaoft/Documents/CodeSpace/Omni/prisma/seed.ts) 中继续扩充并使用 `npx prisma db seed` 更新记录。
- [ ] 确保开发和生产环境中的 `.env` 中正确配有非硬编码的 `DATABASE_URL`。
- **关联依赖**：在开发和运行项目前，需首先在命令行运行 `npx prisma generate` 重新生成本地客户端。
