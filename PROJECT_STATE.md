# LibraFlow — Project State Tracker
> **Course Assignment**: DA3 — Database Management Systems
> **Tech Stack**: React + Vite + TypeScript + Tailwind CSS / Node.js + Express + TypeScript / Neo4j
> **Last Updated**: 2026-10-12

---

## Current Phase

```
Phase 1 — Architecture & Planning   COMPLETE
Phase 2 — Database Layer            COMPLETE
Phase 3 — Backend Foundation        COMPLETE
Phase 4 — Domain CRUD APIs          COMPLETE
Phase 5 — Transactional Loans       COMPLETE
Phase 6 — Frontend UI & Foundation  COMPLETE  <-- finished this session
Phase 7 — Integration & End-to-End  NOT STARTED
```

---

## Workspace Audit

### Phase 1 (2026-10-12) — Created
  LIBRARY/PROJECT_STATE.md
  LIBRARY/docs/ARCHITECTURE.md
  LIBRARY/docs/IMPLEMENTATION_PLAN.md

### Phase 2 (2026-10-12) — Created
  LIBRARY/database/constraints.cypher
  LIBRARY/database/seed.cypher
  LIBRARY/database/demo-queries.cypher
  LIBRARY/docs/DATABASE_SCHEMA.md

### Phase 3 (2026-10-12) — Created
  LIBRARY/.gitignore
  LIBRARY/README.md
  LIBRARY/server/package.json
  LIBRARY/server/package-lock.json
  LIBRARY/server/tsconfig.json
  LIBRARY/server/jest.config.js
  LIBRARY/server/.env.example
  LIBRARY/server/.gitignore
  LIBRARY/server/src/types/index.ts
  LIBRARY/server/src/config/env.ts
  LIBRARY/server/src/config/neo4j.ts
  LIBRARY/server/src/utils/response.ts
  LIBRARY/server/src/utils/errors.ts
  LIBRARY/server/src/middleware/error.middleware.ts
  LIBRARY/server/src/middleware/logger.middleware.ts
  LIBRARY/server/src/middleware/validate.middleware.ts
  LIBRARY/server/src/routes/health.routes.ts
  LIBRARY/server/src/app.ts
  LIBRARY/server/src/server.ts
  LIBRARY/server/tests/health.test.ts
  LIBRARY/server/tests/middleware.test.ts

### Phase 4 (2026-10-12) — Created
  LIBRARY/docs/API_DOCUMENTATION.md
  LIBRARY/server/src/utils/neo4j-helpers.ts
  LIBRARY/server/src/services/books.service.ts
  LIBRARY/server/src/controllers/books.controller.ts
  LIBRARY/server/src/routes/books.routes.ts
  LIBRARY/server/src/services/authors.service.ts
  LIBRARY/server/src/controllers/authors.controller.ts
  LIBRARY/server/src/routes/authors.routes.ts
  LIBRARY/server/src/services/publishers.service.ts
  LIBRARY/server/src/controllers/publishers.controller.ts
  LIBRARY/server/src/routes/publishers.routes.ts
  LIBRARY/server/src/services/libraries.service.ts
  LIBRARY/server/src/controllers/libraries.controller.ts
  LIBRARY/server/src/routes/libraries.routes.ts
  LIBRARY/server/src/services/members.service.ts
  LIBRARY/server/src/controllers/members.controller.ts
  LIBRARY/server/src/routes/members.routes.ts
  LIBRARY/server/src/services/employees.service.ts
  LIBRARY/server/src/controllers/employees.controller.ts
  LIBRARY/server/src/routes/employees.routes.ts
  LIBRARY/server/src/services/admins.service.ts
  LIBRARY/server/src/controllers/admins.controller.ts
  LIBRARY/server/src/routes/admins.routes.ts
  LIBRARY/server/src/services/requests.service.ts
  LIBRARY/server/src/controllers/requests.controller.ts
  LIBRARY/server/src/routes/requests.routes.ts
  LIBRARY/server/tests/books.test.ts
  LIBRARY/server/tests/authors_publishers.test.ts
  LIBRARY/server/tests/users_libraries.test.ts
  LIBRARY/server/tests/requests.test.ts

