import { parsePathname, parseSearch, formatURL } from "./route/url"
import { last, butlast } from "./data/tuple"
import * as text from "./data/string"
import * as int from "./data/int"
import * as float from "./data/float"
import { root } from "./route/root"
import { rest } from "./route/rest"
import { segment } from "./route/segment"
import { concat } from "./route/concat"

/**
 * @template {any[]} Params
 * @param {Route<Params>} route
 * @param {Object} url
 * @param {string} [url.pathname]
 * @param {string} [url.search]
 * @returns {?Params}
 */
export const parsePath = (route, url) =>
  parse(
    route,
    url.pathname == null ? [] : parsePathname(url.pathname),
    url.search == null ? {} : parseSearch(url.search)
  )

/**
 * @template {any[]} Params
 * @param {Route<Params>} route
 * @param {Object} url
 * @param {string} [url.hash]
 * @param {string} [url.search]
 * @returns {?Params}
 */
export const parseHash = (route, url) =>
  parse(
    route,
    parsePathname((url.hash || "").slice(1)),
    url.search == null ? {} : parseSearch(url.search)
  )

/**
 * @template {any[]} Params
 * @param {Route<Params>} route
 * @param {string[]} path
 * @param {Query} query
 * @returns {?Params}
 */
export const parse = (route, path, query) => {
  const output = route.parseRoute(state(path, empty, query))
  if (output != null) {
    const { segments, params } = output
    if (segments.length < 1 || segments[0] == "") {
      return params
    }
  }
  return null
}

/**
 * @template {any[]} Params
 * @param {Route<Params>} route
 * @param {Params} params
 * @returns {string}
 */
export const formatPath = (route, ...params) =>
  format(route, ...params).toString()

/**
 * @template {any[]} Params
 * @param {Route<Params>} route
 * @param {Params} params
 * @returns {string}
 */
export const formatHash = (route, ...params) =>
  `#${format(route, ...params).toString()}`

/**
 * @template {any[]} Params
 * @param {Route<Params>} route
 * @param {Params} params
 * @returns {URL}
 */
export const format = (route, ...params) => {
  const { segments, query } = route.formatRoute(state([], params, {}))

  return formatURL(segments, query)
}

/**
 * @template T
 * @param {(input:string) => null|T} parse
 * @param {(value:T) => string} format
 * @returns {Route<[T]> & VariableSegment<T> & QueryParam<T>}
 */
export const param = (parse, format) => new Param(parse, format)

/**
 * @template T
 * @param {string} name
 * @param {QueryParam<T>} queryParam
 * @returns {Route<[T]> & VariableSegment<T> & QueryParam<T>}
 */
export const query = (name, queryParam) => new QuerySegment(name, queryParam)

export const String = param(text.parse, text.format)
export const Integer = param(int.parse, int.format)
export const Float = param(float.parse, float.format)

export const Root = new URLRoute(root())

/**
 * @template {any[]} Params
 * @implements {Route<Params>}
 */
class URLRoute {
  /**
   * @param {Route<Params>} inner
   */
  constructor(inner) {
    this.inner = inner
  }
  /**
   * @template {any[]} In
   * @param {State<In>} state
   * @returns {?State<[...In, ...Params]>}
   */
  parseRoute(state) {
    return this.inner.parseRoute(state)
  }

  /**
   * @template {any[]} In
   * @param {State<[...In, ...Params]>} state
   * @returns {State<In>}
   */

  formatRoute(state) {
    return this.inner.formatRoute(state)
  }

  /**
   * @param {string} name
   * @returns {RouteAPI<Params>}
   */
  segment(name) {
    /** @type {Route<[]>} */
    const right = segment(name)
    return new URLRoute(concat(this.inner, right))
  }

  /**
   * @template T
   * @param {VariableSegment<T>} segment
   * @returns {RouteAPI<[...Params, T]>}
   */
  rest(segment) {
    /** @type {Route<[T]>} */
    const right = rest(segment)
    return new URLRoute(concat(this.inner, right))
  }

