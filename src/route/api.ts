import * as Parse from "../parser/api.js"
import * as Format from "../formatter/api.js"
import type { Syntax as AdvancedSyntax, Row } from "../syntax/api.js"

export interface Syntax<T> extends AdvancedSyntax<never, Problem, Problem, T> {}

export interface Parser<T> extends Parse.Parser<never, Problem, T> {}

export type Match<T> = Syntax<T> | Capture<T>

export interface Capture<T> {
  parse: null
  until(section: string): Syntax<T>
  end(): Syntax<T>
}

export interface Route<T> extends Syntax<T> {}

export type Problem =
  | { name: "ExpectingMethod"; expecting: string }
  | { name: "Expecting"; expecting: string }
  | { name: "ExpectingInt" }
  | { name: "ExpectingHex" }
  | { name: "ExpectingOctal" }
  | { name: "ExpectingBinary" }
  | { name: "ExpectingFloat" }
  | { name: "ExpectingNumber" }
  | { name: "ExpectingVariable" }
  | { name: "ExpectingSymbol"; expecting: string }
  | { name: "ExpectingKeyword"; expecting: string }
  | { name: "ExpectingEnd" }
  | { name: "ExpectingStart" }
  | { name: "UnexpectedChar" }
  | { name: "Problem"; message: string }
  | { name: "BadRepeat" }

export type Build<
  Params extends Array<unknown>,
  Dict extends {} = {}
> = Params extends []
  ? Dict
  : Params extends [string | number, ...infer Rest]
  ? Build<Rest, Dict>
  : Params extends [{ [K in infer Key]: Match<infer Value> }, ...infer Rest]
  ? Build<Rest, Dict & { [K in Key]: Value }>
  : never
