import * as Route from "./route/api.js"
import { succeed, fail, State as ParseState } from "./parse.js"
import { isSubstring, findSubString, positionAt } from "./util/string.js"
import { ok, error } from "./util/result/lib.js"
import { parse as parseNumeric } from "./parse/numeric.js"
import { row } from "./util/object.js"

export * from "./route/api.js"
export { parse, parsePath, parseHash, parseRequest } from "./parse.js"
export { format } from "./fromat.js"

/**
 * Route that will match given `segment` as a provided `subtitution` value.
 *
 * @template {string} Search
 * @template T
 * @param {Search} segment
 * @param {T} substitution
 * @returns {Route.Route<T>}
 */
export const replace = (segment, substitution) =>
  new Replace(segment, substitution, {
    name: "Expecting",
    expecting: segment,
  })

/**
 * Route that will matches rest of the input capturing it as result. If optional
 * `errorIfEmpty` is provided parse will fail if matched input is empty.
 *
 * @returns {Route.Route<string>}
 * @param {Route.Problem|null} [errorIfEmpty]
 */
export const rest = (errorIfEmpty = null) => new Rest(errorIfEmpty)

/**
 * Matches exact end of the input, if matched provided `value` is captured
 * otherwise error is produced.
 *
 * @template T
 * @param {T} value
 * @returns {Route.Route<value>}
 */
export const end = value =>
  new End(value, {
    name: "ExpectingEnd",
  })

/**
 * @template T
 * @param {T} value
 * @returns {Route.Route<T>}
 */

export const root = value => new Root(value, { name: "ExpectingStart" })

/**
 * @param {string} segment
 * @returns {Route.Route<string>}
 */

export const takeUntil = segment =>
  new TakeUntil(segment, {
    name: "Expecting",
    expecting: segment,
  })

/**
 * @template {PropertyKey} ID
 * @template T
 * @param {ID} id
 * @param {Route.Route<T>} route
 * @returns {Route.Route<{[K in ID]: T}>}
 */
export const variable = (id, route) => new Variable(id, route)

/**
 * @template {PropertyKey} LK
 * @template {PropertyKey} RK
 * @template LV, RV
 * @param {Route.Route<{[K in LK]: LV}>} left
 * @param {Route.Route<{[K in RK]: RV}>} right
 * @returns {Route.Route<{[K in LK]: LV} & {[K in RK]: RV}>}
 */
export const merge = (left, right) =>
  new Join(
    (left, right) => ({ ...left, ...right }),
    merged => [merged, merged],
    left,
    right
  )

/**
 * @template {Route.Segment[]} Segments
 * @param {readonly string[]} strings
 * @param  {Segments} matches
 * @returns {Route.Route<Route.Build<Segments>>}
 */
