# Notes

## Steps to reproduce

1. Clone the repository and open a Node.js REPL or script.
2. Run `const http = require('http');` and check `http.serve` — it is `undefined`.
3. Try to write a Fetch-contract HTTP handler using only the built-in `http` module:
   ```js
   http.serve(async (req) => new Response('hello'));
   // TypeError: http.serve is not a function
   ```
4. Compare with Deno (`Deno.serve`) or Bun (`Bun.serve`), which both accept a
   `(Request) => Response | Promise<Response>` handler and start listening immediately.
5. Observe that in Node.js, developers must manually wire `http.createServer`,
   collect the body stream, construct a `Request` object, and write the `Response`
   back — all boilerplate that other runtimes hide behind a single `serve()` call.

## Observed

`http.serve` does not exist in Node.js prior to this change.  Calling it throws:

```
TypeError: http.serve is not a function
```

No built-in API bridges Node's legacy `IncomingMessage`/`ServerResponse` world
with the modern `Request`/`Response` Fetch API, even though `globalThis.Request`,
`globalThis.Response`, and `globalThis.fetch` are all available in Node ≥ 18.

## Expected

`http.serve(handler, options?)` should be available and should:

- Accept a handler of the form `(request: Request) => Response | Promise<Response>`.
- Accept an optional options object with `port` (default `0`), `host`
  (default `'localhost'`), and `signal` (an `AbortSignal` that stops the server).
- Return the underlying `http.Server` instance so callers can inspect
  `server.address()` or attach additional event listeners.
- Automatically convert the incoming `IncomingMessage` to a Fetch `Request`
  (including reading the body for non-GET/HEAD methods) and write the returned
  `Fetch Response` back as an HTTP response — matching the developer experience
  of `Deno.serve` and `Bun.serve`.
