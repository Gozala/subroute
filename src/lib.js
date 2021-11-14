import * as API from "./route/api.js"
import * as Route from "./route.js"
import { succeed } from "./parse.js"

export const {
  rest,
  parse,
  parseHash,
  parsePath,
  parseRequest,
  format,
  text,
  enumerate,
  compile,
} = Route

/**
 * @template {string} Verb
 * @param {Verb} [method]
 */
export const method =
  method =>
  /**
   * @template {API.Segment[]} Segments
   * @param {readonly string[]} strings
   * @param  {Segments} matches
   * @returns {API.RouteBinder<API.Build<Segments>>}
   */
  (strings, ...matches) => {
    const route = Route.compile({ strings, matches, method })
    /**
     * @template T
     * @param {(input:API.Build<Segments>) => T} handler
     */
    const bind = handler => new RouteHandler(handler, route)

    return Object.assign(bind, {
      parse: route.parse.bind(route),
      format: route.format.bind(route),
    })
  }

export const route = method()

/**
 * @template T, U
 * @implements {API.RouteHandler<T, U>}
 */
class RouteHandler {
  /**
   * @param {(params:T) => U} handler
   * @param {API.Route<T>} route
   */
  constructor(handler, route) {
    this.handler = handler
    this.route = route
  }
  /**
   * @param {API.ParseState} state
   */
  parse(state) {
    const result = this.route.parse(state)
    if (result.ok) {
      const value = this.handler(result.value)
      return succeed(value, result.state)
    } else {
      return result
    }
  }

  /**
   *
   * @param {API.FormatInput<T>} input
   */
  format(input) {
    return this.route.format(input)
  }

  /**
   * @template E
   * @param {API.Parser<E>} other
   * @returns {API.Router<U|E>}
   */
  or(other) {
    return or(this, other)
  }
}

/**
 * @template L, R
 * @param {API.Parser<L>} left
 * @param {API.Parser<R>} right
 * @returns {API.Router<L|R>}
 */
export const or = (left, right) => new Or(left, right)

/**
 * @template L, R
 * @implements {API.Router<L|R>}
 */
class Or {
  /**
   * @param {API.Parser<L>} left
   * @param {API.Parser<R>} right
   */

  constructor(left, right) {
    this.left = left
    this.right = right
  }
  /**
   * @param {API.ParseState} state
   */
  parse(state) {
    const result = this.left.parse(state)
    return result.ok ? result : this.right.parse(state)
  }
  /**
   * @template T
   * @param {API.Parser<T>} other
   * @returns {API.Router<L|R|T>}
   */
  or(other) {
    /** @type {API.Parser<L|R>} */
    const self = this
    return or(self, other)
  }
}
export const CONNECT = method("CONNECT")
export const DELETE = method("DELETE")
export const GET = method("GET")
export const HEAD = method("HEAD")
export const OPTIONS = method("OPTIONS")
export const POST = method("POST")
export const PUT = method("PUT")
export const PATCH = method("PATCH")
export const TRACE = method("TRACE ")

/** @type {API.Problem} */
const ExpectingInt = { name: "ExpectingInt" }
/** @type {API.Problem} */
const ExpectingFloat = { name: "ExpectingFloat" }

export const int = Route.int(ExpectingInt, ExpectingInt)

export const float = Route.float(ExpectingFloat, ExpectingFloat)
