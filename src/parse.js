import { isSubstring, isSubChar, findSubString, first } from "./util/string.js"
import * as Result from "./util/result/lib.js"
import * as API from "./route/api.js"

/**
 * @template C, X, T
 * @param {API.Parse<C, X, T>} parse
 * @param {API.Input} input
 * @returns {Result.Result<API.Problems<C, X>, T>}
 */
export const parseWith = (parse, input) => {
  const result = parse({
    url: input.url,
    method: input.method,
    headers: input.headers,
    query: {},
    offset: 0,
    column: 1,
    line: 1,
    context: [],
  })

  if (result.ok) {
    return { ok: true, value: result.value }
  } else {
    return { ok: false, error: result.error }
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
 * @param {API.Int} line
 * @param {API.Int} column
 * @param {X} problem
 * @param {API.Located<C>[]} stack
 * @returns {API.Problems<C, X>}
 */
export const fromInfo = (line, column, problem, stack) => [
  {
    line,
    column,
    problem,
    stack,
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

// PRIMITIVES;

/**
 * @template C, X, T
 * @param {T} value
 * @returns {API.Parse<C, X, T>}
 */
export const succeed = value => state => good(false, value, state)

/**
 * @template C, X, T
 * @param {X} reason
 * @returns {API.Parse<C, X, T>}
 */
export const problem = reason => state => bad(false, fromState(state, reason))

/**
 * Say you are parsing a function named `viewHealthData` that contains a list.
 * You might get a `DeadEnd` like this:
 *
 * ```js
 * {
 *   line: 18,
 *   column: 22,
 *   problem: { type: "UnexpectedComma" },
 *   contextStack: [
 *     { line: 14, column: 1, context: { type: "Definition", name: 'viewHealthData' } }
 *     { line: 15, column: 4, context: { type: "List" } }
 *   ]
 * }
 * ```
 */

/**
 * @template C, X, T, U
 * @param {(input:T) => U} f
 * @param {API.Parse<C, X, T>} parse
 * @returns {API.Parse<C, X, U>}
 */
export const map = (parse, f) => state => {
  const result = parse(state)
  return result.ok
    ? good(result.progress, f(result.value), result.state)
    : result
}

/**
 * @template C, X, A, B, T
 * @param {(left:A, right:B) => T} f
 * @param {API.Parse<C, X, A>} parseLeft
 * @param {API.Parse<C, X, B>} parseRight
 * @returns {API.Parse<C, X, T>}
 */
export const join = (f, parseLeft, parseRight) => state => {
  const left = parseLeft(state)
  if (!left.ok) {
    return left
  } else {
    const right = parseRight(left.state)
    const progress = left.progress || right.progress
    return right.ok
      ? good(progress, f(left.value, right.value), right.state)
      : bad(progress, right.error)
  }
}

/**
 * Take `T` parser and some `U` parser and returns a parser that will
 * parse both but drop `U`.
 *
 *
 * @template C, X, T
 * @param {API.Parse<C, X, T>} parse
 * @param {API.Parse<C, X, any>} ignore
 * @returns {API.Parse<C, X, T>}
 */
export const skip = (parse, ignore) =>
  join((left, _right) => left, parse, ignore)

/**
 * @template C, X, T, U
 * @param {API.Parse<C, X, T>} parse
 * @param {(value: T) => API.Parse<C, X, U>} then
 * @returns {API.Parse<C, X, U>}
 */
export const chain = (parse, then) => state => {
  const left = parse(state)

  if (left.ok) {
    const parseNext = then(left.value)
    const right = parseNext(left.state)
    const progress = left.progress || right.progress
    return right.ok
      ? good(progress, right.value, right.state)
      : bad(progress, right.error)
  } else {
    return left
  }
}

/**
 * @template C, X
 * @template {Object} L
 * @template {Object} R
 * @param {API.Parse<C, X, L>} left
 * @param {API.Parse<C, X, R>} right
 */
export const extend = (left, right) =>
  join((l, r) => ({ ...l, ...r }), left, right)

/**
 * @template X, T
 * @param {T} value
 * @param {X} problem
 * @returns {API.Parse<never, X, T>}
 */
export const end = (value, problem) => state =>
  state.offset >= state.url.length - 1
    ? good(false, value, state)
    : bad(false, fromState(state, problem))

/**
 * @template C, X, T
 * @param {Iterable<API.Parse<C, X, T>>} parsers
 * @returns {API.Parse<C, X, T>}
 */
export const oneOf = parsers => state => {
  /** @type {API.Problems<C, X>} */
  let error = []
  for (const parse of parsers) {
    const result = parse(state)
    if (result.ok) {
      return result
    } else {
      error = [...error, ...result.error]
    }
  }
  return bad(false, error)
}

/**
 * @template C, X, T, U
 * @param {API.Parse<C, X, T>} left
 * @param {API.Parse<C, X, U>} right
 * @returns {API.Parse<C, X, T|U>}
 */
export const or = (left, right) => state => {
  /** @type {API.Problems<C, X>} */
  let error = []
  for (const parse of [left, right]) {
    const result = parse(state)
    if (result.ok) {
      return result
    } else {
      error = [...error, ...result.error]
    }
  }
  return bad(false, error)
}

/**
 * @template C, X, T, U
 * @param {API.Parse<C, X, T>} left
 * @param {API.Parse<C, X, U>} right
 * @returns {API.Parse<C, X, U>}
 */
export const and = (left, right) => chain(left, () => right)

/**
 * @template C, X
 * @template {string} T
 * @param {T} content
 * @param {X} expecting
 * @returns {API.Parse<C, X, T>}
 */
export const token = (content, expecting) => state => {
  const progress = content.length > 0
  const { offset, line, column } = isSubstring(content, state.url, state)

  if (offset == -1) {
    return bad(false, fromState(state, expecting))
  } else {
    return good(progress, content, { ...state, offset, line, column })
  }
}

/**
 * @template C, X
 * @param {X} expecting
 * @param {X} invalid
 * @returns {API.Parse<C, X, API.Int>}
 */

export const int = (expecting, invalid) =>
  number({
    int: Result.ok,
    hex: () => Result.error(invalid),
    octal: () => Result.error(invalid),
    binary: () => Result.error(invalid),
    float: () => Result.error(invalid),
    invalid,
    expecting,
  })

/**
 * @template C, X
 * @param {X} expecting
 * @param {X} invalid
 * @returns {API.Parse<C, X, API.Float>}
 */

export const float = (expecting, invalid) =>
  number({
    int: v => Result.ok(/** @type {API.Float} */ (v)),
    hex: () => Result.error(invalid),
    octal: () => Result.error(invalid),
    binary: () => Result.error(invalid),
    float: Result.ok,
    invalid,
    expecting,
  })

/**
 * @template C, X, T
 * @param {API.NumberConfig<X, T>} config
 * @returns {API.Parse<C, X, T>}
 */

export const number =
  ({ int, hex, octal, binary, float, invalid, expecting }) =>
  state => {
    const { url: source, offset } = state
    switch (source.charCodeAt(offset)) {
      case 0x30 /* 0 */: {
        const zeroOffset = offset + 1
        const baseOffset = zeroOffset + 1
        switch (source.charCodeAt(zeroOffset)) {
          case 0x78 /* x */:
            return finalizeInt(
              invalid,
              hex,
              baseOffset,
              consumeBase16(baseOffset, source),
              state
            )
          case 0x6f /* o */:
            return finalizeInt(
              invalid,
              octal,
              baseOffset,
              consumeBase(8, baseOffset, source),
              state
            )
          case 0x62 /* b */:
            return finalizeInt(
              invalid,
              binary,
              baseOffset,
              consumeBase(2, baseOffset, source),
              state
            )
          default:
            return finalizeFloat(
              invalid,
              expecting,
              int,
              float,
              [zeroOffset, 0],
              state
            )
        }
      }
      default:
        return finalizeFloat(
          invalid,
          expecting,
          int,
          float,
          consumeBase(10, offset, source),
          state
        )
    }
  }

/**
 * @template C, X, T
 * @param {X} invalid
 * @param {(input:API.Int) => Result.Result<X, T>} handler
 * @param {number} startOffset
 * @param {[number, number]} endPos
 * @param {API.ParseState<C>} state
 * @returns {API.ParseResult<C, X, T>}
 */

const finalizeInt = (invalid, handler, startOffset, [endOffset, n], state) => {
  const result = handler(n)
  if (result.ok) {
    if (startOffset === endOffset) {
      return bad(state.offset < startOffset, fromState(state, invalid))
    } else {
      return good(true, result.value, bumpOffset(state, endOffset))
    }
  } else {
    return bad(true, fromState(state, result.error))
  }
}

/**
 * @template C
 * @param {API.ParseState<C>} state
 * @param {number} offset
 */
const bumpOffset = (state, offset) => ({
  ...state,
  offset,
  column: state.column + (offset - state.offset),
})

/**
 * @template C, X, T
 * @param {X} invalid
 * @param {X} expecting
 * @param {(input:API.Int) => Result.Result<X, T>} intSettings
 * @param {(input:API.Float) => Result.Result<X, T>} floatSettings
 * @param {[number, number]} intPair
 * @param {API.ParseState<C>} state
 * @returns {API.ParseResult<C, X, T>}
 */
const finalizeFloat = (
  invalid,
  expecting,
  intSettings,
  floatSettings,
  intPair,
  state
) => {
  const { line, column, offset, url, context } = state
  const [intOffset] = intPair
  const floatOffset = consumeDotAndExp(intOffset, state.url)

  if (floatOffset < 0) {
    return bad(
      true,
      fromInfo(line, column - floatOffset + offset, invalid, context)
    )
  } else if (offset === floatOffset) {
    return bad(false, fromState(state, expecting))
  } else if (intOffset === floatOffset) {
    return finalizeInt(invalid, intSettings, offset, intPair, state)
  } else {
    const n = toFloat(url.slice(offset, floatOffset))
    if (n === null) {
      return bad(true, fromState(state, invalid))
    } else {
      const result = floatSettings(n)
      if (result.ok) {
        return good(true, result.value, bumpOffset(state, floatOffset))
      } else {
        return bad(true, fromState(state, invalid))
      }
    }
  }
}

/**
 * On a failure, returns negative index of problem.
 * @param {number} offset
 * @param {string} source
 */

const consumeDotAndExp = (offset, source) => {
  if (source.charCodeAt(offset) === 0x2e /* . */) {
    return consumeExp(chompBase10(offset + 1, source), source)
  } else {
    return consumeExp(offset, source)
  }
}

/**
 * On a failure, returns negative index of problem.
 * @param {number} offset
 * @param {string} source
 */
const consumeExp = (offset, source) => {
  const code = source.charCodeAt(offset)
  if (code === 0x65 /* e */ || code === 0x45 /** E */) {
    const eOffset = offset + 1
    const code = source.charCodeAt(eOffset)
    const expOffset =
      code === 0x2b /* + */ || code === 0x2d /* - */ ? eOffset + 1 : eOffset

    const newOffset = chompBase10(expOffset, source)

    return expOffset === newOffset ? -newOffset : newOffset
  } else {
    return offset
  }
}

/**
 * @param {number} offset
 * @param {string} source
 * @returns {number}
 */

const chompBase10 = (offset, source) => {
  for (; offset < source.length; offset++) {
    const code = source.charCodeAt(offset)
    if (code < 0x30 || 0x39 < code) {
      return offset
    }
  }
  return offset
}

/**
 * @param {number} offset
 * @param {string} source
 * @returns {[number, number]}
 */
const consumeBase16 = (offset, source) => {
  for (var total = 0; offset < source.length; offset++) {
    var code = source.charCodeAt(offset)
    if (0x30 <= code && code <= 0x39) {
      total = 16 * total + code - 0x30
    } else if (0x41 <= code && code <= 0x46) {
      total = 16 * total + code - 55
    } else if (0x61 <= code && code <= 0x66) {
      total = 16 * total + code - 87
    } else {
      break
    }
  }
  return [offset, total]
}

/**
 * @param {number} base
 * @param {number} offset
 * @param {string} source
 * @returns {[number, number]}
 */
const consumeBase = (base, offset, source) => {
  for (var total = 0; offset < source.length; offset++) {
    var digit = source.charCodeAt(offset) - 0x30
    if (digit < 0 || base <= digit) break
    total = base * total + digit
  }
  return [offset, total]
}

/**
 * @param {string} input
 * @returns {API.Float|null}
 */
const toFloat = input => {
  if (input.length === 0 || /[\sxbo]/.test(input)) {
    return null
  }
  const n = +input
  return n === n ? n : null
}

// CHOMPED STRINGS

/**
 * @template C, X, T
 * @param {API.Parse<C, X, T>} parse
 * @returns {API.Parse<C, X, string>}
 */
export const getChompedString = parse => mapChompedString(s => s, parse)

/**
 * @template C, X, T, U
 * @param {(source: string, value: T) => U} f
 * @param {API.Parse<C, X, T>} parse
 * @returns {API.Parse<C, X, U>}
 */
export const mapChompedString = (f, parse) => state => {
  const result = parse(state)
  if (result.ok) {
    return good(
      result.progress,
      f(state.url.slice(state.offset, result.state.offset), result.value),
      result.state
    )
  } else {
    return result
  }
}

/**
 * @template C, X
 * @param {(char:API.Char) => boolean} isGood
 * @param {X} expecting
 * @returns {API.Parse<C, X, []>}
 */
export const chompIf = (isGood, expecting) => state => {
  const newOffset = isSubChar(isGood, state.offset, state.url)
  switch (newOffset) {
    case -1: // not found
      return bad(false, fromState(state, expecting))
    case -2: // new line
      return good(true, [], {
        ...state,
        offset: state.offset + 1,
        line: state.line + 1,
        column: 1,
      })
    default:
      return good(true, [], {
        ...state,
        offset: newOffset,
        column: state.column + 1,
      })
  }
}

/**
 * @template C, X
 * @param {(char:API.Char) => boolean} isGood
 * @returns {API.Parse<C, X, []>}
 */
export const chompWhile = isGood => state => {
  let { offset, line, column, url: source } = state
  while (true) {
    const n = isSubChar(isGood, offset, source)
    switch (n) {
      case -1: {
        return good(state.offset < offset, [], {
          ...state,
          offset,
          line,
          column,
        })
      }
      case -2: {
        offset += 1
        line += 1
        column = 1
        break
      }
      default: {
        offset = n
        column += 1
      }
    }
  }
}

/**
 * @template C, X
 * @param {API.Token<X>} token
 * @returns {API.Parse<C, X, []>}
 */
export const chompUntil = token => state => {
  const { offset, line, column } = findSubString(
    token.content,
    state.url,
    state
  )

  if (offset === -1) {
    return bad(false, fromInfo(line, column, token.expecting, state.context))
  } else {
    return good(state.offset < offset, [], {
      ...state,
      offset,
      line,
      column,
    })
  }
}

/**
 * @template C, X
 * @param {string} search
 * @returns {API.Parse<C, X, []>}
 */
export const chompUntilEndOr = search => state => {
  const { url: source } = state
  const { offset, line, column } = findSubString(search, source, state)

  const adjustedOffset = offset < 0 ? source.length : offset

  return good(state.offset < adjustedOffset, [], {
    ...state,
    line,
    column,
    offset: adjustedOffset,
  })
}

// Context

/**
 * @template C, X, T
 * @param {C} context
 * @param {API.Parse<C, X, T>} parse
 * @returns {API.Parse<C, X, T>}
 */
export const inContext = (context, parse) => state => {
  const result = parse({
    ...state,
    context: [
      {
        line: state.line,
        column: state.column,
        context,
      },
      ...state.context,
    ],
  })

  return result.ok
    ? good(result.progress, result.value, {
        ...result.state,
        context: state.context,
      })
    : result
}

/**
 * @template C, X
 * @returns {API.Parse<C, X, API.Int>}
 */
export const line = () => state => good(false, state.line, state)

/**
 * @template C, X
 * @returns {API.Parse<C, X, API.Int>}
 */
export const column = () => state => good(false, state.column, state)

/**
 * @template C, X
 * @returns {API.Parse<C, X, API.Position>}
 */
export const position = () => state => good(false, state, state)

/**
 * @template C, X
 * @returns {API.Parse<C, X, string>}
 */
export const url = () => state => good(false, state.url, state)
