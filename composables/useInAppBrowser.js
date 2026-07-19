/**
 * Detect in-app browsers (Messenger, Facebook, Instagram, WhatsApp, etc.)
 * and try to escape into a real browser where PWA install works.
 */
export const useInAppBrowser = () => {
  const detectApp = () => {
    if (!import.meta.client) return null
    const ua = navigator.userAgent || ''
    if (/FBAN|FBAV|FB_IAB|FB4A|FBAN\//i.test(ua) && !/Messenger/i.test(ua)) return 'facebook'
    if (/Messenger|FBAV.*Messenger/i.test(ua)) return 'messenger'
    if (/Instagram/i.test(ua)) return 'instagram'
    if (/WhatsApp/i.test(ua)) return 'whatsapp'
    if (/Telegram/i.test(ua)) return 'telegram'
    if (/Line\//i.test(ua)) return 'line'
    if (/MicroMessenger|WeChat/i.test(ua)) return 'wechat'
    if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) return 'tiktok'
    if (/Snapchat/i.test(ua)) return 'snapchat'
    // Generic WebView markers (Android)
    if (/; wv\)|WebView/i.test(ua) && /Android/i.test(ua)) return 'webview'
    return null
  }

  const isInAppBrowser = () => !!detectApp()

  const detectPlatform = () => {
    if (!import.meta.client) return 'desktop'
    const ua = navigator.userAgent || ''
    if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
    // iPadOS 13+ reports as Mac — detect touch Mac
    if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return 'ios'
    if (/android/i.test(ua)) return 'android'
    return 'desktop'
  }

  const isStandaloneMode = () => {
    if (!import.meta.client) return false
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      !!window.navigator.standalone
    )
  }

  const getCurrentUrl = () => {
    if (!import.meta.client) return ''
    return window.location.href.split('#')[0]
  }

  const getHostAndPath = (url) => {
    try {
      const u = new URL(url)
      return `${u.host}${u.pathname}${u.search}`
    } catch {
      return url.replace(/^https?:\/\//, '')
    }
  }

  /**
   * Best-effort open in a real browser.
   * In-app WebViews block true PWA install — escaping is the only path.
   * Returns which strategy was attempted.
   */
  const openInExternalBrowser = (targetUrl) => {
    if (!import.meta.client) return 'none'
    const url = targetUrl || getCurrentUrl()
    const platform = detectPlatform()
    const hostPath = getHostAndPath(url)
    const encoded = encodeURIComponent(url)

    if (platform === 'android') {
      // 1) Chrome-specific intent with fallback URL
      const chromeIntent =
        `intent://${hostPath}` +
        `#Intent;scheme=https;package=com.android.chrome` +
        `;S.browser_fallback_url=${encoded};end`
      try {
        window.location.href = chromeIntent
        return 'android-chrome-intent'
      } catch {
        /* continue */
      }
    }

    if (platform === 'ios') {
      // Prefer Safari (required for Add to Home Screen)
      try {
        window.location.href = `x-safari-https://${hostPath}`
        return 'ios-safari'
      } catch {
        /* continue */
      }
      // Chrome on iOS as secondary
      try {
        window.location.href = `googlechrome://navigate?url=${encoded}`
        return 'ios-chrome'
      } catch {
        /* continue */
      }
    }

    // Generic Android VIEW intent (user picks browser)
    if (platform === 'android') {
      try {
        window.location.href =
          `intent://${hostPath}#Intent;scheme=https;action=android.intent.action.VIEW;end`
        return 'android-view-intent'
      } catch {
        /* continue */
      }
    }

    // Last resort
    try {
      const w = window.open(url, '_blank', 'noopener,noreferrer')
      if (w) return 'window-open'
    } catch {
      /* ignore */
    }

    window.location.href = url
    return 'location-href'
  }

  const copyLink = async (targetUrl) => {
    const url = targetUrl || getCurrentUrl()
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        return true
      }
    } catch {
      /* fallback below */
    }
    try {
      const ta = document.createElement('textarea')
      ta.value = url
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }

  const shareLink = async (targetUrl, title = 'Green Ball') => {
    const url = targetUrl || getCurrentUrl()
    if (!navigator.share) return false
    try {
      await navigator.share({ title, url, text: title })
      return true
    } catch {
      return false
    }
  }

  const canShare = () =>
    import.meta.client && typeof navigator !== 'undefined' && !!navigator.share

  return {
    detectApp,
    isInAppBrowser,
    detectPlatform,
    isStandaloneMode,
    getCurrentUrl,
    openInExternalBrowser,
    copyLink,
    shareLink,
    canShare,
  }
}
