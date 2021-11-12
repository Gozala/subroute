import * as Char from "./char/char.js"
import * as API from "../route/api.js"

/**
 * Returns end position of the `search` string inside a `source` string. If not
 * found `offset` will be `-1`.
 *
 * @param {string} search - string to to search in source
 * @param {string} source - source string to search in
 * @param {API.Position} position - position from which to search
 * @returns {API.Position}
 */
export const isSubstring = (search, source, { offset, line, column }) => {
  const length = search.length
  let isGood = offset + length <= source.length
  let index = 0
  while (isGood && index < length) {
    const code = source.charCodeAt(offset)
    isGood = search[index++] === source[offset++]

    if (isGood) {
      if (code === 0x000a /* \n */) {
        line++
        column = 1
      } else {
        column++
        isGood =
          (code & 0xf800) === 0xd800
            ? search[index++] === source[offset++]
            : true
      }
    }
  }

  return { offset: isGood ? offset : -1, line, column }
}

/**
 *
 * @param {(char:Char.Char) => boolean} p
 * @param {number} offset
 * @param {string} source
 * @returns {number}
 */
export const isSubChar = (p, offset, source) => {
  if (source.length <= offset) {
    return -1
  } else if ((source.charCodeAt(offset) & 0xf800) === 0xd800) {
    return p(/** @type {Char.Char} */ (source.substr(offset, 2)))
      ? offset + 2
      : -1
  } else if (p(/** @type {Char.Char} */ (source[offset]))) {
    return source[offset] === "\n" ? -2 : offset + 1
  } else {
    return -1
  }
}

/**
 * Attempts to find a `search` string in the `source` string from the provided
 * position and returns. If not found `offset` will be `-1`.
 *
 * @param {string} search - string to search for.
 * @param {string} source -string to search in.
 * @param {API.Position} position - positoin to search from.
 * @returns {API.Position}
 */
export const findSubString = (search, source, position) => {
  const offset = source.indexOf(search, position.offset)
  const target = offset < 0 ? source.length : offset + search.length
  const { line, column } = positionAt(target, source, position)

  return { offset, line, column }
}

/**
 * Computes position at a given `offset` for in the `source` string from the
 * provided and returns it.
 *
 * @param {number} offset - offset to find position for.
 * @param {string} source -string to search in.
 * @param {API.Position} position - positoin to search from.
 * @returns {API.Position}
 */

export const positionAt = (offset, source, { offset: n, line, column }) => {
  const target =
    offset < 0 ? source.length : offset > source.length ? source.length : offset

  while (n < target) {
    const code = source.charCodeAt(n++)
    if (code === 0x000a /* \n */) {
      column = 1
      line++
    } else {
      column++
      if ((code & 0xf800) === 0xf800) {
        n++
      }
    }
  }

  return { offset: target, line, column }
}

/**
 *
 * @param {string} source
 * @returns {string|null}
 */
export const first = source => {
  const word = source.charCodeAt(0)
  return isNaN(word)
    ? null
    : 0xd800 <= word && word <= 0xdbff
    ? source.slice(0, 2)
    : source.slice(0, 1)
}
