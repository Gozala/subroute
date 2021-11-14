import * as API from "./route/api.js"
import * as Route from "./route.js"
import { succeed, State } from "./parse.js"

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
   * @type {API.Router<U>}
   */
  get router() {
    return this
  }
  /**
   * @param {API.ParseState} state
   */
  handle(state) {
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
   * @param {API.Handler<E>} other
   * @returns {API.Router<U|E>}
   */
  or(other) {
    return or(this, other)
  }
}

/**
 * @template L, R
 * @param {API.Handler<L>} left
 * @param {API.Handler<R>} right
 * @returns {API.Router<L|R>}
 */
export const or = (left, right) => new Or(left, right)

/**
 * @template L, R
 * @implements {API.Router<L|R>}
 */
class Or {
  /**
   * @param {API.Handler<L>} left
   * @param {API.Handler<R>} right
   */

  constructor(left, right) {
    this.left = left
    this.right = right
  }
  /**
   * @param {API.ParseState} state
   */
  handle(state) {
    const result = this.left.handle(state)
    return result.ok ? result : this.right.handle(state)
  }
  /**
   * @template T
   * @param {API.Handler<T>} other
   * @returns {API.Router<L|R|T>}
   */
  or(other) {
    /** @type {API.Handler<L|R>} */
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

/**
 * @template C, X
 * @template {unknown} T
 * @param {API.Handler<T>} handler
 * @param {Object} request
 * @param {string} request.url
 * @param {string} [request.method]
 * @param {Headers} [request.headers]
 * @param {URLSearchParams} [request.searchParams]
 */
export const handle = (handler, request) => {
  const { pathname, searchParams } = new URL(request.url)
  const result = handler.handle(
    State.from({
      source: pathname,
      method: request.method,
      headers: request.headers,
      searchParams,
    })
  )

  if (result.ok) {
    return result.value
  } else {
    throw result.error
  }
}
