# LibraFlow — Project State Tracker
> **Course Assignment**: DA3 — Database Management Systems
> **Tech Stack**: React + Vite + TypeScript + Tailwind CSS / Node.js + Express + TypeScript / Neo4j
> **Last Updated**: 2026-10-12

---

## Current Phase

```
Phase 1 — Architecture & Planning   COMPLETE
Phase 2 — Database Layer            COMPLETE  <-- finished this session
Phase 3 — Backend API               NOT STARTED
Phase 4 — Frontend UI               NOT STARTED
Phase 5 — Integration & Testing     NOT STARTED
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

## Phase 3 Must Create (Exact Order)

### Step 3.1 — Root scaffolding
1.  LIBRARY/.gitignore
2.  LIBRARY/README.md

### Step 3.2 — Backend scaffold (run from LIBRARY/)
```bash
mkdir server
cd server
npm init -y
npm install express neo4j-driver dotenv bcryptjs jsonwebtoken cors
npm install -D typescript ts-node-dev @types/express @types/node @types/bcryptjs @types/jsonwebtoken @types/cors
npx tsc --init
```

### Step 3.3 — Backend source files (create in this order)
3.  LIBRARY/server/tsconfig.json      (strict: true, module: CommonJS, outDir: ./dist)
4.  LIBRARY/server/.env.example
5.  LIBRARY/server/src/types/index.ts (UserPayload, BookDTO, LoanDTO, RequestDTO)
6.  LIBRARY/server/src/config/neo4j.ts (driver singleton + getSession)
7.  LIBRARY/server/src/app.ts         (Express setup, CORS, body-parser, route stubs)
8.  LIBRARY/server/src/server.ts      (entry point, verifyConnectivity on startup)
9.  LIBRARY/server/src/middleware/auth.middleware.ts
10. LIBRARY/server/src/middleware/error.middleware.ts
11. LIBRARY/server/src/routes/auth.routes.ts
12. LIBRARY/server/src/controllers/auth.controller.ts
13. LIBRARY/server/src/services/auth.service.ts
14. LIBRARY/server/src/routes/books.routes.ts
15. LIBRARY/server/src/controllers/books.controller.ts
16. LIBRARY/server/src/services/books.service.ts
17. LIBRARY/server/src/routes/loans.routes.ts
18. LIBRARY/server/src/controllers/loans.controller.ts
19. LIBRARY/server/src/services/loans.service.ts
20. LIBRARY/server/src/routes/requests.routes.ts
21. LIBRARY/server/src/controllers/requests.controller.ts
22. LIBRARY/server/src/services/requests.service.ts
23. LIBRARY/server/src/routes/members.routes.ts
24. LIBRARY/server/src/controllers/members.controller.ts
25. LIBRARY/server/src/routes/admin.routes.ts
26. LIBRARY/server/src/controllers/admin.controller.ts

### Phase 3 must NOT start until:
  - Neo4j is running locally (Desktop or Server)
  - database/constraints.cypher applied in Neo4j Browser -> SHOW CONSTRAINTS returns 13+ rows
  - database/seed.cypher applied in Neo4j Browser -> MATCH (n) RETURN count(n) returns 37
  - IC01-IC04 in demo-queries.cypher all return 0 rows

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
