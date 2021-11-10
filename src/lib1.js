import * as API from "./api.js"
import * as Float from "./data/float.js"
import * as Int from "./data/int.js"
import * as Text from "./data/string.js"
import { param } from "./route.js"

// /**
//  * @returns {API.SegmentReader<{}>}
//  */
// export const route =
//   () =>
//   /**
//    * @template {Object} Params
//    * @param {TemplateStringsArray} strings
//    * @returns {API.ParamReader<Params>}
//    */
//   strings => {}

/**
 * @template {string[]} Variants
 * @param {Variants} variants
 */
export const variant =
  (...variants) =>
  /**
   * @template {string} Name
   * @param {Name} name
   * @returns {API.NamedParam<Name, API.UnionOf<Variants>>}
   */
  name =>
    new Variant(name, variants)

/**
 * @template {string} Name
 * @param {Name} name
 * @returns {API.NamedParam<Name, Float.float>}
 */
export const float = name => ({ ...Float, name })

/**
 * @template {string} Name
 * @param {Name} name
 * @returns {API.NamedParam<Name, Int.int>}
 */
export const int = name => ({ ...Int, name })

/**
 * @template {string} Name
 * @param {Name} name
 * @returns {API.NamedParam<Name, string>}
 */
export const text = name => ({ ...Text, name })

/**
 * @template {unknown} T
 * @param {API.ParamBuilder<T>} value
 * @returns {API.ParamBuilder<Record<string, T>>}
 */
export const dict = value => name => new Dict(name, value)

/**
 * @template {string} Name
 * @template {string[]} Variants
 */
class Variant {
  /**
   *
   * @param {Name} name
   * @param {Variants} variants
   */
  constructor(name, variants) {
    this.name = name
    /** @type {Record<string, API.UnionOf<Variants>>} */
    this.variants = {}
    for (const variant of variants) {
      this.variants[variant] = /** @type {API.UnionOf<Variants>} */ (variant)
    }
  }

  /**
   * @param {string} input
   */
  parse(input) {
    const match = this.variants[input]
    return match || null
  }
  /**
   * @param {API.UnionOf<Variants>} value
   * @returns {string}
   */
  format(value) {
    return String(value)
  }
}

/**
 * @template {string} Name
 * @implements {API.NamedParam<Name, never>}
 */
class Segment {
  /**
   * @param {Name} name
   */
  constructor(name) {
    this.name = name
  }

  /**
   *
   * @param {string} input
   */
  parse(input) {
    if (input === this.name) {
      return null
    } else {
      throw new Error("Does not match")
    }
  }

  /**
   *
   * @param {never} value
   */
  format(value) {
    return this.name
  }
}

/**
 * @template {unknown} T
 * @template {string} Name
 * @implements {API.NamedParam<Name, Record<string, T>>}
 */
class Dict {
  /**
   *
   * @param {Name} name
   * @param {API.ParamBuilder<T>} value
   */
  constructor(name, value) {
    this.name = name
    this.value = value
  }
  /**
   *
   * @param {string} input
   * @returns {Record<string, T>|null}
   */
  parse(input) {
    return null
  }
  /**
   * @param {Record<string, T>} data
   * @returns {string}
   */
  format(data) {
    const entries = Object.entries(data)
    const rows = entries.map(([k, v]) => `${k}: ${this.value(k).format(v)}`)
    return `{${rows.join(",")}}`
  }
}

/**
 * @template {TemplateStringsArray} T
 * @template {API.NamedParam<string, unknown>[]} Params
 * @param {T} strings
 * @param  {Params} params
 * @returns {API.Route<API.Build<{}, Params>>}
 */
const route = (strings, ...params) => {
  const segments = []
  const offset = 0
  while (offset < strings.length) {
    const part = strings[0]
    segments.push(new Segment(part))
    if (offset < params.length) {
      segments.push(params[offset])
    }
  }
  return new Route(segments)
}

/**
 * @template {unknown} V
 * @template {string} K
 * @template {API.NamedParam<K, V>[]} Params
 * @template {API.Build<{}, Params>} T
 * @implements {API.Route<T>}
 */
class Route {
  /**
   * @param {Params} segments
   */
  constructor(segments) {
    this.segments = segments
  }
  /**
   * @param {string} input
   * @returns {T}
   */
  parse(input) {
    const result = /** @type {{[key in K]: V}} */ ({})
    for (const segment of this.segments) {
      const value = segment.parse(input)
      if (value != null) {
        result[segment.name] = value
      }
    }

    return /** @type {T} */ (result)
  }
  /**
   *
   * @param {string} input
   */
  tryParse(input) {
    try {
      return this.parse(input)
    } catch (error) {
      return null
    }
  }
}
