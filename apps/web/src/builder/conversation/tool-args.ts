export function stringArg(args: unknown, key: string): string | undefined {
  if (args && typeof args === 'object' && key in args) {
    const value = Reflect.get(args, key)
    return typeof value === 'string' && value.length > 0 ? value : undefined
  }
  return undefined
}

/** Like `stringArg`, but an empty string is kept: an edit that deletes text has `new_string: ''`. */
function stringField(args: unknown, key: string): string | undefined {
  if (args && typeof args === 'object' && key in args) {
    const value = Reflect.get(args, key)
    return typeof value === 'string' ? value : undefined
  }
  return undefined
}

/** The edit a row shows, from the call's arguments (playground `toolEdit`, keyed by the body). */
export type Edit =
  | { path?: string; before: string; after: string }
  | { path?: string; content: string }

export function editOf(body: string, args: unknown): Edit | undefined {
  const path = stringArg(args, 'path')
  if (body === 'edit') {
    const after = stringField(args, 'new_string')
    return after === undefined
      ? undefined
      : { path, before: stringField(args, 'old_string') ?? '', after }
  }
  if (body === 'write') {
    const content = stringField(args, 'content')
    return content === undefined ? undefined : { path, content }
  }
  return undefined
}

/** A text cut at the screen's limit, with an ellipsis where it was cut (Factory, 800). */
const SHOWN_LIMIT = 800
export function shown(text: string): string {
  return text.length > SHOWN_LIMIT ? `${text.slice(0, SHOWN_LIMIT)}…` : text
}
