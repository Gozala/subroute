import { create } from "state"

/**
 * @returns {Segment}
 */
export const root = () => new Root()

class Root {
  get text() {
    return ""
  }
  /**
   * @template {any[]} In
   * @param {State<In>} state
   * @returns {?State<In>}
   */
  parseRoute(state) {
    return parse(state)
  }

  /**
   * @template {any[]} In
   * @param {State<In>} state
   * @returns {State<In>}
   */

  formatRoute(state) {
    return format(state)
  }

  /**
   * @template {any[]} In
   * @param {State<In>} state
   * @returns {?State<In>}
   */
  parseSegment(state) {
    return parse(state)
  }
  /**
   * @template {any[]} In
   * @param {State<In>} state
   * @returns {State<In>}
   */
  formatSegment(state) {
    return format(state)
  }
}

/**
 * @template {any[]} In
 * @param {State<In>} model
 * @returns {State<In>}
 */
const format = ({ segments, params, query }) =>
  create(["", ...segments], params, query)

/**
 * @template {any[]} In
 * @param {State<In>} state
 * @returns {?State<In>}
 */
const parse = ({ segments, params, query }) => {
  const [first, ...rest] = segments
  if (first === "" && rest.length !== 0) {
    return create(rest, params, query)
  } else {
    return null
  }
}

/**
 * @typedef {import('./interface').Segment} Segment
 */
/**
 * @template Params
 * @typedef {import('./interface').State<Params>} State
 */
