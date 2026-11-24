import { posix } from 'node:path'
import ts from 'typescript'

export type Named = { name: string; file: string; typeOnly: boolean }

export type Binding = { imported: string; local: string; typeOnly: boolean }

export type Ref = {
  kind: 'import' | 'export'
  node: ts.ImportDeclaration | ts.ExportDeclaration
  target: string
  names: readonly Binding[]
}

export function isTest(file: string): boolean {
  return /\.test\.tsx?$/.test(file)
}

export function isCode(file: string): boolean {
  return /\.tsx?$/.test(file)
}

export function isDoor(file: string): boolean {
  return posix.basename(file) === 'public.ts'
}

export function parse(file: string, text: string): ts.SourceFile {
  const kind = file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind)
}

export function resolved(from: string, specifier: string): string | undefined {
  return specifier.startsWith('.')
    ? posix.normalize(posix.join(posix.dirname(from), specifier))
    : undefined
}

function importedBindings(clause: ts.ImportClause | undefined): Binding[] | undefined {
  const bindings = clause?.namedBindings
  if (clause?.name !== undefined || (bindings !== undefined && !ts.isNamedImports(bindings)))
    return undefined
  return (bindings?.elements ?? []).map((one) => ({
    imported: (one.propertyName ?? one.name).text,
    local: one.name.text,
    typeOnly: clause?.isTypeOnly === true || one.isTypeOnly,
  }))
}

function exportedBindings(node: ts.ExportDeclaration): Binding[] | undefined {
  const clause = node.exportClause
  if (clause === undefined || !ts.isNamedExports(clause)) return undefined
  return clause.elements.map((one) => ({
    imported: (one.propertyName ?? one.name).text,
    local: one.name.text,
    typeOnly: node.isTypeOnly || one.isTypeOnly,
  }))
}

export function refsOf(file: string, source: ts.SourceFile): Ref[] {
  const found: Ref[] = []
  for (const node of source.statements) {
    const isImport = ts.isImportDeclaration(node)
    if (!isImport && !ts.isExportDeclaration(node)) continue
    const specifier = node.moduleSpecifier
    if (specifier === undefined || !ts.isStringLiteral(specifier)) continue
    const target = resolved(file, specifier.text)
    const names = isImport ? importedBindings(node.importClause) : exportedBindings(node)
    if (target === undefined || names === undefined) continue
    found.push({ kind: isImport ? 'import' : 'export', node, target, names })
  }
  return found
}

function isRefDeclaration(node: ts.Node): boolean {
  if (ts.isImportDeclaration(node)) return importedBindings(node.importClause) !== undefined
  return ts.isExportDeclaration(node) && exportedBindings(node) !== undefined
}

function isModuleCall(node: ts.CallExpression, source: ts.SourceFile): boolean {
  return (
    node.expression.kind === ts.SyntaxKind.ImportKeyword ||
    /^vi\.(mock|doMock|importActual|importMock)$/.test(node.expression.getText(source))
  )
}

export function otherSpecifiers(source: ts.SourceFile): ts.StringLiteral[] {
  const found: ts.StringLiteral[] = []
  function visit(node: ts.Node): void {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      !isRefDeclaration(node) &&
      node.moduleSpecifier !== undefined &&
      ts.isStringLiteral(node.moduleSpecifier)
    )
      found.push(node.moduleSpecifier)
    const first = ts.isCallExpression(node) ? node.arguments[0] : undefined
    if (
      ts.isCallExpression(node) &&
      first !== undefined &&
      ts.isStringLiteral(first) &&
      isModuleCall(node, source)
    )
      found.push(first)
    if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteral(node.argument.literal)
    )
      found.push(node.argument.literal)
    ts.forEachChild(node, visit)
  }
  visit(source)
  return found
}

export function namesOfDoor(door: string, text: string): Map<string, Named> {
  const names = new Map<string, Named>()
  for (const ref of refsOf(door, parse(door, text))) {
    if (ref.kind !== 'export') throw new Error(`${door}: a door holds only re-exports`)
    for (const one of ref.names) {
      if (one.imported !== one.local)
        throw new Error(`${door}: ${one.imported} is renamed at the door`)
      names.set(one.local, { name: one.local, file: ref.target, typeOnly: one.typeOnly })
    }
  }
  return names
}
