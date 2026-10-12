# LibraFlow — Implementation Plan

> **DA3 Assignment** | 5 Phases | Neo4j + Express + React

---

## Overview

This plan is designed to be achievable by a second-year student working incrementally.
Each phase has a clear definition of done before the next phase begins.

```
Phase 1  Architecture & Planning    (COMPLETE)
Phase 2  Scaffolding & Database     (est. 2-3 hours)
Phase 3  Backend API                (est. 4-5 hours)
Phase 4  Frontend UI                (est. 4-5 hours)
Phase 5  Integration & Testing      (est. 2-3 hours)
```

---

## Phase 1 — Architecture & Planning  [COMPLETE]

### Deliverables produced
- [x] PROJECT_STATE.md (workspace root)
- [x] docs/ARCHITECTURE.md
- [x] docs/IMPLEMENTATION_PLAN.md

### Decisions locked in Phase 1
- Graph model: 8 original DA2 entities + Loan node + Request node = 10 node labels
- Loan as node (not relationship) for fine and history tracking
- JWT auth, three roles: member / employee / admin
- Tailwind CSS v3, Neo4j driver v5, Express v4

---

## Phase 2 — Scaffolding & Database

### Goal
A running backend that connects to Neo4j, with schema constraints applied
and seed data loaded. Frontend Vite project scaffolded but not yet wired to API.

### Step 2.1 — Root config files

Create LIBRARY/.gitignore:
```
node_modules/
dist/
build/
.env
*.log
.DS_Store
```

Create LIBRARY/README.md with:
- Project overview (DA3 assignment)
- Prerequisites (Node 20, Neo4j 5.x)
- Setup instructions for server and client
- How to apply schema.cypher and seed.cypher
- How to start dev servers

### Step 2.2 — Backend scaffold

Run from LIBRARY/:
```bash
mkdir server && cd server
npm init -y
npm install express neo4j-driver dotenv bcryptjs jsonwebtoken cors
npm install -D typescript ts-node-dev @types/express @types/node @types/bcryptjs @types/jsonwebtoken @types/cors
npx tsc --init
```

Create server/tsconfig.json:
- target: ES2020
- module: CommonJS
- rootDir: ./src
- outDir: ./dist
- strict: true
- esModuleInterop: true

Add server/package.json scripts:
- "dev": "ts-node-dev --respawn src/server.ts"
- "build": "tsc"
- "start": "node dist/server.js"

### Step 2.3 — Neo4j config

Create server/.env.example (copy to .env and fill in values):
```
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password_here
JWT_SECRET=replace_with_long_random_string
JWT_EXPIRES_IN=24h
PORT=5000
FINE_RATE_PER_DAY=2
LOAN_PERIOD_DAYS=14
```

Create server/src/config/neo4j.ts — driver singleton with getSession() export.

### Step 2.4 — Express bootstrap

