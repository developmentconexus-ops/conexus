/** An Apple browser: iPhone, iPad (also as a Mac with a touch screen) and Safari on the Mac, all WebKit. */
export function isAppleWebKitBrowser(): boolean {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return true
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true
  return /Safari/.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Edg|Android|OPR/.test(ua)
}
