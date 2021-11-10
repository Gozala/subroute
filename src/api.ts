import { Param, VariableSegment } from "./route/api.js"

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

export interface ParamReader<Params extends Object> {
  <Name extends string, T>(variable: NamedParam<Name, T>): SegmentReader<
    Params & { [K in Name]: T }
  >
}

export interface SegmentReader<Params extends Object> {
  (strings: TemplateStringsArray): ParamReader<Params>
}

export type ParamBuilder<T> = <Name extends string>(
  name: Name
) => NamedParam<Name, T>

export interface NamedParam<Name extends string, T> {
  readonly name: Name

  parse(input: string): T | null
  format(value: T): string
}

declare function route<
  T extends TemplateStringsArray,
  Params extends NamedParam<string, any>[]
>(strings: T, ...args: Params): Route<Build<{}, Params>>

export interface Route<Params> {
  // queryParams<T extends Object>(
  //   params: (name: string) => NamedParam<string, T>
  // ): Route<Params & T>
  // query<
  //   QueryParams extends Record<string, (name: any) => NamedParam<any, any>>
  // >(
  //   parms: QueryParams
  // ): Route<
  //   Params & {
  //     [Key in keyof QueryParams]: QueryParams[Key] extends (
  //       name: string
  //     ) => NamedParam<string, infer T>
  //       ? T
  //       : never
  //   }
  // >

  tryParse(input: string): null | Params
  parse(input: string): Params
}

export type UnionOf<Variants extends any[]> = Variants extends []
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
