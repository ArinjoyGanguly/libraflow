# LibraFlow — Project State Tracker
> **Course Assignment**: DA3 — Database Management Systems
> **Tech Stack**: React + Vite + TypeScript + Tailwind CSS / Node.js + Express + TypeScript / Neo4j
> **Last Updated**: 2026-10-12

---

## Current Phase

```
Phase 1 — Architecture & Planning   COMPLETE
Phase 2 — Scaffolding & Database    NOT STARTED
Phase 3 — Backend API               NOT STARTED
Phase 4 — Frontend UI               NOT STARTED
Phase 5 — Integration & Testing     NOT STARTED
```

---

## Workspace Audit (Phase 1)

The LIBRARY folder was completely empty when Phase 1 began.
No existing files were deleted or overwritten.

Files created by Phase 1:
  LIBRARY/PROJECT_STATE.md
  LIBRARY/docs/ARCHITECTURE.md
  LIBRARY/docs/IMPLEMENTATION_PLAN.md

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

---

## Planned Folder Structure

```
LIBRARY/
|-- client/
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
|       |   |-- common/     (Button, Input, Modal, Badge, Spinner, Table)
|       |   |-- layout/     (Navbar, Sidebar, Footer, PageWrapper)
|       |   \-- features/   (BookCard, LoanRow, RequestCard, UserRow)
|       |-- context/
|       |   \-- AuthContext.tsx
|       |-- hooks/
|       |   |-- useAuth.ts
|       |   \-- useApi.ts
|       |-- pages/
|       |   |-- LoginPage.tsx
|       |   |-- DashboardPage.tsx
|       |   |-- BooksPage.tsx
|       |   |-- BookDetailPage.tsx
|       |   |-- LoansPage.tsx
|       |   |-- RequestsPage.tsx
|       |   |-- MembersPage.tsx
|       |   \-- AdminPage.tsx
|       |-- services/
|       |   \-- api.ts
|       \-- types/
|           \-- index.ts
|
|-- server/
|   |-- package.json
|   |-- tsconfig.json
|   |-- .env.example
|   \-- src/
|       |-- server.ts
|       |-- app.ts
|       |-- config/
|       |   \-- neo4j.ts
|       |-- middleware/
|       |   |-- auth.middleware.ts
|       |   \-- error.middleware.ts
|       |-- routes/
|       |   |-- auth.routes.ts
|       |   |-- books.routes.ts
|       |   |-- members.routes.ts
|       |   |-- loans.routes.ts
|       |   |-- requests.routes.ts
|       |   \-- admin.routes.ts
|       |-- controllers/
|       |   |-- auth.controller.ts
|       |   |-- books.controller.ts
|       |   |-- members.controller.ts
|       |   |-- loans.controller.ts
|       |   |-- requests.controller.ts
|       |   \-- admin.controller.ts
|       |-- services/
|       |   |-- auth.service.ts
|       |   |-- books.service.ts
|       |   |-- loans.service.ts
|       |   \-- requests.service.ts
|       |-- cypher/
|       |   |-- schema.cypher
|       |   \-- seed.cypher
|       \-- types/
|           \-- index.ts
|
|-- docs/
|   |-- ARCHITECTURE.md
|   \-- IMPLEMENTATION_PLAN.md
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

## Commands to Run in Phase 2

```bash
# Run from LIBRARY/ root

# 1. Scaffold backend
mkdir server
cd server
npm init -y
npm install express neo4j-driver dotenv bcryptjs jsonwebtoken cors
npm install -D typescript ts-node-dev @types/express @types/node @types/bcryptjs @types/jsonwebtoken @types/cors
npx tsc --init
cd ..

# 2. Scaffold frontend
mkdir client
cd client
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
npm install axios react-router-dom
npm install -D @types/node
cd ..

# 3. Initialize git
git init
git add .
git commit -m "Phase 1: architecture and planning documents"
```

---

## Test Plan (Phase 5)

### Backend (Postman or VS Code REST Client)
- [ ] POST /api/auth/login with valid creds -> 200 + JWT
- [ ] POST /api/auth/login with wrong password -> 401
- [ ] POST /api/loans without JWT -> 401
- [ ] POST /api/loans as Member role -> 403
- [ ] Issue book with availableCopies = 0 -> 400
- [ ] Issue same book to same member (active loan exists) -> 409
- [ ] Return book -> availableCopies increments, loan.status = RETURNED
- [ ] GET /api/loans/overdue -> only past-due-date active loans

### Frontend (Manual browser testing)
- [ ] Login page loads and handles errors correctly
- [ ] Member dashboard shows active loans and pending requests
- [ ] Employee can approve a request -> loan appears in list
- [ ] Admin stats page shows live database counts
- [ ] Logout clears token and redirects to /login

### Neo4j Constraint Verification (Neo4j Browser)
```cypher
// No negative available copies
MATCH (b:Book) WHERE b.availableCopies < 0 RETURN b;
// Expected: 0 rows

// No orphan loan nodes
MATCH (l:Loan) WHERE NOT ()-[:BORROWED]->(l) RETURN l;
// Expected: 0 rows

// All RETURNED loans have returnDate
MATCH (l:Loan {status:'RETURNED'}) WHERE l.returnDate IS NULL RETURN l;
// Expected: 0 rows
```

---

## Phase 2 Must Create (Exact Order)

1.  LIBRARY/.gitignore
2.  LIBRARY/README.md
3.  LIBRARY/server/package.json   (via npm init -y)
4.  LIBRARY/server/tsconfig.json
5.  LIBRARY/server/.env.example
6.  LIBRARY/server/src/config/neo4j.ts
7.  LIBRARY/server/src/app.ts
8.  LIBRARY/server/src/server.ts
9.  LIBRARY/server/src/types/index.ts
10. LIBRARY/server/src/cypher/schema.cypher
11. LIBRARY/server/src/cypher/seed.cypher
12. LIBRARY/client/   (via npm create vite)
13. LIBRARY/client/tailwind.config.js  (update content paths)
14. LIBRARY/client/src/types/index.ts

Phase 2 must NOT proceed to Phase 3 until:
  - neo4j.ts driver connects without error
  - schema.cypher has been run in Neo4j Browser
  - seed.cypher has been run in Neo4j Browser
  - MATCH (n) RETURN count(n) shows > 0 in Neo4j Browser
  - npm run dev in /server prints "Connected to Neo4j"
  - npm run dev in /client starts Vite on port 5173
