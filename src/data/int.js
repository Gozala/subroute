/**
 * @param {string} input
 * @returns {?int}
 */
export const parse = input => {
  const size = input.length
  if (size === 0) {
    return null
  } else {
    const ch = /** @type {string} */ (input[0])
    if (ch === "0" && input[1] === "x") {
      for (let i = 2; i < size; ++i) {
        const ch = /** @type {string} */ (input[i])
        if (
          ("0" <= ch && ch <= "9") ||
          ("A" <= ch && ch <= "F") ||
          ("a" <= ch && ch <= "f")
        ) {
          continue
        }
        return null
      }

      return /** @type {int} */ (parseInt(input, 16))
    }

    if (ch > "9" || (ch < "0" && ((ch !== "-" && ch !== "+") || size === 1))) {
      return null
    }

    for (let i = 1; i < size; ++i) {
      const ch = /** @type {string} */ (input[i])
      if (ch < "0" || "9" < ch) {
        return null
      }
    }

    return /** @type {int} */ (parseInt(input, 10))
  }
}

/**
 * @param {number} value
 * @returns {?int}
 */
export const from = value => {
  switch (value) {
    case +Infinity:
      return null
    case -Infinity:
      return null
    // Faster `!isNaN(value)` check
    case value:
      return /** @type {int} */ (value)
    default:
      return null
  }
}

/**
 * @param {int} value
 * @returns {string}
 */
export const format = value => value.toString()

/**
 * @typedef {import('./api').int} int
 */
