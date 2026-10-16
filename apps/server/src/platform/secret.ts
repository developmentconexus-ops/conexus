/** Kept from logs and responses: printed, serialized or inspected, it shows only its name. */
export class Secret<Name extends string> {
  readonly #value: string
  readonly name: Name

  constructor(name: Name, value: string) {
    this.name = name
    this.#value = value
  }

  reveal(): string {
    return this.#value
  }

  toString(): string {
    return `[${this.name}]`
  }

  toJSON(): string {
    return `[${this.name}]`
  }
}
