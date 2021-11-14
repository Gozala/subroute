import { describe, it, assert } from "./test.js"
import * as lib from "../src/lib.js"

const { route } = lib
describe("template API", () => {
  it("parse single param", () => {
    const r = route`/car/${{ cid: lib.text }}`(input => input.cid)

    assert.equal(typeof r, "object")
    assert.equal(typeof r.parse, "function")
    assert.equal(typeof r.or, "function")

    assert.throws(() => lib.parsePath(r, { pathname: "" }), Error)

    assert.throws(() => lib.parsePath(r, { pathname: "/car/" }), Error)
    assert.equal(
      lib.parsePath(r, { pathname: "/car/bafy...hash" }),
      "bafy...hash"
    )
    assert.throws(
      () => lib.parsePath(r, { pathname: "car/bafy...hash" }),
      Error
    )
  })

  it("allows substitutions", () => {
    const method = "status"
    const r = route`/${method}/${{ cid: lib.text }}`(data => [data.cid])

    assert.throws(() => lib.parsePath(r, { pathname: "" }), Error)
    assert.throws(() => lib.parsePath(r, { pathname: "/status/" }), Error)
    assert.equal(lib.parsePath(r, { pathname: "/status/bafy...hash" }), [
      "bafy...hash",
    ])
    assert.throws(
      () => lib.parsePath(r, { pathname: "status/bafy...hash" }),
      Error
    )
  })

  it("allow non segment substitutions", () => {
    const user = "gozala"
    const r = lib.route`/@${user}/${{ dir: lib.text }}`(data => ({
      home: `~/${data.dir}`,
    }))

    const out = lib.parsePath(r, { pathname: "/@gozala/home" })
    // ts inference works here
    assert.equal(out.home, "~/home")
    assert.equal(out, { home: "~/home" })

    const r2 = lib.route`/@${user}${{ dir: lib.text }}`(data => data.dir)

    assert.equal(lib.parsePath(r2, { pathname: "/@gozalahome" }), "home")
  })
})

describe("method", () => {
  it("test with method", () => {
    const r = lib.POST`/ipfs/${{ cid: lib.text }}`(data => ({
      url: `ipfs://${data.cid}`,
    }))

    assert.throws(
      () =>
        lib.parseRequest(r, {
          method: "GET",
          url: "https://ipfs.io/ipfs/QmHash",
        }),
      Error
    )

    assert.equal(
      lib.parseRequest(r, {
        method: "POST",
        url: "https://ipfs.io/ipfs/QmHash",
      }),
      { url: "ipfs://QmHash" }
    )
  })

  it("test without method", () => {
    const r = lib.route`/ipfs/${{ cid: lib.text }}`(data => data)

    assert.equal(
      lib.parseRequest(r, {
        method: "GET",
        url: "https://ipfs.io/ipfs/QmHash",
      }),
      { cid: "QmHash" }
    )

    assert.equal(
      lib.parseRequest(r, {
        method: "POST",
        url: "https://ipfs.io/ipfs/QmHash",
      }),
      { cid: "QmHash" }
    )
  })
})

describe("or combinator", () => {
  const post = lib.POST`/car/${{ cid: lib.text }}`(
    data => `write ${JSON.stringify(data)}`
  )
  const get = lib.GET`/car/${{ cid: lib.text }}`(
    data => `read ${JSON.stringify(data)}`
  )
  const stat = lib.GET`/stat/${{ cid: lib.text }}`(
    data => `stat ${JSON.stringify(data)}`
  )

  const any = lib.route`${{ path: lib.rest() }}`(
    data => `fallback ${JSON.stringify(data)}`
  )

  it("will not match without method", () => {
    assert.throws(
      () =>
        lib.parseRequest(post.or(get).or(stat), {
          url: "https://web3.storage/car/bafy_hash",
        }),
      Error,
      "No method will match"
    )
  })

  it("mathes by method and route", () => {
    assert.equal(
      lib.parseRequest(post.or(get).or(stat), {
        url: "https://web3.storage/car/bafy_hash",
        method: "GET",
      }),
      `read {"cid":"bafy_hash"}`,
      "matched by a GET method"
    )

    assert.equal(
      lib.parseRequest(post.or(get).or(stat), {
        url: "https://web3.storage/car/bafy_hash",
        method: "POST",
      }),
      `write {"cid":"bafy_hash"}`,
      "matched by a POST method"
    )
  })

  it("does not match wrong method", () => {
    assert.throws(
      () =>
        lib.parseRequest(post.or(get).or(stat), {
          url: "https://web3.storage/car/bafy_hash",
          method: "PUT",
        }),
      Error,
      "Has no route for PUT method"
    )
  })

  it("can match no method", () => {
    assert.equal(
      lib.parseRequest(post.or(get).or(stat).or(any), {
        url: "https://web3.storage/car/bafy_hash",
      }),
      `fallback {"path":"/car/bafy_hash"}`
    )
  })

  it("can match any method", () => {
    assert.equal(
      lib.parseRequest(post.or(get).or(stat).or(any), {
        method: "HEAD",
        url: "https://web3.storage/car/bafy_hash",
      }),
      `fallback {"path":"/car/bafy_hash"}`
    )
  })

  it("can match any pathname", () => {
    assert.equal(
      lib.parseRequest(post.or(get).or(stat).or(any), {
        url: "https://web3.storage/boom/bot/cook",
      }),
      `fallback {"path":"/boom/bot/cook"}`
    )
  })
})

describe.only("non separator based matches", () => {
  it("can use arbitrary delimiters", () => {
    const plus = lib.route`/calc/${{ x: lib.int }}+${{ y: lib.int }}/`(
      ({ x, y }) => x + y
    )

    const minus = lib.route`/calc/${{ x: lib.int }}-${{ y: lib.int }}/`(
      ({ x, y }) => x - y
    )
    const calc = plus.or(minus)

    assert.equal(lib.parsePath(calc, { pathname: "/calc/3+2/" }), 5)
    assert.equal(lib.parsePath(calc, { pathname: "/calc/7-4/" }), 3)
  })

  it("throws if no delimiters are preset", () => {
    assert.throws(
      () =>
        lib.route`/${{ x: lib.int }}${{ op: lib.text }}${{ y: lib.int }}`(
          data => data
        ),
      SyntaxError
    )
  })

  it("doesn't throw on bound matchers", () => {
    const op = lib.enumerate("+", "-", "*")
    const r = lib.route`/calc/${{ x: lib.int }}${{ op }}${{ y: lib.int }}`(
      ({ x, y, op }) => {
        switch (op) {
          case "+":
            return x + y
          case "-":
            return x - y
          case "*":
            return x * y
        }
      }
    )

    assert.equal(lib.parsePath(r, { pathname: "/calc/3+2/" }), 5)
    assert.equal(lib.parsePath(r, { pathname: "/calc/7-4/" }), 3)
    assert.equal(lib.parsePath(r, { pathname: "/calc/3*5/" }), 15)
  })
})
