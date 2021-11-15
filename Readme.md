# subroute

This is library for type safe routing that addressing two primary concerns:

1. Parsing

   Type safe parseing of routes - Extracting (typed) parameters so that type
   checker is able to report any missuse.

2. Linking / Formatting

   Type safe formating of hyper links - Type checker is able to report if any
   parameter is missing or mistyped.

## The problem

Here is a simlpe example that uses a routing system of [Express][express routing] web framework for [Node.js][]:

> **Disclaimer:** There is no intention to diminish or crticize [Express][], it's an excellent library. As a matter of fact pointed out shortcomings are shortcomings of an untyped nature of JS, which is what [Express][] is tailored for.
>
> That being said, raising popularity of [TypeScript][] provides new opportunities and there is no better way to illustrate them than to compare it to an established solution.

```js
const express = require("express")
const app = express()

app.get("/", (request, response) => {
  response.send(`<a href='/calculator/313/+/3'>Calculate 313 + 3</a>`)
})

app.get("/calculator/:a/+/:b", (request, response) => {
  const { a, b } = request.params
  response.send(`${parseFloat(a) + parseFloat(b)}\n`)
})
```

> **Note:** [Express][] does not actually allow `/+/` path segments, and you would have to use `/plus/` instead, but for the sake of this example lets prentend it does

#### Parsing

There are multiple issues with this approach, that can lead to mistakes which can sneak into production:

- Handling of parameters in routes is too repetitive.

  Declaring a route parameter requires choose a name, which you must later repeat to get it from `request.params`. Mistyping the name of the parameter is a mistake which is not caught by the type checker (even if used). It is just too easy to make changes which would update names in some places and not other causing program to misbehave.

- Request handler needs to parse route parameters.

  All parameter values are passed as strings to a handler, which then needs to be parsed, handling all possible edge cases (In our example `/calculator/313/+/bob` would respond with `NaN` :)

#### Linking

Even if we manage to keep parameter nameing in sync across the code base and excell at parsing their values, there still more that could go wrong:

- Route changes affect hyper links.

  Let's say we had to switch to prefix notation for our calculator and switched from URLs like `/calculator/313/+/3` to `/calculator/plus/313/3` it's just too easy to forget to update a link in our `/` route.

## Solution

```js
import { GET, int, format } from "subroute"
import express from "express"

const example = { a: 313, b: 3 }

const index = GET`/`(() =>
  `<a href='${format(calc.route, example)}'>
    Calculate ${example.a} + ${example.b}
  </a>`)
)

const calc = GET`/calculator/${{ a: int }}/+/${{ b: int }}`(({ a, b }) =>
  `${a + b}`
)

const router = index.or(caluclator)

const app = express()
app.use((request, response) => {
  const result = router.handle(request)
  response.send(result)
})
```

Presented solution attempts to illustrate building blocks that can be used for:

1. Parsing route parameters in a type safe way.

   Type checker that route handler expects parameters that were parsed.

2. Format hyper-links in type safe way.

   Links are formated by calling `format(calc, {a:313, b:3})` on a route
   allowing type checker to report any missmatch in type or number of
   parameters passed.

This elliminates all of the problems pointed out with original example:

- No way to mistype parameter names, at least not without type checker reporting
  that as an error.
- No need to parse route parameters as our routes are typed parsers already.

  > **Note:** Route as presented in the example won't match `/calculator/313/+/bob` since `bob` is not an `int`).

- Route changes will not break links.

  Links are formatted from the routes themselves, so if number or order of
  parameters changes type checker will be at your service and tell you all the
  places you need to update. For example if we update our routing to prefix
  notation only our route definition will change & all the links will continue
  to work as expected:

  ```diff
  - const calc = route`/calculator/${{ a: int }}/+/${{ b: int }}`(
  + const calc = route`/calculator/plus/${{ a: int }}/${{ b: int }}`(
  ```

## Prior Art

This was initially inspired by [url-parser][url-parser.elm] package [Elm][]
library, but later on moved towards the [type safe routing][routing spock]
approach used in [Spock][] - A lightweight [Haskell][] web framework. Both are
great source of inspiration for this work.

[haskell]: https://www.haskell.org/
[routing spock]: https://www.spock.li/2015/04/19/type-safe_routing.html
[spock]: https://www.spock.li/
[url-parser.elm]: http://package.elm-lang.org/packages/evancz/url-parser/latest/UrlParser
[elm]: http://elm-lang.org/
[node url]: https://nodejs.org/dist/latest-v8.x/docs/api/url.html#url_class_url
[location]: https://developer.mozilla.org/en-US/docs/Web/API/Location
[opquae type alias]: https://flow.org/en/docs/types/opaque-types/
[float.flow]: https://www.npmjs.com/package/float.flow
[integer.flow]: https://www.npmjs.com/package/integer.flow
[query parameters]: #query_parameters
[function subtyping]: https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/#function-subtyping
[express]: https://expressjs.com/
[express routing]: https://expressjs.com/en/guide/routing.html
[node.js]: https://nodejs.org/en/
[flow]: http://flow.org/
[typescript]: http://typescriptlang.org/
