// Loaded with --import into a Hub a test spawns, where `plantPasswordService` cannot reach: the
// leaked-password service answers that no password is leaked, and no test reaches the real one
// (testing T14).
const real = globalThis.fetch
const RANGE = 'https://api.pwnedpasswords.com/range/'

globalThis.fetch = async (input, init) => {
  const url = input instanceof Request ? input.url : String(input)
  if (!url.startsWith(RANGE)) return await real(input, init)
  return new Response(`${'0'.repeat(35)}:0`)
}
