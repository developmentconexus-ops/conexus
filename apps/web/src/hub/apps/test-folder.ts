/** A file of a picked folder, as the browser names it: under the folder's own name. */
export function picked(path: string, content: BlobPart = 'x', type = '') {
  const file = new File([content], path.split('/').at(-1) ?? path, { type })
  Object.defineProperty(file, 'webkitRelativePath', { value: path })
  return file
}

/** What `npm run app:pack` makes, inside a folder called `name`. */
export function packed(name = 'recados-1') {
  return [
    picked(`${name}/manifest.json`, '{"contract":1}', 'application/json'),
    picked(`${name}/worker.js`, 'hello', 'text/javascript'),
    picked(`${name}/assets/logo.png`, 'png'),
  ]
}
