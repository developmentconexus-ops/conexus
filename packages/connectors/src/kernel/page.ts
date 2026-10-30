const PAGE_SECONDS = 30
const PAGE_BYTES = 2_000_000

type Limits = Readonly<{ seconds: number; bytes: number }>

/** A page as text, from a deadline and a size the documentation never reaches; either limit ends the read. */
export async function fetchText(
  url: string,
  limits: Limits = { seconds: PAGE_SECONDS, bytes: PAGE_BYTES },
): Promise<string> {
  const response = await globalThis.fetch(url, {
    signal: AbortSignal.timeout(limits.seconds * 1000),
  })
  if (!response.ok) throw new Error(`${url}: ${response.status}`)
  const reader = response.body?.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (let part = await reader?.read(); part && !part.done; part = await reader?.read()) {
    size += part.value.byteLength
    if (size > limits.bytes) {
      await reader?.cancel()
      throw new Error(`${url}: more than ${limits.bytes} bytes`)
    }
    chunks.push(part.value)
  }
  return Buffer.concat(chunks).toString('utf8')
}
