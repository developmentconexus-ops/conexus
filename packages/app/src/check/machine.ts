/**
 * The Builder machine's size, set in the template (`infra/e2b/template.ts`): 2 vCPU and 2 GiB, the
 * founder's choice of 2026-10-30 ("pode ser o M2") after the 512 MiB default let `tipos` run out of
 * memory. E2B takes both natively (`BasicBuildOptions.cpuCount`, `memoryMB`, e2b 2.56.0).
 */
export const MACHINE = Object.freeze({ cpuCount: 2, memoryMB: 2048 })

/** The heap one TypeScript program may use: three quarters of the machine, the rest left to the system and the other processes. */
export const TYPE_HEAP_MB = Math.floor(MACHINE.memoryMB * 0.75)
