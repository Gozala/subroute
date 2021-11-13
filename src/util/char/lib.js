import * as Char from "./char.js"

/**
 * @typedef {Char.Char} Char
 */

/**
 * @param {any} value
 * @returns {value is Char.Char}
 *
 */
export const isChar = value => typeof value === "string" && value.length === 1

/**
 * Detect upper case ASCII characters
 *
 * @param {Char.Char} char
 * @returns {boolean}
 */
const isUpper = char => {
  const code = char.charCodeAt(0)
  return code <= 0x5a && 0x41 <= code
}

/**
 * Detect lower case ASCII characters.
 *
 * @param {Char.Char} char
 * @returns {boolean}
 */
const isLower = char => {
  const code = char.charCodeAt(0)
  return 0x61 <= code && code <= 0x7a
}

/**
 * Detect upper case and lower case ASCII characters.
 *
 * @param {Char.Char} char
 * @returns {boolean}
 */
const isAlpha = char => isLower(char) || isUpper(char)

/**
 *
 * @param {Char.Char} char
 * @returns {boolean}
 */
const isDigit = char => {
  const code = char.charCodeAt(0)
  return code <= 0x39 && 0x30 <= code
}

/**
 * Detect upper case and lower case ASCII characters.
 *
 * @param {Char.Char} char
 * @returns {boolean}
 */
export const isAlphaNum = char =>
  isLower(char) || isUpper(char) || isDigit(char)

/**
 * @param {Char.Char} char
 */
export const isAlphaNumOr_ = char => isAlphaNum(char) || char === "_"

/**
 * @param {Char.Char} char
 */
export const isHexDigit = char => isHex(toCode(char))

/**
 * @param {number} code
 */
export const isHex = code =>
  (0x30 <= code && code <= 0x39) ||
  (0x41 <= code && code <= 0x46) ||
  (0x61 <= code && code <= 0x66)

/**
 *
 * @param {Char.Char} char
 */
export const toCode = char => char.charCodeAt(0)

/**
 *
 * @param {number} code
 * @returns {Char.Char}
 */
export const fromCode = code =>
  /** @type {Char.Char} */ (String.fromCharCode(code))
