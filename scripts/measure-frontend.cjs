#!/usr/bin/env node
// Usage: NODE_PATH=/path/to/playwright/node_modules node liushao_community_frontend/scripts/measure-frontend.cjs \
//   --admin /path/to/admin/dist --community /path/to/community/dist --output results.json
// Serves local production builds with identical synthetic API data. Never calls a backend.
const fs = require('node:fs')
const path = require('node:path')
const http = require('node:http')
const zlib = require('node:zlib')
const { chromium } = require('playwright')

const stamp = '2026-10-18T06:00:00Z'
const posts = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1, userId: 1, username: 'reader', alias: '社区读者', avatar: '',
  title: i === 0 ? '分享经验，让每一次交流都有收获' : `社区开发笔记 ${i + 1}`,
  view: 120 + i, createTime: stamp, modifyTime: stamp,
  tags: [{ id: 1, name: '交流', topicCount: 20 }],
}))
const captcha = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><rect width="120" height="40" fill="#eef4f5"/><text x="12" y="28" font-size="24">AB234</text></svg>').toString('base64')

function fixture(url) {
  switch (url.pathname) {
    case '/api/captcha': return { token: 'performance-fixture', captchaImg: captcha }
    case '/api/billboard/show': return { content: '欢迎来到流沙社区，一起分享经验与想法。' }
    case '/api/tip/today': return { content: '把每一个小进步记录下来。', author: '流沙社区' }
    case '/api/promotion/all': return [{ id: 1, title: '社区使用指南', link: '#/post/1' }]
    case '/api/post/list': return { content: posts, totalElements: 20, totalPages: 2, number: 0, size: 10 }
    default: return undefined
  }
}

async function serve(directory) {
  const root = path.resolve(directory)
  const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon' }
  const cache = new Map()
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost')
    if (url.pathname.startsWith('/api/')) {
      const data = fixture(url)
      return setTimeout(() => {
        res.writeHead(data === undefined ? 501 : 200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
        res.end(JSON.stringify({ code: data === undefined ? 501 : 200, message: 'OK', msg: 'OK', data }))
      }, 100)
    }
    let file = path.resolve(root, '.' + decodeURIComponent(url.pathname))
    if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403); return res.end() }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      if (url.pathname.startsWith('/assets/')) { res.writeHead(404); return res.end() }
      file = path.join(root, 'index.html')
    }
    const type = mime[path.extname(file)] || 'application/octet-stream'
    if (!cache.has(file)) {
      const raw = fs.readFileSync(file)
      cache.set(file, { raw, gzip: zlib.gzipSync(raw, { level: 6 }) })
    }
    const useGzip = /gzip/.test(req.headers['accept-encoding'] || '') && /text|javascript|svg/.test(type)
    const body = cache.get(file)[useGzip ? 'gzip' : 'raw']
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': body.length, 'Cache-Control': 'no-store', ...(useGzip ? { 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' } : {}) })
    res.end(body)
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  return { server, url: `http://127.0.0.1:${server.address().port}` }
}

async function measure(browser, url, app, mobile) {
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, locale: 'zh-CN', colorScheme: 'light' })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  if (mobile) {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750, connectionType: 'cellular4g' })
  }
  await page.addInitScript(() => {
    window.__metrics = { lcp: 0, cls: 0, layoutShifts: [] }
    let sessionStart = 0, lastShift = 0, sessionValue = 0
    new PerformanceObserver(list => { for (const e of list.getEntries()) window.__metrics.lcp = e.startTime }).observe({ type: 'largest-contentful-paint', buffered: true })
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) {
        if (e.hadRecentInput) continue
        if (e.startTime - lastShift < 1000 && e.startTime - sessionStart < 5000) sessionValue += e.value
        else { sessionStart = e.startTime; sessionValue = e.value }
        lastShift = e.startTime
        window.__metrics.cls = Math.max(window.__metrics.cls, sessionValue)
        window.__metrics.layoutShifts.push({ time: e.startTime, value: e.value })
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })
  try {
    await page.goto(url + (app === 'admin' ? '/login' : '/#/'), { waitUntil: 'domcontentloaded' })
    if (app === 'admin') await page.locator('.captcha img').waitFor()
    else await page.getByRole('link', { name: posts[0].title, exact: true }).waitFor()
    const contentReady = await page.evaluate(() => performance.now())
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    const result = await page.evaluate(() => ({
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0,
      ...window.__metrics,
      overflow: document.documentElement.scrollWidth > innerWidth,
      resources: performance.getEntriesByType('resource').map(r => ({ name: new URL(r.name).pathname, transfer: r.transferSize, encoded: r.encodedBodySize, decoded: r.decodedBodySize })),
    }))
    const assets = result.resources.filter(r => /\.(js|css)$/.test(r.name))
    return { app, profile: mobile ? 'mobile-4g-4x' : 'desktop', contentReady, ...result, assetRequests: assets.length, assetEncodedBytes: assets.reduce((n, r) => n + r.encoded, 0), errors }
  } finally { await context.close() }
}

async function main() {
  const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, v, i, a) => i % 2 === 0 ? [...pairs, [v.replace(/^--/, ''), a[i + 1]]] : pairs, []))
  if (!args.admin || !args.community || !args.output) throw new Error('Required: --admin DIST --community DIST --output JSON')
  const samples = [], services = {}
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE || undefined })
  try {
    for (const app of ['admin', 'community']) services[app] = await serve(args[app])
    for (const app of ['admin', 'community']) for (const mobile of [false, true]) for (let run = 1; run <= 3; run++) {
      const sample = await measure(browser, services[app].url, app, mobile)
      samples.push({ run, ...sample })
      console.log(`${app} ${sample.profile} #${run}: FCP=${sample.fcp.toFixed(0)}ms LCP=${sample.lcp.toFixed(0)}ms ready=${sample.contentReady.toFixed(0)}ms JS+CSS=${sample.assetEncodedBytes}B overflow=${sample.overflow}`)
    }
    fs.writeFileSync(args.output, JSON.stringify({ date: new Date().toISOString(), browser: browser.version(), apiDelayMs: 100, gzipLevel: 6, samples }, null, 2) + '\n')
    if (samples.some(s => s.errors.length || s.overflow)) process.exitCode = 1
  } finally {
    await browser.close()
    for (const service of Object.values(services)) await new Promise(resolve => service.server.close(resolve))
  }
}
module.exports = { serve, posts, captcha }
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1 })
