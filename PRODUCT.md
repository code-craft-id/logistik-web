# Logistics Management System

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product Purpose

Standalone replacement for the provider logistics application. Source of truth: docs/PRD.md, docs/ROADMAP.md, and AGENTS.md. Provider observations require domain and business approval before becoming rules.

## Users

Internal logistics staff across branches. PRD personas and exact permission assignments remain provisional. FND-03 provides a presentation foundation for frequent administrative use, as requested by the project coordinator.

## Capabilities and Constraints

FND-03 covers shared UI, navigation and clearly labeled static examples. It does not deliver operational workflows, authentication, RBAC, persistence or database integration. PLT-01 owns identity behavior and scope. DRAFT models remain inaccessible. SCH-01 is approved for its completed scope.

Localization, timezone and formatting policy remain TBD under D-19. Preserve existing English presentation and lang="en" without establishing a localization policy. Do not format example money or dates.

## Evidence on Hand

The request approves shadcn/ui and a restrained, flat administration interface. Iteration 2 preserves the implemented Geist shell and source-owned primitives. Private provider evidence now includes the dashboard navigation image plus Master Data, Modul and Reports menu notes. Typed navigation reflects those observed leaves; undocumented groups stay top-level. Form notes ground the static vendor-style tabbed example. Images and incomplete behavior remain unverified as catalogued in docs/decisions/FND-03-iteration-2.md. D-29 is CONFIRMED by coordinator (2026-10-19): admin access, ignored provider images excluded and not archived; side-by-side evidence belongs in PR text. Live parity and role-level permission parity remain unverified. FND-03 is DONE with coordinator-reported acceptance; see the Final closure note.
