// @ts-check

import * as Bag from "./bag.js"

/**
 * @type {Bag.Empty}
 */
export const empty = {
  type: "Empty",
}

/**
 * @template T
 * @param {Bag.Bag<T>} left
 * @param {T} right
 * @returns {Bag.Bag<T>}
 */
export const addRight = (left, right) => ({
  type: "AddRight",
  left,
  right,
})

/**
 * @template T
 * @param {Bag.Bag<T>} left
 * @param {Bag.Bag<T>} right
 * @returns {Bag.Bag<T>}
 */
export const append = (left, right) => ({
  type: "Append",
  left,
  right,
})

/**
 * @template T
 * @param {T} item
 * @returns {Bag.Bag<T>}
 */
export const of = item => addRight(empty, item)

/**
 * @template T
 * @param {Bag.Bag<T>} bag
 * @returns {T[]}
 */
export const toArray = bag => {
  const bags = [bag]
  const items = []
  while (bags.length > 0) {
    const bag = /** @type {Bag.Bag<T>} */ (bags.shift())
    switch (bag.type) {
      case "Empty":
        break
      case "AddRight": {
        bags.unshift(bag.left)
        items.unshift(bag.right)
        break
      }
      case "Append": {
        bags.unshift(bag.left, bag.right)
        break
      }
    }
  }
  return items
}
