import * as API from "./route/api.js"
import * as State from "./route/state.js"
import { parseSearch, parsePathname, formatURL } from "./route/url.js"
import * as Float from "./data/float.js"
import * as Int from "./data/int.js"
import * as Text from "./data/string.js"
import { isSubstring, isSubChar, findSubString, first } from "./util/string.js"
import { isAlphaNumOr_, isChar } from "./util/char/lib.js"

// /**
//  * @template T
//  * @implements {API.Route<T>}
//  */
// class RouteParser {
//   /**
//    * @template T
//    * @param {API.Route<T>} route
//    * @returns {RouteParser<T>}
//    */
//   static from(route) {
//     return new RouteParser(route)
//   }

//   /**
//    * @param {API.Route<T>} route
//    */
//   constructor(route) {
//     this.route = route
//   }

//   /**
//    * @template In
//    * @param {API.ParseState<In>} state
//    * @returns {API.ParseResult<In & T>}
//    */
//   parseRoute(state) {
//     return this.route.parseRoute(state)
//   }

//   /**
//    * @template Out
//    * @param {API.ParseState<Out & T>} state
//    * @returns {API.FormatResult<Out>}
//    */
//   formatRoute(state) {
//     return this.route.formatRoute(state)
//   }

//   /**
//    * @param {Object} url
//    * @param {string} [url.pathname]
//    * @param {string} [url.search]
//    * @returns {null|T}
//    */

//   parsePath(url) {
//     return parsePath(this.route, url)
//   }

//   /**
//    * @param {Object} url
//    * @param {string} [url.hash]
//    * @param {string} [url.search]
//    * @returns {null|T}
//    */
//   parseHash(url) {
//     return parseHash(this, url)
//   }

//   /**
//    * @param {string[]} segments
//    * @param {API.Query} query
//    * @returns {null|T}
//    */
//   parse(segments, query) {
//     return parse(this, segments, query)
//   }

//   /**
//    * @param {T} data
//    * @returns {string}
//    */
//   formatPath(data) {
//     return formatPath(this.route, data)
//   }

//   /**
//    * @param  {T} data
//    * @returns {string}
//    */
//   formatHash(data) {
//     return formatHash(this, data)
//   }

//   /**
//    * @param {T} data
//    * @returns {API.URL}
//    */
//   format(data) {
//     return format(this, data)
//   }

//   /**
//    * @param {API.Segment} segment
//    * @returns {RouteParser<T>}
//    */
//   const(segment) {
//     return RouteParser.from(and(this.route, segment))
//   }

//   /**
//    * @param {string} text
//    */
//   segment(text) {
//     return RouteParser.from(and(this.route, segment(text)))
//   }

//   /**
//    * @template U
//    * @param {API.VariableSegment<U>} param
//    */

//   param(param) {
//     return RouteParser.from(and(this.route, param))
//   }

//   /**
//    * @template {string} Name
//    * @template U
//    * @param {Name} name
//    * @param {API.QueryParam<U>} param
//    */
//   query(name, param) {
//     return RouteParser.from(and(this.route, queryParam(name, param)))
//   }

//   /**
//    * @template U
//    * @param {API.VariableSegment<U>} param
//    */
//   rest(param) {
//     return RouteParser.from(and(this.route, rest(param)))
//   }
// }

// /**
//  * @param {string} text
//  * @returns {API.Segment}
//  */
// export const segment = text => new RouteSegment(text)

// /**
//  * @template {unknown} L
//  * @template {unknown} R
//  * @param {API.Route<L>} left
//  * @param {API.VariableSegment<R>} right
//  * @returns {API.Route<L & R>}
//  */
// const and = (left, right) => new And(left, right)

// /**
//  * @template {string} Name
//  * @template T
//  * @param {Name} name
//  * @param {API.QueryParam<T>} param
//  * @returns {API.VariableSegment<T>}
//  */
// const queryParam = (name, param) => new QuerySegment(name, param)

// /**
//  * @template {unknown} T
//  * @param {API.VariableSegment<T>} route
//  * @returns {API.VariableSegment<T>}
//  */
// export const rest = route => new RestSegment(route)

// /**
//  * @template {unknown} T
//  * @param {API.Route<T>} route
//  * @param {Object} url
//  * @param {string} [url.pathname]
//  * @param {string} [url.search]
//  * @returns {null|T}
//  */
// export const parsePath = (route, url) =>
//   parse(
//     route,
//     url.pathname == null ? [] : parsePathname(url.pathname),
//     url.search == null ? {} : parseSearch(url.search)
//   )

