export type URL = {
  pathname?: string
  search?: string
  hash?: string
  toString(): string
}

export type Query = Record<string, string>
export type State<Params extends any[]> = {
  segments: string[]
  params: Params
  query: Query
}

export type MaybeState<Params extends any[]> = null | State<Params>

export type Parse = <Params extends any[]>(
  route: Route<Params>,
  url: URL
) => null | Params

export interface StaticSegment {
  readonly text: string

  parseSegment<Params extends any[]>(state: State<Params>): MaybeState<Params>
  formatSegment<Params extends any[]>(state: State<Params>): State<Params>
}

export interface VariableSegment<T> {
  parseSegment<In extends any[]>(state: State<In>): MaybeState<[...In, T]>
  formatSegment<In extends any[]>(state: State<[...In, T]>): State<In>
}

export interface QueryParam<T> {
  parseQueryParam<In extends any[]>(
    name: string,
    state: State<In>
  ): MaybeState<[...In, T]>
  formatQueryParam<In extends any[]>(
    name: string,
    state: State<[...In, T]>
  ): State<In>
}

export interface Route<Out extends any[]> {
  parseRoute<In extends any[]>(state: State<In>): MaybeState<[...In, ...Out]>
  formatRoute<In extends any[]>(state: State<[...In, ...Out]>): State<In>
}

export interface RouteAPI<Out extends any[]> extends Route<Out> {
  concat<Other extends any[]>(other: Route<Other>): RouteAPI<[...Out, ...Other]>
  parsePath(url: URL): null | Out
  parseHash(url: URL): null | Out
  parse(parts: string[], query: Query): null | Out

  format(...data: Out): URL
  formatPath(...data: Out): string
  formatHash(...data: Out): string

  segment(segment?: string): RouteAPI<Out>
  const(segment: Segment): RouteAPI<Out>
  var<T>(segment: VariableSegment<T>): RouteAPI<[...Out, T]>
  rest<T>(segment: VariableSegment<T>): RouteAPI<[...Out, T]>
  param<T>(path: VariableSegment<T>): RouteAPI<[...Out, T]>
  query<T>(name: string, param: QueryParam<T>): RouteAPI<[...Out, T]>
}

export type Segment = StaticSegment & Route<[]>

export type Variable<T> = VariableSegment<T> & Route<[T]>
export type Param<T> = VariableSegment<T> & QueryParam<T> & Route<[T]>
