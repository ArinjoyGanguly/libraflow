# LibraFlow — Architecture Document

> **DA3 College Assignment** | React + Vite + TypeScript + Tailwind CSS | Express + Neo4j

---

## 1. System Overview

LibraFlow is a full-stack Library Management System that migrates the DA2 Oracle/PLSQL
relational design into a Neo4j graph database. It is exposed via a REST API
(Node.js + Express + TypeScript) consumed by a React SPA.

```
[ Browser / React SPA ]
        |  HTTP (JSON)
        v
[ Express REST API -- Node.js + TypeScript, port 5000 ]
        |  Bolt protocol
        v
[ Neo4j Graph Database, port 7687 ]
```

---

## 2. Neo4j Graph Data Model

### 2.1 Node Labels and Properties

#### (:Author)
```
authorId:  String   -- PK, e.g. "A001"
name:      String
email:     String
phone:     String   (optional)
country:   String   (optional)
```
Maps to DA2: Author(Author_Id, Author_Name, Email, Phone, Country)

#### (:Publisher)
```
publisherId: String   -- PK, e.g. "PUB001"
name:        String
address:     String   (optional)
phone:       String   (optional)
email:       String   (optional)
website:     String   (optional)
```
Maps to DA2: Publisher(Publisher_Id, Publisher_Name, Address, Phone, Email, Website)

#### (:Book)
```
bookId:          String    -- PK, e.g. "B001"
isbn:            String    -- UNIQUE constraint
title:           String
genre:           String
language:        String
edition:         String    (optional)
year:            Integer
totalCopies:     Integer
availableCopies: Integer   -- maintained by issue/return transaction
```
Maps to DA2: Books(Book_Id, ISBN, Title, Genre, Language, Edition, Year)

Note: availableCopies is derived but stored redundantly for performance.
It is always updated atomically inside a Neo4j write transaction.

#### (:Library)
```
libraryId: String   -- PK, e.g. "LIB001"
name:      String
address:   String
city:      String
phone:     String   (optional)
email:     String   (optional)
```
Maps to DA2: Library(Library_Id, Library_Name, Address, City, Phone, Email)

#### (:Member)
```
memberId:     String   -- PK, e.g. "M001"
name:         String
email:        String   -- UNIQUE constraint
passwordHash: String
phone:        String   (optional)
address:      String   (optional)
joinDate:     Date
status:       String   -- ACTIVE | SUSPENDED
role:         String   -- fixed value "member"
```
Maps to DA2: Member(Member_Id, Name, Email, Phone, Address, Join_Date)

#### (:Employee)
```
employeeId:   String   -- PK, e.g. "E001"
name:         String
email:        String   -- UNIQUE constraint
passwordHash: String
phone:        String   (optional)
position:     String
libraryId:    String   -- denormalized FK for quick lookup
role:         String   -- fixed value "employee"
```
Maps to DA2: Employee(Employee_Id, Name, Email, Phone, Position, Library_Id)

#### (:Admin)
```
adminId:      String   -- PK, e.g. "ADM001"
name:         String
email:        String   -- UNIQUE constraint
passwordHash: String
role:         String   -- fixed value "admin"
```
Maps to DA2: Admin(Admin_Id, Name, Email)

#### (:Loan)  [NEW — not in DA2]
```
loanId:      String   -- PK, e.g. "L001"
issueDate:   Date
dueDate:     Date
returnDate:  Date     (null until returned)
status:      String   -- ACTIVE | RETURNED | OVERDUE
fineAmount:  Float    -- 0.0 by default; positive if overdue
```
Design rationale: Using a Loan NODE (not a relationship property) means:
  - Each loan has a unique loanId for REST API addressing
  - A member can have multiple historical loans for the same book
  - Fine calculation is a first-class property, not derived at query time
  - Overdue indexing on status is efficient

#### (:Request)
```
requestId:   String   -- PK, e.g. "REQ001"
requestDate: Date
status:      String   -- PENDING | APPROVED | REJECTED
notes:       String   (optional)
```
Maps to DA2: Send_Request(Request_Id, Request_Date, Status)

---

### 2.2 Relationships

```
(:Author)-[:WROTE]->(:Book)
(:Publisher)-[:PUBLISHED]->(:Book)
(:Book)-[:HELD_BY]->(:Library)
(:Member)-[:BORROWED]->(:Loan)
(:Loan)-[:FOR_BOOK]->(:Book)
(:Employee)-[:ISSUED_BY]->(:Loan)
(:Member)-[:SENT]->(:Request)
(:Request)-[:REQUESTS_BOOK]->(:Book)
(:Employee)-[:PROCESSED_BY]->(:Request)
```

All relationships are directional. No properties on relationships
(all transaction data lives on Loan/Request nodes).

---

### 2.3 Entity Mapping from DA2 to Neo4j

