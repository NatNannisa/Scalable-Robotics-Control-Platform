# Robot Control Room

A proof-of-concept centralized robotics operations platform designed
during an in-store AI Robot POC.

The project explores how a robot implementation can evolve beyond
a single-vendor dashboard into a scalable architecture capable of
supporting multiple robot suppliers, branches, telemetry sources,
and operational workflows.

## Why This Project

A typical robotics POC can easily become tightly coupled to one vendor:

Frontend → Supplier API → Supplier-specific data model

That works for a single deployment, but becomes increasingly difficult
to maintain as additional suppliers, robots, branches, and data sources
are introduced.

This project introduces a normalized integration architecture:

Robot / Supplier APIs
        ↓
Supplier Adapters
        ↓
Canonical Robot Model
        ↓
Unified Backend API
        ↓
Centralized Control Room
        ↓
Operations & Analytics

## Architecture

The platform is separated into several responsibilities:

- **Frontend** — centralized robot monitoring and operations
- **Unified Backend API** — common interface for frontend consumers
- **Canonical Robot Model** — normalized representation of robot state
- **Supplier Adapters** — translate vendor-specific APIs into the canonical model
- **Database Layer** — operational and configuration data
- **Mock Supplier Fixtures** — supplier-independent development and testing
- **Backend QA** — integration and contract validation

## Multi-Supplier Architecture

Instead of allowing supplier-specific APIs to propagate throughout
the application, each supplier is isolated behind an adapter.

Supplier A API ─┐
Supplier B API ─┼─→ Supplier Adapters
Supplier C API ─┘
                      ↓
              Canonical Robot Model
                      ↓
                Unified API
                      ↓
               Control Room

This allows supplier implementations to evolve independently while
the frontend and core business logic operate against a stable contract.

## AI-Assisted Engineering Workflow

The project also experiments with a multi-model engineering workflow.

Codex and Claude were used as independent engineering collaborators
for tasks such as:

- reviewing implementation decisions
- challenging architecture assumptions
- verifying API contracts
- identifying coupling between modules
- reviewing edge cases
- validating separation of responsibilities
- supporting code and test review

Architecture boundaries, business requirements, integration decisions,
and final implementation choices remained human-directed.

The goal was not autonomous code generation, but to explore how
multiple AI engineering tools can support architecture and code
verification during rapid POC development.

## Engineering Documentation

Detailed runtime ownership and canonical implementation paths:

→ `docs/platform-review-map.md`