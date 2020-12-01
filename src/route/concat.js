/**
 * @template {any[]} Left
 * @template {any[]} Right
 * @param {Route<Left>} left
 * @param {Route<Right>} right
 * @returns {Route<[...Left, ...Right]>}
 */
export const concat = (left, right) => new Concat(left, right)

/**
 * @template {any[]} Left
 * @template {any[]} Right
 */
class Concat {
  /**
   *
   * @param {Route<Left>} left
   * @param {Route<Right>} right
   */
  constructor(left, right) {
    this.left = left
    this.right = right
  }

  /**
   * @template {any[]} Inn
   * @param {State<Inn>} state
   * @returns {?State<[...Inn, ...Left, ...Right]>}
   */
  parseRoute(state) {
    const left = this.left.parseRoute(state)
    if (left) {
      return this.right.parseRoute(left)
    } else {
      return null
    }
  }

  /**
   * @template {any[]} Inn
   * @param {State<[...Inn, ...Left, ...Right]>} state
   * @returns {State<Inn>}
   */
  formatRoute(state) {
    /** @type {State<[...Inn, ...Left]>} */
    const next = this.right.formatRoute(state)
    return this.left.formatRoute(next)
  }
}

/**
 * @template T
 * @typedef {import('./interface').VariableSegment<T>} VariableSegment
 */
/**
 * @template T
 * @typedef {import('./interface').Route<T>} Route<T>
 */
/**
 * @template {any[]} Params
 * @typedef {import('./interface').State<Params>} State<Params>
 */
