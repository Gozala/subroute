export type URL = {
  pathname?: string
  search?: string
  hash?: string
  toString(): string
}

export type Query = Record<string, string>

export interface ParseState<T> {
  segments: string[]
  query: Query
  params: T
}

export type ParseResult<T> = null | ParseState<T>
export type FormatResult<T> = ParseState<T>

export type Parse = <T>(route: Route<T>, url: URL) => null | T

export interface Route<Out> {
  parseRoute<In>(state: ParseState<In>): ParseResult<In & Out>
  formatRoute<In>(state: ParseState<In & Out>): ParseState<In>
}

export interface StaticSegment<segment extends string> {
  readonly text: segment

  parseSegment<T>(state: ParseState<T>): ParseResult<T>
  formatSegment<T>(state: ParseState<T>): FormatResult<T>
}

export interface VariableSegment<T> {
  parseSegment<In>(state: ParseState<In>): ParseResult<In & T>
  formatSegment<In>(state: ParseState<In & T>): FormatResult<In>
}

export interface QueryParam<T> {
  parseQueryParam<In>(name: string, state: ParseState<In>): ParseResult<In & T>
  formatQueryParam<In>(
    name: string,
    state: ParseState<In & T>
  ): FormatResult<In>
}

export interface DSL<Out> extends Route<Out> {
  concat<Other>(other: Route<Other>): DSL<Out & Other>
  parsePath(url: URL): null | Out
  parseHash(url: URL): null | Out
  parse(parts: string[], query: Query): null | Out

  format(data: Out): URL
  formatPath(data: Out): string
  formatHash(data: Out): string

  /**
   * Adds a static segment.
   */
  segment<name extends string>(segment?: name): DSL<Out>
  const(segment: Segment): DSL<Out>
  var<T>(segment: VariableSegment<T>): DSL<Out & T>
  rest<T>(segment: VariableSegment<T>): DSL<Out & T>
  param<T>(path: VariableSegment<T>): DSL<Out & T>
  query<K extends string, T>(name: K, param: QueryParam<T>): DSL<Out & T>
}

export interface Segment<name extends string = string>
  extends StaticSegment<name>,
    Route<{}> {}

export interface Variable<T> extends VariableSegment<T>, Route<T> {}
export interface Param<T> extends VariableSegment<T>, QueryParam<T>, Route<T> {}

export interface Var<K extends PropertyKey, T>
  extends VariableSegment<{ [key in K]: T }> {}

export interface Fragment<T extends NonNullable<unknown>> {
  parse(input: string): T | null
  format(input: T): string
}

export interface NamedParam<Key extends PropertyKey, Value extends unknown>
  extends VariableSegment<{ [K in Key]: Value }>,
    QueryParam<{ [K in Key]: Value }> {
  readonly key: Key
}

export type Build<
  Dict extends Object,
  Params extends Array<unknown>
> = Params extends []
  ? Dict
  : Params extends [string | number, ...infer Rest]
  ? Build<Dict, Rest>
  : Params extends [NamedParam<infer Name, infer Value>, ...infer Rest]
  ? Build<Dict & { [K in Name]: Value }, Rest>
  : never
