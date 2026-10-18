/** Bytes in base64, as a CSP hash names them; `url` gives base64url without padding, as a secret travels. */
export function base64Of(bytes: Uint8Array, alphabet: 'standard' | 'url' = 'standard'): string {
  const text = btoa(String.fromCharCode(...bytes))
  if (alphabet === 'standard') return text
  return text.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

export async function sha256Of(text: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))
}