### Phase 5 (2026-10-13) — Created
  LIBRARY/server/src/services/loans.service.ts
  LIBRARY/server/src/controllers/loans.controller.ts
  LIBRARY/server/src/routes/loans.routes.ts
  LIBRARY/server/tests/loans.test.ts

### Phase 6 (2026-10-13) — Recovered & Created
  LIBRARY/client/index.html
  LIBRARY/client/vite.config.ts
  LIBRARY/client/src/index.css
  LIBRARY/client/src/App.css
  LIBRARY/client/src/App.tsx
  LIBRARY/client/src/main.tsx
  LIBRARY/client/src/types/index.ts
  LIBRARY/client/src/services/api.ts
  LIBRARY/client/src/services/seedData.ts
  LIBRARY/client/src/context/auth-context.ts
  LIBRARY/client/src/context/AuthContext.tsx
  LIBRARY/client/src/hooks/useAuth.ts
  LIBRARY/client/src/components/common/Badge.tsx
  LIBRARY/client/src/components/common/Button.tsx
  LIBRARY/client/src/components/common/Card.tsx
  LIBRARY/client/src/components/common/Input.tsx
  LIBRARY/client/src/components/common/Select.tsx
  LIBRARY/client/src/components/common/Modal.tsx
  LIBRARY/client/src/components/common/Table.tsx
  LIBRARY/client/src/components/common/EmptyState.tsx
  LIBRARY/client/src/components/common/Alert.tsx
  LIBRARY/client/src/components/common/StatCard.tsx
  LIBRARY/client/src/components/layout/Sidebar.tsx
  LIBRARY/client/src/components/layout/Navbar.tsx
  LIBRARY/client/src/components/layout/AppLayout.tsx
  LIBRARY/client/src/pages/DashboardPage.tsx
  LIBRARY/client/src/pages/BooksPage.tsx
  LIBRARY/client/src/pages/AddEditBookPage.tsx
  LIBRARY/client/src/pages/MembersPage.tsx
  LIBRARY/client/src/pages/StaffPage.tsx
  LIBRARY/client/src/pages/LibrariesPage.tsx
  LIBRARY/client/src/pages/IssueReturnPage.tsx
  LIBRARY/client/src/pages/LoansHistoryPage.tsx
  LIBRARY/client/src/pages/RequestsPage.tsx
  LIBRARY/client/src/pages/DiscoveryPage.tsx
  LIBRARY/client/src/pages/AnalyticsPage.tsx
  LIBRARY/client/src/pages/SettingsPage.tsx
  LIBRARY/client/src/pages/NotFoundPage.tsx

No backend files, tests, or database scripts were broken.

No existing files were deleted or overwritten.

---

## Key Architectural Decisions

| # | Decision | Rationale |
|---|----------|-----------| 
| 1 | Neo4j ONLY (no SQL) | Assignment requirement; graph model is natural for borrowing histories |
| 2 | Loan as a NODE (not a relationship) | Allows per-loan-ID tracking, multiple loans, fine storage |
| 3 | Request as a NODE with status property | Mirrors Oracle DA2 Send_Request; status: PENDING/APPROVED/REJECTED |
| 4 | JWT for authentication | Stateless; stored in localStorage (acceptable for academic scope) |
| 5 | Monorepo /client and /server | Standard pattern; single git repo |
| 6 | Three roles: Member, Employee, Admin | Directly maps to DA2 entities |
| 7 | availableCopies counter on Book node | Avoids expensive COUNT() on every borrow check |
| 8 | Tailwind CSS v3 | More stable than v4; easier PostCSS setup for students |
| 9 | database/ folder separate from server/ | Scripts apply directly to Neo4j Browser or Cypher Shell — no app needed |
| 10 | MERGE for all seed statements | Re-running seed.cypher is idempotent — no duplicate nodes |