  /**
   * @template T
   * @param {VariableSegment<T>} variable
   * @returns {RouteAPI<[...Params, T]>}
   */
  param(variable) {
    /** @type {Route<[T]>} */
    const right = new ParameterSegment(variable)
    return new URLRoute(concat(this.inner, right))
  }

  /**
   * @template {any[]} Etc
   * @param {Route<Etc>} other
   * @returns {RouteAPI<[...Params, ...Etc]>}
   */
  concat(other) {
    return new URLRoute(concat(this, other))
  }

  /**
   * @template T
   * @param {string} name
   * @param {QueryParam<T>} param
   * @returns {Route<[...Params, T]>}
   */
  query(name, param) {
    /** @type {Route<[T]>} */
    const right = query(name, param)
    return new URLRoute(concat(this.inner, right))
  }

  /**
   * @param {Object} url
   * @param {string} [url.pathname]
   * @param {string} [url.search]
   * @returns {?Params}
   */
  parsePath(url) {
    return parsePath(this, url)
  }

  /**
   * @param {Object} url
   * @param {string} [url.hash]
   * @param {string} [url.search]
   * @returns {?Params}
   */
  parseHash(url) {
    return parseHash(this, url)
  }

  /**
   * @param {string[]} segments
   * @param {Query} query
   * @returns {?Params}
   */
  parse(segments, query) {
    return parse(this, segments, query)
  }

  /**
   * @param  {Params} params
   * @returns {string}
   */
  formatPath(...params) {
    return formatPath(this, ...params)
  }

  /**
   * @param  {Params} params
   * @returns {string}
   */
  formatHash(...params) {
    return formatHash(this, ...params)
  }

  /**
   * @param {Params} params
   * @returns {URL}
   */
  format(...params) {
    return format(this, ...params)
  }
}

export const Rest = new URLRoute(RestSegment.route(String))

/**
 * @template T
 * @implements {Route<[T]>}
 * @implements {VariableSegment<T>}
 */
class ParameterSegment {
  /**
   * @param {VariableSegment<T>} inner
   */
  constructor(inner) {
    this.inner = inner
  }

  /**
   * @template {any[]} In
   * @param {State<In>} state
   * @returns {?State<[...In, T]>}
   */
  parseRoute(state) {
    return this.inner.parseSegment(state)
  }

  /**
   * @template {any[]} In
   * @param {State<[...In, T]>} state
   * @returns {State<In>}
   */

  formatRoute(state) {
    return this.inner.formatSegment(state)
  }

  /**
   * @template {any[]} Params
   * @param {State<Params>} state
   * @returns {?State<[...Params, T]>}
   */
  parseSegment(state) {
    return this.inner.parseSegment(state)
  }

  /**
   * @template {any[]} Params
   * @param {State<[...Params, T]>} state
   * @returns {State<Params>}
   */
  formatSegment(state) {
    return this.inner.formatSegment(state)
  }
}

/**
 * @template T
 * @implements {Route<[T]>}
 * @implements {VariableSegment<T>}
 * @implements {QueryParam<T>}
 */
class Param {
  /**
   * @param {(input:string) => null|T} parseParam
   * @param {(value:T) => string} formatParam
   */
  constructor(parseParam, formatParam) {
    this.parseParam = parseParam
    this.formatParam = formatParam
  }

  /**
   * @template {any[]} In
   * @param {State<In>} state
   * @returns {?State<[...In, T]>}
   */
  parseRoute(state) {
    return this.parseSegment(state)
  }

  /**
   * @template {any[]} In
   * @param {State<[...In, T]>} state
   * @returns {State<In>}
   */

  formatRoute(state) {
    return this.formatSegment(state)
  }

