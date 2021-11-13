import * as Syntax from "./syntax.js"
import * as Parse from "./parser/api.js"
import * as API from "./route/api.js"
import * as ParseState from "./parser/state.js"

/**
 * @template T
 * @param {string} segment
 * @param {T} substitution
 * @returns {API.Syntax<T>}
 */
const replace = (segment, substitution) =>
  new Syntax.Replace(segment, substitution, {
    name: "Expecting",
    expecting: segment,
  })

/**
 * @returns {API.Syntax<string>}
 * @param {API.Problem|null} [errorIfEmpty]
 */
const rest = (errorIfEmpty = null) => new Syntax.Rest(errorIfEmpty)

/**
 * @returns {API.Syntax<{}>}
 */
const end = () =>
  new Syntax.End(
    {},
    {
      name: "ExpectingEnd",
    }
  )

/**
 * @template T
 * @param {T} value
 * @returns {API.Syntax<T>}
 */

const root = value => new Syntax.Root(value, { name: "ExpectingStart" })

/**
 * @param {string} segment
 * @returns {API.Syntax<string>}
 */

const takeUntil = segment =>
  new Syntax.TakeUntil(segment, {
    name: "Expecting",
    expecting: segment,
  })

/**
 * @template {PropertyKey} ID
 * @template T
 * @param {ID} name
 * @param {API.Syntax<T>} parser
 * @returns {API.Syntax<{[K in ID]: T}>}
 */
const row = (name, parser) => new Syntax.Variable(name, parser)

/**
 * @template {PropertyKey} LK
 * @template {PropertyKey} RK
 * @template LV, RV
 * @param {API.Syntax<{[K in LK]: LV}>} left
 * @param {API.Syntax<{[K in RK]: RV}>} right
 * @returns {API.Syntax<{[K in LK]: LV} & {[K in RK]: RV}>}
 */
const merge = (left, right) =>
  new Syntax.Join(
    (left, right) => ({ ...left, ...right }),
    merged => [merged, merged],
    left,
    right
  )

/**
 * @template T
 * @template {Array<{[K in PropertyKey]: API.Match<any>}|string|number>} Segments
 * @param {readonly string[]} strings
 * @param  {Segments} matches
 * @returns {API.Route<API.Build<Segments>>}
 */
export const route = (strings, ...matches) => {
  /** @type {API.Match<*>} */
  let route = root({})
  let offset = 0
  while (offset < strings.length) {
    route = skip(route, strings[offset])

    if (offset < matches.length) {
      const group = matches[offset]

      switch (typeof group) {
        case "string":
        case "number":
          route = skip(route, group.toString())
          break
        default:
          for (const [key, pattern] of Object.entries(group)) {
            route = extend(route, key, pattern)
          }
      }
    }
    offset++
  }

  return route.parse === null ? route.end() : route
}

/**
 * @template T
 * @param {API.Match<T>} match
 * @param {string} section
 * @returns {API.Match<T>}
 */
const skip = (match, section) => {
  if (section.length === 0) {
    return match
  } else if (match.parse == null) {
    return match.until(section)
  } else {
    return merge(match, replace(section, {}))
  }
}

/**
 * @template {PropertyKey} LK
 * @template {PropertyKey} RK
 * @template LV, RV
 * @param {API.Match<{[K in LK]: LV}>} route
 * @param {RK} id
 * @param {API.Match<RV>} match
 * @returns {API.Match<{[K in LK]: LV} & {[K in RK]: RV}>}
 */
const extend = (route, id, match) => {
  if (route.parse == null) {
    throw new SyntaxError(
      "Route may not have two matches next to eache other, please add some delimiter between the two"
    )
  } else if (match.parse == null) {
    return capture(route, id, match)
  } else {
    return merge(route, row(id, match))
  }
}

/**
 * @implements {API.Capture<string>}
 */
class CaptureText {
  /**
   * @returns {API.Match<string>}
   */
  static new() {
    return new this()
  }
  constructor() {
    /** @type {null} */
    this.parse
    this.parse = null
  }
  /**
   * @param {string} section
   */
  until(section) {
    return takeUntil(section)
  }
  end() {
    return rest({ name: "ExpectingEnd" })
  }
}

export const text = CaptureText.new()

/**
 * @template {PropertyKey} LK
 * @template {PropertyKey} RK
 * @template LV, RV
 * @implements {API.Capture<{[K in LK]: LV} & {[K in RK]: RV}>}
 */
class CaptureNext {
  /**
   * @param {RK} id
   * @param {API.Syntax<{[K in LK]: LV}>} syntax
   * @param {API.Capture<RV>} capture
   */
  constructor(id, syntax, capture) {
    this.id = id
    this.syntax = syntax
    this.capture = capture
    /** @type {null} */
    this.parse
    this.parse = null
  }
  /**
   * @param {string} section
   */
  until(section) {
    return merge(this.syntax, row(this.id, this.capture.until(section)))
  }
  end() {
    return merge(this.syntax, row(this.id, this.capture.end()))
  }
}
/**
 * @template {PropertyKey} LK
 * @template {PropertyKey} RK
 * @template LV, RV
 * @param {RK} id
 * @param {API.Syntax<{[K in LK]: LV}>} syntax
 * @param {API.Capture<RV>} capture
 * @returns {API.Capture<{[K in LK]: LV} & {[K in RK]: RV}>}
 */
const capture = (syntax, id, capture) => new CaptureNext(id, syntax, capture)

/**
 * @template {unknown} T
 * @param {API.Route<T>} route
 * @param {object} input
 * @param {string} input.pathname
 */
export const parsePath = (route, { pathname }) =>
  parse(route, ParseState.from({ source: pathname }))

/**
 * @template {unknown} T
 * @param {API.Route<T>} route
 * @param {Object} url
 * @param {string} [url.hash]
 * @returns {null|T}
 */
export const parseHash = (route, url) =>
  parse(route, ParseState.from({ source: (url.hash || "").slice(1) }))

/**
 * @template {unknown} T
 * @param {API.Route<T>} route
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
    ParseState.from({
      source: pathname,
      method: request.method,
      headers: request.headers,
      searchParams,
    })
  )
}

/**
 * @template {unknown} T
 * @param {API.Route<T>} route
 * @param {Parse.State<never>} state
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

/**
 * @template {unknown} T
 * @param {API.Route<T>} route
 * @param {T} value
 */
export const format = (route, value) => {
  const result = route.format({
    value,
    state: {
      pathname: "",
      context: [],
    },
  })

  if (result.ok) {
    return result.value
  } else {
    throw result.error
  }
}

/**
 * @template L, R
 * @param {API.Syntax<L>} left
 * @param {API.Syntax<R>} right
 * @returns {API.Syntax<R>}
 */

export const and = (left, right) => new Syntax.And(left, right)
