import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer, request } from "node:http";
import { connect } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { startObservationServer } from "./server.mjs";

const fixture = {
  provenance: "SYNTHETIC_TEST_ONLY",
  title: '<script>alert("x")</script>',
  columns: ["Name", "<img src=x>"],
  rows: [["Fake & only", "'quoted'"]],
};

async function setup(t, value = fixture) {
  const dir = await mkdtemp(join(tmpdir(), "observation-test-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const fixturePath = join(dir, "fixture.json");
  await writeFile(fixturePath, JSON.stringify(value));
  return { fixturePath, dir };
}

async function running(t) {
  const paths = await setup(t);
  const harness = await startObservationServer(paths);
  t.after(
    () =>
      new Promise((resolve, reject) => {
        harness.server.closeAllConnections();
        harness.server.close((error) => (error ? reject(error) : resolve()));
      }),
  );
  return { ...paths, ...harness };
}

function get(origin, path = "/", method = "GET") {
  return new Promise((resolve, reject) => {
    const req = request(`${origin}${path}`, { method, agent: false }, (res) => {
      const parts = [];
      res.on("data", (part) => parts.push(part));
      res.on("end", () =>
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(parts).toString(),
        }),
      );
      res.on("error", reject);
    });
    req.on("error", reject);
    req.end();
  });
}

function raw(origin, message) {
  return new Promise((resolve, reject) => {
    const socket = connect({
      host: "127.0.0.1",
      port: Number(new URL(origin).port),
    });
    const parts = [];
    socket.setTimeout(2500, () => {
      socket.destroy();
      reject(new Error("socket did not close"));
    });
    socket.on("connect", () => socket.write(message));
    socket.on("data", (part) => parts.push(part));
    socket.on("error", reject);
    socket.on("end", () => resolve(Buffer.concat(parts).toString()));
  });
}

function denied(response) {
  assert.match(response, /^HTTP\/1\.1 (?:400|403|404|405|413|417|431) /);
  assert.doesNotMatch(response, /SYNTHETIC_TEST_ONLY|Fake &amp;/);
}

async function rejectsStartup(options) {
  await assert.rejects(async () => {
    const unexpected = await startObservationServer(options);
    await new Promise((resolve) => unexpected.server.close(resolve));
  });
}