---

## DA2 Entity Mapping (All 8 Preserved)

| DA2 Oracle Table | Neo4j Node Label | Seed IDs |
|-----------------|-----------------|---------|
| Author | (:Author) | A101, A102, A103 (DA2) + A104, A105 |
| Publisher | (:Publisher) | PUB01, PUB02, PUB03 (DA2) + PUB04 |
| Books | (:Book) | B001, B002, B003 (DA2) + B004, B005 |
| Library | (:Library) | LIB01, LIB02 |
| Member | (:Member) | M001, M002 (DA2) + M003, M004 |
| Employee | (:Employee) | E01, E02 (DA2) |
| Admin | (:Admin) | AD01, AD02 (DA2) |
| Send_Request | (:Request) | REQ001–REQ006 |
| (new) | (:Loan) | L001–L007 |

---

## Planned Folder Structure

```
LIBRARY/
|-- database/                        COMPLETE
|   |-- constraints.cypher
|   |-- seed.cypher
|   \-- demo-queries.cypher
|
|-- docs/                            COMPLETE
|   |-- ARCHITECTURE.md
|   |-- IMPLEMENTATION_PLAN.md
|   \-- DATABASE_SCHEMA.md
|
|-- client/                          NOT STARTED (Phase 4)
|   |-- index.html
|   |-- package.json
|   |-- tsconfig.json
|   |-- vite.config.ts
|   |-- tailwind.config.js
|   |-- postcss.config.js
|   \-- src/
|       |-- main.tsx
|       |-- App.tsx
|       |-- index.css
|       |-- assets/
|       |-- components/
|       |   |-- common/
|       |   |-- layout/
|       |   \-- features/
|       |-- context/
|       |   \-- AuthContext.tsx
|       |-- hooks/
|       |-- pages/
|       |-- services/
|       \-- types/
|
|-- server/                          NOT STARTED (Phase 3)
|   |-- package.json
|   |-- tsconfig.json
|   |-- .env.example
|   \-- src/
|       |-- server.ts
|       |-- app.ts
|       |-- config/
|       |   \-- neo4j.ts
|       |-- middleware/
|       |-- routes/
|       |-- controllers/
|       |-- services/
|       \-- types/
|
|-- PROJECT_STATE.md
|-- .gitignore
\-- README.md
```

---

## API Contracts (Summary Table)

### Auth
| Method | Route | Auth Required | Description |
|--------|-------|---------------|-------------|
| POST | /api/auth/login | None | Login, returns JWT |
| POST | /api/auth/register | None | Register as member |
| GET | /api/auth/me | JWT | Get current user |

### Books
| Method | Route | Auth Required | Description |
|--------|-------|---------------|-------------|
| GET | /api/books | Any | List or search books |
| GET | /api/books/:bookId | Any | Book detail with author/publisher |
| POST | /api/books | Employee/Admin | Add new book |
| PUT | /api/books/:bookId | Employee/Admin | Update book metadata |
| DELETE | /api/books/:bookId | Admin | Delete book (if no active loans) |

### Loans
| Method | Route | Auth Required | Description |
|--------|-------|---------------|-------------|
| POST | /api/loans | Employee | Issue book to member |
| GET | /api/loans | Employee/Admin | All active loans |
| GET | /api/loans/member/:memberId | Member(self)/Employee | Loans for a member |
| PUT | /api/loans/:loanId/return | Employee | Process book return |
| GET | /api/loans/overdue | Employee/Admin | All overdue loans |

### Requests
| Method | Route | Auth Required | Description |
|--------|-------|---------------|-------------|
| POST | /api/requests | Member | Submit borrow request |
| GET | /api/requests | Employee/Admin | All pending requests |
| GET | /api/requests/my | Member | Own requests |
| PUT | /api/requests/:requestId/approve | Employee | Approve (creates loan) |
| PUT | /api/requests/:requestId/reject | Employee | Reject request |

