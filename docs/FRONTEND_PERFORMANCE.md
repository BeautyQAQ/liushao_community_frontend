# 前端加载与体验优化记录

2026-10-18。基线为管理前端 `1693fa1`、社区前端 `090e0b7` 的生产构建；优化结果来自本次本地工作区。范围是两套前端的加载、移动布局、键盘操作和加载/错误反馈。

## 首屏实测

下表为每种场景三次冷启动的中位数，均使用生产构建、相同浏览器、相同模拟数据。kB 按 1000 字节计算。

移动场景：390 × 844，设备像素比 2，CPU 放慢 4 倍，网络延迟 150 ms，下载 1.6 Mbps、上传 0.75 Mbps。

| 页面 | 首屏 JS/CSS 压缩响应体 | 首次内容绘制 FCP | 最大内容绘制 LCP | 关键内容可见 | CLS |
| --- | --- | --- | --- | --- | --- |
| 管理登录页 | 404.4 → 123.8 kB（减少 69.4%） | 3.03 → 1.60 s | 3.15 → 1.76 s | 3.17 → 2.11 s | 0.0000 → 0.0000 |
| 社区首页 | 626.9 → 179.9 kB（减少 71.3%） | 4.28 → 1.20 s | 4.28 → 2.78 s | 5.46 → 3.05 s | 0.6106 → 0.0029 |

桌面场景：1440 × 900，不额外限制网络或 CPU。

| 页面 | FCP | LCP | 关键内容可见 | CLS |
| --- | --- | --- | --- | --- |
| 管理登录页 | 316 → 240 ms | 356 → 320 ms | 387 → 405 ms | 0.0009 → 0.0000 |
| 社区首页 | 476 → 176 ms | 476 → 528 ms | 777 → 531 ms | 0.0974 → 0.0021 |

桌面管理页的关键内容可见时间、社区首页的 LCP 没有改善；本地低延迟测量存在波动，页面内容和 LCP 候选元素也发生了变化。保留全部测量结果，后续应使用实际设备与真实用户数据复核。

首屏资源统计包含导航后实际请求的全部 JS/CSS，包括动态路由与共享模块，取 Resource Timing 的 `encodedBodySize`；不包含 HTTP 头、HTML、API 和图片。分包后管理页 JS/CSS 请求数由 8 增至 12，社区页由 17 增至 31，体积收益和请求数量均已计入上述实测。

“关键内容可见”指管理页验证码图片节点可见、社区首页第一条帖子标题链接可见，不代表后端业务吞吐或全站所有资源加载完毕。CLS 按没有近期输入的布局偏移计算最大会话窗口（间隔不超过 1 秒、窗口不超过 5 秒）；只观察本次首次加载阶段。

## 构建产物

下表均为压缩前 kB；全部 JS/CSS 是 `dist/assets` 对应文件的合计。入口体积包含拆分的影响，首屏加载总量以上面的浏览器测量为准。

| 工程 | 入口 JS | 主 CSS | 全部 JS | 全部 CSS |
| --- | --- | --- | --- | --- |
| 管理端 | 869.91 → 93.58 | 361.77 → 5.90 | 1153.43 → 699.39 | 364.63 → 186.94 |
| 社区端 | 1303.09 → 49.42 | 1216.79 → 7.30 | 1687.83 → 718.70 | 1222.25 → 122.75 |

两端构建不再出现超过 500 kB 的分包警告；没有提高告警阈值。既有依赖版本保持不变，新增两个构建插件，社区端删除 Buefy 及其专属依赖。

## 实现

- 模板组件和 `v-loading` 通过 `unplugin-vue-components` 的 Element Plus resolver 按需引入；`unplugin-element-plus` 补齐 `ElMessage`、`ElMessageBox` 等命令式 API 的样式。中文语言配置由根 `ElConfigProvider` 提供。依据：[组件插件文档](https://github.com/unplugin/unplugin-vue-components#usage)、[Element Plus 样式插件文档](https://github.com/element-plus/unplugin-element-plus#usage)。
- 保留生成的 `src/components.d.ts`，使干净检出后的首次类型检查覆盖模板；管理表格通过 `@vue-generic` 指定业务行类型，补齐用户创建时间类型和动态表单的字符串绑定。
- 管理布局延迟加载，登录入口不下载后台布局；社区导航与发帖入口改用原生语义元素，移除 Buefy、全量框架 CSS、字体图标和未使用的全局日期工具注册。现有页面必要的布局工具样式集中维护。
- 深色模式工具仅在启用时下载，保留已有偏好，并提供切换失败提示。
- 导航支持键盘展开、Escape 收起与焦点恢复；增加跳到主要内容入口、可见焦点、减少动态效果的系统偏好。登录注册支持回车提交和自动填充；手机分页换行、表单和弹窗适配窄屏。
- 公告、提示语、推广和验证码增加加载、失败与重试反馈。帖子列表增加骨架占位，预留页脚和验证码空间，减少数据到达后的内容跳动。

## 验证范围

- 两端 `npm run build`（含严格 TypeScript 检查）通过；`git diff --check` 通过。依赖安装时两端 audit 均为 0 个已知漏洞。
- Chromium 共 82 项页面/交互检查通过：1440px 与 390px 下的社区公开/登录页面、管理系统与八类运营页面、确认框/详情/系统弹窗、导航、键盘搜索、回车登录、深色模式延迟加载、API 失败重试。没有页面脚本错误、未解析组件或整页横向溢出。
- 追加检查跳到主要内容、减少动态效果模式、Space 展开和 Escape 收起导航；骨架与验证码预留空间最终在 320/390/1440px 下复核通过。
- 浏览器校验使用固定模拟 API；没有连接 NAS、写入真实账号或重新执行后端业务联调。未执行正式部署、完整屏幕阅读器审计或真实用户性能采样。

2026-10-19 已追加生产镜像与真实 MySQL、Redis、SMTP 的桌面/手机业务回归，共 10 项通过，入口和记录见 [e2e/README.md](../e2e/README.md)。该轮验证功能闭环；本文件中的性能数字和 82 项检查仍对应上述固定模拟 API 的测量环境。

## 测量环境与复现

Node.js 22.23.1，Playwright 1.64.0，Chromium 148.0.7778.96，同一台 Linux 主机。静态服务器使用本机 HTTP/1.1、gzip level 6；每个样本使用新浏览器上下文并禁用缓存。API 使用脚本内固定数据和 100 ms 响应延迟，测量期间不运行构建或其他浏览器任务。

在工作区根目录先构建两端。准备 Playwright 与 Chromium 后运行：

```bash
NODE_PATH=/path/to/playwright/node_modules \
CHROMIUM_EXECUTABLE=/path/to/chromium/chrome \
node liushao_community_frontend/scripts/measure-frontend.cjs \
  --admin authority_management_frontend/dist \
  --community liushao_community_frontend/dist \
  --output /tmp/frontend-performance.json
```

如果使用 Playwright 配套安装的浏览器，可以省略 `CHROMIUM_EXECUTABLE`。对比改动时，先保存旧版本的两套 `dist`，分别把旧、新目录传给同一脚本；保持浏览器、机器和测量条件一致。脚本只提供本地模拟 API，不要求启动后端。

原始记录：[优化前](frontend-performance/before.json)、[优化后](frontend-performance/after.json)、[中位数与构建统计](frontend-performance/summary.json)、[82 项浏览器检查](frontend-performance/browser-checks.json)。复现入口：[测量脚本](../scripts/measure-frontend.cjs)。
