/**
 * @returns {Segment}
 */
export const base = () => new Base()

class Base {
  get text() {
    return ""
  }
  /**
   * @template {any[]} In
   * @param {State<In>} state
   * @returns {?State<In>}
   */
  parseRoute(state) {
    return state
  }

  /**
   * @template {any[]} In
   * @param {State<In>} state
   * @returns {State<In>}
   */

  formatRoute(state) {
    return state
  }

  /**
   * @template {any[]} In
   * @param {State<In>} state
   * @returns {?State<In>}
   */
  parseSegment(state) {
    return state
  }

  /**
   * @template {any[]} In
   * @param {State<In>} state
   * @returns {State<In>}
   */

  formatSegment(state) {
    return state
  }
}

/**
 * @typedef {import('./interface').Segment} Segment
 */
/**
 * @template Params
 * @typedef {import('./interface').State<Params>} State
 */
