type Kind = 'local' | 'session'

/**
 * The browser's storage, which refuses in a private window or with site data blocked: a value that
 * cannot be kept is lost and the page works without it (web W19).
 */
export function pageStorage(kind: Kind): Pick<Storage, 'getItem' | 'setItem'> {
  function open() {
    return kind === 'local' ? globalThis.localStorage : globalThis.sessionStorage
  }
  return {
    getItem(key) {
      try {
        return open().getItem(key)
      } catch {
        // biome-ignore lint/plugin: storage the browser refuses reads as nothing kept (web W19)
        return null
      }
    },
    setItem(key, value) {
      try {
        open().setItem(key, value)
        // biome-ignore lint/plugin: a browser that refuses storage keeps the value for this page only (web W19)
      } catch {
        // The value holds for this page when the browser refuses storage (web W19).
      }
    },
  }
}
