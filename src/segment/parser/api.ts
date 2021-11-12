import { Located, Position, DeadEnd, Problems } from "../../route/api"
export type { Position, Located, Problems, DeadEnd }
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