| DA2 Oracle Table | Neo4j Node Label | Mapped? |
|-----------------|-----------------|---------|
| Author | (:Author) | Yes, all columns |
| Publisher | (:Publisher) | Yes, all columns |
| Books | (:Book) | Yes, all columns + availableCopies |
| Library | (:Library) | Yes, all columns |
| Member | (:Member) | Yes, all columns + passwordHash + role |
| Employee | (:Employee) | Yes, all columns + passwordHash + role |
| Admin | (:Admin) | Yes, all columns + passwordHash + role |
| Send_Request | (:Request) | Yes, all columns |
| (no equivalent) | (:Loan) | New — replaces junction/history table |

---

## 3. Transaction Rules

### 3.1 Issue a Book (POST /api/loans)

Pre-conditions (checked before creating any nodes):
  1. Book exists and book.availableCopies > 0
  2. Member has no ACTIVE Loan for the same book
  3. Member.status = ACTIVE (not SUSPENDED)

Atomic write transaction steps:
  1. CREATE (:Loan { loanId, issueDate: date(), dueDate: date()+14days, status:'ACTIVE', fineAmount:0.0 })
  2. CREATE (member)-[:BORROWED]->(loan)
  3. CREATE (loan)-[:FOR_BOOK]->(book)
  4. CREATE (employee)-[:ISSUED_BY]->(loan)
  5. SET book.availableCopies = book.availableCopies - 1

Error responses:
  - availableCopies = 0 -> HTTP 400 "No copies available"
  - Active loan exists -> HTTP 409 "Member already has an active loan for this book"
  - Member suspended  -> HTTP 403 "Member account is suspended"

### 3.2 Return a Book (PUT /api/loans/:loanId/return)

Pre-conditions:
  1. Loan exists and loan.status = ACTIVE

Atomic write transaction steps:
  1. SET loan.status = 'RETURNED'
  2. SET loan.returnDate = date()
  3. IF loan.dueDate < date() THEN
       SET loan.fineAmount = duration.between(loan.dueDate, date()).days * FINE_RATE_PER_DAY
     ELSE SET loan.fineAmount = 0.0
  4. SET book.availableCopies = book.availableCopies + 1

Post-conditions:
  - loan.status = RETURNED
  - book.availableCopies restored
  - Fine recorded (0 if on time)

Fine rate: controlled by FINE_RATE_PER_DAY env variable (default: 2 per day)
Loan period: controlled by LOAN_PERIOD_DAYS env variable (default: 14 days)

---

## 4. Constraints and Indexes

Run server/src/cypher/schema.cypher in Neo4j Browser before starting the application.

```cypher
-- Uniqueness constraints (also create backing indexes automatically)
CREATE CONSTRAINT unique_book_isbn    IF NOT EXISTS FOR (b:Book)      REQUIRE b.isbn IS UNIQUE;
CREATE CONSTRAINT unique_book_id      IF NOT EXISTS FOR (b:Book)      REQUIRE b.bookId IS UNIQUE;
CREATE CONSTRAINT unique_member_id    IF NOT EXISTS FOR (m:Member)    REQUIRE m.memberId IS UNIQUE;
CREATE CONSTRAINT unique_member_email IF NOT EXISTS FOR (m:Member)    REQUIRE m.email IS UNIQUE;
CREATE CONSTRAINT unique_author_id    IF NOT EXISTS FOR (a:Author)    REQUIRE a.authorId IS UNIQUE;
CREATE CONSTRAINT unique_publisher_id IF NOT EXISTS FOR (p:Publisher) REQUIRE p.publisherId IS UNIQUE;
CREATE CONSTRAINT unique_library_id   IF NOT EXISTS FOR (l:Library)   REQUIRE l.libraryId IS UNIQUE;
CREATE CONSTRAINT unique_employee_id  IF NOT EXISTS FOR (e:Employee)  REQUIRE e.employeeId IS UNIQUE;
CREATE CONSTRAINT unique_employee_email IF NOT EXISTS FOR (e:Employee) REQUIRE e.email IS UNIQUE;
CREATE CONSTRAINT unique_admin_id     IF NOT EXISTS FOR (a:Admin)     REQUIRE a.adminId IS UNIQUE;
CREATE CONSTRAINT unique_loan_id      IF NOT EXISTS FOR (l:Loan)      REQUIRE l.loanId IS UNIQUE;
CREATE CONSTRAINT unique_request_id   IF NOT EXISTS FOR (r:Request)   REQUIRE r.requestId IS UNIQUE;

-- Performance indexes
CREATE INDEX idx_loan_status    IF NOT EXISTS FOR (l:Loan)    ON (l.status);
CREATE INDEX idx_book_title     IF NOT EXISTS FOR (b:Book)    ON (b.title);
CREATE INDEX idx_request_status IF NOT EXISTS FOR (r:Request) ON (r.status);
```

