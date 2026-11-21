import { runDataConformance } from '@conexus/hub-api/conformance'
import { realWorld } from './test-world.ts'

// The Projeto's laws run in conformance-project.test.ts: 46 worlds pass the runner's 120 s per file.
runDataConformance('empresa: Bruno, de Vendas, sobre o banco de teste e o dublê do Sankhya', (t) =>
  realWorld(t, 'COMPANY'),
)
