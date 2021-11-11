import * as Parser from "./parse.js"
import * as API from "./route/api.js"

/**
 * @template T
 * @typedef {API.Parse<never, API.Problem, T>} Parse
 */

/**
 * @template {Object} T
 * @typedef {API.Route<never, API.Problem, T>} Router
 */

/**
 * @template {PropertyKey} Key
 * @param {Key} key
 * @returns {Router<{[K in Key]: string}>}
 */
export const text = key => new TextSegment(key)

/**
 * @template C, X
 * @template {PropertyKey} Key
 * @implements {API.Route<C, X, {[K in Key]: string}>}
 */
class TextSegment {
  /**
   * @param {Key} key
   */
  constructor(key) {
    this.key = key
  }

  /**
   * @param {API.Token<X>} token
   * @returns {API.Route<C, X, {[K in Key]: string}>}
   */
  segment(token) {
    const { key } = this
    const parse = Parser.mapChompedString((source, value) => {
      return /** @type {{[K in Key]: string}} */ ({ [key]: source })
    }, Parser.chompUntil(token))

    return new Route(parse)
  }
  /**
   * @template {Object} U
   * @param {API.Parse<C, X, U>} other
   * @returns {API.Route<C, X, {[K in Key]: string} & U>}
   */
  param(other) {
    return new Route(Parser.extend(this.parseRoute, other))
  }

  /**
   * @returns {API.Parse<C, X, {[K in Key]: string}>}
   */
  get parseRoute() {
    const { key } = this
    const parse = Parser.chain(
      Parser.getChompedString(Parser.chompUntilEndOr(`\n`)),
      value => {
        if (value.length > 0) {
          return Parser.succeed(
            /** @type {{[K in Key]: string}} */ ({ [key]: value })
          )
        } else {
          return Parser.problem(ExpectingEnd)
        }
      }
    )

    Object.defineProperty(this, "parse", { value: parse })
    return parse
  }

  /**
   * @param {{[K in Key]: string}} data
   * @param {API.FormatState<C>} state
   */
  formatRoute(data, state) {
    return data[this.key]
  }
}

/**
 * @template {PropertyKey} Key
 * @param {Key} key
 * @returns {Router<{[K in Key]: API.Float}>}
 */
export const float = key =>
  Route.from(named(key, Parser.float(ExpectingFloat, ExpectingFloat)))

/**
 * @template {PropertyKey} Key
 * @param {Key} key
 * @returns
 */
export const int = key =>
  Route.from(named(key, Parser.int(ExpectingInt, ExpectingInt)))

/**
 * @template {PropertyKey} Key
 * @template C, X, V
 * @param {Key} key
 * @param {API.Parse<C, X, V>} parse
 * @returns {API.Parse<C, X, {[K in Key]: V}>}
 */
const named = (key, parse) =>
  Parser.map(parse, value => /** @type {{[K in Key]: V}} */ ({ [key]: value }))

/**
 * @template {Array<API.Route<never, API.Problem, Object>|string|number>} Params
 * @param {readonly string[]} strings
 * @param  {Params} params
 * @returns {API.Route<never, API.Problem, API.Build<never, API.Problem, {}, Params>>}
 */
export const route = (strings, ...params) => {
  /** @type {API.Route<never, API.Problem, *>} */
  let route = Route.root({})
  let offset = 0
  while (offset < strings.length) {
    const content = strings[offset]
    if (content.length > 0) {
      route = route.segment({
        content,
        expecting: { type: "Expecting", expecting: content },
      })
    }

    if (offset < params.length) {
      const param = params[offset]

      route =
        typeof param === "string" || typeof param === "number"
          ? route.segment({
              content: param.toString(),
              expecting: { type: "Expecting", expecting: param.toString() },
            })
          : Route.compose(route, param)
    }
    offset++
  }
  return route.param(Parser.end({}, ExpectingEnd))
}

/**
 * @template C, X
 * @template {Object} T
 * @implements {API.Route<C, X, T>}
 */
class Route {
  /**
   * @template C, X, T
   * @param {T} value
   * @returns {API.Route<C, X, T>}
   */
  static root(value) {
    return new Route(Parser.succeed(value))
  }

  /**
   * @template C, X, T
   * @param {API.Parse<C, X, T>} parse
   * @returns {API.Route<C, X, T>}
   */
  static from(parse) {
    return new Route(parse)
  }

