import * as Parse from "../parser/api.js"
import * as Format from "../formatter/api.js"

export interface Syntax<C, X, Y, T>
  extends Parse.Parser<C, X, T>,
    Format.Formatter<C, Y, T> {}

export type Row<K extends PropertyKey, V> = {
  [Key in K]: V
}
