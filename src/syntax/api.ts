import * as Parse from "../parser/api.js"
import * as Format from "../formatter/api.js"
import type { Result } from "../util/result/result.js"
import { int, float } from "../data/api.js"

export interface Syntax<C, X, Y, T>
  extends Parse.Parser<C, X, T>,
    Format.Formatter<C, Y, T> {}

export type Row<K extends PropertyKey, V> = {
  [Key in K]: V
}

export interface NumberConfig<X, T> {
  int(int: int): Result<X, T>
  hex(int: int): Result<X, T>
  octal(int: int): Result<X, T>
  binary(int: int): Result<X, T>
  float(float: float): Result<X, T>
  invalid: X
  expecting: X
}
