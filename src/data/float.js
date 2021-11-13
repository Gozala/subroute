/**
 * @param {string} input
 * @returns {float|null}
 */
export const parse = input => {
  switch (input) {
    case "":
      return null
    default: {
      if (/[\sxbo]/.test(input)) {
        return null
      } else {
        return from(+input)
      }
    }
  }
}

/**
 *
 * @param {float} value
 * @returns {string}
 */
export const format = value => value.toString()

/**
 * Turns given number into a float.
 *
 * @param {number} n
 * @returns {float|null}
 */
export const from = n => {
  switch (n) {
    case Infinity:
      return null
    case -Infinity:
      return null
    // Faster !isNaN(n) check
    case n:
      return /** @type {float} */ (n)
    // n is NaN
    default:
      return null
  }
}

/**
 * @typedef {import('./api').float} float
 */