// /**
//  * @template {unknown} T
//  * @param {API.Route<T>} route
//  * @param {Object} url
//  * @param {string} [url.hash]
//  * @param {string} [url.search]
//  * @returns {null|T}
//  */
// export const parseHash = (route, url) =>
//   parse(
//     route,
//     parsePathname((url.hash || "").slice(1)),
//     url.search == null ? {} : parseSearch(url.search)
//   )

// /**
//  * @template {unknown} T
//  * @param {API.Route<T>} route
//  * @param {string[]} path
//  * @param {API.Query} query
//  * @returns {null|T}
//  */
// export const parse = (route, path, query) => {
//   const output = route.parseRoute(State.empty(path, query))
//   if (output != null) {
//     const { segments, params } = output
//     if (segments.length < 1 || segments[0] == "") {
//       return params
//     }
//   }
//   return null
// }

// /**
//  * @template {unknown} T
//  * @param {API.Route<T>} route
//  * @param {T} data
//  * @returns {string}
//  */
// export const formatPath = (route, data) => format(route, data).toString()

// /**
//  * @template {unknown} T
//  * @param {API.Route<T>} route
//  * @param {T} data
//  * @returns {string}
//  */
// export const formatHash = (route, data) => `#${format(route, data).toString()}`

// /**
//  * @template {unknown} T
//  * @param {API.Route<T>} route
//  * @param {T} data
//  * @returns {API.URL}
//  */
// export const format = (route, data) => {
//   const { segments, query } = route.formatRoute(State.create([], data, {}))

//   return formatURL(segments, query)
// }

// /**
//  * @template {string} Text
//  * @implements {API.Route<{}>}
//  * @implements {API.StaticSegment<Text>}
//  */
// class BaseSegment {
//   /**
//    *
//    * @param {Text} text
//    */
//   constructor(text) {
//     this.text = text
//   }
//   /**
//    * @template In
//    * @param {API.ParseState<In>} state
//    * @returns {API.ParseResult<In>}
//    */
//   parseSegment(state) {
//     return state
//   }

//   /**
//    * @template Out
//    * @param {API.ParseState<Out>} state
//    * @returns {API.FormatResult<Out>}
//    */
//   formatSegment(state) {
//     return state
//   }

//   /**
//    * @template In
//    * @param {API.ParseState<In>} state
//    * @returns {API.ParseResult<In>}
//    */
//   parseRoute(state) {
//     return this.parseSegment(state)
//   }

//   /**
//    * @template In
//    * @param {API.ParseState<In>} state
//    * @returns {API.FormatResult<In>}
//    */
//   formatRoute(state) {
//     return this.formatSegment(state)
//   }
// }

// /**
//  * @implements {API.VariableSegment<{}>}
//  */
// class RootSegment {
//   /**
//    * @template In
//    * @param {API.ParseState<In>} state
//    * @returns {API.ParseResult<In>}
//    */
//   parseSegment({ segments, params, query }) {
//     const [first, ...rest] = segments
//     if (first === "" && rest.length !== 0) {
//       return State.create(rest, params, query)
//     } else {
//       return null
//     }
//   }
//   /**
//    * @template Out
//    * @param {API.ParseState<Out>} state
//    * @returns {API.ParseState<Out>}
//    */
//   formatSegment({ segments, params, query }) {
//     return State.create(["", ...segments], params, query)
//   }

//   /**
//    * @template In
//    * @param {API.ParseState<In>} state
//    * @returns {API.ParseResult<In>}
//    */
//   parseRoute(state) {
//     return this.parseSegment(state)
//   }

//   /**
//    * @template In
//    * @param {API.ParseState<In>} state
//    * @returns {API.FormatResult<In>}
//    */
//   formatRoute(state) {
//     return this.formatSegment(state)
//   }
// }

// /**
//  * @template {unknown} T
//  * @template {unknown} U
//  * @implements {API.Route<T & U>}
//  */
// class And {
//   /**
//    * @param {API.Route<T>} base
//    * @param {API.VariableSegment<U>} next
//    */
//   constructor(base, next) {
//     this.base = base
//     this.next = next
//   }

//   /**
//    * @template In
//    * @param {API.ParseState<In>} state
//    * @returns {API.ParseResult<In & T & U>}
//    */
//   parseRoute(state) {
//     const next = this.base.parseRoute(state)
//     if (next != null) {
//       return this.next.parseSegment(next)
//     } else {
//       return null
//     }
//   }

//   /**
//    * @template Out
//    * @param {API.ParseState<Out & T & U>} state
//    * @returns {API.FormatResult<Out>}
//    */
//   formatRoute(state) {
//     return this.base.formatRoute(this.next.formatSegment(state))
//   }
// }

