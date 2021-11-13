import * as Result from "./result.js"

/**
 * @template X, T
 * @typedef {Result.Result<X, T>} Result
 */

/**
 * @template T
 * @param {T} value
 * @returns {Result.Success<T>}
 */
export const ok = value => ({ ok: true, value })

/**
 * @template X
 * @param {X} error
 * @returns {Result.Failure<X>}
 */
export const error = error => ({ ok: false, error })

/**
 * @template X, T
 * @param {X} failure
 * @param {T|null|undefined} maybe
 * @returns {Result.Result<X, T>}
 */
export const fromMaybe = (failure, maybe) => {
  switch (maybe) {
    case null:
    case undefined:
      return error(failure)
    default:
      return ok(maybe)
  }
}