Create server/src/app.ts:
- cors() middleware (origin: http://localhost:5173)
- express.json()
- Route mounting stubs returning 501 for now
- Error middleware at bottom

Create server/src/server.ts:
- Import app
- driver.verifyConnectivity() on startup
- app.listen(PORT)

### Step 2.5 — Cypher files

Create server/src/cypher/schema.cypher with:
- 10 uniqueness constraints (one per entity primary key)
- 2 email uniqueness constraints (Member, Employee)
- 3 performance indexes (Loan.status, Book.title, Request.status)

Create server/src/cypher/seed.cypher with:
- 2 Authors (A001, A002)
- 2 Publishers (PUB001, PUB002)
- 5 Books (B001-B005) with genre, isbn, totalCopies, availableCopies
- 1 Library (LIB001)
- 3 Members (M001-M003) — passwords: "password123" hashed with bcrypt
- 2 Employees (E001-E002) — passwords: "employee123" hashed with bcrypt
- 1 Admin (ADM001) — password: "admin123" hashed with bcrypt
- All WROTE / PUBLISHED / HELD_BY relationships
- 2 Loans (L001 ACTIVE, L002 RETURNED)
- 1 Request (REQ001 PENDING)

Run both files in Neo4j Browser (paste and execute).

### Step 2.6 — Frontend scaffold

Run from LIBRARY/:
```bash
cd client
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
npm install axios react-router-dom
npm install -D @types/node
```

Update client/tailwind.config.js content paths:
```js
content: ["./index.html", "./src/**/*.{ts,tsx}"]
```

Add Tailwind directives to client/src/index.css:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Create client/src/types/index.ts with shared TypeScript interfaces:
Book, Author, Publisher, Library, Member, Employee, Admin, Loan, Request, AuthUser

### Phase 2 Definition of Done
- [ ] cd server && npm run dev — starts without error, prints "Connected to Neo4j"
- [ ] Neo4j Browser: MATCH (n) RETURN count(n) — shows > 0 nodes
- [ ] cd client && npm run dev — Vite dev server starts on port 5173
- [ ] npx tsc --noEmit in /server — zero errors

---

## Phase 3 — Backend API

### Goal
All REST endpoints implemented, protected by JWT middleware, and manually
tested with Postman or the VS Code REST Client extension.

### Step 3.1 — Shared types and middleware

Create server/src/types/index.ts:
- UserPayload interface (userId, role, name)
- Extend Express Request type to include user?: UserPayload
- DTO interfaces for all entities

Create server/src/middleware/auth.middleware.ts:
- verifyToken: reads Authorization header, calls jwt.verify
- requireRole(...roles): checks decoded payload role

Create server/src/middleware/error.middleware.ts:
- Catches errors thrown from controllers
- Returns { error: message } JSON with appropriate status code

### Step 3.2 — Auth module

Files: routes/auth.routes.ts, controllers/auth.controller.ts, services/auth.service.ts

POST /api/auth/register:
- Hash password with bcryptjs (saltRounds: 10)
- Create (:Member) node, return JWT

POST /api/auth/login:
- MATCH node by email across Member, Employee, Admin labels
- bcrypt.compare password
- Return signed JWT with {userId, role, name}

GET /api/auth/me:
- Requires verifyToken middleware
- Return decoded user from req.user

### Step 3.3 — Books module

Files: routes/books.routes.ts, controllers/books.controller.ts, services/books.service.ts

GET /api/books:
- Optional ?search= parameter: WHERE b.title CONTAINS $search
- Return array of books with author name and publisher name joined

GET /api/books/:bookId:
- Return full book detail with author, publisher, library

POST /api/books:
- Requires Employee or Admin role
- CREATE (:Book) + relationships to Author and Publisher

PUT /api/books/:bookId:
- Requires Employee or Admin role
- SET properties on Book node (NOT availableCopies — managed by loan logic)

DELETE /api/books/:bookId:
- Requires Admin role
- Only allowed if availableCopies = totalCopies (no active loans)

### Step 3.4 — Loans module (most critical)

Files: routes/loans.routes.ts, controllers/loans.controller.ts, services/loans.service.ts

POST /api/loans — issueBook():
1. Check book.availableCopies > 0
2. Check no existing ACTIVE loan for same member+book
3. Check member.status = ACTIVE
4. Inside Neo4j write transaction:
   - CREATE Loan node
   - CREATE (member)-[:BORROWED]->(loan)
   - CREATE (loan)-[:FOR_BOOK]->(book)
   - CREATE (employee)-[:ISSUED_BY]->(loan)
   - SET book.availableCopies -= 1
5. Return new loan

PUT /api/loans/:loanId/return — returnBook():
1. Find ACTIVE loan by loanId
2. Inside Neo4j write transaction:
   - SET loan.status = RETURNED
   - SET loan.returnDate = date()
   - Calculate fine if overdue
   - SET book.availableCopies += 1
3. Return updated loan

GET /api/loans/overdue:
- MATCH (l:Loan {status:'ACTIVE'}) WHERE l.dueDate < date()

### Step 3.5 — Requests module

Files: routes/requests.routes.ts, controllers/requests.controller.ts, services/requests.service.ts

POST /api/requests (Member):
- Create (:Request) node + (member)-[:SENT]->(request) + (request)-[:REQUESTS_BOOK]->(book)

PUT /api/requests/:requestId/approve (Employee):
- SET request.status = APPROVED
- Call loans.service.issueBook() — reuse, do not duplicate logic
- CREATE (employee)-[:PROCESSED_BY]->(request)

PUT /api/requests/:requestId/reject (Employee):
- SET request.status = REJECTED
- CREATE (employee)-[:PROCESSED_BY]->(request)

### Step 3.6 — Members and Admin modules

Members controller (no service file):
- GET /api/members — MATCH (m:Member) RETURN m (exclude passwordHash)
- GET /api/members/:memberId — include loan history
- PUT /api/members/:memberId — update allowed fields only

Admin controller:
- GET /api/admin/stats — single aggregate query
- POST /api/admin/authors — CREATE (:Author)
- POST /api/admin/publishers — CREATE (:Publisher)
- POST /api/admin/libraries — CREATE (:Library)
- POST /api/admin/employees — CREATE (:Employee) with hashed password

### Phase 3 Definition of Done
- [ ] All 20 endpoints return correct HTTP status codes
- [ ] JWT protection verified for all protected routes
- [ ] Full issue -> return cycle works in Postman
- [ ] availableCopies stays consistent (no negative values)
- [ ] npx tsc --noEmit passes with zero errors

---

## Phase 4 — Frontend UI

### Goal
A polished React SPA where all three roles can perform their tasks.

### Design System

Colors:
- Background: slate-900
- Sidebar: slate-800
- Card: slate-700 / white
- Accent: sky-500
- Danger: red-500
- Success: emerald-500

Font: Inter (add via Google Fonts link in index.html)

### Step 4.1 — Global setup

Update client/src/index.css with Tailwind + custom font import.
Create client/src/context/AuthContext.tsx.
Create client/src/hooks/useAuth.ts.
Create client/src/hooks/useApi.ts (generic data fetching hook).
Create client/src/services/api.ts (Axios instance with interceptors).
Create client/src/App.tsx with React Router routes and ProtectedRoute wrapper.

Route structure:
```
/               -> redirect to /dashboard if logged in, else /login
/login          -> LoginPage (public)
/dashboard      -> DashboardPage (all roles)
/books          -> BooksPage (all roles)
/books/:bookId  -> BookDetailPage (all roles)
/loans          -> LoansPage (employee/admin only)
/requests       -> RequestsPage (member sees own, employee sees all)
/members        -> MembersPage (employee/admin only)
/admin          -> AdminPage (admin only)
```

### Step 4.2 — Common components

Build these reusable components first:
- Button.tsx: variant prop (primary, secondary, danger), loading state
- Input.tsx: label, error message, controlled
- Badge.tsx: status colors (ACTIVE=sky, RETURNED=emerald, OVERDUE=red, PENDING=amber)
- Modal.tsx: overlay + close on backdrop click
- Spinner.tsx: animated loading indicator
- Table.tsx: generic sortable table with empty state

### Step 4.3 — Layout components

- Sidebar.tsx: role-aware navigation links, LibraFlow logo
- Navbar.tsx: breadcrumb + user name + logout button
- PageWrapper.tsx: consistent padding and max-width

### Step 4.4 — Pages

LoginPage: centered card, email + password inputs, error alert

DashboardPage:
- Member: stats (active loans, pending requests) + recent activity
- Employee: quick-action buttons (issue book, process requests)
- Admin: full stats cards from /api/admin/stats

BooksPage: search input + results table + availability badge

BookDetailPage: full book info, author, publisher, copies available

LoansPage (Employee/Admin):
- Tabs: Active | Overdue | All History
- Issue Book form in modal
- Return button on each active loan row

RequestsPage:
- Member view: own requests list + Submit Request button
- Employee view: pending requests table + Approve/Reject buttons

MembersPage (Employee/Admin): searchable table with member status badge

AdminPage:
- Stats cards at top
- Add Author form
- Add Publisher form
- Add Employee form

### Step 4.5 — Feature components

- BookCard.tsx: compact book display for search results
- LoanRow.tsx: loan table row with status badge and actions
- RequestCard.tsx: request card with status and approve/reject buttons
- UserRow.tsx: member or employee row in table

### Phase 4 Definition of Done
- [ ] Login works; wrong credentials show error
- [ ] Role-based navigation renders correctly for each role
- [ ] Book list loads from real API
- [ ] Member can submit a borrow request
- [ ] Employee can issue a book and process a return
- [ ] Admin stats page shows live database counts
- [ ] No browser console errors

---

## Phase 5 — Integration & Testing

### Goal
Verify full-stack works end-to-end and prepare submission.

### Step 5.1 — End-to-end scenarios

Scenario A — Member borrowing flow:
  1. Login as M001 (member)
  2. Browse books, submit request for B003
  3. Login as E001 (employee)
  4. Approve REQ — loan L003 created, B003.availableCopies decremented
  5. Login as M001 — see active loan in dashboard
  6. Login as E001 — return loan L003
  7. Verify B003.availableCopies restored

Scenario B — Edge cases:
  - Issue book with availableCopies=0 -> 400 error shown in UI
  - Double issue same book -> 409 error shown in UI
  - Access /admin as member -> redirect

### Step 5.2 — Neo4j data integrity checks

Run in Neo4j Browser after all tests:
  MATCH (b:Book) WHERE b.availableCopies < 0 RETURN b
  -> Expected: 0 rows

  MATCH (l:Loan) WHERE NOT ()-[:BORROWED]->(l) RETURN l
  -> Expected: 0 rows

  MATCH (l:Loan {status:'RETURNED'}) WHERE l.returnDate IS NULL RETURN l
  -> Expected: 0 rows

### Step 5.3 — Submission checklist
- [ ] README.md has complete setup + run instructions
- [ ] .env is NOT in git history (check: git log --all --full-history -- "**/.env")
- [ ] schema.cypher and seed.cypher committed
- [ ] npm run build in /client: zero errors
- [ ] npx tsc --noEmit in /server: zero errors
- [ ] Screenshots of working app in README.md or docs/

---

## File Creation Order (Complete List)

Phase 2 (14 files):
  LIBRARY/.gitignore
  LIBRARY/README.md
  LIBRARY/server/package.json
  LIBRARY/server/tsconfig.json
  LIBRARY/server/.env.example
  LIBRARY/server/src/config/neo4j.ts
  LIBRARY/server/src/app.ts
  LIBRARY/server/src/server.ts
  LIBRARY/server/src/types/index.ts
  LIBRARY/server/src/cypher/schema.cypher
  LIBRARY/server/src/cypher/seed.cypher
  LIBRARY/client/ (Vite scaffold)
  LIBRARY/client/tailwind.config.js (update)
  LIBRARY/client/src/types/index.ts

Phase 3 (18 files):
  LIBRARY/server/src/middleware/auth.middleware.ts
  LIBRARY/server/src/middleware/error.middleware.ts
  LIBRARY/server/src/routes/auth.routes.ts
  LIBRARY/server/src/controllers/auth.controller.ts
  LIBRARY/server/src/services/auth.service.ts
  LIBRARY/server/src/routes/books.routes.ts
  LIBRARY/server/src/controllers/books.controller.ts
  LIBRARY/server/src/services/books.service.ts
  LIBRARY/server/src/routes/loans.routes.ts
  LIBRARY/server/src/controllers/loans.controller.ts
  LIBRARY/server/src/services/loans.service.ts
  LIBRARY/server/src/routes/requests.routes.ts
  LIBRARY/server/src/controllers/requests.controller.ts
  LIBRARY/server/src/services/requests.service.ts
  LIBRARY/server/src/routes/members.routes.ts
  LIBRARY/server/src/controllers/members.controller.ts
  LIBRARY/server/src/routes/admin.routes.ts
  LIBRARY/server/src/controllers/admin.controller.ts

Phase 4 (24 files):
  LIBRARY/client/src/context/AuthContext.tsx
  LIBRARY/client/src/hooks/useAuth.ts
  LIBRARY/client/src/hooks/useApi.ts
  LIBRARY/client/src/services/api.ts
  LIBRARY/client/src/components/common/Button.tsx
  LIBRARY/client/src/components/common/Input.tsx
  LIBRARY/client/src/components/common/Badge.tsx
  LIBRARY/client/src/components/common/Modal.tsx
  LIBRARY/client/src/components/common/Spinner.tsx
  LIBRARY/client/src/components/common/Table.tsx
  LIBRARY/client/src/components/layout/Sidebar.tsx
  LIBRARY/client/src/components/layout/Navbar.tsx
  LIBRARY/client/src/components/layout/PageWrapper.tsx
  LIBRARY/client/src/components/features/BookCard.tsx
  LIBRARY/client/src/components/features/LoanRow.tsx
  LIBRARY/client/src/components/features/RequestCard.tsx
  LIBRARY/client/src/components/features/UserRow.tsx
  LIBRARY/client/src/pages/LoginPage.tsx
  LIBRARY/client/src/pages/DashboardPage.tsx
  LIBRARY/client/src/pages/BooksPage.tsx
  LIBRARY/client/src/pages/BookDetailPage.tsx
  LIBRARY/client/src/pages/LoansPage.tsx
  LIBRARY/client/src/pages/RequestsPage.tsx
  LIBRARY/client/src/pages/MembersPage.tsx
  LIBRARY/client/src/pages/AdminPage.tsx
  LIBRARY/client/src/App.tsx
