import { createHash } from "node:crypto";
import { open } from "node:fs/promises";
import { createServer, STATUS_CODES } from "node:http";
import { pathToFileURL } from "node:url";

const MAX_FILE_BYTES = 64 * 1024;
const SECURITY_HEADERS = {
  "Content-Security-Policy":
    "default-src 'none'; script-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'; frame-src 'none'; frame-ancestors 'none'; sandbox",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  Connection: "close",
};

async function snapshot(fixturePath) {
  if (
    typeof fixturePath !== "string" ||
    /^[a-z][a-z\d+.-]*:\/\//i.test(fixturePath)
  ) {
    throw new Error("A local synthetic JSON file path is required");
  }
  const file = await open(fixturePath, "r");
  let bytes;
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > MAX_FILE_BYTES)
      throw new Error("Fixture must be a regular file of at most 64 KiB");
    // Bound allocation and reads even if the file grows after stat().
    const buffer = Buffer.alloc(MAX_FILE_BYTES + 1);
    let size = 0;
    while (size < buffer.length) {
      const { bytesRead } = await file.read(
        buffer,
        size,
        buffer.length - size,
        size,
      );
      if (bytesRead === 0) break;
      size += bytesRead;
    }
    if (size > MAX_FILE_BYTES) throw new Error("Fixture exceeds 64 KiB");
    bytes = buffer.subarray(0, size);
  } finally {
    await file.close();
  }
  const value = JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(bytes),
  );
  const text = (item) => typeof item === "string" && item.length <= 500;
  if (
    !value ||
    Array.isArray(value) ||
    typeof value !== "object" ||
    Object.keys(value).sort().join(",") !== "columns,provenance,rows,title" ||
    value.provenance !== "SYNTHETIC_TEST_ONLY" ||
    !text(value.title) ||
    !Array.isArray(value.columns) ||
    value.columns.length > 20 ||
    !value.columns.every(text) ||
    !Array.isArray(value.rows) ||
    value.rows.length > 100 ||
    !value.rows.every(
      (row) =>
        Array.isArray(row) &&
        row.length === value.columns.length &&
        row.every(text),
    )
  ) {
    throw new Error("Invalid synthetic fixture schema");
  }
  const json = Buffer.from(JSON.stringify(value));
  const digest = createHash("sha256").update(json).digest("hex");
  const escapeHtml = (item) =>
    item.replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  const html = Buffer.from(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(value.title)}</title></head><body><p>SYNTHETIC_TEST_ONLY — no provider evidence</p><h1>${escapeHtml(value.title)}</h1><p>Snapshot SHA256: ${digest}</p><table><thead><tr>${value.columns.map((column) => `<th scope="col">${escapeHtml(column)}</th>`).join("")}</tr></thead><tbody>${value.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`,
  );
  return { json, html, digest };
}

// Parser failures and protocol switches never enter a route or echo input.
function rejectSocket(socket, status = 400) {
  if (socket.destroyed || !socket.writable) return;
  socket.end(
    `HTTP/1.1 ${status} ${STATUS_CODES[status]}\r\n${Object.entries(
      SECURITY_HEADERS,
    )
      .map(([key, value]) => `${key}: ${value}\r\n`)
      .join("")}Content-Length: 0\r\n\r\n`,
  );
}

export async function startObservationServer({ fixturePath, port = 0 }) {
  if (!Number.isInteger(port) || port < 0 || port > 65535)
    throw new Error("Invalid loopback port");
  const { json, html, digest } = await snapshot(fixturePath);
  let expectedHost;
  const server = createServer(
    {
      maxHeaderSize: 8192,
      requestTimeout: 5000,
      headersTimeout: 5000,
      connectionsCheckingInterval: 1000,
      keepAliveTimeout: 1000,
    },
    (req, res) => {
      const deny = (status) => {
        res.writeHead(status, { ...SECURITY_HEADERS, "Content-Length": "0" });
        res.end();
      };
      const names = req.rawHeaders
        .filter((_item, index) => index % 2 === 0)
        .map((item) => item.toLowerCase());
      if (names.length > 50) return deny(431);
      if (
        names.filter((name) => name === "host").length !== 1 ||
        req.headers.host !== expectedHost
      )
        return deny(403);
      if (
        names.some(
          (name) =>
            name === "forwarded" ||
            name.startsWith("x-forwarded-") ||
            name.startsWith("proxy-") ||
            name === "via",
        )
      )
        return deny(403);
      if (
        names.some((name) =>
          ["content-length", "transfer-encoding", "expect", "upgrade"].includes(
            name,
          ),
        )
      )
        return deny(400);
      if (req.method !== "GET" && req.method !== "HEAD") return deny(405);
      if (req.url !== "/" && req.url !== "/fixture.json") return deny(404);
      const isJson = req.url === "/fixture.json";
      const body = isJson ? json : html;
      res.writeHead(200, {
        ...SECURITY_HEADERS,
        "Content-Type": isJson
          ? "application/json; charset=utf-8"
          : "text/html; charset=utf-8",
        "Content-Length": String(body.length),
      });
      res.end(req.method === "HEAD" ? undefined : body);
    },
  );
  // Parse the entire bounded header block, then reject excess count instead of
  // silently truncating headers (which could conceal framing/proxy headers).
  server.maxHeadersCount = 0;
  server.setTimeout(5000, (socket) => socket.destroy());
  server.on("checkContinue", (_req, res) => {
    res.writeHead(400, { ...SECURITY_HEADERS, "Content-Length": "0" });
    res.end();
  });
  server.on("checkExpectation", (_req, res) => {
    res.writeHead(417, { ...SECURITY_HEADERS, "Content-Length": "0" });
    res.end();
  });
  server.on("upgrade", (_req, socket) => rejectSocket(socket));
  server.on("connect", (_req, socket) => rejectSocket(socket));
  server.on("clientError", (error, socket) =>
    rejectSocket(socket, error.code === "HPE_HEADER_OVERFLOW" ? 431 : 400),
  );
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.removeListener("error", reject);
      expectedHost = `127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
  return { server, origin: `http://${expectedHost}`, digest };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (process.argv.length !== 3) {
    console.error(
      "Usage: node tools/legacy-observation/server.mjs <synthetic-fixture-json-path>",
    );
    process.exitCode = 1;
  } else {
    try {
      const { origin, digest } = await startObservationServer({
        fixturePath: process.argv[2],
      });
      console.log(
        JSON.stringify({ origin, digest, provenance: "SYNTHETIC_TEST_ONLY" }),
      );
    } catch {
      console.error("Synthetic fixture server could not start");
      process.exitCode = 1;
    }
  }
}
