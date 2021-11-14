import * as Parse from "../parse/api.js"
import * as Format from "../format/api.js"
export type { int, float } from "../data/api.js"

export type { NumberConfig } from "../parse/api.js"

export type Row<K extends PropertyKey, V> = {
  [Key in K]: V
}

export type ParseResult<T, X = Problem, C = never> = Parse.Result<C, X, T>
export interface ParseState<C = never> extends Parse.State<C> {}
export interface FormatInput<T, C = never> extends Format.Input<C, T> {}
export interface FormatState<C = never> extends Format.State<C> {}

export interface Route<T, X = Problem, Y = Problem, C = never>
  extends Parse.Parser<C, X, T>,
    Format.Formatter<C, Y, T> {}

export interface Parser<T, X = Problem, C = never>
  extends Parse.Parser<never, Problem, T> {}

export type Match<T> = Route<T> | Capture<T>

export interface Capture<T> {
  parse: null
  until(section: string): Route<T>
  end(): Route<T>
}

export interface RouteHandler<T> extends Parser<T> {
  or<U>(other: RouteHandler<U>): RouteHandler<T | U>
}

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

/**
 * Type representing a segment of the route
 */
export type Segment<T = unknown> =
  | { [K in PropertyKey]: Match<T> }
  | string
  | number
