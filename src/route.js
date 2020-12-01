import { parsePathname, parseSearch, formatURL } from "./route/url"
import { last, butlast } from "./data/tuple"
import * as text from "./data/string"
import * as int from "./data/int"
import * as float from "./data/float"
/**
 * @template {any[]} Params
 */
class Model {
  /**
   * @param {string[]} segments
   * @param {Params} params
   * @param {Query} query
   */
  constructor(segments, params, query) {
    this.segments = segments
    this.params = params
    this.query = query
  }
}

/**
 * @template {any[]} Params
 * @param {string[]} segments
 * @param {Params} params
 * @param {Query} query
 * @returns {State<Params>}
 */
const state = (segments, params, query) => new Model(segments, params, query)

/**
 * @template {any[]} Params
 * @implements {Route<Params>}
 */
class URLRoute {
  /**
   * @template {any[]} Params
   * @param {Route<Params>} route
   * @returns {URLRoute<Params>}
   */
  static from(route) {
    return new URLRoute(route)
  }

  /**
   * @template {any[]} Params
   * @param {Route<Params>} base
   * @param {Segment} next
   * @returns {Route<Params>}
   */
  static chainConstant(base, next) {
    return new ChainConstant(base, next)
  }

  /**
   * @param {Route<Params>} route
   */
  constructor(route) {
    this.route = route
  }
  /**
   * @template {any[]} In
   * @param {State<In>} state
   * @returns {?State<[...In, ...Params]>}
   */
  parseRoute(state) {
    return this.route.parseRoute(state)
  }

  /**
   * @template {any[]} In
   * @param {State<[...In, ...Params]>} state
   * @returns {State<In>}
   */
  formatRoute(state) {
    return this.route.formatRoute(state)
  }
  /**
   * @param {string} text
   * @returns {Route<Params>}
   */
  segment(text) {
    return this.const(segment(text))
  }
  /**
   *
   * @param {Segment} segment
   * @returns {URLRoute<Params>}
   */
  const(segment) {
    return new URLRoute(URLRoute.chainConstant(this, segment))
  }

  /**
   * @template T
   * @param {VariableSegment<T>} param
   * @returns {Route<[...Params, T]>}
   */
  param(param) {
    return new ChainVariable(this, param)
  }

  /**
   * @template T
   * @param {string} name
   * @param {QueryParam<T>} param
   * @returns {Route<[...Params, T]>}
   */
  query(name, param) {
    return new ChainVariable(this, new QuerySegment(name, param))
  }

  /**
   * @template T
   * @param {VariableSegment<T>} param
   * @returns {Route<[...Params, T]>}
   */
  rest(param) {
    return new ChainVariable(this, rest(param))
  }

  /**
   * @template T
   * @param {VariableSegment<T>} segment
   * @returns {Route<[...Params, T]>}
   */
  var(segment) {
    return new ChainVariable(this, segment)
  }

