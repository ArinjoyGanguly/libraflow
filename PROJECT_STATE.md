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
Phase 4 — Domain CRUD APIs          COMPLETE  <-- finished this session
Phase 5 — Auth & Loan Transactions  NOT STARTED
Phase 6 — Frontend UI               NOT STARTED
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

## Phase 5 Tasks (Authentication & Loan Transactions)

Next tasks for Phase 5:
1. **Authentication & Authorization**:
   - `auth.service.ts`, `auth.controller.ts`, `auth.routes.ts`, `auth.middleware.ts`
   - Unified login (`POST /api/auth/login`) looking up Member, Employee, or Admin by email
   - Bcrypt password comparison
   - JWT generation with `{ userId, role, name }`
   - Route protection middleware (`verifyToken`, `requireRole('employee', 'admin')`)
2. **Loan Management & Atomic Transactions**:
   - `loans.service.ts`, `loans.controller.ts`, `loans.routes.ts`
   - Issue book transaction (`POST /api/loans`): atomic copy deduction and loan creation
   - Return book transaction (`PUT /api/loans/:loanId/return`): atomic copy restoration and fine calculation
   - Overdue loans query (`GET /api/loans/overdue`)
3. **Admin Dashboard Analytics**:
   - `GET /api/admin/stats`: single aggregate graph query for total books, members, active loans, and pending requests
4. **Phase 6 Frontend Development**:
   - React + Vite + Tailwind CSS UI implementation

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
