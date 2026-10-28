const { test: base, expect } = require('@playwright/test')

const observedContexts = new WeakMap()

function observeContext(context) {
  if (observedContexts.has(context)) return observedContexts.get(context)
  const errors = []
  const observedPages = new WeakSet()
  const observe = page => {
    if (observedPages.has(page)) return
    observedPages.add(page)
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (/Failed to resolve (component|directive)/.test(message.text())) errors.push(message.text())
    })
    page.on('response', response => {
      const url = new URL(response.url())
      if (url.pathname.startsWith('/assets/') && response.status() >= 400) {
        errors.push(`Static asset failed: ${url.pathname} (${response.status()})`)
      }
    })
    page.on('requestfailed', request => {
      const url = new URL(request.url())
      if (url.pathname.startsWith('/assets/') && request.failure()?.errorText !== 'net::ERR_ABORTED') {
        errors.push(`Static asset could not load: ${url.pathname}`)
      }
    })
  }
  context.on('page', observe)
  context.pages().forEach(observe)
  const assertHealthy = () => expect(errors, 'No page exceptions, unresolved components, or failed production assets').toEqual([])
  observedContexts.set(context, assertHealthy)
  return assertHealthy
}

const test = base.extend({
  browserHealth: [async ({ context }, use) => {
    const assertHealthy = observeContext(context)
    await use()
    assertHealthy()
  }, { auto: true }]
})

module.exports = { test, expect, observeContext }
