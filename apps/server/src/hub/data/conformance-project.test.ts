import { runDataConformance } from '@conexus/hub-api/conformance'
import { realWorld } from './test-world.ts'

runDataConformance('projeto: o que o Projeto recebeu cruzado com o papel de Bruno', (t) =>
  realWorld(t, 'PROJECT'),
)
