export interface Float extends Number {
  [Symbol.toStringTag](): "float"
}
export type float = number & Float

export interface Int extends Number {
  [Symbol.toStringTag](): "int"
}
export type int = number & Int
