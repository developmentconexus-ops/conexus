// Diagnostic only, never merged. Loaded into every e2e file process with NODE_OPTIONS=--import.
// A file process still alive 90 s after it started logs, every 30 s, what keeps it alive.
// The timer is unref'd, so the probe itself never keeps a process alive.
const started = Date.now()
function describe(handle) {
  const kind = handle?.constructor?.name ?? typeof handle
  if (kind === 'Socket' || kind === 'TLSSocket')
    return `${kind} ${handle.localAddress}:${handle.localPort}->${handle.remoteAddress}:${handle.remotePort} destroyed=${handle.destroyed}`
  if (kind === 'Server') return `Server ${JSON.stringify(handle.address?.())}`
  if (kind === 'ChildProcess') return `ChildProcess pid=${handle.pid} ${(handle.spawnargs ?? []).slice(0, 4).join(' ')}`
  if (kind === 'Timeout' || kind === 'Immediate')
    return `${kind} ${handle._idleTimeout ?? ''}ms ${String(handle._onTimeout ?? '').replace(/\s+/g, ' ').slice(0, 200)}`
  return kind
}
const isTestFile = /\.test\.ts$/.test(process.argv[1] ?? '')
setInterval(() => {
  if (!isTestFile) return
  const seconds = Math.round((Date.now() - started) / 1000)
  if (seconds < 90) return
  const line = {
    level: 40,
    msg: 'OPEN_HANDLES',
    file: process.argv[1],
    seconds,
    resources: process.getActiveResourcesInfo(),
    handles: process._getActiveHandles().map(describe),
  }
  process.stderr.write(`${JSON.stringify(line)}\n`)
}, 30_000).unref()
