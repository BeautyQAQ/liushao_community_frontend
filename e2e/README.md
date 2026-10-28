# 真实接口浏览器回归

在工作区根目录运行：

```bash
python3 liushao_community_frontend/e2e/run.py
```

需要本机 Docker Engine / Compose v2、Python 3，以及 Node.js 22.12.0 或更高版本。首次运行还需要下载 npm 包、Chromium 和构建镜像所需的网络。Linux 若缺少浏览器系统库，先在 `liushao_community_frontend/e2e/` 执行 `npm ci`、`npm exec --no -- playwright install --with-deps chromium`，后一个命令可能需要管理员权限来安装系统包。

测试包使用独立锁文件，固定 Playwright 1.64.0，不改变两套前端的依赖。默认安装该 Playwright 版本配套的 Chromium；通过 `CHROMIUM_EXECUTABLE` 指定现有浏览器时会跳过浏览器下载，该浏览器版本由调用者选择。镜像构建前会先启动一次浏览器，检查可执行文件及系统库，并将实际 Node.js、Playwright 和 Chromium 版本写入私密运行记录 `runtime.json`。

入口自动生成随机项目名、随机本机端口和独立凭据，从当前四个工程构建生产镜像；启动全新 MySQL 8.4、Redis 7、仅内存收件的 SMTP 测试服务及四个应用；先执行部署冒烟，再执行浏览器用例。应用通过各自 Nginx 的同源 `/api` 访问真实接口，没有 `page.route`、模拟 API 或认证替身。

## 覆盖范围

八条业务用例分别在 1440×900 桌面和 390×844 手机视口运行，共十六项：

| 场景 | 浏览器操作及服务端核验 |
| --- | --- |
| 发布 | 注册、登录、Markdown 预览/清理、正文图片、发帖编辑、搜索标签；旧版本冲突和未登录写入拒绝 |
| 社交 | 头像上传、评论回复、点赞收藏、关注粉丝、通知已读、双向私信；图片/评论/帖子归属、幂等计数、第三人私信隔离 |
| 邮件 | 实际 SMTP 投递、邮箱验证、找回密码、新密码登录；验证码一次性、统一找回响应、旧密码及旧登录失效 |
| 运营 | 管理员验证码登录、隐藏帖子、作者修改待审、重新公开、社区账号禁用恢复、操作审计 |
| 权限 | 只读账号界面限制与服务端 403、实时撤权、角色变更及重置密码后的旧登录撤销 |
| 内容发现 | 精华与置顶标识、隐藏内容排除、关注动态登录提示、当前账号筛选、取消关注及栏目刷新恢复 |
| 草稿 | 输入后立即刷新恢复、账号隔离、草稿箱续写、真实发布及清除草稿、防重复发布、删除 |
| 草稿恢复 | 真实断网期间继续输入、恢复连接后同步、过期版本拒绝覆盖、保留冲突正文并复制为新主题 |

重要写操作等待浏览器触发的真实 HTTP 响应并校验结果；同时检查状态落库后的读取结果、页面异常、未解析组件、失败的生产静态资源及关键页面横向溢出。保持应用原有限流：仅对明确的 429 做有界等待，不清空限流键、不修改生产认证逻辑。后台验证码只从本次隔离 Redis 读取，核验有效期和一次性消费，不使用固定测试验证码。

SMTP 收件器只存在于测试 Compose 覆盖文件中，内存最多保留 200 封、每封最多 512 KiB，超限会拒收；它不向外投递、不打印邮件内容。邮件验证码从实际收件结果解析，支持当前 JavaMail 单段纯文本邮件的 UTF-8 Base64 主题，以及 Base64、quoted-printable 或直接文本正文。此验收不覆盖正式邮件服务的认证、TLS 或送达率。

