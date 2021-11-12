export type URL = {
  pathname?: string
  search?: string
  hash?: string
  toString(): string
}

export type Query = Record<string, string>

export interface Input {
  url: string
  method?: string

  headers?: Headers
}

// export interface ParseState<T> {
//   segments: string[]
//   query: Query
//   params: T
// }

// export type ParseResult<T> = null | ParseState<T>
// export type FormatResult<T> = ParseState<T>

// export type Parse = <T>(route: Route<T>, url: URL) => null | T

// export interface Route<Out> {
//   parseRoute<In>(state: ParseState<In>): ParseResult<In & Out>
//   formatRoute<In>(state: ParseState<In & Out>): ParseState<In>
// }

// export interface StaticSegment<segment extends string> {
//   readonly text: segment

//   parseSegment<T>(state: ParseState<T>): ParseResult<T>
//   formatSegment<T>(state: ParseState<T>): FormatResult<T>
// }

// export interface VariableSegment<T> {
//   parseSegment<In>(state: ParseState<In>): ParseResult<In & T>
//   formatSegment<In>(state: ParseState<In & T>): FormatResult<In>
// }

// export interface QueryParam<T> {
//   parseQueryParam<In>(name: string, state: ParseState<In>): ParseResult<In & T>
//   formatQueryParam<In>(
//     name: string,
//     state: ParseState<In & T>
//   ): FormatResult<In>
// }

// export interface DSL<Out> extends Route<Out> {
//   concat<Other>(other: Route<Other>): DSL<Out & Other>
//   parsePath(url: URL): null | Out
//   parseHash(url: URL): null | Out
//   parse(parts: string[], query: Query): null | Out

//   format(data: Out): URL
//   formatPath(data: Out): string
//   formatHash(data: Out): string

//   /**
//    * Adds a static segment.
//    */
//   segment<name extends string>(segment?: name): DSL<Out>
//   const(segment: Segment): DSL<Out>
//   var<T>(segment: VariableSegment<T>): DSL<Out & T>
//   rest<T>(segment: VariableSegment<T>): DSL<Out & T>
//   param<T>(path: VariableSegment<T>): DSL<Out & T>
//   query<K extends string, T>(name: K, param: QueryParam<T>): DSL<Out & T>
// }

// export interface Segment<name extends string = string>
//   extends StaticSegment<name>,
//     Route<{}> {}

// export interface Variable<T> extends VariableSegment<T>, Route<T> {}
// export interface Param<T> extends VariableSegment<T>, QueryParam<T>, Route<T> {}

// export interface Var<K extends PropertyKey, T>
//   extends VariableSegment<{ [key in K]: T }> {}

// export interface Fragment<T extends NonNullable<unknown>> {
//   parse(input: string): T | null
//   format(input: T): string
// }

// export interface NamedParam<Key extends PropertyKey, Value extends unknown>
//   extends VariableSegment<{ [K in Key]: Value }>,
//     QueryParam<{ [K in Key]: Value }> {
//   readonly key: Key
// }

// export type Build<
//   Dict extends Object,
//   Params extends Array<unknown>
// > = Params extends []
//   ? Dict
//   : Params extends [string | number, ...infer Rest]
//   ? Build<Dict, Rest>
//   : Params extends [NamedParam<infer Name, infer Value>, ...infer Rest]
//   ? Build<Dict & { [K in Name]: Value }, Rest>
//   : never

// ----------------------------------

export interface Position {
  offset: Int
  line: Int
  column: Int
}

export interface Located<Context> {
  line: Int
  column: Int
  context: Context
}

// export interface State<Context> extends Position {
//   source: string
//   indent: Int
//   context: Located<Context>[]
// }

export interface ParseState<Context> extends Position {
  url: string
  method?: string
  headers?: Headers

  params?: URLSearchParams
  query: Query

  context: Located<Context>[]
}

export interface FormatState<Context> {
  method: string | undefined
  headers: Headers
  params: URLSearchParams

  context: Located<Context>[]
}

export interface Good<Value, State> {
  ok: true

  progress: boolean
  value: Value
  state: State
}

export interface Bad<Problems> {
  ok: false
  progress: boolean
  error: Problems
}

export type Problems<Context, Problem> = DeadEnd<Context, Problem>[]

