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
   */
  (strings, ...matches) =>
  /**
   * @template T
   * @param {(params: API.Build<Segments, {}>) => T} handler
   * @returns {API.RouteHandler<T>}
   */

  handler =>
    new RouteHandler(handler, Route.compile({ strings, matches, method }))

export const route = method()

/**
 * @template T, U
 * @implements {API.RouteHandler<U>}
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
   * @template E
   * @param {API.RouteHandler<E>} other
   * @returns {API.RouteHandler<U|E>}
   */
  or(other) {
    return or(this, other)
  }
}

/**
 * @template L, R
 * @param {API.RouteHandler<L>} left
 * @param {API.RouteHandler<R>} right
 * @returns {API.RouteHandler<L|R>}
 */
export const or = (left, right) => new Or(left, right)

/**
 * @template L, R
 * @implements {API.RouteHandler<L|R>}
 */
class Or {
  /**
   * @param {API.RouteHandler<L>} left
   * @param {API.RouteHandler<R>} right
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
   * @param {API.RouteHandler<T>} other
   * @returns {API.RouteHandler<L|R|T>}
   */
  or(other) {
    /** @type {API.RouteHandler<L|R>} */
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
