// The wall: the namespace sends every `fetch` an app makes here, and here it ends. An app reaches
// nothing outside, the Hub included, until a step brings a connector through the platform (S4).
export default {
  fetch() {
    console.warn(JSON.stringify({ level: 40, msg: 'EDGE_OUTBOUND_REFUSED' }))
    return new Response(null, { status: 403 })
  },
} satisfies ExportedHandler