test("GET/HEAD expose deterministic synthetic bytes, digest and inert escaped HTML", async (t) => {
  const h = await running(t);
  assert.match(h.origin, /^http:\/\/127\.0\.0\.1:\d+$/);
  const data = await get(h.origin, "/fixture.json");
  assert.equal(data.status, 200);
  assert.deepEqual(JSON.parse(data.body), fixture);
  assert.equal(h.digest, createHash("sha256").update(data.body).digest("hex"));
  const html = await get(h.origin);
  assert.equal(html.status, 200);
  assert.match(html.body, /SYNTHETIC_TEST_ONLY/);
  assert.match(
    html.body,
    /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/,
  );
  assert.match(html.body, /&lt;img src=x&gt;/);
  assert.match(html.body, /Fake &amp; only/);
  assert.match(html.body, /&#39;quoted&#39;/);
  assert.doesNotMatch(html.body, /<script|<img|<iframe|<form/i);
  for (const path of ["/", "/fixture.json"]) {
    const a = await get(h.origin, path);
    const b = await get(h.origin, path);
    const head = await get(h.origin, path, "HEAD");
    assert.equal(a.body, b.body);
    assert.equal(head.status, 200);
    assert.equal(head.body, "");
    assert.equal(
      head.headers["content-length"],
      String(Buffer.byteLength(a.body)),
    );
    assert.equal(a.headers["cache-control"], "no-store");
    assert.equal(a.headers["x-content-type-options"], "nosniff");
    assert.equal(a.headers["referrer-policy"], "no-referrer");
    for (const directive of [
      "default-src 'none'",
      "script-src 'none'",
      "connect-src 'none'",
      "form-action 'none'",
      "base-uri 'none'",
      "object-src 'none'",
      "frame-src 'none'",
      "sandbox",
    ]) {
      assert.ok(
        a.headers["content-security-policy"]
          .split(";")
          .map((v) => v.trim())
          .includes(directive),
      );
    }
    assert.equal(a.headers["set-cookie"], undefined);
    assert.equal(a.headers["access-control-allow-origin"], undefined);
  }
});

test("file replacement and removal cannot change the startup snapshot", async (t) => {
  const h = await running(t);
  const before = await get(h.origin, "/fixture.json");
  await writeFile(h.fixturePath, "{broken");
  assert.equal((await get(h.origin, "/fixture.json")).body, before.body);
  await rm(h.fixturePath);
  assert.equal((await get(h.origin, "/fixture.json")).body, before.body);
});

test("rejects malformed, non-synthetic, unknown, inconsistent and oversized fixtures before listening", async (t) => {
  const { fixturePath, dir } = await setup(t);
  const invalid = [
    null,
    [],
    {},
    { ...fixture, provenance: "PROVIDER" },
    { ...fixture, extra: true },
    { ...fixture, title: 1 },
    { ...fixture, title: "x".repeat(501) },
    { ...fixture, columns: ["x".repeat(501)] },
    { ...fixture, columns: Array(21).fill("x") },
    { ...fixture, rows: Array(101).fill(["x", "y"]) },
    { ...fixture, rows: [["x"]] },
    { ...fixture, rows: [[1, "y"]] },
    { ...fixture, rows: [["x".repeat(501), "y"]] },
    { ...fixture, rows: "bad" },
    { ...fixture, columns: "bad" },
  ];
  for (const value of invalid) {
    await writeFile(fixturePath, JSON.stringify(value));
    await rejectsStartup({ fixturePath });
  }
  for (const bytes of ["{broken", " ".repeat(65537), ""]) {
    await writeFile(fixturePath, bytes);
    await rejectsStartup({ fixturePath });
  }
  await rejectsStartup({ fixturePath: dir });
  await rejectsStartup({ fixturePath: join(dir, "missing") });
});

test("allows a fixture at the documented string/row/column limits", async (t) => {
  const value = {
    provenance: "SYNTHETIC_TEST_ONLY",
    title: "x".repeat(500),
    columns: Array(20).fill("x"),
    rows: Array.from({ length: 100 }, () => Array(20).fill("x")),
  };
  const { fixturePath } = await setup(t, value);
  const h = await startObservationServer({ fixturePath });
  t.after(() => new Promise((resolve) => h.server.close(resolve)));
  assert.deepEqual(
    JSON.parse((await get(h.origin, "/fixture.json")).body),
    value,
  );
});

test("rejects forbidden targets, methods, Host/proxy headers, bodies and protocol switches without forwarding", async (t) => {
  let canaryHits = 0;
  const canary = createServer((_req, res) => {
    canaryHits++;
    res.end("canary");
  });
  await new Promise((resolve) => canary.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => canary.close(resolve)));
  const canaryOrigin = `http://127.0.0.1:${canary.address().port}`;
  const h = await running(t);
  const host = new URL(h.origin).host;
  const send = (line, headers = "", tail = "") =>
    raw(
      h.origin,
      `${line} HTTP/1.1\r\nHost: ${host}\r\nConnection: close\r\n${headers}\r\n${tail}`,
    );
  for (const path of [
    "/missing",
    "/favicon.ico",
    "/?x=1",
    "/fixture.json?",
    "/%2e%2e/secret",
    "/../secret",
    "//example.invalid/",
    `${canaryOrigin}/probe`,
    "/fixture.json#x",
    "/fixture.json/",
  ]) {
    denied(await send(`GET ${path}`));
  }
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS", "TRACE"])
    denied(await send(`${method} /`));
  for (const foreign of [
    "example.invalid",
    "localhost",
    `127.0.0.2:${new URL(h.origin).port}`,
    `${host}.evil`,
    `user@${host}`,
    "127.0.0.1:1",
  ]) {
    denied(
      await raw(
        h.origin,
        `GET / HTTP/1.1\r\nHost: ${foreign}\r\nConnection: close\r\n\r\n`,
      ),
    );
  }
  denied(await raw(h.origin, "GET / HTTP/1.1\r\nConnection: close\r\n\r\n"));
  denied(await send("GET /", `Host: ${host}\r\n`));
  for (const header of [
    `Forwarded: host=${host}`,
    `X-Forwarded-Host: ${host}`,
    "X-Forwarded-For: 127.0.0.1",
    "X-Forwarded-Proto: http",
    "Proxy-Connection: keep-alive",
    "Via: 1.1 proxy",
    "Content-Length: 0",
    "Content-Length: 1",
    "Transfer-Encoding: chunked",
    "Expect: 100-continue",
    "Expect: unknown",
  ]) {
    denied(
      await send(
        "GET /",
        `${header}\r\n`,
        header === "Content-Length: 1" ? "x" : "",
      ),
    );
  }
  denied(
    await send(
      "GET /",
      "Content-Length: 1\r\nTransfer-Encoding: chunked\r\n",
      "0\r\n\r\n",
    ),
  );
  denied(await send(`CONNECT 127.0.0.1:${canary.address().port}`));
  denied(
    await raw(
      h.origin,
      `GET / HTTP/1.1\r\nHost: ${host}\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n`,
    ),
  );
  denied(await send("GET /", `X-Padding: ${"x".repeat(9000)}\r\n`));
  denied(await send("GET /", "Invalid Header: value\r\n"));
  assert.equal(canaryHits, 0);
});
