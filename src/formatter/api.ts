import { Located, Problems } from "../parser/api.js"
import * as result from "../util/result/lib.js"

export interface Formatter<C, X, T> {
  format(input: Input<C, T>): Result<X, C>
}

export interface Input<C, T> {
  value: T
  state: State<C>
}
export interface State<Context> {
  pathname: string

  method?: string
  headers?: Headers
  params?: URLSearchParams

  context: Located<Context>[]
}

export type Result<X, C> = result.Result<Problems<C, X>, State<C>>
