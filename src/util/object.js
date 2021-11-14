/**
 * @template {PropertyKey} Key
 * @template Value
 * @param {Key} key
 * @param {Value} value
 */
export const row = (key, value) =>
  /** @type {{[K in Key]: Value}} */ ({ [key]: value })
