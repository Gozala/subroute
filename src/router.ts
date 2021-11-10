import { Param, VariableSegment } from "./route/interface"

declare class Router {
  static route: SegmentReader<{}>

  static enum<Variants extends string[]>(
    ...variants: Variants
  ): <Name extends string>(name: Name) => NamedParam<Name, UnionOf<Variants>>
  static float<Name extends string>(name: Name): NamedParam<Name, number>
  static int<Name extends string>(name: Name): NamedParam<Name, number>
  static string<Name extends string>(name: Name): NamedParam<Name, string>

  static dict<T>(
    value: (name: string) => NamedParam<string, T>
  ): <Name extends string>(name: Name) => NamedParam<Name, Record<string, T>>

  static struct<
    T extends { [key in string]: (name: string) => NamedParam<string, any> }
  >(
    fields: T
  ): <Name extends string>(
    name: Name
  ) => NamedParam<
    Name,
    {
      [Key in keyof T]: T[Key] extends (
        name: string
      ) => NamedParam<string, infer U>
        ? U
        : never
    }
  >
}

interface ParamReader<Params extends Object> {
  <Name extends string, T>(variable: NamedParam<Name, T>): SegmentReader<
    Params & { [K in Name]: T }
  >
}

interface SegmentReader<Params extends Object> {
  (strings: TemplateStringsArray): ParamReader<Params>
}

interface NamedParam<Name extends string, T> {
  readonly name: Name

  parse(input: string): T | null
  format(value: T): string
}

const calculator = Router.route`calculator/`(Router.float("a"))`/+/`(
  Router.float("b")
)

declare function route<
  T extends TemplateStringsArray,
  Params extends NamedParam<string, any>[]
>(strings: T, ...args: Params): Route<Build<{}, Params>>

export interface Route<Params> {
  queryParams<T extends Object>(
    params: (name: string) => NamedParam<string, T>
  ): Route<Params & T>
  query<
    QueryParams extends Record<string, (name: any) => NamedParam<any, any>>
  >(
    parms: QueryParams
  ): Route<
    Params & {
      [Key in keyof QueryParams]: QueryParams[Key] extends (
        name: string
      ) => NamedParam<string, infer T>
        ? T
        : never
    }
  >

  tryParse(): null | Params
  parse(): Params
}

type UnionOf<Variants extends any[]> = Variants extends []
  ? never
  : Variants extends [infer T, ...infer U]
  ? T | UnionOf<U>
  : never

export type Build<
  Dict extends Object,
  Params extends NamedParam<string, any>[]
> = Params extends []
  ? Dict
  : Params extends [NamedParam<infer Name, infer Value>, ...infer Rest]
  ? Rest extends NamedParam<string, any>[]
    ? Build<Dict & { [K in Name]: Value }, Rest>
    : never
  : never

String.raw

const a = route`/calculator/${Router.float("a")}/${Router.string(
  "op"
)}/${Router.float("b")}`

declare function tag<T>(strings: readonly [T], ...args: any[]): T

const requestID = Router.string("requestid")
const after = Router.float
const before = Router.float
const date = Router.string("")

const getPin = route`/pins/${requestID}/`.query({ after })

const cid = Router.string
const name = Router.string
const status = Router.enum("queued", "pinning", "pinned", "failed")
const match = Router.enum("exact", "iexact", "partial", "ipartial")
const meta = Router.dict(Router.string)
const point = Router.struct({ x: Router.int, y: Router.int })

const listPinsQuery = Router.struct({
  cid,
  name,
  match,
  status,
  before,
  after,
  limit: Router.int,
  point,
  meta,
})

const listPins = route`/pins/${requestID}`
  .query({
    cid,
    name,
    match,
    status,
    before,
    after,
    limit: Router.int,
    point,
    meta,
  })
  .parse()

export {}

declare function r(
  strings: TemplateStringsArray,
  ...params: NamedParam<string, unknown>[]
): Route<Build<{}, typeof params>>
