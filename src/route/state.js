import * as API from "./api.js"

/**
 * @template T
 * @param {string[]} segments
 * @param {T} params
 * @param {Query} query
 * @returns {API.ParseState<T>}
 */
export const create = (segments, params, query) =>
  new ParseState(segments, params, query)

/**
 * @param {string[]} segments
 * @param {Query} query
 * @returns {API.ParseState<{}>}
 */
export const empty = (segments, query) => new ParseState(segments, {}, query)

/**
 * @template T
 */
class ParseState {
  /**
   * @param {string[]} segments
   * @param {T} params
   * @param {Query} query
   */
  constructor(segments, params, query) {
    this.segments = segments
    this.params = params
    this.query = query
  }
}

/**
 * @typedef {import("./interface").Query} Query
 */
/**
 * @template {any[]} Params
 * @typedef {import("./interface").State<Params>} State
 */
