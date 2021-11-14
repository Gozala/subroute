import type * as Data from "../util/result/result.js"

export interface Parser<C, X, T> {
  parse(state: State<C>): Result<C, X, T>
}

export interface State<Context> extends Position {
  source: string

  method?: string
  headers?: Headers
  params?: URLSearchParams

  context: Located<Context>[]
}

export interface Success<C, T> {
  ok: true
  value: T
  state: State<C>
}

export interface Error<C, X> {
  ok: false
  error: Problems<C, X>
}

export type Result<C, X, T> = Error<C, X> | Success<C, T>

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

export interface Position {
  offset: int
  line: int
  column: int
}

export interface Located<Context> {
  line: int
  column: int
  context: Context
}

import type { Char } from "../util/char/char.js"
import type { int, float } from "../data/api.js"

export type { Char, int, float }

export interface NumberConfig<X, T> {
  int(int: int): Data.Result<X, T>
  hex(int: int): Data.Result<X, T>
  octal(int: int): Data.Result<X, T>
  binary(int: int): Data.Result<X, T>
  float(float: float): Data.Result<X, T>
  invalid: X
  expecting: X
}
