/**
 * @template {any[]} Params
 * @param {string[]} segments
 * @param {Params} params
 * @param {Query} query
 * @returns {State<Params>}
 */
export const create = (segments, params, query) =>
  new Model(segments, params, query)

/**
 * @param {string[]} segments
 * @param {Query} query
 * @returns {State<[]>}
 */
export const empty = (segments, query) => new Model(segments, [], query)

/**
 * @template {any[]} Params
 */
class Model {
  /**
   * @param {string[]} segments
   * @param {Params} params
   * @param {Query} query
   */
  constructor(segments, params, query) {
    this.segments = segments
    this.params = params
    this.query = query
  }
}

/**
 * @typedef {import("./route/interface").Query} Query
 */
/**
 * @template {any[]} Params
 * @typedef {import("./interface").State<Params>} State
 */