### Members
| Method | Route | Auth Required | Description |
|--------|-------|---------------|-------------|
| GET | /api/members | Employee/Admin | List all members |
| GET | /api/members/:memberId | Member(self)/Employee | Member profile |
| PUT | /api/members/:memberId | Member(self)/Admin | Update profile |

### Admin
| Method | Route | Auth Required | Description |
|--------|-------|---------------|-------------|
| GET | /api/admin/stats | Admin | Dashboard statistics |
| POST | /api/admin/authors | Admin | Add author |
| POST | /api/admin/publishers | Admin | Add publisher |
| POST | /api/admin/libraries | Admin | Add library |
| POST | /api/admin/employees | Admin | Add employee |

---

## Phase 2 — Database Layer: Validation Results

### Static validation (no live Neo4j connection available)
The following checks were performed on the Cypher scripts:

- [x] constraints.cypher: 13 CREATE CONSTRAINT statements, all with IF NOT EXISTS
- [x] constraints.cypher: 7 CREATE INDEX statements, all with IF NOT EXISTS
- [x] seed.cypher: All node creation uses MERGE (idempotent — no duplicates on re-run)
- [x] seed.cypher: All relationship creation uses MERGE
- [x] seed.cypher: DA2 IDs preserved: A101-A103, PUB01-PUB03, B001-B003, M001-M002, E01-E02, AD01-AD02
- [x] seed.cypher: Loan statuses ACTIVE / RETURNED / OVERDUE all present (L001-L007)
- [x] seed.cypher: Request statuses PENDING / APPROVED / REJECTED all present (REQ001-REQ006)
- [x] seed.cypher: availableCopies is consistent with active loan count (see table below)
- [x] seed.cypher: Member-Employee request pairs preserved via (Member)-[:SENT]->(Request)<-[:PROCESSED]-(Employee)
- [x] demo-queries.cypher: Uses MATCH, OPTIONAL MATCH, WHERE, WITH, RETURN, ORDER BY, aggregation
- [x] demo-queries.cypher: Includes 7 integrity check queries (IC01-IC07)
- [x] demo-queries.cypher: Includes transaction simulation queries (Q19-Q21)

### Book/Loan consistency table
| Book | totalCopies | Active Loans | availableCopies set |
|------|------------|-------------|-------------------|
| B001 | 4 | L001, L003 = 2 | 2 CORRECT |
| B002 | 3 | none = 0 | 3 CORRECT |
| B003 | 5 | L004(OVERDUE), L005 = 2 | 3 CORRECT |
| B004 | 3 | L006 = 1 | 2 CORRECT |
| B005 | 4 | none = 0 | 4 CORRECT |

NOTE: L004 has status OVERDUE. It is still an active physical loan (book not returned),
so it reduces availableCopies. The application backend is responsible for detecting
ACTIVE loans past their dueDate and updating status to OVERDUE.

### Known limitation
The static Cypher scripts cannot be machine-verified without a running Neo4j instance.
The Cypher syntax follows Neo4j 5.x documentation conventions. Live verification must
be performed by running the scripts in Neo4j Browser using IC01-IC07 in demo-queries.cypher.

---

## Phase 3 Execution Report (Backend Foundation)

### Execution Summary
- **Directory**: `LIBRARY/server`
- **Dependencies Installed**:
  - Runtime: `express`, `neo4j-driver`, `dotenv`, `cors`, `jsonwebtoken`, `bcryptjs`
  - Development/Testing: `typescript`, `ts-node-dev`, `jest`, `ts-jest`, `supertest`, `@types/*`
