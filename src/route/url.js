/**
 * Parses URL pathname into segments delimeted by `/` character.
 *
 * @param {string} pathname
 * @returns {string[]} 
 */
export const parsePathname = pathname => pathname.split("/")

/**
 * Serailzes URL pathname segments into a pathname by delimiting them with `/`
 * character.
 *
 * @param {string[]} segments
 * @returns {string}
 */
export const formatPathname = (segments) => {
  switch (segments.length) {
    case 0:
      return ""
    case 1:
      if (segments[0] === "") {
        return "/"
      } else {
        return segments.join("/")
      }
    default:
      return segments.join("/")
  }
}

/**
 * Parses URL `search` field which assumes leading `?` character. 
 *
 * @param {string} input
 * @returns {Query}
 */
export const parseSearch = (input) => parseQuery(input.slice(1))

/**
 * @param {Query} params
 * @returns {string}
 */
export const formatSearch = (params) => {
  const query = formatQuery(params)
  return query === "" ? "" : `?${query}`
}


/**
 * Parses URL query parameters string which assumes no loading
 * `?` character.
 * 
 * @param {string} input 
 * @returns {Query}
 */
export const parseQuery = (input) =>
  input.split("&").reduce((query, segment) => {
    const index = segment.indexOf("=")
    const [key, value] = index >= 0
      ? [segment.slice(0, index), segment.slice(index + 1)]
      : [segment, ""]

    query[decodeURIComponent(key)] = decodeURIComponent(value)
    return query
  }, Object.create(null))

/**
 * Formats Query into string.
 *
 * @param {Query} query
 * @returns {string}
 */
export const formatQuery = (query) => {
  let result = ""
  for (const [key, value] of Object.entries(query)) {
    if (value === "") {
      result += `&${encodeURIComponent(key)}`
    } else {
      result += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    }
  }

  return result.slice(1)
}


/**
 * @param {string[]} path
 * @param {Query} [query]
 * @param {string} [hash]
 * @returns {URL}
 */
export const formatURL = (path, query, hash) =>
  new FormattedURL(
    formatPathname(path),
    query == null ? "" : formatSearch(query),
    (hash == "" || hash == null) ? "" : hash[0] === "#" ? hash : `#${hash}`
  )

class FormattedURL {
  /**
   * @param {string} pathname 
   * @param {string} search
   * @param {string} hash 
   */
  constructor(pathname, search, hash) {
    this.pathname = pathname
    this.search = search
    this.hash = hash
  }
  toString() {
    return `${this.pathname}${this.hash}${this.search}`
  }
}

/**
 * @typedef {import('./interface').URL} URL
 * @typedef {import('./interface').Query} Query
 */
