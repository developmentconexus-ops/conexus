/** How long a saved file's address lives: Firefox reads the blob after the click returns. */
const REVOKE_AFTER_MS = 40_000

/** Saves the bytes as a file: a blob that an `<a download>`, held by the page for the click, saves. */
export function saveBlob(blob: Blob, name: string): void {
  const href = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = name
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(href), REVOKE_AFTER_MS)
}