/**
 * We have a ton of information here! So in the error message, we can say that “I
 * ran into an issue when parsing a list in the definition of `viewHealthData`.
 * It looks like there is an extra comma.” Or maybe something even better!
 * Furthermore, many parsers just put a mark where the problem manifested. By
 * tracking the `line` and `column` of the context, we can show a much larger region
 * as a way of indicating “I thought I was parsing this thing that starts over
 * here.” Otherwise you can get very confusing error messages on a missing `]`
 * or `}` or `)` because “I need more indentation” on something unrelated.
 * **Note:** Rows and columns are counted like a text editor. The beginning is
 * `line=1`
 * and `column=1`. The `col` increments as characters are chomped. When a `\n` is
 * chomped, `line` is incremented and `col` starts over again at `1`.
 */
export interface DeadEnd<Context, Problem> {
  line: number
  column: number
  problem: Problem
  context: Located<Context>[]
}

import type { Result } from "../util/result/result.js"
import type { Char } from "../util/char/char.js"
export type Tagged<T, Tag> = T & { tag?: Tag }
export type Int = Tagged<number, "Int">
export type Float = Tagged<number, "Float">

export type { Char }

export interface NumberConfig<X, T> {
  int(int: Int): Result<X, T>
  hex(int: Int): Result<X, T>
  octal(int: Int): Result<X, T>
  binary(int: Int): Result<X, T>
  float(float: Float): Result<X, T>
  invalid: X
  expecting: X
}

/**
 * With the simpler `Parser` module, you could just say `symbol ","` and
 * parse all the commas you wanted. But now that we have a custom type for our
 * problems, we actually have to specify that as well. So anywhere you just used
 * a `string` in the simpler module, you now use a `Token<Problem>` in the
 * advanced module:
 *
 * ```ts
 * type Problem =
 *   | { type: 'ExpectingComma' }
 *   | { type: 'ExpectingListEnd' }
 *
 * const token:Token<Problem> = {
 *   type: 'Token',
 *   content: ',',
 *   problem: { type: 'ExpectingComma' }
 * }
 *
 * const listEnd:Token<Problem> = {
 *   type: 'Token',
 *   content: ']',
 *   problem: { type: 'ExpectingListEnd' }
 * }
 * ```
 *
 * You can be creative with your custom type. Maybe you want a lot of detail.
 * Maybe you want looser categories. It is a custom type. Do what makes sense for
 * you!
 */
export interface Token<X> {
  content: string
  expecting: X
}

export interface RouteParser<C, X, T> {
  parseRoute: Parse<C, X, T>
}

export interface FragmentParser<C, X, T> {
  parseFragment: Parse<C, X, T>
}

export interface Parse<C, X, T> {
  (state: ParseState<C>): ParseResult<C, X, T>
}

export type ParseResult<Context, Problem, Value> =
  | Good<Value, ParseState<Context>>
  | Bad<Problems<Context, Problem>>

export interface RouteFormatter<C, X, T> {
  formatRoute: FormatResult<C, X, T>
}

export interface FragmentFormatter<C, X, T> {
  formatFragment: Format<C, X, T>
}

export interface Format<C, X, T> {
  (value: T, state: FormatState<C>): FormatResult<C, X, string>
}

export type FormatResult<Context, Problem, Value> =
  | Good<Value, FormatState<Context>>
  | Bad<Problems<Context, Problem>>

// export interface Route<C, X, T>
//   extends RouteParser<C, X, T>,
//     // , RouteFormatter<C, X, T>
//     Object {}

export type Build<
  C,
  X,
  Dict extends Object,
  Params extends Array<unknown>
> = Params extends []
  ? Dict
  : Params extends [string | number, ...infer Rest]
  ? Build<C, X, Dict, Rest>
  : Params extends [Route<C, X, infer U>, ...infer Rest]
  ? Build<C, X, Dict & U, Rest>
  : never

export interface Route<C, X, T extends Object> extends RouteParser<C, X, T> {
  segment(token: Token<X>): Route<C, X, T>
  param<U extends Object>(parse: Parse<C, X, U>): Route<C, X, T & U>
}

export type Problem =
  | { type: "Expecting"; expecting: string }
  | { type: "ExpectingInt" }
  | { type: "ExpectingHex" }
  | { type: "ExpectingOctal" }
  | { type: "ExpectingBinary" }
  | { type: "ExpectingFloat" }
  | { type: "ExpectingNumber" }
  | { type: "ExpectingVariable" }
  | { type: "ExpectingSymbol"; expecting: string }
  | { type: "ExpectingKeyword"; expecting: string }
  | { type: "ExpectingEnd" }
  | { type: "UnexpectedChar" }
  | { type: "Problem"; message: string }
  | { type: "BadRepeat" }