  /**
   * @template C, X, T, U
   * @param {API.Route<C, X, T>} left
   * @param {API.Route<C, X, U>} right
   */
  static compose(left, right) {
    return new RouteComposer(left, right)
  }
  /**
   * @param {API.Parse<C, X, T>} parse
   */
  constructor(parse) {
    this.parseRoute = parse
  }

  /**
   * @template U
   * @param {API.Token<X>} token
   * @returns {API.Route<C, X, T>}
   */
  segment(token) {
    return withSegment(this, token)
  }
  /**
   * @template {Object} U
   * @param {API.Parse<C, X, U>} other
   * @returns {API.Route<C, X, T & U>}
   */
  param(other) {
    return withParam(this, other)
  }
}

/**
 * @template C, X
 * @template {Object} T
 * @template {Object} U
 * @param {API.Route<C, X, T>} route
 * @param {API.Parse<C, X, U>} next
 * @returns {API.Route<C, X, T & U>}
 */

const withParam = (route, next) =>
  new Route(Parser.extend(route.parseRoute, next))

/**
 * @template C, X, T, U
 * @param {API.Route<C, X, T>} route
 * @param {API.Token<X>} token
 * @returns {API.Route<C, X, T>}
 */
const withSegment = (route, { content, expecting }) =>
  new Route(Parser.skip(route.parseRoute, Parser.token(content, expecting)))

/**
 * @template C, X, T, U
 * @implements {API.Route<C, X, T & U>}
 */
class RouteComposer {
  /**
   * @param {API.Route<C, X, T>} left
   * @param {API.Route<C, X, U>} right
   */
  constructor(left, right) {
    this.left = left
    this.right = right
  }

  get parseRoute() {
    const parse = Parser.extend(this.left.parseRoute, this.right.parseRoute)
    Object.defineProperty(this, "parse", {
      value: parse,
    })
    return parse
  }

  /**
   * @param {API.Token<X>} token
   * @returns {API.Route<C, X, T & U>}
   */
  segment(token) {
    return withParam(this.left, this.right.segment(token).parseRoute)
  }
  /**
   * @template {Object} E
   * @param {API.Parse<C, X, E>} other
   * @returns {API.Route<C, X, T & U & E>}
   */
  param(other) {
    return withParam(this, other)
  }
}

// /**
//  * @template {Array<API.NamedParam<string, unknown>|string|number>} Params
//  * @param {readonly string[]} strings
//  * @param  {Params} params
//  * @returns {API.Route<API.Build<{}, Params>>}
//  */

// export const routeWithMethod = (strings, ...params) => {
//   const [first, ...parts] = strings
//   if (first.startsWith("/")) {
//     return route(strings, ...params)
//   } else {
//     const offset = first.indexOf("/")
//     if (offset < 0) {
//       const method = first.trim().toUpperCase
//       return Object.assign(route(parts, ...params), { method })
//     } else {
//       const method = first.slice(0, offset).trim().toUpperCase()
//       return Object.assign(route([first.slice(offset), ...parts], ...params), {
//         method,
//       })
//     }
//   }
// }

/** @type {API.Problem} */
const ExpectingInt = { type: "ExpectingInt" }
/** @type {API.Problem} */
const ExpectingHex = { type: "ExpectingHex" }
/** @type {API.Problem} */
const ExpectingOctal = { type: "ExpectingOctal" }
/** @type {API.Problem} */
const ExpectingBinary = { type: "ExpectingBinary" }
/** @type {API.Problem} */
const ExpectingFloat = { type: "ExpectingFloat" }
/** @type {API.Problem} */
const ExpectingNumber = { type: "ExpectingNumber" }
/** @type {API.Problem} */
const ExpectingEnd = { type: "ExpectingEnd" }

/**
 * @template T
 * @param {API.Route<never, API.Problem, T>} route
 * @param {API.Input} input
 */
export const parse = (route, input) => Parser.parseWith(route.parseRoute, input)

/**
 * @template T
 * @param {API.Route<never, API.Problem, T>} route
 * @param {{pathname: string}} input
 */
export const parsePath = (route, input) => {
  const result = parse(route, { url: input.pathname })
  if (result.ok) {
    return result.value
  } else {
    return null
  }
}
