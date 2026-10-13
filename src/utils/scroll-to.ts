export function scrollTo(to: number, duration = 500, callback?: () => void): void {
  const start = window.scrollY
  const startTime = performance.now()
  const animate = (now: number) => {
    const progress = duration <= 0 ? 1 : Math.min((now - startTime) / duration, 1)
    const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2
    window.scrollTo(0, start + (to - start) * eased)
    if (progress < 1) requestAnimationFrame(animate)
    else callback?.()
  }
  requestAnimationFrame(animate)
}
