# 流沙社区前端

Vue 3.5.43 + TypeScript strict + Vite 8 + Vue Router 4 + Vuex 4 + Element Plus。

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

## 容器交付

```bash
docker build -t liushao/community-web:local .
docker run --rm --name community-web --network liushao \
  -p 127.0.0.1:5173:8080 \
  -e API_UPSTREAM=http://community-api:8080 \
  liushao/community-web:local
```

独立运行示例要求已创建 `liushao` Docker 网络，且社区后端以 `community-api` 网络别名加入该网络。完整四服务及 MySQL/Redis 的启动方式见工作区根目录部署说明。

镜像使用 Node.js 22 执行 `npm ci --include=dev` 和严格类型检查构建，运行阶段使用非 root 的 `nginxinc/nginx-unprivileged:stable-alpine`，监听 `8080`。构建上下文排除本地 `.env*`、`.npmrc`、依赖和已有产物；镜像固定浏览器 API 地址为同源 `/api`。Vite 环境变量会写入前端产物，请勿用它们存储密钥。

`API_UPSTREAM` 是容器启动时的后端地址，默认 `http://community-api:8080`，填写协议、主机及端口，不带路径或结尾 `/`。Nginx 将 `/api/post/list` 转成后端 `/post/list`，保留查询参数、请求方法、请求体和认证头。此变量改变后需要重建容器，无需重新构建镜像。

Nginx 使用 Docker 自定义网络的 DNS `127.0.0.11`，解析缓存有效期为 10 秒；后端重建换 IP 后，无需重启前端即可在缓存过期后的请求中重新解析。后端启动和旧地址缓存期间 API 可能暂时返回 502。配置通过 `rewrite ... break` 剥离 `/api/`，再使用不含 URI 的变量 `proxy_pass` 转发，从而保留改写后的路径和原查询参数，语义见 [Nginx proxy_pass 文档](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass)；缓存配置见 [resolver 文档](https://nginx.org/en/docs/http/ngx_http_core_module.html#resolver)。该 DNS 地址适用于此容器方案，迁移到其他运行环境时需按实际 DNS 修改。

`GET /healthz` 返回 `200 ok`，用于镜像健康检查，仅表示静态服务可用；后端有独立健康检查。Nginx 提供 SPA 入口回退，入口 HTML 每次重新验证缓存，带哈希的 `/assets/` 文件缓存一年；缺失的 `/assets/` 资源返回 404，API 错误保持原状态码。

入口会覆盖客户端提供的转发头，后端依据真实连接来源执行限流。`X-Forwarded-Host` 保留请求 Host，`X-Forwarded-Port` 从 Host 中提取对外端口（兼容 `[::1]:端口`；当前 HTTP 入口不带端口时为 80），避免容器端口和对外端口不一致导致同源请求被拒绝；客户端伪造的转发端口会被覆盖。若外层增加 TLS 反向代理，需要按实际可信代理地址配置 Nginx 的真实 IP、协议与对外端口处理，不能直接信任任意来源的 `X-Forwarded-*`。线上 HTTPS、备份和数据库迁移要求见根目录部署说明。

`.github/workflows/ci.yml` 在 push、pull request 或手动触发时安装锁定依赖、执行严格类型检查及生产构建，再构建容器镜像。CI 不需要业务密钥，不推送镜像，也不部署。

## 已实现

- 注册、登录、退出，登录状态恢复；访问发帖/设置页面时跳转登录并返回原页面。
- 首页最新/近七天热门、分页、标题/正文/标签/作者搜索和标签筛选。
- 发布、详情、作者编辑及删除；Markdown 编辑/预览，正文经 DOMPurify 清理后渲染。
- 编辑版本冲突提示，提交失败保留输入，离开未保存的编辑页面时确认。
- 用户主页、作者帖子列表、昵称和简介设置、密码修改；公开主页不显示邮箱。
- 评论与一级回复、自己的评论删除、点赞/取消、收藏/取消和我的收藏分页；登录后保留互动返回路径。
- 用户关注/取消、关注与粉丝分页；通知中心、未读数量、逐条/全部已读；私信会话、发送、历史分页和已读状态。
- PNG/JPEG 图片上传（最大 4 MiB）、头像更新、Markdown 图片插入与预览；图片地址统一经过 API 前缀处理。
- 邮箱验证码验证、忘记密码和验证码重置；验证码有效期 10 分钟，发送后显示重发等待，失败保留输入。
- 我的帖子显示审核状态与原因；作者可以查看和编辑自己的待审核/隐藏帖子，公开页面遵循后端发布状态。
- 按作者身份显示操作按钮，服务端再次检查归属。401 清理本地状态；改密后重新登录。
- 首屏空数据、请求失败和不存在的帖子/用户处理，基础移动端布局。

账号为 2–32 位字母、数字或下划线；密码至少 8 个字符、最多 72 字节。邮箱验证与找回密码需要后端 SMTP 配置；找回请求使用统一提示，不暴露邮箱是否注册。社区账号与后台管理员独立。

使用 Marked 解析 Markdown，并用 DOMPurify 过滤脚本、事件属性等内容；预览与详情复用同一渲染组件。不要绕过该组件直接渲染用户 HTML。

生产构建包含严格类型检查；各阶段接口与浏览器验收结果见工作区根目录 `MODERNIZATION.md`。

## 前端加载与体验

Element Plus 的模板组件、指令和样式按需引入；消息和确认框等命令式 API 的样式由 `unplugin-element-plus` 补齐。中文配置由根 `ElConfigProvider` 提供，构建生成的 `src/components.d.ts` 随代码保留，用于首次构建前的模板类型检查。

社区导航与发帖入口使用原生语义元素，已移除 Buefy 依赖、全量框架样式和字体图标加载。主题工具只在启用深色模式时下载；保留已有主题偏好。公共页面布局与必要的工具样式集中于 `src/assets/app.css`。

导航支持键盘展开、Escape 收起并恢复焦点；页面提供跳到主要内容入口。登录/注册支持回车提交与自动填充，手机分页换行。帖子使用骨架占位，公告、提示语和推广区提供加载提示及失败重试。减少动态效果的系统偏好也会用于滚动行为。

性能对比、测量条件和浏览器验收范围见工作区根目录 `FRONTEND_PERFORMANCE.md`。
