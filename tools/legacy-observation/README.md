# Synthetic offline observation harness

This dependency-free Node 24 tool is local protective infrastructure only.
It is **not a provider-equivalent replica**. Fixture tests never prove legacy
parity or enable autonomous live observation. The effective access gate remains
UNVERIFIED until its separate independent evidence and authorization qualify.

From the repository root in PowerShell:

```powershell
& C:/Laragon/bin/nodejs/node-v24.15.0-win-x64/node.exe tools/legacy-observation/server.mjs tools/legacy-observation/fixture.synthetic.json
```

The CLI prints only its ephemeral `http://127.0.0.1:<port>` origin, SHA256 digest
and synthetic status. Stop with Ctrl+C. Never type live URLs into this CLI,
reuse an authenticated browser context, or supply real records/provider HTML,
credentials, downloaded assets or private payloads. Use a fresh context for
local synthetic work. Synthetic provenance is a required label, not automatic
proof that arbitrary input was sanitized; the caller must provide synthetic data.

## Contract and guarantees

`startObservationServer({ fixturePath, port = 0 })` returns
`Promise<{ server, origin, digest }>`; `server` is a Node HTTP server that its
caller closes. The host is always IPv4 loopback `127.0.0.1`. There is no upstream,
forwarder, redirect, filesystem route, database, outbound client or child process.
The only served targets are exact `GET`/`HEAD /` and `/fixture.json`.

Startup reads one regular JSON file, bounded to 64 KiB, closes it, validates its
schema, then retains only rendered bytes in memory. Editing or deleting that
file cannot change the running snapshot. The SHA256 identifies the canonical
UTF-8 JSON bytes served at `/fixture.json`, rather than source-file whitespace.
All title, column and cell values are escaped as inert HTML text.

The exact schema is `{ provenance: 'SYNTHETIC_TEST_ONLY', title: string,
columns: string[], rows: string[][] }`. Unknown/missing fields, other types,
inconsistent row widths and malformed UTF-8/JSON fail startup. Title, column
labels and cells are at most 500 JavaScript string code units; there are at
most 20 columns and 100 rows, subject also to the file byte limit.

The server requires its exact loopback Host including assigned port. It rejects
foreign/missing/duplicate Hosts, forwarding/proxy headers, request framing
(including Content-Length: 0), other methods/targets, Expect, CONNECT and
upgrades. Absolute URLs, query strings and percent/traversal paths are not
normalized into allowed routes. It bounds headers to 8 KiB/50 fields, uses
5-second request/header/socket timeouts and closes each response connection.
Parser errors fail closed without echoing input. Responses use restrictive CSP
(including sandbox and denied scripts/connect/forms/base/objects/frames),
no-store, nosniff and no-referrer. There are no cookies, CORS grants, telemetry
or raw request logs.

Explicit UNC paths (backslash, slash or mixed separators), NT/device namespace
prefixes, URL schemes and Windows drive-relative paths are rejected before any
filesystem operation. Windows root-relative paths are also rejected; use an
ordinary relative path or an explicit absolute local drive path. This is a
syntactic guard, not proof that the resolved file is local: the working
directory/local roots, mapped drives, junctions, symlinks and other filesystem
redirections must be independently trusted. A mapped drive or a link can still
resolve to remote storage. This tool does not inspect or sandbox that resolution.

## Limits and verification

This server does **not** establish browser egress isolation, an OS/process or
filesystem sandbox, provider equivalence, safe legacy GET routes, comprehensive
legacy protection or external-owner authorization. CSP is defense in depth
for these synthetic documents, not a browser-wide network boundary. It is not
a hardened multi-user service or general-purpose HTTP proxy. Do not expose it
through a tunnel/reverse proxy or treat its label/hash as approval to browse a
provider. It implements no domain workflow or permission model.

```powershell
& C:/Laragon/bin/nodejs/node-v24.15.0-win-x64/node.exe --test tools/legacy-observation/server.test.mjs
& C:/Laragon/bin/nodejs/node-v24.15.0-win-x64/node.exe --check tools/legacy-observation/server.mjs
```

Tests use temporary synthetic files and real loopback HTTP/raw sockets, including
a local canary that must receive zero forwarded traffic. They cover immutable
bytes, HEAD, escaping, schema/size failures, target/Host/method/framing rejection,
CONNECT/upgrades and malformed/oversized headers. They make no production calls.
