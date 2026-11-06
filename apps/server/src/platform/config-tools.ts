import { z } from 'zod'
import { Secret } from './secret.ts'

/**
 * The saved tools' host on the edge (step 24.4), behind Cloudflare Access: an origin and nothing
 * more, over https but for a double on this machine; the Hub calls only `<origin>/<toolVersionId>`.
 */
export const ToolsOrigin = z
  .string()
  .refine((value) => {
    const url = URL.parse(value)
    const local = url?.protocol === 'http:' && url.hostname === '127.0.0.1'
    return url?.origin === value && (url.protocol === 'https:' || local)
  })
  .brand('ToolsOrigin')
export type ToolsOrigin = z.infer<typeof ToolsOrigin>

/** The Access service token, which only `createEdgeTools` sends, to the tools' host alone (S36). */
export type ToolsAccess = Readonly<{
  clientId: Secret<'ToolsAccessClientId'>
  clientSecret: Secret<'ToolsAccessClientSecret'>
}>

export const ToolsEnvironment = z.object({
  HUB_TOOLS_ORIGIN: ToolsOrigin,
  HUB_TOOLS_ACCESS_CLIENT_ID_FILE: z.string().min(1),
  HUB_TOOLS_ACCESS_CLIENT_SECRET_FILE: z.string().min(1),
})

/** The tools' host, and the service token's two halves, each read from its own file by `read`. */
export function toolsConfigOf(
  env: z.output<typeof ToolsEnvironment>,
  read: (variable: string, path: string) => string,
): { toolsOrigin: ToolsOrigin; toolsAccess: ToolsAccess } {
  const id = read('HUB_TOOLS_ACCESS_CLIENT_ID_FILE', env.HUB_TOOLS_ACCESS_CLIENT_ID_FILE)
  const secret = read(
    'HUB_TOOLS_ACCESS_CLIENT_SECRET_FILE',
    env.HUB_TOOLS_ACCESS_CLIENT_SECRET_FILE,
  )
  const toolsAccess = {
    clientId: new Secret('ToolsAccessClientId', id),
    clientSecret: new Secret('ToolsAccessClientSecret', secret),
  }
  return { toolsOrigin: env.HUB_TOOLS_ORIGIN, toolsAccess }
}
