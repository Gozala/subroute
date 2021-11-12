import { describe, it } from "mocha"
import * as assert from "uvu/assert"
import * as lib from "../src/segment/route.js"
const { route } = lib
describe("template API", () => {
  it("parse single param", () => {
    const r = route`/car/${{ cid: lib.text }}`
    assert.equal(typeof r, "object")
    assert.equal(typeof r.parse, "function")
    assert.equal(typeof r.format, "function")

    assert.throws(() => lib.parsePath(r, { pathname: "" }), Error)

    assert.throws(() => lib.parsePath(r, { pathname: "/car/" }), Error)
    assert.equal(lib.parsePath(r, { pathname: "/car/bafy...hash" }), {
      cid: "bafy...hash",
    })
    assert.throws(
      () => lib.parsePath(r, { pathname: "car/bafy...hash" }),
      Error
    )
  })

  it("format single param", () => {
    const r = route`/car/${{ cid: lib.text }}`
    // @ts-expect-error - Property 'cid' is missing
    assert.equal(lib.format(r, {}).pathname, "/car/undefined")

    // @ts-expect-error - Type 'number' is not assignable to type 'string'.
    assert.equal(lib.format(r, { cid: 1 }).pathname, "/car/1")

    assert.equal(
      lib.format(r, { cid: "bafy...hash" }).pathname,
      "/car/bafy...hash"
    )
  })

  it("allows substitutions", () => {
    const method = "status"
    const r = route`/${method}/${{ cid: lib.text }}`

    assert.throws(() => lib.parsePath(r, { pathname: "" }), Error)
    assert.throws(() => lib.parsePath(r, { pathname: "/status/" }), Error)
    assert.equal(lib.parsePath(r, { pathname: "/status/bafy...hash" }), {
      cid: "bafy...hash",
    })
    assert.throws(
      () => lib.parsePath(r, { pathname: "status/bafy...hash" }),
      Error
    )

    // @ts-expect-error - Property 'cid' is missing
    assert.equal(lib.format(r, {}).pathname, "/status/undefined")

    // @ts-expect-error - Type 'number' is not assignable to type 'string'.
    assert.equal(lib.format(r, { cid: 1 }).pathname, "/status/1")

    assert.equal(
      lib.format(r, { cid: "bafy...hash" }).pathname,
      "/status/bafy...hash"
    )
  })

  it("allow non segment substitutions", () => {
    const user = "gozala"
    const r = lib.route`/@${user}/${{ dir: lib.text }}`

    assert.equal(lib.parsePath(r, { pathname: "/@gozala/home" }), {
      dir: "home",
    })

    const r2 = lib.route`/@${user}${{ dir: lib.text }}`

    assert.equal(lib.parsePath(r2, { pathname: "/@gozalahome" }), {
      dir: "home",
    })
  })
})

describe("method", () => {
  it("test with method", () => {
    const r = lib.POST`/ipfs/${{ cid: lib.text }}`

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
      { cid: "QmHash" }
    )
  })

  it("test without method", () => {
    const r = lib.route`/ipfs/${{ cid: lib.text }}`

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