// /**
//  * @template {string} Name
//  * @template {unknown} T
//  * @implements {API.VariableSegment<T>}
//  */
// class QuerySegment {
//   /**
//    * @param {Name} name
//    * @param {API.QueryParam<T>} queryParam
//    */
//   constructor(name, queryParam) {
//     this.name = name
//     this.queryParam = queryParam
//   }

//   /**
//    * @template In
//    * @param {API.ParseState<In>} state
//    * @returns {API.ParseResult<In & T>}
//    */
//   parseSegment(state) {
//     return this.queryParam.parseQueryParam(this.name, state)
//   }

//   /**
//    * @template Out
//    * @param {API.ParseState<Out & T>} state
//    * @returns {API.FormatResult<Out>}
//    */
//   formatSegment(state) {
//     return this.queryParam.formatQueryParam(this.name, state)
//   }
// }

// /**
//  * @template {unknown} T
//  *
//  * @implements {API.VariableSegment<T>}
//  */
// class RestSegment {
//   /**
//    * @param {API.VariableSegment<T>} inner
//    */
//   constructor(inner) {
//     this.inner = inner
//   }

//   /**
//    * @template In
//    * @param {API.ParseState<In>} state
//    * @returns {API.ParseResult<In & T>}
//    */
//   parseSegment(state) {
//     const { segments, params, query } = state
//     const next = State.create([segments.join("/")], params, query)
//     return this.inner.parseSegment(next)
//   }

//   /**
//    * @template Out
//    * @param {API.ParseState<Out & T>} state
//    * @returns {API.FormatResult<Out>}
//    */
//   formatSegment(state) {
//     return this.inner.formatSegment(state)
//   }
// }

// /**
//  * @template {string} Text
//  * @extends {BaseSegment<Text>}
//  */
// class RouteSegment extends BaseSegment {
//   /**
//    * @template In
//    * @param {API.ParseState<In>} state
//    * @returns {API.ParseResult<In>}
//    */
//   parseSegment({ params, segments, query }) {
//     const { text } = this
//     if (segments.length === 0) {
//       return null
//     } else {
//       const [first, ...rest] = segments
//       if (first === text) {
//         return State.create(rest, params, query)
//       } else {
//         return null
//       }
//     }
//   }

//   /**
//    * @template Out
//    * @param {API.ParseState<Out>} state
//    * @returns {API.FormatResult<Out>}
//    */
//   formatSegment({ params, segments, query }) {
//     return State.create([this.text, ...segments], params, query)
//   }
// }

// /**
//  * @template {PropertyKey} Key
//  * @template T
//  * @implements {API.NamedParam<Key, T>}
//  */

// class Param {
//   /**
//    * @param {Key} key
//    * @param {API.Fragment<T>} inner

//    */
//   constructor(key, inner) {
//     this.key = key
//     this.inner = inner
//   }
//   /**
//    * @template In
//    * @param {API.ParseState<In>} state
//    * @returns {API.ParseResult<In & {[key in Key]: T}>}
//    */
//   parseSegment(state) {
//     const { segments, params, query } = state
//     if (segments.length === 0) {
//       return null
//     } else {
//       const [first, ...rest] = segments
//       const value = this.inner.parse(first)
//       if (value != null) {
//         return State.create(rest, extend(params, this.key, value), query)
//       } else {
//         return null
//       }
//     }
//   }

//   /**
//    * @template Out
//    * @param {API.ParseState<Out & {[key in Key]: T}>} state
//    * @returns {API.FormatResult<Out>}
//    */
//   formatSegment(state) {
//     const { segments, params, query } = state
//     const value = params[this.key]
//     const segment = this.inner.format(params[this.key])
//     return State.create([segment, ...segments], remove(params, this.key), query)
//   }

//   /**
//    * @template In
//    * @template {string} Name
//    * @param {Name} name
//    * @param {API.ParseState<In>} state
//    * @returns {API.ParseResult<In & {[key in Key]: T}>}
//    */
//   parseQueryParam(name, { segments, query, params }) {
//     const value = query[name]
//     const param = value != null ? this.inner.parse(value) : null
//     if (param == null) {
//       return null
//     } else {
//       return State.create(segments, extend(params, this.key, param), query)
//     }
//   }
//   /**
//    * @template Out
//    * @template {string} Name
//    * @param {Name} name
//    * @param {API.ParseState<Out & {[key in Key]: T}>} state
//    * @returns {API.FormatResult<Out>}
//    */
//   formatQueryParam(name, { segments, params, query }) {
//     const param = params[this.key]
//     const value = this.inner.format(param)
//     query[name] = value
//     return State.create(segments, remove(params, this.key), query)
//   }
// }

