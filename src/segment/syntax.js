import * as Parse from "./parser/api.js"
import * as Format from "./formatter/api.js"
import * as Syntax from "./syntax/api.js"
import { isSubstring, findSubString, positionAt } from "../util/string.js"
import { ok, error } from "../util/result/lib.js"
import * as API from "../route/api.js"
import { parseNumber } from "./parser/number.js"
import { succeed, fail } from "./parser/parse.js"

export * from "./syntax/api.js"
/**
 * @template C, X, T
 * @implements {Syntax.Syntax<C, X, never, T>}
 */
export class Root {
  /**
   * @param {T} value
   * @param {X} error
   */
  constructor(value, error) {
    this.error = error
    this.value = value
  }
  /**
   * @param {Parse.State<C>} state
   */
  parse(state) {
    if (state.offset === 0) {
      return succeed(this.value, state)
    } else {
      return fail(this.error, state)
    }
  }
  /**
   * @param {Format.Input<C, T>} state
   */
  format({ state }) {
    return ok(state)
  }
}

/**
 * @template C, X, T
 * @implements {Syntax.Syntax<C, X, never, T>}
 */
export class End {
  /**
   * @param {T} value
   * @param {X} error
   */
  constructor(value, error) {
    this.value = value
    this.error = error
  }
  /**
   * @param {Parse.State<C>} state
   */
  parse(state) {
    const { error, value } = this
    return state.offset >= state.source.length - 1
      ? fail(error, state)
      : succeed(value, state)
  }
  /**
   * @param {Format.Input<C, T>} state
   */
  format({ state }) {
    return ok(state)
  }
}
/**
 * @template C, X, T
 * @template {string} Match
 * @implements {Syntax.Syntax<C, X, never, T>}
 */
export class Replace {
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
   * @param {Parse.State<C>} state
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
   * @param {Format.Input<C, T>} state
   */
  format({ state }) {
    return ok({ ...state, pathname: `${state.pathname}${this.match}` })
  }
}

/**
 * @template C, X, Y, T
 * @template {PropertyKey} ID
 * @implements {Syntax.Syntax<C, X, Y, {[K in ID]: T}>}
 */
export class Variable {
  /**
   * @param {ID} id
   * @param {Syntax.Syntax<C, X, Y, T>} inner
   */
  constructor(id, inner) {
    this.id = id
    this.inner = inner
  }

  /**
   * @param {Parse.State<C>} state
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
   * @param {Format.Input<C, {[key in ID]: T}>} input
   */
  format({ value, state }) {
    return this.inner.format({ value: value[this.id], state })
  }
}

/**
 * @template C, X
 * @template {string} Match
 * @implements {Syntax.Syntax<C, X, never, string>}
 */
export class TakeUntil {
  /**
   * @param {Match} match
   * @param {X} error
   */
  constructor(match, error) {
    this.match = match
    this.error = error
  }

  /**
   * @param {Parse.State<C>} state
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
   * @param {Format.Input<C, string>} param0
   */

  format({ value, state }) {
    return ok({ ...state, pathname: `${state.pathname}${value}` })
  }
}

/**
 * @template C, X
 * @implements {Syntax.Syntax<C, X, never, string>}
 */
export class Rest {
  /**
   * @param {X|null} emptyError
   */
  constructor(emptyError) {
    this.emptyError = emptyError
  }
  /**
   * @param {Parse.State<C>} state
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
   * @param {Format.Input<C, string>} param0
   */
  format({ value, state }) {
    return ok({ ...state, pathname: `${state.pathname}${value}` })
  }
}

/**
 * @template {PropertyKey} Key
 * @template Value
 * @param {Key} key
 * @param {Value} value
 * @returns {Syntax.Row<Key, Value>}
 */
const row = (key, value) =>
  /** @type {{[K in Key]: Value}} */ ({ [key]: value })

/**
 * @template C, X, T
 * @implements {Parse.Parser<C, X, T>}
 * @implements {Format.Formatter<C, X, T>}
 */
export class Numeric {
  /**
   * @param {API.NumberConfig<X, T>} config
   */
  constructor(config) {
    this.config = config
  }
  /**
   *
   * @param {Parse.State<C>} state
   */
  parse(state) {
    return parseNumber(state, this.config)
  }
  /**
   *
   * @param {Format.Input<C, T>} input
   */
  format({ value, state }) {
    return ok({ ...state, pathname: `${state.pathname}${value}` })
  }
}

/**
 * @template C, X, Y, L, R, LR
 * @implements {Syntax.Syntax<C, X, Y, LR>}
 */
export class Join {
  /**
   * @param {(left:L, right:R) => LR} join
   * @param {(lr:LR) => [L, R]} split
   * @param {Syntax.Syntax<C, X, Y, L>} left
   * @param {Syntax.Syntax<C, X, Y, R>} right
   */
  constructor(join, split, left, right) {
    this.join = join
    this.split = split
    this.left = left
    this.right = right
  }
  /**
   *
   * @param {Parse.State<C>} state
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
   * @param {Format.Input<C, LR>} input
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
 * @template C, X, T
 * @implements {Syntax.Syntax<C, X, never, T>}
 */
export class Method {
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
   * @param {Parse.State<never>} state
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
   * @param {Format.Input<C, T>} input
   */
  format({ value, state }) {
    return ok({
      ...state,
      method: this.expect,
    })
  }
}

/**
 * @template C, X, Y, L, R
 */
export class And {
  /**
   * @param {Syntax.Syntax<C, X, Y, L>} left
   * @param {Syntax.Syntax<C, X, Y, R>} right
   */
  constructor(left, right) {
    this.left = left
    this.right = right
  }
  /**
   *
   * @param {Parse.State<C>} state
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
   * @param {Format.Input<C, R>} input
   */
  format(input) {
    return this.right.format(input)
  }
}