export const compileRoute = (strings, matches) => {
  /** @type {Route.Match<*>} */
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
 * @template {Route.Segment[]} Segments
 * @template {string} Verb
 * @param {Object} options
 * @param {readonly string[]} options.strings
 * @param {Segments} options.matches
 * @param {Verb} [options.method]
 *
 */
export const compile = ({ method, strings, matches }) => {
  const route = compileRoute(strings, matches)
  return method == null ? route : and(expectMethod(method, {}), route)
}

/**
 * @template T
 * @param {Route.Match<T>} match
 * @param {string} section
 * @returns {Route.Match<T>}
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
 * @param {Route.Match<{[K in LK]: LV}>} route
 * @param {RK} id
 * @param {Route.Match<RV>} match
 * @returns {Route.Match<{[K in LK]: LV} & {[K in RK]: RV}>}
 */
const extend = (route, id, match) => {
  if (route.parse == null) {
    throw new SyntaxError(
      "Route may not have two matches next to eache other, please add some delimiter between the two"
    )
  } else if (match.parse == null) {
    return capture(route, id, match)
  } else {
    return merge(route, variable(id, match))
  }
}

/**
 * @template T
 * @template [X=Route.Problem]
 * @template [C=never]
 * @param {Route.NumberConfig<X, T>} config
 * @returns {Route.Route<T, X, X, C>}
 */

export const numeric = config => new Numeric(config)

/**
 * @template [X=Route.Problem]
 * @template [C=never]
 * @param {X} expecting
 * @param {X} invalid
 */

export const int = (expecting, invalid) =>
  numeric({
    int: ok,
    hex: () => error(invalid),
    octal: () => error(invalid),
    binary: () => error(invalid),
    float: () => error(invalid),
    invalid,
    expecting,
  })

/**
 * @template [X=Route.Problem]
 * @template [C=never]
 * @param {X} expecting
 * @param {X} invalid
 */

export const float = (expecting, invalid) =>
  numeric({
    int: v => ok(/** @type {Route.float} */ (v)),
    hex: () => error(invalid),
    octal: () => error(invalid),
    binary: () => error(invalid),
    float: ok,
    invalid,
    expecting,
  })

/**
 * @implements {Route.Capture<string>}
 */
class CaptureText {
  /**
   * @returns {Route.Match<string>}
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
 * @implements {Route.Capture<{[K in LK]: LV} & {[K in RK]: RV}>}
 */
class CaptureNext {
  /**
   * @param {RK} id
   * @param {Route.Route<{[K in LK]: LV}>} syntax
   * @param {Route.Capture<RV>} capture
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
    return merge(this.syntax, variable(this.id, this.capture.until(section)))
  }
  end() {
    return merge(this.syntax, variable(this.id, this.capture.end()))
  }
}
/**
 * @template {PropertyKey} LK
 * @template {PropertyKey} RK
 * @template LV, RV
 * @param {RK} id
 * @param {Route.Route<{[K in LK]: LV}>} syntax
 * @param {Route.Capture<RV>} capture
 * @returns {Route.Capture<{[K in LK]: LV} & {[K in RK]: RV}>}
 */
const capture = (syntax, id, capture) => new CaptureNext(id, syntax, capture)

/**
 * @template L, R
 * @param {Route.Route<L>} left
 * @param {Route.Route<R>} right
 * @returns {Route.Route<R>}
 */

export const and = (left, right) => new And(left, right)

/**
 * @template {string} M
 * @template T
 * @param {M} expecting
 * @param {T} value
 * @returns {Route.Route<T>}
 */
const expectMethod = (expecting, value) =>
  new Method(expecting, value, {
    name: "ExpectingMethod",
    expecting,
  })

/**
 * @template C, X, T
 * @implements {Route.Route<T, X, never, C>}
 */
class Root {
  /**
   * @param {T} value
   * @param {X} error
   */
  constructor(value, error) {
    this.error = error
    this.value = value
  }
  /**
   * @param {Route.ParseState<C>} state
   */
  parse(state) {
    if (state.offset === 0) {
      return succeed(this.value, state)
    } else {
      return fail(this.error, state)
    }
  }
  /**
   * @param {Route.FormatInput<T, C>} state
   */
  format({ state }) {
    return ok(state)
  }
}

/**
 * @template C, X, T
 * @implements {Route.Route<T, X, never, C>}
 */
class End {
  /**
   * @param {T} value
   * @param {X} error
   */
  constructor(value, error) {
    this.value = value
    this.error = error
  }
  /**
   * @param {Route.ParseState<C>} state
   */
  parse(state) {
    const { error, value } = this
    return state.offset >= state.source.length - 1
      ? fail(error, state)
      : succeed(value, state)
  }
  /**
   * @param {Route.FormatInput<T, C>} state
   */
  format({ state }) {
    return ok(state)
  }
}
/**
 * @template C, X, T
 * @template {string} Match
 * @implements {Route.Route<T, X, never, C>}
 */
class Replace {
  /**
   * @param {Match} match
   * @param {T} value
   * @param {X} error
   */
  constructor(match, value, error) {
    this.match = match
    this.value = value
    this.error = error
  }
  /**
   * @param {Route.ParseState<C>} state
   */
  parse(state) {
    const { match, error, value } = this
    const { offset, line, column } = isSubstring(match, state.source, state)

    if (offset === -1) {
      return fail(error, state)
    } else {
      return succeed(value, { ...state, offset, line, column })
    }
  }
  /**
   * @param {Route.FormatInput<T, C>} state
   */
  format({ state }) {
    return ok({ ...state, pathname: `${state.pathname}${this.match}` })
  }
}

/**
 * @template C, X, Y, T
 * @template {PropertyKey} ID
 * @implements {Route.Route<{[K in ID]: T}, X, Y, C>}
 */
class Variable {
  /**
   * @param {ID} id
   * @param {Route.Route<T, X, Y, C>} inner
   */
  constructor(id, inner) {
    this.id = id
    this.inner = inner
  }

  /**
   * @param {Route.ParseState<C>} state
   */
  parse(state) {
    const { id } = this
    const result = this.inner.parse(state)
    if (result.ok) {
      return succeed(row(id, result.value), result.state)
    } else {
      return result
    }
  }
  /**
   * @param {Route.FormatInput<{[key in ID]: T}, C>} input
   */
  format({ value, state }) {
    return this.inner.format({ value: value[this.id], state })
  }
}

/**
 * @template C, X
 * @template {string} Match
 * @implements {Route.Route<string, X, never, C>}
 */
class TakeUntil {
  /**
   * @param {Match} match
   * @param {X} error
   */
  constructor(match, error) {
    this.match = match
    this.error = error
  }

  /**
   * @param {Route.ParseState<C>} state
   */
  parse(state) {
    const { offset, line, column } = findSubString(
      this.match,
      state.source,
      state
    )

    if (offset === -1) {
      return fail(this.error, {
        line,
        column,
        context: state.context,
      })
    } else {
      return succeed(state.source.slice(state.offset, offset), {
        ...state,
        offset,
        line,
        column,
      })
    }
  }
  /**
   * @param {Route.FormatInput<string, C>} input
   */

  format({ value, state }) {
    return ok({ ...state, pathname: `${state.pathname}${value}` })
  }
}

/**
 * @template C, X
 * @implements {Route.Route<string, X, never, C>}
 */
class Rest {
  /**
   * @param {X|null} emptyError
   */
  constructor(emptyError) {
    this.emptyError = emptyError
  }
  /**
   * @param {Route.ParseState<C>} state
   */
  parse(state) {
    const { emptyError } = this
    const { source, context } = state
    const { offset, line, column } = positionAt(source.length, source, state)
    const slice = source.slice(state.offset)
    const result =
      slice.length === 0 && emptyError
        ? fail(emptyError, { line, column, context })
        : succeed(slice, { ...state, offset, line, column })
    return result
  }
  /**
   * @param {Route.FormatInput<string, C>} input
   */
  format({ value, state }) {
    return ok({ ...state, pathname: `${state.pathname}${value}` })
  }
}

/**
 * @template C, X, T
 * @implements {Route.Route<T, X, never, C>}
 */
class Method {
  /**
   * @param {string} expect
   * @param {T} value
   * @param {X} error
   */
  constructor(expect, value, error) {
    this.expect = expect.toUpperCase()
    this.value = value
    this.error = error
  }
  /**
   * @param {Route.ParseState<C>} state
   */
  parse(state) {
    if ((state.method || "").toUpperCase() !== this.expect) {
      return fail(this.error, state)
    } else {
      return succeed(this.value, state)
    }
  }
  /**
   *
   * @param {Route.FormatInput<T, C>} input
   */
  format({ state }) {
    return ok({
      ...state,
      method: this.expect,
    })
  }
}

/**
 * @template C, X, Y, L, R, LR
 * @implements {Route.Route<LR, X, Y, C>}
 */
class Join {
  /**
   * @param {(left:L, right:R) => LR} join
   * @param {(lr:LR) => [L, R]} split
   * @param {Route.Route<L, X, Y, C>} left
   * @param {Route.Route<R, X, Y, C>} right
   */
  constructor(join, split, left, right) {
    this.join = join
    this.split = split
    this.left = left
    this.right = right
  }
  /**
   *
   * @param {Route.ParseState<C>} state
   */
  parse(state) {
    const { left, right, join } = this
    const leftResult = left.parse(state)
    if (!leftResult.ok) {
      return leftResult
    } else {
      const rightResult = right.parse(leftResult.state)
      return rightResult.ok
        ? succeed(join(leftResult.value, rightResult.value), rightResult.state)
        : rightResult
    }
  }
  /**
   * @param {Route.FormatInput<LR, C>} input
   */
  format({ state, value }) {
    const { left, right } = this
    const [leftValue, rightValue] = this.split(value)
    const leftResult = left.format({ value: leftValue, state })
    if (leftResult.ok) {
      return right.format({ value: rightValue, state: leftResult.value })
    } else {
      return leftResult
    }
  }
}

/**
 * @template C, X, Y, L, R
 */
class And {
  /**
   * @param {Route.Route<L, X, Y, C>} left
   * @param {Route.Route<R, X, Y, C>} right
   */
  constructor(left, right) {
    this.left = left
    this.right = right
  }
  /**
   *
   * @param {Route.ParseState<C>} state
   */
  parse(state) {
    const { left, right } = this
    const leftResult = left.parse(state)
    if (!leftResult.ok) {
      return leftResult
    } else {
      return right.parse(leftResult.state)
    }
  }
  /**
   * @param {Route.FormatInput<R, C>} input
   */
  format(input) {
    return this.right.format(input)
  }
}

/**
 * @template {string[]} T
 * @param  {T} options
 * @returns {Route.Route<T[number]>}
 */

export const enumerate = (...options) =>
  new Enum(options, {
    name: "Expecting",
    expecting: options.join("|"),
  })

/**
 * @template {string} T
 * @template X
 * @template [C=never]
 * @implements {Route.Route<T, X, never, C>}
 */
class Enum {
  /**
   * @param {T[]} options
   * @param {X} error
   */
  constructor(options, error) {
    this.options = options
    this.error = error
  }
  /**
   * @param {Route.ParseState<C>} state
   */
  parse(state) {
    const { options, error } = this
    for (const option of options) {
      const { offset, line, column } = isSubstring(option, state.source, state)
      if (offset >= 0) {
        return succeed(option, { ...state, offset, line, column })
      }
    }

    return fail(error, state)
  }
  /**
   * @param {Route.FormatInput<T, C>} state
   */
  format({ state, value }) {
    return ok({ ...state, pathname: `${state.pathname}${value}` })
  }
}
/**
 * @template C, X, T
 * @implements {Route.Route<T, X, X, C>}
 */
class Numeric {
  /**
   * @param {Route.NumberConfig<X, T>} config
   */
  constructor(config) {
    this.config = config
  }
  /**
   *
   * @param {Route.ParseState<C>} state
   */
  parse(state) {
    return parseNumeric(state, this.config)
  }
  /**
   *
   * @param {Route.FormatInput<T, C>} input
   */
  format({ value, state }) {
    return ok({ ...state, pathname: `${state.pathname}${value}` })
  }
}
