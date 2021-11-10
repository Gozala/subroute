import { route, text, parsePath } from "./lib.js"

const read = route`/car/${text("cid")}`
