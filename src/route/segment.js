import { create } from "state"

/**
 * @param {string} text
 * @returns {Segment}
 */
export const segment = text => new StaticSegment(text)

class StaticSegment {
  /**
   * @param {string} text
   */
  constructor(text) {
    /** @readonly */
    this.text = text
  }

  /**
   * @template {any[]} In
   * @param {State<In>} state
   * @returns {?State<In>}
   */
  parseSegment(state) {
    return parse(this, state)
  }

  /**
   * @template {any[]} Params
   * @param {State<Params>} state
   * @returns {State<Params>}
   */
  formatSegment(state) {
    return format(this, state)
  }
  /**
   * @template {any[]} In
   * @param {State<In>} state
   * @returns {?State<In>}
   */
  parseRoute(state) {
    return parse(this, state)
  }

  /**
   * @template {any[]} In
   * @param {State<In>} state
   * @returns {State<In>}
   */
  formatRoute(state) {
    return format(this, state)
  }
}

/**
 * @template {any[]} In
 * @param {SegmentData} self
 * @param {State<In>} state
 * @returns {?State<In>}
 */
const parse = ({ text }, { params, segments, query }) => {
  if (segments.length === 0) {
    return null
  } else {
    const [first, ...rest] = segments
    if (first === text) {
      return create(rest, params, query)
    } else {
      return null
    }
  }
}

/**
 * @template {any[]} Params
 * @param {StaticSegment} self
 * @param {State<Params>} state
 * @returns {State<Params>}
 */
const format = ({ text }, { params, segments, query }) =>
  create([text, ...segments], params, query)

/**
 * @typedef {import('./interface').Segment} Segment
 *
 * @typedef {Object} SegmentData
 * @property {string} text
 */

/**
 * @template T
 * @typedef {import('./interface').VariableSegment<T>} VariableSegment
 */
/**
 * @template T
 * @typedef {import('./interface').Variable<T>} Variable<T>
 */
/**
 * @template {any[]} Params
 * @typedef {import('./interface').State<Params>} State<Params>
 */
