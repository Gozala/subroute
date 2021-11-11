import { describe, it } from "mocha"
import * as assert from "uvu/assert"
// import * as lib from "typed-router.ts"
// import { route } from "typed-router.ts"
// describe("template API", () => {
//   it("parse single param", () => {
//     const r = route`/car/${lib.text("cid")}`
//     assert.equal(typeof r, "object")
//     assert.equal(typeof r.parseRoute, "function")
//     assert.equal(typeof r.formatRoute, "function")

//     assert.equal(lib.parsePath(r, { pathname: "" }), null)
//     assert.equal(lib.parsePath(r, { pathname: "/car/" }), null)
//     assert.equal(lib.parsePath(r, { pathname: "/car/bafy...hash" }), {
//       cid: "bafy...hash",
//     })
//     assert.equal(lib.parsePath(r, { pathname: "car/bafy...hash" }), null)
//   })

//   it("format single param", () => {
//     const r = route`/car/${lib.text("cid")}`
//     // @ts-expect-error - Property 'cid' is missing
//     assert.equal(lib.format(r, {}).pathname, "/car/undefined")

//     // @ts-expect-error - Type 'number' is not assignable to type 'string'.
//     assert.equal(lib.format(r, { cid: 1 }).pathname, "/car/1")

//     assert.equal(
//       lib.format(r, { cid: "bafy...hash" }).pathname,
//       "/car/bafy...hash"
//     )
//   })

//   it("allows substitutions", () => {
//     const method = "status"
//     const r = route`/${method}/${lib.text("cid")}`

//     assert.equal(lib.parsePath(r, { pathname: "" }), null)
//     assert.equal(lib.parsePath(r, { pathname: "/status/" }), null)
//     assert.equal(lib.parsePath(r, { pathname: "/status/bafy...hash" }), {
//       cid: "bafy...hash",
//     })
//     assert.equal(lib.parsePath(r, { pathname: "status/bafy...hash" }), null)

//     // @ts-expect-error - Property 'cid' is missing
//     assert.equal(lib.format(r, {}).pathname, "/status/undefined")

//     // @ts-expect-error - Type 'number' is not assignable to type 'string'.
//     assert.equal(lib.format(r, { cid: 1 }).pathname, "/status/1")

//     assert.equal(
//       lib.format(r, { cid: "bafy...hash" }).pathname,
//       "/status/bafy...hash"
//     )
//   })

//   it("allow non segment substitutions", () => {
//     const user = "gozala"
//     const r = lib.route`/@${user}/${lib.text("dir")}`

//     assert.equal(lib.parsePath(r, { pathname: "/@gozala/home" }), {
//       dir: "home",
//     })
//   })
// })

// describe("method", () => {
//   it("test with method", () => {
//     const r = lib.routeWithMethod`POST /ipfs/${lib.text("cid")}`

//     assert.equal(
//       lib.parseRequest(r, {
//         method: "GET",
//         url: "https://ipfs.io/ipfs/QmHash",
//       }),
//       null
//     )

//     assert.equal(
//       lib.parseRequest(r, {
//         method: "POST",
//         url: "https://ipfs.io/ipfs/QmHash",
//       }),
//       { cid: "QmHash" }
//     )
//   })

//   it("test without method", () => {
//     const r = lib.routeWithMethod`/ipfs/${lib.text("cid")}`

//     assert.equal(
//       lib.parseRequest(r, {
//         method: "GET",
//         url: "https://ipfs.io/ipfs/QmHash",
//       }),
//       { cid: "QmHash" }
//     )

//     assert.equal(
//       lib.parseRequest(r, {
//         method: "POST",
//         url: "https://ipfs.io/ipfs/QmHash",
//       }),
//       { cid: "QmHash" }
//     )
//   })
// })
