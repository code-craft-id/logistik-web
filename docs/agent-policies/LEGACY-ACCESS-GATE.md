# Legacy observation access gate (canonical mode contract)

This file records eligibility; it is not a network guard. Repository owner authorized local protective infrastructure and these narrow mode definitions. External legacy system-owner authorization is still required where applicable. Agents cannot self-approve external access.

## Current effective state

- Mode: `UNVERIFIED`
- Legacy approval status (preserved): `NOT_VERIFIED`
- Target reference: `https://redlogistik.tracks-app.com/index.php/`; actual production/environment details UNVERIFIED
- Available external role: Administrator; authentication UNVERIFIED
- Independent reviewer / evidence / approval timestamp: `TBD` / `TBD` / `TBD`
- Authorized observation environment/session: `NONE`
- Approved routes and interactions: `NONE`
- External owner authorization reference: `NONE`
- Expiry / revocation / continued applicability: `UNVERIFIED`
- Local preparation: synthetic immutable harness, when tests pass, proves only its documented server surface. It is not a provider-equivalent replica, browser sandbox or authorization.

## Modes and eligibility

| Mode | Permitted activity ONLY after eligibility is verified | Required facts |
| --- | --- | --- |
| `ISOLATED_AUTONOMOUS` | Autonomous read-only observation inside the exact approved isolated replica/environment | Independent review of target identity and provider equivalence, synthetic/sanitized data authority, application/DB/filesystem restrictions, integrations disabled, browser/process network isolation and bypass denial, dummy negative-test evidence, dedicated Chrome/CDP identity, privacy scope and explicit scoped human authorization. Never inferred from localhost or fixture tests. |
| `PROTECTED_AUTONOMOUS` | Autonomous observation of exact technically reviewed non-mutating routes/interactions through comprehensive enforced protection | Independent server-side read-only or equivalent enforcement review; every request path forced through protection including dangerous GETs, redirects, background fetches, service workers, WebSockets, external integrations and alternate routes; nonproduction negative tests; exact target/browser/role/routes, external owner authorization and independent human safety sign-off. A GET-only proxy/allowlist alone cannot qualify. |
| `SUPERVISED_VISUAL` | Passive inspection of explicitly approved visible non-sensitive content while human controls navigation | Explicit session-specific human authorization, target/window/content/duration/privacy scope and permitted ephemeral capture; active supervision. No agent navigation, clicks, reload, forms, DOM/network/console extraction, credentials or autonomous observation. This is not network enforcement and cannot satisfy autonomous eligibility. D-29 non-archival policy retained. |
| `UNVERIFIED` | Offline sanitized evidence and dummy local tests only | Default for missing, stale, contradictory, expired, revoked or insufficient evidence/authorization. No autonomous legacy access or page-content inspection. Previously loaded/authenticated tabs are not exempt. |

Legacy `NOT_VERIFIED` maps only to `UNVERIFIED`. Bare historical `VERIFIED`, requested mode, configured browser, read-only sandbox, disabled evaluation or restored checkpoint NEVER imply an autonomous mode. Inspect actual eligibility and current authorization, failing closed on uncertainty.

## Independent verification record required before activation

Human owner/security reviewer records: exact environment/origin, ownership/legal authority, provider-equivalence limits, dedicated browser/profile/CDP binding, role, routes/interactions, enforced application/DB/filesystem/network boundaries, bypass/redirect/background/service-worker/WebSocket/integration coverage, nonproduction negative-test results and code/config/artifact digests, privacy review, reviewer/date, explicit authorization reference, validity/expiry/revocation conditions. Repository owner consent to build a harness is not the legacy owner's access approval. Local code QA verifies local claims only.

Manual authentication is requested only after the applicable environment, protection and scoped authorization are established. User alone signs in; agents never request/type/read credentials, export cookies/tokens or inspect auth payloads. Authentication/session metadata may be written and must be covered by the approved environment/authorization. No business mutation is permitted in any mode.

## Activation and restoration

Lead records requested mode separately from effective mode, qualifying evidence and remaining gaps. Only the independent human approval record can activate a qualifying provider-equivalent environment. On every resume or target/session/config/data change, check identity, enforcement applicability and current authorization; checkpoint restoration grants no authority and cannot extend or resurrect expired authorization. Missing facts => effective `UNVERIFIED`.

The current approval record above remains NOT_VERIFIED. Definitions added here do not clear it. See LEGACY-READONLY.md and LEGACY-OBSERVATION-INFRASTRUCTURE.md for guarantees, tests and gaps. Do not test protection through production mutations or attempt automatic legacy repair/reversion.
