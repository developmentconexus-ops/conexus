import { randomInt } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:net'

/** The lowest port the kernel hands out by itself; IANA's where Linux does not say. */
function ephemeralLow(): number {
  try {
    return Number(readFileSync('/proc/sys/net/ipv4/ip_local_port_range', 'utf8').split(/\s+/)[0])
  } catch {
    return 49_152
  }
}

function bindable(port: number): Promise<boolean> {
  const server = createServer()
  return new Promise((resolve) => {
    server.once('error', () => resolve(false))
    server.listen({ host: '0.0.0.0', port }, () => server.close(() => resolve(true)))
  })
}

/**
 * A port free for a Hub the test spawns, below the kernel's ephemeral range: a port of that range,
 * freed here, could be taken before the Hub binds it by one of the Hub's own outbound connections,
 * and the Hub would end without LISTENING.
 */
export async function freePort(): Promise<number> {
  const low = ephemeralLow()
  for (let tries = 0; tries < 100; tries += 1) {
    const port = 1_024 + randomInt(low - 1_024)
    if (await bindable(port)) return port
  }
  throw new Error(`no free port below ${low}`)
}

/** The Hub's two ports, never the same: the config refuses an edge port equal to the Hub's. */
export async function hubPorts(): Promise<{ port: number; edgePort: number }> {
  const port = await freePort()
  let edgePort = await freePort()
  while (edgePort === port) edgePort = await freePort()
  return { port, edgePort }
}
