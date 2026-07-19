export abstract class ValueObject<T> {
  protected constructor(private readonly _value: T) {}

  get value(): T {
    return this._value
  }

  /** Structural equality between value objects of the same concrete type. */
  equals(other?: ValueObject<T>): boolean {
    if (other === undefined || other === null) {
      return false
    }

    if (other.constructor !== this.constructor) {
      return false
    }

    return JSON.stringify(this._value) === JSON.stringify(other.value)
  }

  toString(): string {
    return String(this._value)
  }
}
