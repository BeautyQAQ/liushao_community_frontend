# 流沙社区前端

Vue 3.5.43 + TypeScript（strict）+ Vite 8 + Vue Router 4 + Vuex 4 + Element Plus。
社区页面保留 Buefy 布局，升级到支持 Vue 3 的 Buefy 3。

## 开发

使用 Node.js 22.12+（已验证 22.23.1）。

```bash
npm ci --include=dev
cp .env.example .env.local
npm run dev
```

默认访问 http://localhost:5173 。开发服务器将 `/api` 转发到 `.env.local` 的 `VITE_API_PROXY_TARGET`。

```bash
npm run typecheck
npm run build
npm run preview
```

`build` 包含类型检查。发布 `dist/` 时需要在反向代理中配置 `/api` 到后端；Vite 的开发代理不会进入生产包。社区站保留 hash 路由。

## 当前范围

本阶段验证首页、热门切换、分页、注册表单、登录及登录状态恢复。帖子详情/编辑、搜索、用户主页等原有链接所指向的页面尚未实现，见根目录 MODERNIZATION.md。

完整迁移范围、验收记录和后续计划见工作区根目录 `MODERNIZATION.md`。
