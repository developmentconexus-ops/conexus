// The page of Recados: it calls the app's two operations and shows the list.
async function chamar(operacao, entrada) {
  const resposta = await fetch(`/api/${operacao}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entrada),
  })
  if (!resposta.ok) throw new Error(String(resposta.status))
  return resposta.json()
}

async function mostrar() {
  const lista = document.getElementById('recados')
  const recados = await chamar('listarRecados', {})
  lista.replaceChildren(
    ...recados.map((recado) => {
      const item = document.createElement('li')
      item.textContent = recado.texto
      return item
    }),
  )
}

document.getElementById('escrever').addEventListener('submit', async (evento) => {
  evento.preventDefault()
  const campo = document.getElementById('texto')
  const aviso = document.getElementById('aviso')
  try {
    await chamar('escreverRecado', { texto: campo.value })
    campo.value = ''
    aviso.textContent = ''
    await mostrar()
  } catch {
    aviso.textContent = 'Não deu para guardar o recado. Tente de novo.'
  }
})

mostrar().catch(() => {
  document.getElementById('aviso').textContent = 'Não deu para carregar os recados.'
})
