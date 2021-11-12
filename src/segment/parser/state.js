import { column } from "../../parse.js"
import * as Parse from "./api.js"

/**
 * @template C
 * @template {Partial<Parse.State<C>>} Input
 * @param {{ source: string } & Input} input
 * @returns {Parse.State<C>}
 */
export const from = ({
  offset = 0,
  line = 1,
  column = 1,
  source,
  method,
  headers,
  params,
  context = [],
}) => ({
  source,
  method,
  headers,
  params,
  context,
  offset,
  line,
  column,
})

/**
 * @template C
 * @param {Parse.State<C>} state
 * @param {number} offset
 * @returns {Parse.State<C>}
 */
export const bumpOffset = (state, offset) => ({
  ...state,
  offset,
  column: state.column + (offset - state.offset),
})