---

## 5. Authentication and Authorization

```
Login flow:
  POST /api/auth/login
  -> Find node by email across Member, Employee, Admin labels
  -> bcrypt.compare(plaintext, passwordHash)
  -> jwt.sign({ userId, role, name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
  -> Return { token, user }

Every protected request:
  Authorization: Bearer <token>
  -> auth.middleware.ts: jwt.verify(token, JWT_SECRET)
  -> Attach decoded payload to req.user
  -> requireRole('employee', 'admin') middleware: 403 if role not in list
```

JWT payload shape:
```
{ userId: "M001", role: "member", name: "Alice Kumar" }
```

Role hierarchy:
  member   -- can browse books, submit/view own requests, view own loans
  employee -- all member capabilities + issue/return books, approve/reject requests, view all members
  admin    -- all employee capabilities + add/delete books, authors, publishers, employees, view stats

---

## 6. Module Boundaries

### Backend
```
Auth Module:     auth.routes -> auth.controller -> auth.service
Book Module:     books.routes -> books.controller -> books.service
Loan Module:     loans.routes -> loans.controller -> loans.service  [most complex]
Request Module:  requests.routes -> requests.controller -> requests.service
Member Module:   members.routes -> members.controller  [no service needed]
Admin Module:    admin.routes -> admin.controller  [no service needed]
```

Service files contain only Cypher queries and Neo4j session logic.
Controllers contain only HTTP request/response handling.
Routes contain only Express router declarations and middleware.

### Frontend
```
Auth Module:     LoginPage + AuthContext + useAuth hook
Book Module:     BooksPage + BookDetailPage + BookCard
Loan Module:     LoansPage + LoanRow + issue/return forms
Request Module:  RequestsPage + RequestCard + submit/approve flows
Member Module:   MembersPage + UserRow
Admin Module:    AdminPage + stats dashboard
```

---

## 7. Environment Configuration

server/.env (copy from .env.example and fill in values):
```
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password_here
JWT_SECRET=replace_with_long_random_string_at_least_32_chars
JWT_EXPIRES_IN=24h
PORT=5000
FINE_RATE_PER_DAY=2
LOAN_PERIOD_DAYS=14
```

client runs at: http://localhost:5173 (Vite default)
server runs at: http://localhost:5000

CORS origin in app.ts is hardcoded to http://localhost:5173 for development.

---

## 8. Technology Versions

| Package | Version | Notes |
|---------|---------|-------|
| Node.js | 20 LTS | Minimum version |
| React | 18 | Hooks + functional components only |
| Vite | 5 | --template react-ts scaffold |
| TypeScript | 5 | strict mode enabled |
| Tailwind CSS | 3 | PostCSS integration |
| Express | 4 | Callback-style (not async generators) |
| neo4j-driver | 5 | Official Neo4j JS driver |
| jsonwebtoken | 9 | JWT signing and verification |
| bcryptjs | 2 | Password hashing (pure JS, no native deps) |
| axios | latest | HTTP client on frontend |
| react-router-dom | 6 | Client-side routing |

---

## 9. Key Cypher Query Patterns

### Find all active loans with member and book info
```cypher
MATCH (m:Member)-[:BORROWED]->(l:Loan {status:'ACTIVE'})-[:FOR_BOOK]->(b:Book)
RETURN m.name AS member, m.memberId, b.title AS book, b.bookId,
       l.loanId, l.issueDate, l.dueDate
ORDER BY l.dueDate ASC
```

### Find overdue loans
```cypher
MATCH (m:Member)-[:BORROWED]->(l:Loan {status:'ACTIVE'})-[:FOR_BOOK]->(b:Book)
WHERE l.dueDate < date()
RETURN m.name, m.email, b.title, l.loanId, l.dueDate,
       duration.between(l.dueDate, date()).days AS daysOverdue
```

### Book search
```cypher
MATCH (b:Book)
WHERE toLower(b.title) CONTAINS toLower($search)
   OR toLower(b.genre) CONTAINS toLower($search)
OPTIONAL MATCH (a:Author)-[:WROTE]->(b)
OPTIONAL MATCH (p:Publisher)-[:PUBLISHED]->(b)
RETURN b, a.name AS authorName, p.name AS publisherName
LIMIT 50
```

### Admin stats (single query)
```cypher
MATCH (b:Book) WITH count(b) AS totalBooks
MATCH (m:Member) WITH totalBooks, count(m) AS totalMembers
MATCH (l:Loan {status:'ACTIVE'}) WITH totalBooks, totalMembers, count(l) AS activeLoans
OPTIONAL MATCH (r:Request {status:'PENDING'})
RETURN totalBooks, totalMembers, activeLoans, count(r) AS pendingRequests
```
