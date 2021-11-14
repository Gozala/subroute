import * as Parse from "./parse/api.js"
import * as State from "./parse/state.js"

export * from "./parse/api.js"
export { State }

/**
 * @template C, X, T
 * @param {X} problem
 * @param {object} options
 * @param {number} options.line
 * @param {number} options.column
 * @param {Parse.Located<C>[]} options.context
 * @returns {Parse.Error<C, X>}
 */
export const fail = (problem, options) =>
  new ParseError([new DeadEnd(problem, options)])

/**
 * @template C, T
 * @param {T} value
 * @param {Parse.State<C>} state
 * @returns {Parse.Success<C, T>}
 */
export const succeed = (value, state) => ({ ok: true, value, state })

/**
 * @template C, X
 * @implements {Parse.DeadEnd<C, X>}
 */
class DeadEnd extends SyntaxError {
  /**
   * @param {X} problem
   * @param {object} options
   * @param {number} options.line
   * @param {number} options.column
   * @param {Parse.Located<C>[]} options.context
   */
  constructor(problem, { line, column, context }) {
    super(`Failed to parse`)
    this.problem = problem
    this.line = line
    this.column = column
    this.context = context
  }
}

/**
 * @template C, X
 * @implements {Parse.Error<C, X>}
 */
class ParseError extends SyntaxError {
  /**
   * @param {Parse.Problems<C, X>} problems
   */
  constructor(problems) {
    super("Failed to parse")
    this.error = problems
    /** @type {false} */
    this.ok = false
  }
}

/**
 * @template C, X
 * @template {unknown} T
 * @param {Parse.Parser<C, X, T>} route
 * @param {object} input
 * @param {string} input.pathname
 */
export const parsePath = (route, { pathname }) =>
  parse(route, State.from({ source: pathname }))

/**
 * @template C, X
 * @template {unknown} T
 * @param {Parse.Parser<C, X, T>} route
 * @param {Object} url
 * @param {string} [url.hash]
 * @returns {null|T}
 */
export const parseHash = (route, url) =>
  parse(route, State.from({ source: (url.hash || "").slice(1) }))

/**
 * @template C, X
 * @template {unknown} T
 * @param {Parse.Parser<T, X, C>} route
 * @param {Object} request
 * @param {string} request.url
 * @param {string} [request.method]
 * @param {Headers} [request.headers]
 * @param {URLSearchParams} [request.searchParams]
 */
export const parseRequest = (route, request) => {
  const { pathname, searchParams } = new URL(request.url)
  return parse(
    route,
    State.from({
      source: pathname,
      method: request.method,
      headers: request.headers,
      searchParams,
    })
  )
}

/**
 * @template C, X
 * @template {unknown} T
 * @param {Parse.Parser<C, X, T>} route
 * @param {Parse.State<C>} state
 * @returns {T}
 */
export const parse = (route, state) => {
  const result = route.parse(state)
  if (result.ok) {
    return result.value
  } else {
    throw result.error
  }
}
