import * as Parse from "./api.js"

/**
 * @template C, X, T
 * @param {X} problem
 * @param {object} options
 * @param {number} options.line
 * @param {number} options.column
 * @param {Parse.Located<C>[]} options.context
 * @returns {Parse.Error<C, X>}
 */
export const fail = (problem, options) =>
  new ParseError([new DeadEnd(problem, options)])

/**
 * @template C, T
 * @param {T} value
 * @param {Parse.State<C>} state
 * @returns {Parse.Success<C, T>}
 */
export const succeed = (value, state) => ({ ok: true, value, state })

/**
 * @template C, X
 * @implements {Parse.DeadEnd<C, X>}
 */
class DeadEnd extends SyntaxError {
  /**
   * @param {X} problem
   * @param {object} options
   * @param {number} options.line
   * @param {number} options.column
   * @param {Parse.Located<C>[]} options.context
   */
  constructor(problem, { line, column, context }) {
    super(`Failed to parse`)
    this.problem = problem
    this.line = line
    this.column = column
    this.context = context
  }
}

/**
 * @template C, X
 * @implements {Parse.Error<C, X>}
 */
class ParseError extends SyntaxError {
  /**
   * @param {Parse.Problems<C, X>} problems
   */
  constructor(problems) {
    super("Failed to parse")
    this.error = problems
    /** @type {false} */
    this.ok = false
  }
}
