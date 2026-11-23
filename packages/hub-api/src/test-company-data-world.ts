import type { CompanyData, DataSources } from './company-data.ts'
import { Catalog, companyData } from './company-data.ts'
import { LAWS_AT } from './company-data-conformance.ts'
import type { DataWorld } from './company-data-world.ts'

const ERP = '00000000-0000-4000-8000-0000000000e1'
const MAIL = '00000000-0000-4000-8000-0000000000e3'

export const CATALOG = Catalog.parse({
  kind: 'CATALOG',
  systems: [
    {
      connection: ERP,
      connector: 'erp-falso',
      name: 'ERP da matriz',
      reads: [
        { operation: 'listarPedidos', label: 'Pedidos', summary: 'Os pedidos de uma situação.' },
        { operation: 'listarClientes', label: 'Clientes', summary: 'Os clientes ativos.' },
      ],
      actions: [
        {
          operation: 'criarPedido',
          label: 'Criar pedido',
          summary: 'Um pedido novo.',
          effect: 'WRITE',
        },
      ],
    },
    {
      connection: MAIL,
      connector: 'correio-falso',
      name: 'Correio',
      reads: [{ operation: 'buscarMensagens', label: 'Mensagens', summary: 'Busca por texto.' }],
      actions: [
        { operation: 'enviarMensagem', label: 'Enviar', summary: 'Uma mensagem.', effect: 'WRITE' },
      ],
    },
  ],
})

type Answer<K extends 'live' | 'funnel'> = Awaited<ReturnType<DataSources[K]>>

type Row = Readonly<Record<string, unknown>>

/** The contract over the fake sources with a record of its own: one row per read, of names; with the record down, no read returns. */
function recordedOver(sources: DataSources, rows: Row[], down: { record: boolean }): CompanyData {
  const data = companyData({ sources, now: () => LAWS_AT })
  return {
    ...data,
    async read(request) {
      const answer = await data.read(request)
      if (down.record) return { kind: 'TABLE_UNAVAILABLE' }
      rows.push({ verb: request.kind, outcome: answer.kind })
      return answer
    },
  }
}

export function fakeWorld(catalog: Catalog = CATALOG): DataWorld {
  const reached: DataWorld['reached'] = { live: [], funnel: [], signals: [] }
  const gave: DataWorld['gave'] = { live: [], funnel: [] }
  const isDown = { catalog: false, record: false }
  const recorded: Row[] = []
  const sources: DataSources = {
    async catalog({ signal }) {
      reached.signals.push(signal)
      return isDown.catalog ? { kind: 'CATALOG_UNAVAILABLE' } : catalog
    },
    async live({ connection, operation, input, signal }) {
      reached.signals.push(signal)
      reached.live.push({ connection, operation, input })
      const answer: Answer<'live'> = { kind: 'OK', value: [{ assunto: 'Pedido 7' }] }
      gave.live.push(answer)
      return answer
    },
    async funnel({ connection, operation, input, call, signal }) {
      reached.signals.push(signal)
      reached.funnel.push({ connection, operation, input, call })
      const answer: Answer<'funnel'> = { kind: 'WRITE_UNCERTAIN', mark: 'pedido-2', returned: null }
      gave.funnel.push(answer)
      return answer
    },
  }
  return {
    sources,
    data: recordedOver(sources, recorded, isDown),
    reads: async () => [...recorded],
    failRecord() {
      isDown.record = true
    },
    reached,
    gave,
    liveInput: {},
    down() {
      isDown.catalog = true
    },
  }
}
