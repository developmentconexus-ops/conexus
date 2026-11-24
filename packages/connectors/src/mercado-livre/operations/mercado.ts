import { z } from 'zod'
import { get, valueAt } from '../../kernel/operation.ts'
import { anunciosDetalhe } from './anuncios.ts'
import { chain, Decimal, defineRoute, firstRowWith, PathId } from './route.ts'

export const tendencias = defineRoute({
  id: 'tendencias',
  subject: 'mercado',
  docs: 'tendencias',
  summary: 'Lista as buscas em alta no Mercado Livre Brasil, com a palavra e o endereço da busca.',
  label: 'Tendências',
  input: z.object({}),
  rowsAt: null,
  probe: () => ({}),
  request: () => get('/trends/MLB'),
})

export const maisVendidos = defineRoute({
  id: 'maisVendidos',
  subject: 'mercado',
  docs: 'mais-vendidos-no-mercado-livre',
  summary:
    'Lista os mais vendidos de uma categoria do Mercado Livre Brasil, na ordem, com o id e o tipo de cada um.',
  label: 'Mais vendidos',
  input: z.object({ categoryId: PathId }),
  rowsAt: 'content',
  from: [anunciosDetalhe.id],
  probe: chain(anunciosDetalhe.id, 'body.category_id', (categoryId) => ({
    categoryId,
  })),
  request: (input) => get(`/highlights/MLB/category/${input.categoryId}`),
})

export const tarifaDeVenda = defineRoute({
  id: 'tarifaDeVenda',
  subject: 'mercado',
  docs: 'comissao-por-vender',
  summary:
    'Calcula a tarifa de venda de um preço numa categoria e tipo de anúncio: o valor e a parte percentual e fixa.',
  label: 'Tarifa de venda',
  input: z.object({
    price: z.number().positive().max(1_000_000_000),
    categoryId: PathId,
    listingTypeId: PathId,
  }),
  rowsAt: null,
  from: [anunciosDetalhe.id],
  probe: (earlier) => {
    const row = firstRowWith(earlier, anunciosDetalhe.id, [
      'body.price',
      'body.category_id',
      'body.listing_type_id',
    ])
    const price = Decimal.safeParse(row && valueAt(row, 'body.price')).data
    const categoryId = row && valueAt(row, 'body.category_id')
    const listingTypeId = row && valueAt(row, 'body.listing_type_id')
    return price !== undefined &&
      typeof categoryId === 'string' &&
      typeof listingTypeId === 'string'
      ? { price, categoryId, listingTypeId }
      : null
  },
  request: (input) =>
    get('/sites/MLB/listing_prices', {
      price: input.price,
      category_id: input.categoryId,
      listing_type_id: input.listingTypeId,
    }),
})
