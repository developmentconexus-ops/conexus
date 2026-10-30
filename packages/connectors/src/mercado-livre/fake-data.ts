// Invented values only (S40). The buyer's name, e-mail, phone, address and CPF are here on
// purpose: the kit must drop them (`operations.test.ts`, "sem dados do comprador").

export const APP = Object.freeze({
  clientId: 'fake-app-1234567890',
  clientSecret: 'fake-secret-0001',
})
export const REDIRECT_URI = 'https://hub.exemplo.test/integrations/return'

export const SELLER = Object.freeze({ ref: '123456789', label: 'PADARIASOL' })

export const ITEMS = ['MLB1000000001', 'MLB1000000002', 'MLB1000000003']
export const ORDER = 2000000000001
export const PACK = 2000000000099
export const SHIPMENT = 40000000001
export const CLAIM = 5000000001

/** The buyer, as the API sends them on the routes that carry one. */
export const BUYER = {
  id: 77001,
  nickname: 'COMPRADORFICTICIO',
  first_name: 'Maria',
  last_name: 'Fictícia',
  email: 'maria.ficticia@exemplo.test',
  phone: { area_code: '11', number: '988776655' },
  billing_info: { doc_type: 'CPF', doc_number: '52998224725' },
}

export const ORDER_BODY = {
  id: ORDER,
  status: 'paid',
  date_created: '2026-09-10T10:00:00.000-03:00',
  date_closed: '2026-09-10T10:05:00.000-03:00',
  total_amount: 89.9,
  paid_amount: 89.9,
  currency_id: 'BRL',
  pack_id: PACK,
  shipping: { id: SHIPMENT },
  buyer: BUYER,
  order_items: [
    {
      item: { id: ITEMS[0], title: 'Pão de forma integral', seller_sku: 'PAO-001' },
      quantity: 2,
      unit_price: 44.95,
    },
  ],
}

export function itemBody(id: string, index: number) {
  return {
    id,
    title: `Produto fictício ${index + 1}`,
    price: 49.9 + index,
    currency_id: 'BRL',
    available_quantity: 10 - index,
    sold_quantity: index * 3,
    status: 'active',
    permalink: `https://produto.exemplo.test/${id}`,
    category_id: 'MLB1055',
    listing_type_id: 'gold_special',
    condition: 'new',
    user_product_id: index === 0 ? 'MLBU1000001' : null,
    inventory_id: index === 0 ? 'ABCD12345' : null,
  }
}

export function paging(total: number, query: URLSearchParams) {
  return {
    total,
    offset: Number(query.get('offset') ?? 0),
    limit: Number(query.get('limit') ?? 50),
  }
}

/** One answer of the fake: its body, and an optional status. */
type Reply = { body: unknown; status?: number; headers?: Record<string, string> }

/** A route of the fake: which operation it answers and under which permission group (what `refuseGroups` refuses). */
export type Route = {
  name: string
  group: string
  pattern: RegExp
  /** `seller` in the path must be the token's account. */
  answer(a: { query: URLSearchParams; match: RegExpExecArray; headers: Headers }): Reply
}

export const SELLER_PATH = '(?<seller>[A-Za-z0-9_-]+)'

/** The `/users/me` answer, with the fields the kit must not carry. */
export function me(account: { ref: string; label: string }) {
  return {
    id: Number(account.ref),
    nickname: account.label,
    site_id: 'MLB',
    country_id: 'BR',
    user_type: 'normal',
    permalink: `https://perfil.exemplo.test/${account.label}`,
    registration_date: '2020-01-01T00:00:00.000-03:00',
    email: 'dono@exemplo.test',
    phone: { area_code: '11', number: '900000001' },
  }
}
