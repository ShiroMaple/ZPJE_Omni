# 开发总结：致远协同 OA 组织架构同步与 Ticket 认证对接指南

- **归档日期**：2026-07-30
- **系统及版本**：致远协同管理软件 V9.0SP1
- **REST 认证账户**：
  - **登录名**：`${SEEYON_OA_REST_USERNAME}`（见 `.env`）
  - **密码**：`${SEEYON_OA_REST_PASSWORD}`（见 `.env`）
- **关于如何申请REST账户：** 需要具有系统管理员身份的账户，在OA后台管理-信息集成配置-REST用户管理 中创建，并授予合适的权限
- **涉及模块/服务**：组织模型管理服务 (OrgData)、Token 票据验证服务

---

## 1. REST API 认证 (Token 获取)

调用所有组织架构同步接口前，必须先获取 REST Token，该 Token 在后续请求的 Header 中以 `token` 字段携带。

* **请求 URL**：`POST` `/seeyon/rest/token?option.n_a_s=1`
* **Request Headers**：
  * `Content-Type: application/json`
* **Request Body (JSON)**：
  ```json
  {
    "userName": "${SEEYON_OA_REST_USERNAME}",
    "password": "${SEEYON_OA_REST_PASSWORD}"
  }
  ```
* **响应示例 (JSON)**：
  ```json
  {
    "bindingUser": null,
    "userName": "OmniRest",
    "id": "5c11f994-b84c-41f3-a5ec-a6d318c6ccb6" // 这里的 id 即为后续接口需要的 token
  }
  ```

---

## 2. 组织架构数据同步

### 2.1 获取单位 (OrgAccounts)

获取集团及下属所有单位列表。该接口采用 `GET` 请求。

* **请求 URL**：`GET` `/seeyon/rest/orgAccounts?option.n_a_s=1`
* **Request Headers**：
  * `token`: `<Token_String>`
* **常见字段说明**：
  * `id` (String)：单位 ID（如 `"670869647114347"`，镇海石化建安工程股份有限公司）。
  * `name` (String)：单位名称。
  * `code` (String)：单位编码（如 `"company"`）。
  * `enabled` (Boolean)：是否启用。

### 2.2 获取部门 (OrgDepartments)

获取指定单位下的所有部门列表。该接口采用 `GET` 请求，传入对应的 `accountId`。

* **请求 URL**：`GET` `/seeyon/rest/orgDepartments/{accountId}?option.n_a_s=1`
* **Request Headers**：
  * `token`: `<Token_String>`
* **常见字段说明**：
  * `id` (String)：部门 ID。
  * `name` (String)：部门名称（如 `"繁安公司（外）"`）。
  * `code` (String/null)：部门编码。
  * `enabled` (Boolean)：是否启用。
  * `orgAccountId` (String)：所属单位 ID。

### 2.3 获取在职人员 (OrgMembers)

为了避免一次性查询集团或大公司所有人员导致网络超时或服务内存溢出（如主单位拥有 900+ 部门，人员多达数千人），**强烈建议采取按部门（Department）级联拉取人员的方案**。

* **请求 URL**：`GET` `/seeyon/rest/orgMembers/department/{departmentId}?option.n_a_s=1&firstLayer=false`
* **Request Headers**：
  * `token`: `<Token_String>`
* **参数说明**：
  * `firstLayer=false`：表示递归拉取当前部门及所有子部门下的人员（默认为 `true` 只拉取当前层级）。
* **在职状态筛选规则**：
  拉取的人员列表中包含已离职或被停用的账户，必须严格使用以下布尔属性组合进行过滤以获得**正常在职人员**：
  `enabled === true && isDeleted === false`
* **常见字段说明**：
  * `id` (String)：人员 ID。
  * `name` (String)：姓名（如 `"郑修东"`）。
  * `loginName` (String)：登录账号/用户名（用于 SSO 单点登录匹配，如 `"zxd212735"`）。
  * `code` (String)：人员工号（如 `"00000893"`）。
  * `telNumber` (String)：手机号（如 `"13586886252"`）。
  * `emailAddress` (String)：邮箱。
  * `enabled` (Boolean)：账户启用状态（必须为 `true`）。
  * `isDeleted` (Boolean)：是否已删除（必须为 `false`）。

---

## 3. 单点登录 (用 Ticket 获取用户中文名)

当用户从致远 OA 门户单点登录跳转到第三方系统时，OA 链接后会携带 `ticket` 参数（例如：`?ticket=TICKET_VALUE`）。第三方系统后端可通过此接口验证 Ticket 并换取包括**中文姓名**在内的用户信息。

> [!NOTE]
> 该接口为公共校验接口，安全设计为免 Rest 认证（即**无需**在 Header 中传 `token` 即可直接发起请求）。

* **请求 URL**：`GET` `/seeyon/rest/token/ticket?ticket={ticket_value}`
* **响应示例 (JSON)**：
  * **成功** (code == 0)：
    ```json
    {
      "code": 0,
      "data": {
        "code": "00000893",       // 工号
        "telNumber": "13586886252",// 手机号
        "loginName": "zxd212735",  // 登录账号（用于建立会话）
        "name": "郑修东",          // 用户中文名
        "email": "Zhengxd@izpje.com"
      },
      "message": "成功"
    }
    ```
  * **失败** (code != 0)：
    ```json
    {
      "code": 1,
      "message": "无效的ticket！"
    }
    ```
