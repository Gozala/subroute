import { create } from "state"

/**
 * @template T
 * @param {VariableSegment<T>} inner
 * @return {Variable<T>}
 */
export const rest = (inner) => new Rest(inner)

/**
 * @template T
 */
class Rest {
  /**
   * @param {VariableSegment<T>} inner
   */
  constructor(inner) {
    this.inner = inner
  }

  /**
   * @template {any[]} In
   * @param {State<In>} state
   * @returns {?State<[...In, T]>}
   */
  parseSegment(state) {
    return parse(this, state)
  }

  /**
   * @template {any[]} Inn
   * @param {State<[...Inn, T]>} state
   * @returns {State<Inn>}
   */
  formatSegment(state) {
    return format(this, state)
  }

  /**
   * @template {any[]} In
   * @param {State<In>} state
   * @returns {?State<[...In, T]>}
   */
  parseRoute(state) {
    return parse(this, state)
  }

  /**
   * @template {any[]} In
   * @param {State<[...In, T]>} state
   * @returns {State<In>}
   */
  formatRoute(state) {
    return format(this, state)
  }

  /**
   * @template {any[]} In
   * @template {string} Name
   * @param {Name} name
   * @param {State<[...In, T]>} state
   * @returns {?State<[...In, T]>}
   */
  parseQueryParam(name, state) {
    throw 1
  }

  /**
   * @template {any[]} In
   * @template {string} Name
   * @param {Name} name
   * @param {State<[...In, T]>} state
   * @returns {State<In>}
   */
  formatQueryParam(name, state) {
    throw 2
  }
}

/**
 * @template T
 * @template {any[]} In
 * @param {Rest<T>} self
 * @param {State<In>} model
 * @returns {?State<[...In, T]>}
 */
const parse = ({ inner }, { segments, params, query }) => {
  const next = create([segments.join("/")], params, query)
  return inner.parseSegment(next)
}

/**
 * @template T
 * @template {any[]} In
 *
 * @param {Rest<T>} self
 * @param {State<[...In, T]>} state
 * @returns {State<In>}
 */
const format = ({ inner }, state) =>
  // TODO: Do we need to error if more segments are left ?
  inner.formatSegment(state)

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