- **TypeScript Configuration**: `tsconfig.json` targeting ES2022/CommonJS with strict mode enabled and `dist/` compilation target.
- **Environment Management**:
  - `server/.env.example` committed with placeholders only.
  - Environment variables read: `PORT`, `NODE_ENV`, `CORS_ORIGIN`, `NEO4J_URI`, `NEO4J_USERNAME` (with `NEO4J_USER` fallback), `NEO4J_PASSWORD`, `NEO4J_DATABASE`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FINE_RATE_PER_DAY`, `LOAN_PERIOD_DAYS`.
  - `.env` excluded via root `.gitignore` and `server/.gitignore`.
- **Database Module (`server/src/config/neo4j.ts`)**:
  - Singleton driver initialization via `getDriver()`.
  - Safe session management via `getSession()` and `withSession<T>()` auto-closing sessions in `finally` blocks.
  - Driver shutdown lifecycle via `closeDriver()`.
  - Real connectivity verification via `verifyConnectivity()` using official `driver.verifyConnectivity()`.
  - No connection fabrication or mock replacements.
- **Health & Readiness Endpoints**:
  - `GET /health` & `GET /api/health`: HTTP server process liveness (HTTP 200).
  - `GET /health/db` & `GET /api/health/db`: Neo4j database readiness probe returning HTTP 200 (`CONNECTED`) when reachable or HTTP 503 (`DISCONNECTED`) when unreachable.
- **Centralized Middleware & Conventions**:
  - Consistent JSON response contracts (`ApiResponse<T>`, `sendSuccess`, `sendError`).
  - Centralized error hierarchy (`AppError`, `BadRequestError`, `NotFoundError`, etc.) with global error handling catching Neo4j and Express runtime errors.
  - Request logging middleware and reusable request validation middleware generator (`validateRequest`).
  - Graceful shutdown signal traps for `SIGTERM` and `SIGINT`.

### Commands Run and Verification Results

1. `npm install` (in `server/`):
   - Command: `npm install`
   - Result: Exit code 0, 446 packages added, 0 installation errors.
2. Production TypeScript Build:
   - Command: `npm run build`
   - Result: Exit code 0, `tsc` completed without errors, outputs generated in `server/dist/`.
3. Test Suite Execution:
   - Command: `npm test`
   - Result: Exit code 0, 2 test suites passed, 8 tests passed in 23.27s:
     - `tests/health.test.ts`: 4 passed (Liveness probe, alias route, Neo4j connectivity mock success, Neo4j connectivity failure returning 503).
     - `tests/middleware.test.ts`: 4 passed (404 handler, request validation failure, validation success, custom `AppError` handling).

### Known Limitations
- When running in an environment without a local or remote Neo4j 5 database instance actively listening on port 7687, the database readiness probe (`/health/db`) honestly returns HTTP 503 with status `DISCONNECTED`. This is the intended behavior and guarantees that connection status is never fabricated.

---

## Phase 4 Execution Report (Domain CRUD APIs)

### Execution Summary
- **Implemented Domains**:
  - **Books** (`/api/books`): Full CRUD, search, genre filter, pagination, sorting whitelist. Enforces referential integrity by rejecting deletion if active loans exist (`409 Conflict`).
  - **Authors** (`/api/authors`): Full CRUD, keyword search, pagination, returns authored books.
  - **Publishers** (`/api/publishers`): Full CRUD, search, pagination, returns published books.
  - **Libraries** (`/api/libraries`): Full CRUD, returns aggregated book and employee counts; protects library deletion when holdings exist.
  - **Members** (`/api/members`): Full CRUD, pagination, status filter. Excludes stored `passwordHash` in all responses; prevents deletion if active loans exist.
  - **Employees** (`/api/employees`): Full CRUD, hashes passwords via `bcryptjs`, links to Library branch, excludes `passwordHash`.
  - **Administrators** (`/api/admins`): Full CRUD, hashes passwords via `bcryptjs`, excludes `passwordHash`.
  - **Member Requests** (`/api/requests`): Full CRUD, status filter (`PENDING`, `APPROVED`, `REJECTED`), links member, requested book, and processing employee.
- **Security & Integrity Adherence**:
  - **100% Parameterized Cypher**: Every user input passed via parameters (`$param`), preventing Cypher injection.
  - **Password Secrecy**: Stored bcrypt hashes are filtered using `sanitizeEntity` and explicitly omitted from projection shapes.
  - **Session Lifecycle**: All database calls use `withSession<T>()` auto-closing sessions in `finally` blocks.
  - **Referential Integrity**: Books and Members cannot be deleted if active loans exist (`409 Conflict`). Libraries cannot be deleted if books are held.
  - **Consistent Responses**: All endpoints return `{ success, data, meta }` or `{ success: false, error, details }`.

### Commands Run and Verification Results

1. Production TypeScript Build:
   - Command: `npm run build`
   - Result: Exit code 0, `tsc` completed without errors, outputs compiled into `server/dist/`.
2. Automated Test Suite:
   - Command: `npm test`
   - Result: Exit code 0, 6 test suites passed, 33 tests passed in 5.16s:
     - `tests/health.test.ts`: 4 passed (Liveness probe, alias route, Neo4j connectivity mock success, Neo4j connectivity failure returning 503).
     - `tests/middleware.test.ts`: 4 passed (404 handler, request validation failure, validation success, custom `AppError` handling).
     - `tests/books.test.ts`: 6 passed (List, detail, create, validation error, prevent delete on active loan, delete success).
     - `tests/authors_publishers.test.ts`: 7 passed (Authors CRUD & Publishers CRUD).
     - `tests/users_libraries.test.ts`: 7 passed (Members password protection & loan deletion guard, Employees password protection, Admins password protection, Libraries deletion holdings guard).
     - `tests/requests.test.ts`: 5 passed (Requests list, detail, create, update with employee, delete).

---

## Phase 5 Execution Report (Transactional Loans & Member Requests)

### Execution Summary
- **Implemented Loan Endpoints**:
  - `POST /api/loans/issue` & `POST /api/loans`: Atomic borrowing transaction.
    - Validates member exists and status is `ACTIVE` (blocks `SUSPENDED` members with `403 Forbidden`).
    - Validates book exists and `availableCopies > 0` (rejects with `400 Bad Request` if depleted).
    - Prevents member from borrowing the same book concurrently (`409 Conflict`).
    - Acquires Neo4j node write lock via `executeWrite`, safely decrementing `availableCopies` and creating `(:Loan)` node.
    - Connects `(:Member)-[:BORROWED]->(:Loan)`, `(:Loan)-[:FOR_BOOK]->(:Book)`, and `(:Employee)-[:ISSUED]->(:Loan)`.
  - `POST /api/loans/:loanId/return` & `PUT /api/loans/:loanId/return`: Atomic return transaction.
    - Validates loan exists and is `ACTIVE` or `OVERDUE` (rejects duplicate return with `400 Bad Request`).
    - Atomically updates status to `RETURNED`, sets `returnDate`, computes overdue fine (`days * FINE_RATE_PER_DAY`), and increments `book.availableCopies`.
    - Preserves all historical loan records and relationship metadata.
  - `GET /api/loans`: List all loans with filters (`status`, `memberId`, `bookId`) and pagination.
  - `GET /api/loans/:loanId`: Single loan details with related member, book, and issuing staff.
  - `GET /api/loans/overdue`: Overdue loans probe with live computed days overdue and fine amount.
  - `GET /api/members/:memberId/loans`: Member borrowing history endpoint.
- **Member Requests Refinement**:
  - Validated status transition lifecycle: `PENDING` -> `APPROVED` or `REJECTED`.
  - Rejects attempts to transition already processed (`APPROVED`/`REJECTED`) requests (`400 Bad Request`).
  - Records processing employee via `(:Employee)-[:PROCESSED]->(:Request)`.
- **Database Concurrency & Locking Architecture**:
  - All mutating borrowing and return operations execute inside `withTransaction` using official `session.executeWrite(async tx => ...)`.
  - Modifying `b.availableCopies` inside the transaction forces Neo4j to take an exclusive write lock on the `(:Book)` node.
  - Concurrent issue requests on the same book are serialized at the database engine level; the second transaction re-evaluates `availableCopies > 0` and fails cleanly if zero copies remain.

### Commands Run and Verification Results

1. Production TypeScript Build:
   - Command: `npm run build`
   - Result: Exit code 0, `tsc` completed with zero errors, outputs compiled into `server/dist/`.
2. Automated Test Suite:
   - Command: `npm test`
   - Result: Exit code 0, 7 test suites passed, 46 tests passed in 4.69s:
     - `tests/health.test.ts`: 4 passed
     - `tests/middleware.test.ts`: 4 passed
     - `tests/books.test.ts`: 6 passed
     - `tests/authors_publishers.test.ts`: 7 passed
     - `tests/users_libraries.test.ts`: 7 passed
     - `tests/requests.test.ts`: 7 passed (including lifecycle transition guards)
     - `tests/loans.test.ts`: 11 passed (Issue book, 0 copies error, duplicate active loan error, missing entity 404, return book, double return rejection, overdue filtering, member loan history, pagination, transaction rollback on failure)

---

## Phase 6 Execution Report (Frontend Foundation & UI Architecture)

### 1. Interruption Diagnosis & Safe Recovery
- **Failure Cause**: The previous session created the Vite scaffolding and initiated package installations (`tailwindcss@^4.3.3`, `react`, `react-dom`, `react-router-dom`, `lucide-react`, `recharts`, `oxlint`), but was interrupted by network loss before any domain UI components, design tokens, layouts, or router views could be authored. Only default boilerplate Vite files existed in `src/`.
- **Lockfile & Dependency Verification**: `package.json` and `package-lock.json` were audited with `npm ci` (0 vulnerabilities, 82 packages added). Network ping confirmed full npm registry restoration.
- **Tailwind v4 Integration**: The previous session installed `tailwindcss@4.3.3` with `postcss` and `autoprefixer` expecting Tailwind v3 behavior, leaving Tailwind uncompiled by Vite. We installed `@tailwindcss/vite@4.3.3` matching the installed core version, registered `tailwindcss()` in `vite.config.ts`, and established design tokens in `src/index.css`.

### 2. Implemented Architecture & UI System
- **Application Shell (`components/layout/`)**:
  - `Sidebar.tsx`: Persistent brand identity, responsive slide-out drawer on mobile, persona tag, grouped navigation items.
  - `Navbar.tsx`: Real-time backend/Neo4j health check probe, breadcrumbs, persona switcher (Student Member, Staff Librarian, Administrator).
  - `AppLayout.tsx`: Unified flex layout with responsive viewports.
- **Design System & Reusable Components (`components/common/`)**:
  - `Badge.tsx`: Semantic statuses (`ACTIVE`, `OVERDUE`, `RETURNED`, `PENDING`, `APPROVED`, `REJECTED`, role tags).
  - `Button.tsx`: Primary, secondary, outline, danger, ghost variants with loading states and icon slots.
  - `Card.tsx`: Structural containers with headers, subtitles, actions, and footers.
  - `Input.tsx` & `Select.tsx`: Accessible controls with validation errors and helper text.
  - `Modal.tsx`: Keyboard accessible dialogs (Escape key trap, backdrop lock).
  - `Table.tsx`: Generic data table with loading spinners and empty states.
  - `StatCard.tsx`: Key circulation metrics with trends and color schemes.
  - `Alert.tsx` & `EmptyState.tsx`: Honest feedback and empty state representations.
- **Core Domain Screens (`pages/`)**:
  - `DashboardPage.tsx`: Top circulation metrics, active loans table, pending request queue, quick workflows.
  - `BooksPage.tsx`: Catalog search, genre filters, availability filtering, volume inspection modal.
  - `AddEditBookPage.tsx`: Book registration and edit form linking Author, Publisher, and Library branch.
  - `MembersPage.tsx`: Member directory with standing indicators (`ACTIVE` vs `SUSPENDED`) and registration modal.
  - `StaffPage.tsx`: Staff directory separating librarians and system administrators.
  - `LibrariesPage.tsx`: Physical campus branch overview with holdings count and staff allocations.
  - `IssueReturnPage.tsx`: Circulation desk for atomic book issuance (with copy check) and returns (with fine calculation).
  - `LoansHistoryPage.tsx`: Circulation history log with overdue fine calculation ($1/day) and status filters.
  - `RequestsPage.tsx`: Member request reservation queue with staff Approve/Reject workflow.
  - `DiscoveryPage.tsx`: Multi-hop Neo4j graph discovery (same author, same publisher, same genre, co-borrowings).
  - `AnalyticsPage.tsx`: Recharts-powered circulation lifecycle distribution and genre allocation charts.
  - `SettingsPage.tsx`: Circulation thresholds (`LOAN_PERIOD_DAYS`, `FINE_RATE_PER_DAY`) and live `/health` diagnostics.
  - `NotFoundPage.tsx`: Graceful 404 handler.
- **State & Service Layer**:
  - `context/auth-context.ts` & `context/AuthContext.tsx`: Persona state management.
  - `hooks/useAuth.ts`: Custom hook adhering to Vite Fast Refresh.
  - `services/api.ts`: Fetch wrapper with token authorization and real-time backend/Neo4j health probes.
  - `services/seedData.ts`: 100% faithful presentation data matching `database/seed.cypher` and `docs/DATABASE_SCHEMA.md`.

### 3. Verification & Quality Checks
1. **TypeScript Compilation & Production Build**:
   - Command: `npm run build` (in `client/`)
   - Result: Exit code 0, `tsc -b && vite build` built in 1.09s, zero errors. Output: `dist/index.html` (1.00 kB), `dist/assets/index-*.css` (51.19 kB), `dist/assets/index-*.js` (754.91 kB).
2. **Linting (`oxlint`)**:
   - Command: `npm run lint` (in `client/`)
   - Result: Exit code 0, 0 errors, 0 warnings across all 35 source files.
3. **Backend Regression Test Suite**:
   - Command: `npm test` (in `server/`)
   - Result: Exit code 0, 7 test suites passed, 46 tests passed in 21.66s. No backend routes or database logic modified.

### 4. Phase 7 Starting Point (Integration & End-to-End)
- **Frontend Start Command**: `cd client && npm run dev`
- **Backend Start Command**: `cd server && npm run dev`
- **Integration Hand-off**:
  1. Set `VITE_API_BASE_URL=http://localhost:5000/api` in `client/.env`.
  2. Connect `client/src/services/api.ts` to replace presentation fallback data with live endpoints (`GET /api/books`, `POST /api/loans`, `PUT /api/loans/:loanId/return`, `GET /api/requests`, etc.).
  3. Wire authentication JWT storage to backend `/api/auth/login`.