2026-10-25 完整验收：16 项全部通过，0 跳过、0 失败、0 用例重试，浏览器阶段约 293 秒；生产构建、部署冒烟及自动清理通过。本次通过 `CHROMIUM_EXECUTABLE` 使用本机 Chromium 148.0.7778.96，Playwright 1.64.0；默认下载的配套浏览器未在本次验收运行。应用提交及未提交状态、实际运行版本、各项结果、38 个功能与验收入口文件的源码哈希及清理核验见[2026-10-25 验收记录](docs/regression/2026-10-25.json)。2026-10-19 的原 10 项验收另存为[历史记录](docs/regression/2026-10-19.json)。

2026-10-28 目录整理后复验：通过本仓库 `e2e/run.py` 从新位置构建四个生产镜像，部署冒烟和桌面/手机共 16 项用例全部通过，0 失败、0 跳过、0 重试；本轮测试容器、卷、镜像、凭据和临时产物已清理。见 [最新脱敏记录](docs/regression/latest.json)。

## 常用选项

```bash
# 仅跑手机视口，仍创建全新隔离环境。
python3 liushao_community_frontend/e2e/run.py --project mobile

# 按标题筛选用例。
python3 liushao_community_frontend/e2e/run.py --project desktop --grep '真实邮件'

# 已安装测试依赖和 Chromium 时跳过安装。
python3 liushao_community_frontend/e2e/run.py --skip-install

# 使用本机已有的 Chromium，跳过浏览器下载；Playwright 仍由锁文件固定。
CHROMIUM_EXECUTABLE=/absolute/path/to/chrome python3 liushao_community_frontend/e2e/run.py

# 可信镜像源/企业 Maven 配置，仅影响镜像构建。
python3 liushao_community_frontend/e2e/run.py --npm-registry https://registry.npmmirror.com \
  --maven-settings /absolute/path/to/settings.xml

# 只列出用例，无须启动服务。
cd liushao_community_frontend/e2e
npm run test:list
```

## 隔离与诊断

- 每次生成 `liushao-e2e-<时间>-<随机值>`，只允许本地 Docker Unix socket；两端入口和收件 HTTP 仅绑定 `127.0.0.1`，数据库及 Redis 不暴露宿主机端口。
- 不读取 `.env.local` 或 `liushao_community_backend/deploy/.env`，过滤调用 shell 中的应用和 Compose 环境变量；数据库、Redis、JWT、后台密码、内部运营密钥全部独立生成。绝不对 NAS、共享 Redis 或已有项目执行清理操作。
- 默认无论成功或失败均清理本次项目的容器、卷和生成的应用镜像；SIGINT/SIGTERM 同样进入清理。Docker 守护进程不可用或进程被 SIGKILL 时无法保证即时清理，入口会在可处理的清理失败时保留项目名和私密环境路径。
- 结果保存在 `liushao_community_frontend/e2e/.artifacts/<运行编号>/`：`runtime.json`、`runner.log`、`results.json`、HTML 报告和失败截图；失败时另保存服务日志。目录仅当前用户可读，不进入 Git。默认禁用包含请求正文/令牌的 trace、视频和存储状态导出；不要将整个产物目录公开发布。
- `--keep-environment` 仅用于本机调试，会保留该隔离项目和权限为 `0600` 的凭据文件，并输出准确的清理命令。调试完成后执行该命令，再删除对应的 `private/environment` 文件。默认运行不保留凭据。

本测试包拒绝直接连接任意环境的 `npm test`；使用上述 Python 入口创建隔离环境。这里的测试是会新增和修改数据的验收，不应指向生产环境。

## CI 接入

测试包和运行入口随社区前端仓库版本管理，部署编排随社区后端仓库版本管理。现有四个项目的独立 CI 保持原有范围。

无界面 CI 使用相同命令和非零退出码，可用 `--project desktop` 缩短反馈时间。安装 Chromium 系统库后运行 `python3 liushao_community_frontend/e2e/run.py`，成功和失败都会自动清理。按需受控保存 `results.json`，日志及截图保持私密。

集成 CI 需把四个仓库的固定提交检出到同级目录，再从共同父目录执行运行入口。测试入口无需父目录本身具有 Git 仓库，也不负责推送或发布。