  /**
   * @template {any[]} Params
   * @param {State<Params>} model
   * @returns {?State<[...Params, T]>}
   */
  parseSegment(model) {
    const { segments, params, query } = model
    if (segments.length === 0) {
      return null
    } else {
      const [next, ...rest] = /** @type {[string, ...string[]]} */ (segments)
      const param = this.parseParam(next)
      if (param != null) {
        return state(rest, [...params, param], query)
      } else {
        return null
      }
    }
  }

  /**
   * @template {any[]} Params
   * @param {State<[...Params, T]>} model
   * @returns {State<Params>}
   */
  formatSegment(model) {
    const { segments, params, query } = model
    const segment = this.formatParam(last(params))
    return state([segment, ...segments], butlast(params), query)
  }

  /**
   * @template {any[]} Params
   * @param {string} name
   * @param {State<Params>} model
   * @returns {?State<[...Params, T]>}
   */
  parseQueryParam(name, model) {
    const value = model.query[name]
    const param = value != null ? this.parseParam(value) : null
    if (param == null) {
      return null
    } else {
      return state(model.segments, [...model.params, param], model.query)
    }
  }

  /**
   * @template {any[]} Params
   * @param {string} name
   * @param {State<[...Params, T]>} model
   * @returns {State<Params>}
   */
  formatQueryParam(name, model) {
    const { segments, params, query } = model
    const param = last(params)
    const value = this.formatParam(param)
    query[name] = value
    return state(segments, butlast(params), query)
  }
}

/**
 * @template T
 * @implements {Route<[T]>}
 * @implements {VariableSegment<T>}
 * @implements {QueryParam<T>}
 */
class QuerySegment {
  /**
   * @param {string} name
   * @param {QueryParam<T>} queryParam
   */
  constructor(name, queryParam) {
    this.name = name
    this.queryParam = queryParam
  }

  /**
   * @template {any[]} In
   * @param {State<In>} state
   * @returns {?State<[...In, T]>}
   */
  parseRoute(state) {
    return this.parseSegment(state)
  }

  /**
   * @template {any[]} In
   * @param {State<[...In, T]>} state
   * @returns {State<In>}
   */
  formatRoute(state) {
    return this.formatSegment(state)
  }

  /**
   * @template {any[]} In
   * @param {string} name
   * @param {State<In>} state
   * @returns {?State<[...In, T]>}
   */
  parseQueryParam(name, state) {
    return this.queryParam.parseQueryParam(name, state)
  }

  /**
   * @template {any[]} In
   * @param {string} name
   * @param {State<[...In, T]>} state
   * @returns {State<In>}
   */
  formatQueryParam(name, state) {
    return this.queryParam.formatQueryParam(name, state)
  }

  /**
   * @template {any[]} In
   * @param {State<In>} state
   * @returns {?State<[...In, T]>}
   */
  parseSegment(state) {
    return this.queryParam.parseQueryParam(this.name, state)
  }

  /**
   * @template {any[]} In
   * @param {State<[...In, T]>} state
   * @returns {State<In>}
   */
  formatSegment(state) {
    return this.queryParam.formatQueryParam(this.name, state)
  }
}

/**
 * @typedef {import("./route/interface").Query} Query
 * @typedef {import("./route/interface").Segment} Segment
 * @typedef {import("./route/interface").ConstantSegment} ConstantSegment
 * @typedef {import("./route/interface").URL} URL
 */
/**
 * @template {any[]} Params
 * @typedef {import('./route/interface').State<Params>} State<Params>
 */
/**
 * @template T
 * @typedef {import('./route/interface').VariableSegment<T>} VariableSegment
 */
/**
 * @template T
 * @typedef {import('./route/interface').QueryParam<T>} QueryParam
 */

/**
 * @template {any[]} Params
 * @typedef {import('./route/interface').Route<Params>} Route<Params>
 */

/**
 * @template {any[]} Params
 * @typedef {URLRoute<Params>} RouteAPI<Params>
 */