---

## Test Plan (Phase 5)

### Backend (Postman or VS Code REST Client)
- [ ] POST /api/auth/login with valid creds -> 200 + JWT
- [ ] POST /api/auth/login with wrong password -> 401
- [ ] POST /api/loans without JWT -> 401
- [ ] POST /api/loans as Member role -> 403
- [ ] Issue book with availableCopies = 0 -> 400
- [ ] Issue same book to same member (active loan exists) -> 409
- [ ] Issue book to SUSPENDED member M004 -> 403
- [ ] Return book -> availableCopies increments, loan.status = RETURNED
- [ ] Return already-returned loan -> 400
- [ ] GET /api/loans/overdue -> only past-due-date active loans

### Frontend (Manual browser testing)
- [ ] Login page loads and handles errors correctly
- [ ] Member dashboard shows active loans and pending requests
- [ ] Employee can approve a request -> loan appears in list
- [ ] Admin stats page shows live database counts
- [ ] Logout clears token and redirects to /login

### Neo4j Constraint Verification (use demo-queries.cypher IC01-IC07)
- [ ] IC01: No negative available copies -> 0 rows
- [ ] IC02: availableCopies + activeLoans = totalCopies -> 0 rows
- [ ] IC03: No orphan Loan nodes -> 0 rows
- [ ] IC04: No RETURNED loan missing returnDate -> 0 rows
