# 流沙社区前端

Vue 3.5.43 + TypeScript strict + Vite 8 + Vue Router 4 + Vuex 4 + Element Plus/Buefy。

## 开发

需要 Node.js 22.12+（已验证 22.23.1）：

```bash
npm ci --include=dev
cp .env.example .env.local
npm run dev
```

默认访问 http://localhost:5173 。`/api` 由 Vite 代理至 `VITE_API_PROXY_TARGET`（默认 http://localhost:8080）。请先按社区后端 README 启动 MySQL、Redis 和应用，再通过注册页面创建社区账号。

```bash
npm run typecheck
npm run build
npm run preview
```

生产发布 `dist/`，并在服务器上将 `/api` 转发至后端；开发代理不会进入生产包。路由使用 hash 模式。

## 已实现

- 注册、登录、退出，登录状态恢复；访问发帖/设置页面时跳转登录并返回原页面。
- 首页最新/近七天热门、分页、标题/正文/标签/作者搜索和标签筛选。
- 发布、详情、作者编辑及删除；Markdown 编辑/预览，正文经 DOMPurify 清理后渲染。
- 编辑版本冲突提示，提交失败保留输入，离开未保存的编辑页面时确认。
- 用户主页、作者帖子列表、昵称和简介设置、密码修改；公开主页不显示邮箱。
- 按作者身份显示操作按钮，服务端再次检查归属。401 清理本地状态；改密后重新登录。
- 首屏空数据、请求失败和不存在的帖子/用户处理，基础移动端布局。

账号为 2–32 位字母、数字或下划线；密码至少 8 个字符、最多 72 字节。注册邮箱目前仅作联系信息，不提供邮件验证或密码找回。社区账号与后台管理员独立。

使用 Marked 解析 Markdown，并用 DOMPurify 过滤脚本、事件属性等内容；预览与详情复用同一渲染组件。不要绕过该组件直接渲染用户 HTML。

本阶段已完成严格类型检查、生产构建及真实 NAS 环境 Chromium 业务联调。组件库当前仍全量引入，构建的大分包提示留待后续性能阶段优化。
