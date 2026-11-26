export declare const EntityContextType: { readonly TABLE: 'table' }
export declare const TableDeclareType: { readonly EXPRESSION: 1 }

export type Entity = {
  readonly entityContextType: string
  readonly declareType?: number
  /** The slice of the SQL the entity was read from. */
  readonly text: string
}

declare const parsed: unique symbol
type ParseTree = { readonly [parsed]: true }
type Tokens = readonly unknown[]

export declare class TrinoSQL {
  /** Positions are counted from 1. */
  validate(sql: string): readonly { readonly startLine: number; readonly startColumn: number }[]
  /** Null on a syntax error; each statement starts after its leading comments. */
  splitSQLByStatement(sql: string): readonly { readonly text: string }[] | null
  getAllTokens(sql: string): Tokens
  parse(sql: string): ParseTree
  listen(listener: TrinoEntityCollector, tree: ParseTree): void
}

export declare class TrinoEntityCollector {
  constructor(sql: string, tokens: Tokens)
  getEntities(): readonly Entity[]
}
