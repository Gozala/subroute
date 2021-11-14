import * as API from "./format/api.js"

export * from "./format/api.js"
/**
 * @template C, X
 * @template {unknown} T
 * @param {API.Formatter<C, X, T>} formatter
 * @param {T} value
 */
export const format = (formatter, value) => {
  const result = formatter.format({
    value,
    state: {
      pathname: "",
      context: [],
    },
  })

  if (result.ok) {
    return result.value
  } else {
    throw result.error
  }
}
