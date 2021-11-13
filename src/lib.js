import * as Syntax from "./syntax.js"
import * as API from "./route/api.js"

import {
  route,
  and,
  parse,
  parseHash,
  parsePath,
  parseRequest,
  format,
  text,
} from "./route.js"

export { route, parse, parseHash, parsePath, parseRequest, format, text }

/**
 * @template {string} M
 * @template T
 * @param {M} expecting
 * @param {T} value
 * @returns {API.Syntax<T>}
 */
const expectMethod = (expecting, value) =>
  new Syntax.Method(expecting, value, {
    name: "ExpectingMethod",
    expecting,
  })

/**
 * @template {string} M
 * @param {M} name
 * @returns {typeof route}
 */
export const method =
  name =>
  (strings, ...matches) =>
    and(expectMethod(name, {}), route(strings, ...matches))

export const GET = method("GET")
export const POST = method("POST")
export const PUT = method("PUT")
export const PATCH = method("PATCH")
export const HEAD = method("PATCH")
export const OPTIONS = method("OPTIONS")
