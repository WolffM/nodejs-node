'use strict';

const common = require('../common');
const assert = require('assert');
const http = require('http');

// Verify that http.serve is exported.
assert.strictEqual(typeof http.serve, 'function');

// http.serve() should throw if the handler is not a function.
assert.throws(() => http.serve('not-a-function'), {
  code: 'ERR_INVALID_ARG_TYPE',
});

// http.serve() should throw if options is not an object.
assert.throws(() => http.serve(() => {}, 'bad-options'), {
  code: 'ERR_INVALID_ARG_TYPE',
});

// Basic GET – handler returns a plain text Response.
{
  const server = http.serve(
    common.mustCall(async (req) => {
      assert.strictEqual(req.method, 'GET');
      assert.match(req.url, /\/hello/);
      return new Response('world', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      });
    }),
    { port: 0, host: '127.0.0.1' },
  );

  server.on('listening', common.mustCall(async () => {
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}/hello`);
    assert.strictEqual(res.status, 200);
    const body = await res.text();
    assert.strictEqual(body, 'world');
    assert.strictEqual(res.headers.get('content-type'), 'text/plain');
    server.close();
  }));
}

// POST – handler can read the request body.
{
  const server = http.serve(
    common.mustCall(async (req) => {
      assert.strictEqual(req.method, 'POST');
      const text = await req.text();
      assert.strictEqual(text, 'ping');
      return new Response('pong', { status: 201 });
    }),
    { port: 0, host: '127.0.0.1' },
  );

  server.on('listening', common.mustCall(async () => {
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}/echo`, {
      method: 'POST',
      body: 'ping',
    });
    assert.strictEqual(res.status, 201);
    const body = await res.text();
    assert.strictEqual(body, 'pong');
    server.close();
  }));
}

// AbortSignal – server should close when the signal is aborted.
{
  const ac = new AbortController();

  const server = http.serve(
    () => new Response('ok'),
    { port: 0, host: '127.0.0.1', signal: ac.signal },
  );

  server.on('listening', common.mustCall(() => {
    server.on('close', common.mustCall());
    ac.abort();
  }));
}
