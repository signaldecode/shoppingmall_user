const FALLBACK_IMAGE = '/images/빈이미지.png'

export default defineNuxtPlugin(() => {
  if (typeof document === 'undefined') return

  document.addEventListener('error', (e) => {
    const el = e.target
    if (el.tagName !== 'IMG') return
    if (el.dataset.fallbackApplied) return

    el.dataset.fallbackApplied = 'true'
    el.src = FALLBACK_IMAGE
  }, true)
})
