// Invented values only (S40). The records have the shape the shelf's functions read (`properties`,
// `createdAt`, `updatedAt`, `archived`), "a confirmar na gravação" (9.1).

export const APP = Object.freeze({
  clientId: 'fake-hubspot-app-1234',
  clientSecret: 'fake-hubspot-secret-0001',
})
export const REDIRECT_URI = 'https://hub.exemplo.test/integrations/return'

export const PORTAL = Object.freeze({ id: 987654321 })

/** More than a page of 100, so a walk of the list takes a cursor to its end. */
const COUNT = 230

function stamped(index: number) {
  const at = new Date(Date.UTC(2026, 8, 10, 12, 0, index)).toISOString()
  return { createdAt: at, updatedAt: at, archived: false }
}

/** A contact's e-mail and phone look real, as HubSpot sends them. */
const CONTACTS = Array.from({ length: COUNT }, (_, index) => ({
  id: String(1000 + index),
  properties: {
    email: `contato${index + 1}@exemplo.test`,
    firstname: `Contato${index + 1}`,
    lastname: 'Fictício',
    phone: index === 0 ? '5511988776655' : null,
    createdate: stamped(index).createdAt,
    lastmodifieddate: stamped(index).updatedAt,
    hs_object_id: String(1000 + index),
  },
  ...stamped(index),
}))

const COMPANIES = Array.from({ length: COUNT }, (_, index) => ({
  id: String(2000 + index),
  properties: {
    name: `Empresa Fictícia ${index + 1}`,
    domain: `empresa${index + 1}.exemplo.test`,
    industry: 'FOOD_BEVERAGES',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
    phone: '+55 11 3000-0000',
    website: `https://empresa${index + 1}.exemplo.test`,
    createdate: stamped(index).createdAt,
    hs_lastmodifieddate: stamped(index).updatedAt,
    hs_object_id: String(2000 + index),
  },
  ...stamped(index),
}))

const DEALS = Array.from({ length: COUNT }, (_, index) => ({
  id: String(3000 + index),
  properties: {
    dealname: `Negócio fictício ${index + 1}`,
    dealstage: 'qualifiedtobuy',
    pipeline: 'default',
    amount: String(1000 + index),
    closedate: stamped(index).createdAt,
    createdate: stamped(index).createdAt,
    hs_lastmodifieddate: stamped(index).updatedAt,
    hs_object_id: String(3000 + index),
  },
  ...stamped(index),
}))

export const OBJECTS = { contacts: CONTACTS, companies: COMPANIES, deals: DEALS } as const
