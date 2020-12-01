/**
 * @template {any[]} ButLast
 * @template Last
 * @param {[...ButLast, Last]} tuple
 * @returns {Last}
 */
export const last = (tuple) => tuple[tuple.length - 1]

/**
 * @template {any[]} ButLast
 * @template Last
 * @param {[...ButLast, Last]} tuple
 * @returns {ButLast}
 */
export const butlast = (tuple) =>
  /** @type {ButLast} */ (tuple.slice(0, tuple.length - 1))
