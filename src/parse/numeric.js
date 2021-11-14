import * as Parse from "./api.js"
import * as Result from "../util/result/lib.js"
import * as Data from "../data/api.js"
import { fail, succeed } from "../parse.js"
import { bumpOffset } from "./state.js"

/**
 * @template C, X, T
 * @param {Parse.State<C>} state
 * @param {Parse.NumberConfig<X, T>} config
 * @returns {Parse.Result<C, X, T>}
 */
export const parse = (
  state,
  { int, hex, octal, binary, float, invalid, expecting }
) => {
  const { source, offset } = state

  switch (source.charCodeAt(offset)) {
    case 0x30 /* 0 */: {
      const zeroOffset = /** @type {Data.int} */ (offset + 1)
      const baseOffset = /** @type {Data.int} */ (zeroOffset + 1)
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
            [zeroOffset, /** @type {Data.int} */ (0)],
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
 * @param {(input:Data.int) => Result.Result<X, T>} handler
 * @param {number} startOffset
 * @param {[number, Data.int]} endPos
 * @param {Parse.State<C>} state
 * @returns {Parse.Result<C, X, T>}
 */

export const finalizeInt = (
  invalid,
  handler,
  startOffset,
  [endOffset, n],
  state
) => {
  const result = handler(n)
  if (result.ok) {
    if (startOffset === endOffset) {
      return fail(invalid, state)
    } else {
      return succeed(result.value, bumpOffset(state, endOffset))
    }
  } else {
    return fail(result.error, state)
  }
}

/**
 * @template C, X, T
 * @param {X} invalid
 * @param {X} expecting
 * @param {(input:Data.int) => Result.Result<X, T>} intSettings
 * @param {(input:Data.float) => Result.Result<X, T>} floatSettings
 * @param {[Data.int, Data.int]} intPair
 * @param {Parse.State<C>} state
 * @returns {Parse.Result<C, X, T>}
 */
export const finalizeFloat = (
  invalid,
  expecting,
  intSettings,
  floatSettings,
  intPair,
  state
) => {
  const { line, column, offset, source, context } = state
  const [intOffset] = intPair
  const floatOffset = consumeDotAndExp(intOffset, source)

  if (floatOffset < 0) {
    return fail(invalid, {
      line,
      column: column - floatOffset + offset,
      context,
    })
  } else if (offset === floatOffset) {
    return fail(expecting, state)
  } else if (intOffset === floatOffset) {
    return finalizeInt(invalid, intSettings, offset, intPair, state)
  } else {
    const n = toFloat(source.slice(offset, floatOffset))
    if (n === null) {
      return fail(invalid, state)
    } else {
      const result = floatSettings(n)
      if (result.ok) {
        return succeed(result.value, bumpOffset(state, floatOffset))
      } else {
        return fail(invalid, state)
      }
    }
  }
}

/**
 * @param {string} input
 * @returns {Data.float|null}
 */
export const toFloat = input => {
  if (input.length === 0 || /[\sxbo]/.test(input)) {
    return null
  }

  const n = /** @type {Data.float} */ (+input)
  return n === n ? n : null
}

/**
 * On a failure, returns negative index of problem.
 * @param {number} offset
 * @param {string} source
 */

export const consumeDotAndExp = (offset, source) => {
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
export const consumeExp = (offset, source) => {
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

export const chompBase10 = (offset, source) => {
  for (; offset < source.length; offset++) {
    const code = source.charCodeAt(offset)
    if (code < 0x30 || 0x39 < code) {
      return offset
    }
  }
  return offset
}

/**
 * @param {Data.int} offset
 * @param {string} source
 * @returns {[Data.int, Data.int]}
 */
export const consumeBase16 = (offset, source) => {
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
  return [offset, /** @type {Data.int} */ (total)]
}

/**
 * @param {number} base
 * @param {Data.int} offset
 * @param {string} source
 * @returns {[Data.int, Data.int]}
 */
export const consumeBase = (base, offset, source) => {
  for (var total = 0; offset < source.length; offset++) {
    var digit = source.charCodeAt(offset) - 0x30
    if (digit < 0 || base <= digit) break
    total = base * total + digit
  }
  return [offset, /** @type {Data.int} */ (total)]
}