  /**
   * @template {any[]} Etc
   * @param {Route<Etc>} other
   * @returns {Route<[...Params, ...Etc]>}
   */
  concat(other) {
    return concat(this, other)
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

/**
 * @template {any[]} Left
 * @template {any[]} Right
 * @extends {URLRoute<[...Left, ...Right]>}
 */
class Concatenation extends URLRoute {
  /**
   *
   * @param {Route<Left>} left
   * @param {Route<Right>} right
   */
  constructor(left, right) {
    super()
    this.left = left
    this.right = right
  }

  /**
   * @param {State<[]>} state
   * @returns {?State<[...Left, ...Right]>}
   */
  parseRoute(state) {
    const right = this.right.parseRoute(state)
    if (right) {
      return this.left.parseRoute(right)
    } else {
      return right
    }
  }

  /**
   * @param {State<[...Left, ...Right]>} state
   * @returns {State<[]>}
   */
  formatRoute(state) {
    throw new Error("Subclass must implement")
  }
}

/**
 * @template T
 * @extends {URLRoute<[T]}
 * @implements {VariableSegment<T>}
 */
class VariableRoute extends URLRoute {
  /**
   * @template {any[]} Params
   * @param {State<Params>} state
   * @returns {?State<[...Params, T]>}
   */
  parseSegment(state) {
    throw new Error("Subclass must implemnet this")
  }

  /**
   * @template {any[]} Params
   * @param {State<[...Params, T]>} state
   * @returns {State<Params>}
   */
  formatSegment(state) {
    throw new Error("subclass must implement this")
  }

  /**
   * @param {State<[]>} state
   * @returns {?State<[T]>}
   */
  parseRoute(state) {
    return this.parseSegment(state)
  }

  /**
   * @param {State<[T]>} state
   * @returns {State<[]>}
   */
  formatRoute(state) {
    return this.formatSegment(state)
  }
}

/**
 * @extends {URLRoute<[]>}
 * @implements {ConstantSegment}
 * @implements {Route<[]>}
 */
class BaseSegment {
  /**
   * @template {any[]} Params
   * @param {State<Params>} state
   * @returns {?State<Params>}
   */
  parseSegment(state) {
    return state
  }

  /**
   * @template {any[]} Params
   * @param {State<Params>} state
   * @returns {State<Params>}
   */
  formatSegment(state) {
    return state
  }

  /**
   * @template {any[]} In
   * @param {State<In>} state
   * @returns {?State<In>}
   */
  parseRoute(state) {
    return this.parseSegment(state)
  }

  /**
   * @template {any[]} In
   * @param {State<In>} state
   * @returns {State<In>}
   */
  formatRoute(state) {
    return this.formatSegment(state)
  }
}

class RootSegment extends BaseSegment {
  /**
   * @template {any[]} Params
   * @param {State<Params>} model
   * @returns {?State<Params>}
   */
  parseSegment(model) {
    const { segments, params, query } = model
    const [first, ...rest] = segments
    if (first === "" && rest.length !== 0) {
      return state(rest, params, query)
    } else {
      return null
    }
  }

  /**
   * @template {any[]} Params
   * @param {State<Params>} model
   * @returns {State<Params>}
   */
  formatSegment(model) {
    const { segments, params, query } = model
    return state(["", ...segments], params, query)
  }
}

/**
 * @template T
 *
 * @extends {VariableRoute<T>}
 * @implements {VariableSegment<T>}
 */
class RestSegment extends VariableRoute {
  /**
   * @param {VariableSegment<T>} inner
   */
  constructor(inner) {
    super()
    this.inner = inner
  }

  /**
   * @template {any[]} Params
   * @param {State<Params>} model
   * @returns {?State<[...Params, T]>}
   */
  parseSegment(model) {
    const { segments, params, query } = model
    const next = state([segments.join("/")], params, query)
    return this.inner.parseSegment(next)
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

class RouteSegment extends BaseSegment {
  /**
   * @param {string} text
   */
  constructor(text) {
    super()
    this.text = text
  }

  /**
   * @template {any[]} Params
   * @param {State<Params>} model
   * @returns {?State<Params>}
   */
  parseSegment(model) {
    const { params, segments, query } = model
    const { text } = this
    if (segments.length === 0) {
      return null
    } else {
      const [first, ...rest] = segments
      if (first === text) {
        return state(rest, params, query)
      } else {
        return null
      }
    }
  }

  /**
   * @template {any[]} Params
   * @param {State<Params>} model
   * @returns {State<Params>}
   */
  formatSegment(model) {
    const { params, segments, query } = model
    return state([this.text, ...segments], params, query)
  }
}

/**
 * @template T
 * @extends {VariableRoute<T>}
 * @implements {QueryParam<T>}
 */
class RouteParam extends VariableRoute {
  /**
   * @param {(input:string) => null|T } parseParam
   * @param {(param:T) => string} formatParam
   */
  constructor(parseParam, formatParam) {
    super()
    this.parseParam = parseParam
    this.formatParam = formatParam
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
 * @template {any[]} Params
 * @implements {Route<Params>}
 */
class ChainConstant {
  /**
   * @param {Route<Params>} base
   * @param {Segment} next
   */
  constructor(base, next) {
    this.base = base
    this.next = next
  }

  /**
   * @template {any[]} In
   * @param {State<In>} state
   * @returns {null | State<[...In, ...Params]>}
   */
  parseRoute(state) {
    const next = this.base.parseRoute(state)
    if (next != null) {
      return this.next.parseSegment(next)
    } else {
      return null
    }
  }

  /**
   * @template {any[]} In
   * @param {State<[...In, ...Params]>} state
   * @returns {State<In>}
   */
  formatRoute(state) {
    return this.base.formatRoute(this.next.formatSegment(state))
  }
}

/**
 * @template {any[]} Params
 * @template T
 * @extends {URLRoute<[...Params, T]>}
 */
class ChainVariable {
  /**
   * @param {Route<Params>} base
   * @param {VariableSegment<T>} next
   */
  constructor(base, next) {
    this.base = base
    this.next = next
  }

  /**
   * @param {State<[]>} state
   * @returns {?State<[...Params, T]>}
   */
  parseRoute(state) {
    const next = this.base.parseRoute(state)
    if (next != null) {
      return this.next.parseSegment(next)
    } else {
      return null
    }
  }

  /**
   * @param {State<[...Params, T]>} state
   * @returns {State<[]>}
   */
  formatRoute(state) {
    return this.base.formatRoute(this.next.formatSegment(state))
  }
}

/**
 * @template T
 * @extends {VariableRoute<T>}
 */
class QuerySegment extends VariableRoute {
  /**
   * @param {string} name
   * @param {QueryParam<T>} queryParam
   */
  constructor(name, queryParam) {
    super()
    this.name = name
    this.queryParam = queryParam
  }

  /**
   * @template {any[]} Params
   * @param {string} name
   * @param {State<Params>} state
   * @returns {?State<[...Params, T]>}
   */
  parseQueryParam(name, state) {
    return this.queryParam.parseQueryParam(name, state)
  }

  /**
   * @template {any[]} Params
   * @param {string} name
   * @param {State<[...Params, T]>} state
   * @returns {State<Params>}
   */
  formatQueryParam(name, state) {
    return this.queryParam.formatQueryParam(name, state)
  }

  /**
   * @template {any[]} Params
   * @param {State<Params>} state
   * @returns {?State<[...Params, T]>}
   */
  parseSegment(state) {
    return this.queryParam.parseQueryParam(this.name, state)
  }

  /**
   * @template {any[]} Params
   * @param {State<[...Params, T]>} state
   * @returns {State<Params>}
   */
  formatSegment(state) {
    return this.queryParam.formatQueryParam(this.name, state)
  }
}

/**
 * @template T
 * @param {VariableSegment<T>} route
 * @returns {VariableSegment<T> & Route<[T]>}
 */
export const rest = (route) => new RestSegment(route)

/**
 * @template {any[]} Left
 * @template {any[]} Right
 * @param {Route<Left>} left
 * @param {Route<Right>} right
 * @returns {Route<[...Left, ...Right]>}
 */
export const concat = (left, right) => new Concatenation(left, right)

/**
 * @param {string} text
 * @returns {Segment}
 */
export const segment = (text) => new RouteSegment(text)

/**
 * @template T
 * @param {(input:string) => null|T} parse
 * @param {(value:T) => string} format
 * @returns {Param<T>}
 */
export const param = (parse, format) => new RouteParam(parse, format)

export const String = param(text.parse, text.format)
export const Integer = param(int.parse, int.format)
export const Float = param(float.parse, float.format)

/** @type {Segment} */
export const Base = new BaseSegment()

/**
 * @type {Segment}
 */
export const Root = new RootSegment()

/**
 * @type {VariableSegment<string> & Route<[string]>}
 */
export const Rest = new RestSegment(String)

/**
 * @template T
 * @param {string} name
 * @param {QueryParam<T>} route
 * @returns {Param<T>}
 */
export const query = (name, route) => new QuerySegment(name, route)

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
  const output = route.parseRoute(state(path, [], query))
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
 * @template T
 * @typedef {import('./route/interface').Param<T>} Param
 */

/**
 * @template {any[]} Params
 * @typedef {import('./route/interface').Route<Params>} Route<Params>
 */
