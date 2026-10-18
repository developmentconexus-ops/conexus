/** Reads a reply's body up to the cap; past it, it stops reading and answers undefined (code C59). */
export async function cappedText(
  body: ReadableStream<Uint8Array> | null,
  capBytes: number,
): Promise<string | undefined> {
  if (body === null) return ''
  const chunks: Uint8Array[] = []
  let size = 0
  for await (const chunk of body) {
    size += chunk.byteLength
    if (size > capBytes) return undefined
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}
