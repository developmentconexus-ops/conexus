// Travar calls the operation that never ends; the page shows what the platform answered for it.
document.getElementById('travar').addEventListener('click', async () => {
  const resposta = await fetch('/api/travar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  const pagina = new DOMParser().parseFromString(await resposta.text(), 'text/html')
  document.getElementById('aviso').textContent = pagina.querySelector('h1')?.textContent ?? ''
})