// /**
//  * @template {PropertyKey} Key
//  * @template Value
//  * @param {Key} key
//  * @param {API.Fragment<Value>} fragment
//  * @returns {API.NamedParam<Key, Value>}
//  */

// const param = (key, fragment) => new Param(key, fragment)

// /**
//  * @template {Object} Source
//  * @template {PropertyKey} Key
//  * @template {unknown} Value
//  * @param {Source} source
//  * @param {Key} key
//  * @param {Value} value
//  */
// const extend = (source, key, value) =>
//   /** @type {Source & {[key in Key]: Value}} */ ({
//     ...source,
//     [key]: value,
//   })

// /**
//  * @template {Object} Source
//  * @template {PropertyKey} Key
//  * @param {Source & {[key in Key]: unknown}} source
//  * @param {Key} key
//  * @returns {Source}
//  */
// const remove = (source, key) => {
//   const out = { ...source }
//   delete out[key]
//   return out
// }

// /**
//  * @template {string} Name
//  * @param {Name} name
//  */
// export const float = name => param(name, Float)

// /**
//  * @template {string} Name
//  * @param {Name} name
//  * @returns {API.NamedParam<Name, Int.int>}
//  */
// export const int = name => param(name, Int)

// /**
//  * @template {string} Name
//  * @param {Name} name
//  * @returns {API.NamedParam<Name, string>}
//  */
// export const text = name => param(name, Text)

// /**
//  * @template T
//  * @param {string} method
//  * @param {API.Route<T>} route
//  */
// export const withMethod = (method, route) => {}

// /**
//  * @template T
//  * @param {API.Route<T> & { method?: string }} route
//  * @param {Object} request
//  * @param {string} request.url
//  * @param {string} request.method
//  */
// export const parseRequest = (route, request) => {
//   const method = route.method || request.method
//   if (method.toUpperCase() != request.method) {
//     return null
//   } else {
//     return parsePath(route, new URL(request.url))
//   }
// }

// /**
//  * @template {Array<API.NamedParam<string, unknown>|string|number>} Params
//  * @param {readonly string[]} strings
//  * @param  {Params} params
//  * @returns {API.Route<API.Build<{}, Params>>}
//  */
// export const route = (strings, ...params) => {
//   /** @type {API.Route<*>} */
//   let route = new RootSegment()
//   let offset = 0
//   while (offset < strings.length) {
//     route = addSegments(route, strings[offset].split("/"))

//     if (offset < params.length) {
//       const param = params[offset]
//       route =
//         typeof param === "string"
//           ? addSegments(route, param.split("/"))
//           : typeof param === "number"
//           ? and(route, segment(param.toString()))
//           : and(route, param)
//     }
//     offset++
//   }
//   return route
// }

// /**
//  * @template T
//  * @param {API.Route<T>} route
//  * @param {string[]} segments
//  * @returns {API.Route<T>}
//  */
// const addSegments = (route, segments) => {
//   for (const part of segments) {
//     if (part !== "") {
//       route = and(route, segment(part))
//     }
//   }
//   return route
// }

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

/**
 * @template {string} T
 * @template C, X
 */
class Segment {
  /**
   * @param {T} content
   * @param {X} expecting
   */
  constructor(content, expecting) {
    this.content = content
    this.expecting = expecting
  }
  /**
   * @param {API.ParseState<C>} state
   * @returns {API.ParseResult<C, X, T>}
   */
  parse(state) {
    const { content, expecting } = this
    const progress = content.length > 0
    const { offset, line, column } = isSubstring(content, state.source, state)

    if (offset == -1) {
      return bad(false, fromState(state, expecting))
    } else {
      return good(progress, content, { ...state, offset, line, column })
    }
  }

  /**
   * @template Out
   * @param {API.ParseState<Out>} state
   * @returns {API.FormatResult<Out>}
   */
  formatSegment({ params, segments, query }) {
    return State.create([this.text, ...segments], params, query)
  }
}

/**
 * @template C, X
 * @param {API.ParseState<C>} state
 * @param {X} problem
 * @returns {API.Problems<C, X>}
 */
export const fromState = (state, problem) => [
  {
    line: state.line,
    column: state.column,
    problem,
    stack: state.context,
  },
]

/**
 * @template C, X
 * @param {boolean} progress
 * @param {API.Problems<C, X>} problems
 * @returns {API.Bad<API.Problems<C, X>>}
 */
const bad = (progress, problems) => ({
  ok: false,
  progress,
  error: problems,
})

/**
 * @template C, T
 * @param {boolean} progress
 * @param {T} value
 * @param {API.ParseState<C>} state
 * @returns {API.Good<T, API.ParseState<C>>}
 */
const good = (progress, value, state) => ({
  ok: true,
  progress,
  value,
  state,
})
