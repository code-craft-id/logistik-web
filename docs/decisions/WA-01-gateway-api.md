# WhatsApp gateway API v1

LMS-owned contract, 2026-10-26. The stakeholder authorized LMS to choose the
routes; the forthcoming Baileys project implements this contract. Peer review
and live gateway interoperability are pending. This specifies session management
only, not operational notification triggers or message delivery.

## LMS configuration

```dotenv
WHATSAPP_GATEWAY_URL="https://your-gateway.example"
WHATSAPP_GATEWAY_API_KEY="replace-with-a-random-secret-at-least-32-characters"
```

These are the only gateway settings required in LMS. Restart the app after
changing environment values. Use HTTP loopback only for non-production. The URL
can contain a base path; LMS appends `/v1/...`. No credentials/query/fragment in
the URL. Keys are 32–512 printable ASCII characters without whitespace. Configure
the same key in the gateway. Do not use `NEXT_PUBLIC_` or put this key in browsers.
Gateway authentication is **not** an alternative to LMS login.

The gateway must namespace session storage by the authenticated API key's LMS
installation/environment and Branch Int ID. Production and staging must use
different keys/namespaces. One durable session/number per branch within that
namespace. Reject connecting a number already used by another branch; never
silently move it. Branch names, company IDs and customer IDs are not session IDs.

## LMS → gateway routes

All requests carry `Authorization: Bearer <API key>` and `Accept: application/json`.
Compare credentials securely and reject unknown keys before reading sessions.
All successful responses are HTTP 200 JSON, never 204 or redirects. Errors have
non-2xx status; LMS discards gateway error bodies. No cookies are forwarded.

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/v1/branches/{branchId}/session` | Read state; no existing session returns `disconnected`, not 404 |
| POST | `/v1/branches/{branchId}/session` | Ensure a connection attempt exists; repeated requests reuse the same session/QR attempt |
| DELETE | `/v1/branches/{branchId}/session` | Logout and invalidate only this branch's stored auth; already disconnected is a successful no-op |
| GET | `/v1/branches/{branchId}/session/qr` | Return the current short-lived QR; HTTP 409 if unavailable/expired/already connected |

`branchId` is a canonical positive decimal Int (1–2147483647). POST and DELETE
have no request body. Serialize concurrent operations per namespace+branch;
return promptly with the current state instead of waiting for a device scan.

Session response (exactly these three fields):

```json
{ "branchId": 7, "status": "disconnected", "phoneNumber": null }
```

`status` is `disconnected`, `connecting`, `qr` or `connected`. `phoneNumber` is
null except when connected, when it is a required E.164 string such as
`+6281234567890`. Do not return Baileys auth keys, JIDs, cookies, tokens, QR or
debug fields in a session response. The number above is an illustrative format.

QR response has exactly `branchId`, `qrDataUrl`, and `expiresAt`:

```json
{
  "branchId": 7,
  "qrDataUrl": "data:image/png;base64,<actual PNG base64 starting iVBORw0KGgo>",
  "expiresAt": "2026-10-26T12:01:00.000Z"
}
```

The illustrated PNG placeholder must be replaced with actual PNG data. Maximum
data URL length is 180000 characters. Expiry must be in the future, at most five
minutes away, and reflect the real QR's remaining lifetime. Return HTTP 409
when no usable QR exists. Rotate expired QR data; never expose another branch's
QR. Keep QR responses private/no-store. Clocks must be synchronized.

LMS validates the returned branch ID, response shape and QR expiry, rejects
redirects, enforces an eight-second timeout including body reading, and caps JSON
bodies at 256 KiB. It makes no automatic retries. On timeout, an operation may
have completed remotely: query status before retrying. Gateway idempotency is
required for duplicate requests and reconnect recovery.

## Browser → LMS routes

These routes use the user's Better Auth session cookie and server authorization;
they do not accept the gateway API key as a browser credential.

| Method | Path | Access |
| --- | --- | --- |
| GET | `/api/whatsapp/branches/{branchId}/session` | `whatsapp_configuration:view` plus active branch scope |
| POST | `/api/whatsapp/branches/{branchId}/session` | Administrator and `whatsapp_configuration:update`; same Origin required |
| DELETE | `/api/whatsapp/branches/{branchId}/session` | Same restrictions as POST |
| GET | `/api/whatsapp/branches/{branchId}/session/qr` | Same administrator restriction; same-origin fetch or Origin required |

Active branch/office and undeleted company are required. Unavailable/out-of-scope
branches return 404, unauthenticated users 401, denied rights/origins 403, invalid
IDs 400, QR not ready/expired 409, invalid gateway configuration 503 and gateway
failures 502. Responses are `Cache-Control: private, no-store`.

The existing WA panel fetches status on opening a branch, lets an administrator
connect, display QR, refresh status after scanning, and explicitly confirm logout.
QR is cleared on refresh, expiry or dialog close; it is never stored in browser
storage. Merely opening the panel does not connect or send a message.

Every QR request and connection mutation records an audit event without PII,
phone numbers, QR or secrets. A durable REQUESTED event precedes each external
mutation; COMPLETED means the gateway response was validated, not that a device
was already paired. UNCONFIRMED means the remote effect could not be confirmed.
There is no distributed transaction: use status to reconcile ambiguous outcomes.
Do not hold a database transaction open across a gateway network request.

No schema migration, session-secret storage in LMS, webhook, automatic reconnect
job in LMS, or public message-send endpoint is introduced. Baileys owns durable
auth and reconnection. Operational sends will use a separately reviewed contract
with recipient, branch ownership, idempotency and notification-trigger rules.
