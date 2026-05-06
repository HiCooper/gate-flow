# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GateFlow is an A/B experimentation platform ("Victor" / 维克托) consisting of a Java Spring Boot backend, multiple React frontends, and a client SDK. The monorepo uses pnpm workspaces.

## Repository Structure

```
gate-flow/
├── apps/
│   ├── marketing/          # GateFlow marketing site (@gate-flow/marketing)
│   ├── admin/              # Admin dashboard (@gate-flow/admin)
│   └── victor-mng-front/   # AB experiment mgmt UI (Figma-generated, separate pkg)
├── packages/
│   └── shared/             # Shared UI tokens, hooks, utils, components
├── backend/
│   └── victor-service/     # Java Spring Boot multi-module Maven project
└── package.json            # Root pnpm workspace manifest
```

## Frontend

### Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS v4 (uses `@import "tailwindcss"` and `@theme` blocks, no `tailwind.config.js`)
- React Router v6 (marketing/admin) / React Router v7 (victor-mng-front)
- pnpm workspaces with `@gate-flow/shared` internal package

### Workspace Commands
Run from repo root:
- `pnpm dev` — start all frontend apps in parallel
- `pnpm dev:marketing` — start marketing site only (port 3000)
- `pnpm dev:admin` — start admin dashboard only (port 3001)
- `pnpm build` — build all frontend packages/apps
- `pnpm typecheck` — run `tsc --noEmit` across workspace
- `pnpm lint` — runs stub `echo ok` in most packages

Run from individual app directories:
- `pnpm dev` / `pnpm build` / `pnpm typecheck`

### Shared Package (`packages/shared`)
- Source-only package (no build step). Exports: `tokens`, `hooks`, `utils`, `components`
- Peer dependencies: `react`, `react-dom`
- Imported as `@gate-flow/shared` or `@gate-flow/shared/*`

### Per-App Notes

**`apps/admin`** (port 3001)
- Dark-themed dashboard for paywall/experiment management.
- State management via zustand with domain-specific stores in `src/stores/`
- Uses `@dnd-kit/core` and `@dnd-kit/sortable` for drag-and-drop.
- Uses `recharts` for analytics charts.

**`apps/marketing`** (port 3000)
- Landing site with docs, pricing, blog, customers pages.
- Static data files in `src/data/`.

**`apps/victor-mng-front`**
- Figma-generated AB experiment management UI with its own `package.json` (name `@figma/my-make-file`).
- Uses Radix UI primitives and a full `src/app/components/ui/` component library (shadcn/ui style).
- Has a custom Vite plugin `figmaAssetResolver()` for `figma:asset/*` imports.
- Uses React Router v7 (`createBrowserRouter` from `react-router`).

### Frontend Conventions
- Tailwind CSS v4 configuration lives in CSS files via `@theme` and `@import "tailwindcss"`.
- All apps alias `@` to their `./src` directory.
- `tsconfig.base.json` at repo root defines shared compiler options and path mappings for `@gate-flow/shared`.

## Backend

### Tech Stack
- Java 17, Spring Boot 3.4.0, Maven
- MyBatis-Plus 3.5.15 (ORM)
- MySQL 8.0 + Druid connection pool
- Redis (caching)
- Kafka (event pipeline)
- Flyway (DB migrations)
- SpringDoc OpenAPI (Swagger UI at `/swagger-ui.html`)
- Lombok + MapStruct

### Module Architecture (layered, bottom-up)

| Module | Purpose | Key Constraint |
|--------|---------|----------------|
| `victor-common` | Utilities, constants, base exceptions | No Spring dependencies |
| `victor-domain` | Entities, DTOs, event models | Depends only on common |
| `victor-bucketing` | Core bucketing/div分流 engine | **Pure Java, no Spring** — designed to be portable to SDK |
| `victor-infrastructure` | MyBatis mappers, DB/Redis/Kafka config | Depends on domain |
| `victor-service` | Business logic services | Depends on domain, bucketing, infrastructure |
| `victor-sdk` | Client SDK for downstream services | Depends on domain |
| `victor-web` | REST controllers, Spring Boot entry point | Depends on domain, service, infrastructure |
| `victor-pipeline` | Event ingestion (Kafka producer, ClickHouse writer) | — |
| `victor-stats` | Statistical engine: SRM, CUPED, Z-test, BH correction, mSPRT | Uses Apache Commons Math |

### Build & Run Commands

From `backend/victor-service/`:
- `mvn clean package` — build all modules
- `mvn clean package -DskipTests` — build without tests
- `mvn test` — run all tests
- `mvn test -Dtest=BucketEngineTest` — run a single test class
- `mvn test -pl victor-bucketing` — run tests for one module
- `mvn spring-boot:run -pl victor-web` — run the application

Docker:
- `docker-compose up` from `backend/victor-service/` spins up MySQL, Redis, and the service.

### Application Config

`victor-web/src/main/resources/application.yml`:
- Server port: `8080`
- DB: `victor_experiment` on localhost:3306
- Redis: localhost:6379
- Flyway enabled with migrations in `classpath:db/migration`
- MyBatis-Plus: camelCase mapping, logic delete field `deleted`
- OpenAPI docs at `/v3/api-docs`, Swagger UI at `/swagger-ui.html`

### Key Architecture Details

**Bucketing Engine (`victor-bucketing`)**
- `BucketEngine.computeBucket(userId, layerId, salt)` uses MurmurHash3 on `userId#layerId#salt` and mods by 10,000 to produce a bucket number (0–9999).
- `BucketEngine.findVariant(bucket, variantSpecs)` maps the bucket to a variant key based on `[bucketStart, bucketEnd]` ranges.
- This module intentionally has zero Spring dependencies so it can be embedded directly into the client SDK.

**Experiment & Layer Model**
- Experiments live within layers. Layers provide orthogonal traffic buckets so experiments in different layers do not interfere.
- Each experiment has `bucketStart`/`bucketEnd` (traffic allocation) and contains multiple `Variant`s with their own bucket ranges.
- `UserAssignment` tracks which variant a user was assigned to.

**Pipeline & Stats**
- `victor-pipeline` ingests events via REST (`EventController`) or Kafka, writes to ClickHouse.
- `victor-stats` implements sequential testing (mSPRT), variance reduction (CUPED), and multiple comparison correction (BH).

## API Endpoints

REST controllers in `victor-web` under `/api/v1/`:
- `ExperimentController` — `/api/v1/experiments`
- `LayerController` — `/api/v1/layers`
- `VariantController` — `/api/v1/variants`
- `BucketingController` — `/api/v1/bucket` (runtime bucketing requests)
- `ConfigController` — `/api/v1/config` (SDK config fetch)
- `EventController` (in pipeline module) — event ingestion

## Testing

**Java:** JUnit 5 + Mockito + Spring Boot Test. Controllers use `@WebMvcTest`.

**Frontend:** No test frameworks are currently configured in the frontend packages.

## Development Workflow

1. Start infrastructure: `docker-compose up mysql redis` from `backend/victor-service/`
2. Start backend: `mvn spring-boot:run -pl victor-web` from `backend/victor-service/`
3. Start frontend(s): `pnpm dev:admin` or `pnpm dev:marketing` from repo root
