import * as Syntax from "./syntax.js"
import * as API from "./route/api.js"
import * as Route from "./route.js"

export const {
  parse,
  parseHash,
  parsePath,
  parseRequest,
  format,
  text,
  route,
  method,
} = Route

// /**
//  *
//  */
// const route = () => {

// }

// export { route, method }

export const GET = method("GET")
export const POST = method("POST")
export const PUT = method("PUT")
export const PATCH = method("PATCH")
export const HEAD = method("PATCH")
export const OPTIONS = method("OPTIONS")
