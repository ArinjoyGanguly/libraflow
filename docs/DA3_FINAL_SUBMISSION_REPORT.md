# LibraFlow: Smart Library Management System
## DBMS DA3 Final Project Submission Report
### Graph Database Extension of Oracle SQL/PLSQL Relational Library System

---

**Course**: Database Management Systems (DBMS) — DA3  
**Project Title**: LibraFlow — Graph-Powered Smart Library Management System  
**Previous Baseline**: DA2 Oracle SQL/PLSQL Library Management System  
**Primary Database**: Neo4j Graph Database (Community Edition v5.x)  
**Full-Stack Implementation**: React 18 + Vite + TypeScript (Frontend) / Node.js + Express + TypeScript (Backend)  
**Student / Team Details**: `[STUDENT_NAME / ROLL_NUMBER / BATCH_PLACEHOLDER]`  
**Date of Submission**: October 2026  

---

## 1. Abstract

LibraFlow is an end-to-end full-stack Library Management System that transitions a traditional relational database (previously engineered in Oracle 19c SQL and PL/SQL for DA2) into a native graph database architecture powered by Neo4j and Cypher. While relational databases model relationships indirectly via foreign keys and compute multi-hop joins through expensive table scans and nested loops, LibraFlow leverages Neo4j's index-free adjacency. Nodes (`Author`, `Publisher`, `Book`, `Library`, `Member`, `Employee`, `Admin`, `Loan`, `Request`) store direct physical record pointers to their connected relationships (`WROTE`, `PUBLISHED`, `HELD_BY`, `BORROWED`, `FOR_BOOK`, etc.). 

The full-stack application provides a modern, responsive user interface styled with Tailwind CSS, a type-safe Express.js REST API with ACID transactional borrowing operations, real-time graph discovery (author bibliographies, publisher imprints, co-borrowing clusters), 3-hop collaborative filtering recommendations, and comprehensive library circulation analytics.

---

## 2. Problem Statement

Traditional relational library management systems experience several architectural limitations as catalog sizes and circulation networks expand:
1. **Multi-Hop Traversal Latency**: Finding collaborative book recommendations (readers who borrowed Book A also borrowed Book B) requires self-joining large loan tables multiple times ($O(N^k)$ complexity).
2. **Schema Rigidity**: Adding diverse relationships (e.g., co-authorship, multi-branch holdings, hierarchical staff administration) requires schema migrations, alter-table operations, and nullable foreign-key columns.
3. **Complex Aggregations**: Generating real-time analytics across loans, books, members, and branches involves nested aggregations with complex `GROUP BY` clauses that strain relational query optimizers.
4. **Relational-Object Impedance Mismatch**: Web clients consume hierarchical JSON graph payloads, requiring multi-table SQL queries, ORM mapping overhead, and repetitive serialization routines.

---

## 3. Project Objectives

1. **Schema Migration**: Transform all 8 relational entities from the DA2 Oracle schema into native Neo4j node labels, adding dedicated transactional nodes for `Loan` and `Request`.
2. **Index-Free Adjacency**: Implement direct relationship pointers to execute constant-time $O(1)$ relationship traversals regardless of total graph size.
3. **Transactional Integrity**: Maintain strict ACID guarantees for borrowing operations (decrementing physical copy counts atomically upon issuing, incrementing upon return, and preventing double loans).
4. **Graph Discovery & Collaborative Recommendations**: Implement 3-hop graph pattern matching to deliver explainable book recommendations without statistical black-box models.
5. **Real-Time Circulation Analytics**: Execute parameterized Cypher aggregations for popular books, genre distribution, patron activity, campus branch allocation, and overdue delinquency tracking.
6. **Full-Stack Integration & Differentiated Diagnostics**: Provide a dark navy/purple web interface that communicates with the backend via a typed REST API, offering infrastructure diagnostics that explicitly differentiate between backend downtime, database unavailability, and query errors.

---

## 4. Review of the Baseline DA2 Oracle SQL/PLSQL System

In the prerequisite DA2 phase, the library system was implemented in Oracle 19c using relational DDL, triggers, and PL/SQL stored procedures:

### Original DA2 Relational Tables:
1. `Author(Author_Id, Author_Name, Email, Phone, Country)`
2. `Publisher(Publisher_Id, Publisher_Name, Address, Phone, Email, Website)`
3. `Books(Book_Id, ISBN, Title, Genre, Language, Edition, Year)`
4. `Library(Library_Id, Library_Name, Address, City, Phone, Email)`
5. `Member(Member_Id, Name, Email, Phone, Address, Join_Date)`
6. `Employee(Employee_Id, Name, Email, Phone, Position, Library_Id)`
7. `Admin(Admin_Id, Name, Email)`
8. `Send_Request(Request_Id, Request_Date, Status)`

### Original Relational Constraints & PL/SQL Logic:
- **Foreign Keys**: `Books` referenced `Author(Author_Id)` and `Publisher(Publisher_Id)`. `Employee` referenced `Library(Library_Id)`.
- **PL/SQL Triggers**: Triggers were deployed to update book copy counts and prevent borrowing when physical stock was depleted.
- **Relational Limitations Observed in DA2**: Queries analyzing reading affinity across patrons required joining `Member`, `Loan_Junction`, `Books`, `Loan_Junction`, and `Member` across indexed B-trees, with execution times growing as circulation history accumulated.

---

## 5. Motivation for the Neo4j Graph Extension

| Architectural Dimension | Oracle SQL/PLSQL (DA2) | Neo4j Graph Database (DA3) |
|---|---|---|
| **Data Representation** | Tables, tuples, primary/foreign keys | Nodes, labels, directional typed relationships |
| **Relationship Traversal** | Relational JOIN via index lookups ($O(\log N)$ per hop) | Index-free adjacency via double-linked memory pointers ($O(1)$ per hop) |
| **Schema Evolution** | `ALTER TABLE`, rigid column specifications | Property graph flexibility: nodes can have dynamic attributes |
| **Recommendation Engine** | Slow recursive SQL Common Table Expressions (CTEs) | Declarative ASCII-art Cypher pattern matching (`MATCH (m)-[:BORROWED]->(l)...`) |
| **Circulation Transactions** | PL/SQL row-level locks (`SELECT FOR UPDATE`) | Managed ACID transactions (`session.executeWrite`) |
| **Developer Ergonomics** | SQL string concatenation / JDBC result sets | Official Neo4j JavaScript Driver with typed record mapping |

---

## 6. Technology Stack

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Tooling & Dev Server**: Vite 8.3
- **Styling**: Tailwind CSS (dark navy/purple theme: `#020617` background with `#6366f1` purple/indigo accents)
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Responsive bar charts and pie charts)
- **Routing**: React Router v6

### Backend Architecture
- **Runtime**: Node.js v20+ LTS
- **Server Framework**: Express.js with TypeScript
- **Database Driver**: Official `neo4j-driver` (v5.x)
- **Testing Framework**: Jest, Supertest, ts-jest
- **Security & Validation**: CORS, Custom schema validation middleware, Parameterized Cypher

### Database Layer
- **Engine**: Neo4j Community Edition v5.x
- **Query Language**: Cypher
- **Connection Protocol**: Bolt (`bolt://localhost:7687`)

---

## 7. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                         │
│       React 18 + Vite SPA (Port 5173 - Dark Navy/Purple)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                HTTP / JSON REST API Requests
                Proxy: Vite Dev Server -> Port 5000
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Express.js Backend                       │
│                     (Node.js Port 5000)                     │
├─────────────────────────────────────────────────────────────┤
│  Middleware Pipeline:                                       │
│  - CORS (Origin: localhost:5173)                            │
│  - JSON Body Parser                                         │
│  - Request Logger                                           │
│  - Validation Middleware (Required field validation)        │
│  - Centralized Error Handler (AppError, Neo4jError, 404)    │
├─────────────────────────────────────────────────────────────┤
│  Controllers & Services:                                    │
│  - BooksService       - LoansService (ACID Transactions)   │
│  - MembersService     - AnalyticsService (Cypher Aggs)     │
│  - RequestsService    - Admins/Libraries/Authors/Pubs      │
└──────────────────────────────┬──────────────────────────────┘
                               │
               Bolt Binary Protocol (Port 7687)
             Connection Pool (neo4j-driver v5.x)
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                  Neo4j Graph Database                       │
│  - 9 Node Labels                                            │
│  - 11 Directional Relationships                             │
│  - 13 Uniqueness Constraints                                │
│  - 7 Performance Indexes                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Relational to Graph Model Mapping

Every entity from the DA2 Oracle schema was systematically converted into graph constructs:

| DA2 Relational Entity | Neo4j Node Label | Primary Identifier | Graph Relationships Established |
|---|---|---|---|
| `Author` | `:Author` | `authorId` (`A101`, `A102`...) | `(Author)-[:WROTE]->(Book)` |
| `Publisher` | `:Publisher` | `publisherId` (`PUB01`...) | `(Publisher)-[:PUBLISHED]->(Book)` |
| `Books` | `:Book` | `bookId` (`B001`...), `isbn` | Target of `[:WROTE]`, `[:PUBLISHED]`, `[:FOR_BOOK]`, `[:REQUESTS_BOOK]`; Source of `[:HELD_BY]` |
| `Library` | `:Library` | `libraryId` (`LIB01`...) | Target of `(Book)-[:HELD_BY]->(Library)`, `(Employee)-[:WORKS_AT]->(Library)` |
| `Member` | `:Member` | `memberId` (`M001`...), `email` | `(Member)-[:BORROWED]->(Loan)`, `(Member)-[:SENT]->(Request)` |
| `Employee` | `:Employee` | `employeeId` (`E01`...), `email` | `(Employee)-[:ISSUED]->(Loan)`, `(Employee)-[:PROCESSED]->(Request)`, `(Employee)-[:WORKS_AT]->(Library)` |
| `Admin` | `:Admin` | `adminId` (`AD01`...), `email` | `(Admin)-[:MANAGES]->(Library)` |
| *Junction Concept* | `:Loan` | `loanId` (`L001`...) | `(Member)-[:BORROWED]->(Loan)-[:FOR_BOOK]->(Book)`, `(Employee)-[:ISSUED]->(Loan)` |
| `Send_Request` | `:Request` | `requestId` (`REQ001`...) | `(Member)-[:SENT]->(Request)-[:REQUESTS_BOOK]->(Book)`, `(Employee)-[:PROCESSED]->(Request)` |

---

## 9. Neo4j Graph Schema Details

### 9.1 Directional Relationships (11 Total)
1. `(Author)-[:WROTE]->(Book)`: Associates author with book node.
2. `(Publisher)-[:PUBLISHED]->(Book)`: Links publishing imprint to volume.
3. `(Book)-[:HELD_BY]->(Library)`: Assigns physical book to campus library branch.
4. `(Employee)-[:WORKS_AT]->(Library)`: Assigns library staff to specific campus branch.
5. `(Admin)-[:MANAGES]->(Library)`: Hierarchical branch governance.
6. `(Member)-[:BORROWED]->(Loan)`: Connects borrowing patron to transaction node.
7. `(Loan)-[:FOR_BOOK]->(Book)`: Connects active/historical loan to physical catalog volume.
8. `(Employee)-[:ISSUED]->(Loan)`: Audit trail of employee who processed the checkout.
9. `(Member)-[:SENT]->(Request)`: Identifies member who submitted title acquisition request.
10. `(Request)-[:REQUESTS_BOOK]->(Book)`: Links acquisition request to desired book.
11. `(Employee)-[:PROCESSED]->(Request)`: Audit trail of employee who approved or rejected the request.

### 9.2 Constraints and Performance Indexes
Applied via `database/constraints.cypher`:
- **13 Uniqueness Constraints**:
  - `unique_author_id` on `Author(authorId)`
  - `unique_publisher_id` on `Publisher(publisherId)`
  - `unique_book_id` on `Book(bookId)`
  - `unique_book_isbn` on `Book(isbn)`
  - `unique_library_id` on `Library(libraryId)`
  - `unique_member_id` on `Member(memberId)`
  - `unique_member_email` on `Member(email)`
  - `unique_employee_id` on `Employee(employeeId)`
  - `unique_employee_email` on `Employee(email)`
  - `unique_admin_id` on `Admin(adminId)`
  - `unique_admin_email` on `Admin(email)`
  - `unique_loan_id` on `Loan(loanId)`
  - `unique_request_id` on `Request(requestId)`
- **7 Performance Indexes**:
  - `idx_loan_status` on `Loan(status)`
  - `idx_loan_due_date` on `Loan(dueDate)`
  - `idx_book_title` on `Book(title)`
  - `idx_book_genre` on `Book(genre)`
  - `idx_member_status` on `Member(status)`
  - `idx_request_status` on `Request(status)`
  - `idx_request_date` on `Request(requestDate)`

---

## 10. Key Cypher Queries and Implementation Purpose

### 10.1 Multi-Entity Dashboard Statistics (Q12)
```cypher
MATCH (b:Book) WITH count(b) AS booksCount
MATCH (m:Member) WITH booksCount, count(m) AS membersCount
MATCH (l:Loan) WITH booksCount, membersCount,
  count(l) AS totalLoansCount,
  count(CASE WHEN l.status = 'ACTIVE' THEN 1 END) AS activeLoansCount,
  count(CASE WHEN l.status = 'OVERDUE' OR (l.status = 'ACTIVE' AND l.dueDate < date()) THEN 1 END) AS overdueLoansCount
MATCH (r:Request) WITH booksCount, membersCount, totalLoansCount, activeLoansCount, overdueLoansCount,
  count(CASE WHEN r.status = 'PENDING' THEN 1 END) AS requestsCount
MATCH (lib:Library)
RETURN booksCount, membersCount, totalLoansCount, activeLoansCount, overdueLoansCount, requestsCount, count(lib) AS librariesCount
```
*Purpose*: Aggregates high-level metrics in a single graph traversal pass without multiple relational table scans.

### 10.2 Index-Free Adjacency Book Discovery
```cypher
// Co-borrowing Graph Traversal
MATCH (focal:Book {bookId: $bookId})<-[:FOR_BOOK]-(l1:Loan)<-[:BORROWED]-(m:Member)
MATCH (m)-[:BORROWED]->(l2:Loan)-[:FOR_BOOK]->(other:Book)
WHERE other.bookId <> $bookId
RETURN other.bookId AS bookId, other.title AS title, other.availableCopies AS availableCopies, count(DISTINCT m) AS borrowCount
ORDER BY borrowCount DESC
LIMIT 5
```
*Purpose*: Identifies titles frequently borrowed by readers of the current book without relational self-joins.

### 10.3 3-Hop Collaborative Filtering Member Recommendations
```cypher
MATCH (m:Member {memberId: $memberId})-[:BORROWED]->(:Loan)-[:FOR_BOOK]->(alreadyRead:Book)
WITH m, collect(DISTINCT alreadyRead.bookId) AS readBookIds

MATCH (m)-[:BORROWED]->(:Loan)-[:FOR_BOOK]->(sharedBook:Book)
     <-[:FOR_BOOK]-(:Loan)<-[:BORROWED]-(coReader:Member)
WHERE coReader.memberId <> $memberId

MATCH (coReader)-[:BORROWED]->(:Loan)-[:FOR_BOOK]->(rec:Book)
WHERE NOT rec.bookId IN readBookIds
  AND rec.availableCopies > 0

OPTIONAL MATCH (a:Author)-[:WROTE]->(rec)
RETURN rec.bookId AS bookId, rec.title AS title, rec.genre AS genre,
       coalesce(a.name, 'Unknown') AS author, rec.availableCopies AS availableCopies,
       count(DISTINCT coReader) AS coReaderCount
ORDER BY coReaderCount DESC, rec.title ASC
LIMIT 8
```
*Purpose*: Delivers explainable reading recommendations based on reader community network overlaps.

### 10.4 Popular Books Ranking (Q13)
```cypher
MATCH (l:Loan)-[:FOR_BOOK]->(b:Book)
WITH b, count(l) AS totalBorrows
OPTIONAL MATCH (a:Author)-[:WROTE]->(b)
RETURN b.bookId AS bookId, b.title AS title, coalesce(a.name, 'Unknown') AS author,
       b.genre AS genre, totalBorrows, b.availableCopies AS currentlyAvailable
ORDER BY totalBorrows DESC
LIMIT 10
```

---

## 11. Transactional Borrowing Logic (ACID Compliance)

The checkout and return procedures in `LoansService` enforce strict ACID compliance using Neo4j managed write transactions (`session.executeWrite`):

### 11.1 Issue Book Transaction Rules
1. **Member Status Verification**: Query checks if member exists and has `status = 'ACTIVE'`. Suspended members are rejected with HTTP 403.
2. **Double Borrow Prevention**: Checks if the member already holds an active loan for the requested book. Duplicate checkouts are rejected with HTTP 409 Conflict.
3. **Copy Availability Check**: Validates `b.availableCopies > 0`. If 0, rejects with HTTP 400 Bad Request.
4. **Atomic Decrement**: Within the transaction, the `Loan` node is created, relationships (`BORROWED`, `FOR_BOOK`, `ISSUED`) are linked, and `b.availableCopies = b.availableCopies - 1` is updated atomically.

### 11.2 Return Book Transaction Rules
1. **Loan Existence & Status**: Verifies the loan exists. If `status === 'RETURNED'`, the request is rejected with HTTP 400 (prevents duplicate returns).
2. **Overdue Fine Calculation**: If return date > due date, calculates late fee:
   $$\text{Fine} = \max(0, \text{daysLate}) \times \text{FINE\_RATE\_PER\_DAY}$$
3. **Atomic Reinstatement**: Updates `l.status = 'RETURNED'`, records `l.returnDate`, stores `l.fineAmount`, and increments `b.availableCopies = b.availableCopies + 1`.

---

## 12. Frontend Implementation & User Experience

The React client adheres to the designated dark navy and purple design language:
- **Dashboard (`/`)**: Displays live summary counters, circulation tables, and quick-action shortcuts. Features four-tier infrastructure diagnostics (Backend Offline, Neo4j Offline, Query Error, Empty Database).
- **Books Catalogue (`/books`)**: Search with debounced title/author/ISBN filtering, genre dropdown, stock filtering, and pagination.
- **Book Management (`/books/new`, `/books/edit/:id`)**: Full CRUD modal forms with author, publisher, and branch select bindings.
- **Member Directory (`/members`)**: Member listings, role badges, registration modal, and member loan history slide-over.
- **Circulation Desk (`/circulation`)**: Quick issue and return processing with validation locks against double submissions.
- **Graph Discovery (`/discovery`)**: Focal book relationship explorer showing author bibliographies, publishing imprints, and collaborative co-borrowing clusters. Also houses the 3-hop member recommendation section.
- **Analytics (`/analytics`)**: Recharts data visualizations showing most borrowed books, genre circulation frequency, top patron activity, and campus library stock allocations.
- **Settings & Diagnostics (`/settings`)**: Configuration view displaying live uptime, environment bindings, and an on-demand Neo4j connection probe.

---

## 13. Testing Methodology and Actual Results

Testing was conducted across four distinct layers:

### 13.1 Automated Backend Test Suite (Jest & Supertest)
The backend test suite consists of 8 test suites and 52 isolated unit and integration tests:
- `health.test.ts` (2 tests): Validates `/health` liveness (200) and `/health/db` readiness (200 connected / 503 disconnected).
- `middleware.test.ts` (4 tests): Tests 404 JSON handlers, 400 missing field validation, and custom AppError handling.
- `books.test.ts` (8 tests): Tests pagination, search, single book query, creation validation, updates, deletion constraints, and graph neighbor retrieval.
- `loans.test.ts` (11 tests): Tests successful issuing, 0 copy rejections, duplicate active loan rejection, return processing, duplicate return prevention, overdue fine calculations, and rollback semantics.
- `authors_publishers.test.ts` (9 tests): Validates author and publisher CRUD APIs.
- `users_libraries.test.ts` (8 tests): Validates members, staff, campus libraries, and admin statistics.
- `requests.test.ts` (6 tests): Validates member request submission, queue listing, and approval/rejection workflows.
- `analytics.test.ts` (4 tests): Validates `/api/analytics` aggregated dashboard and `/api/analytics/members/:id/recommendations` 3-hop graph traversal.

**Outcome**: **8/8 test suites passed**, **52/52 tests passed** (100% pass rate).

### 13.2 TypeScript Type-Checking & Build Verification
- **Backend Build (`server`)**: `npm run build` (`tsc`) executed with 0 type errors.
- **Frontend Build (`client`)**: `npm run build` (`tsc -b && vite build`) transformed 2518 modules in 1.27s with 0 errors.
- **Frontend Linter (`client`)**: `npm run lint` (`oxlint`) inspected 35 source files with 0 errors.

---

## 14. Security Audit & Hardening

1. **Cypher Injection Mitigation**: 100% of dynamic Cypher queries utilize parameterized inputs (`$search`, `$genre`, `$memberId`, `$bookId`). No unsanitized string interpolations exist in query bodies.
2. **Sorting Parameter Whitelisting**: Sort fields are validated against strict allowed dictionaries (`title -> b.title`, `year -> b.year`).
3. **Secret Containment**: Environment configuration is isolated in `.env`, strictly ignored by `.gitignore`, with template variables documented in `.env.example`.
4. **Production Stack Trace Suppression**: In production mode (`NODE_ENV=production`), server errors omit internal stack traces and database internal codes.
5. **CORS Hardening**: Explicitly configured in Express to allow only the local Vite frontend (`http://localhost:5173`).

---

## 15. Known Limitations

1. **Authentication Scope**: Member, employee, and admin roles are handled via role-based frontend contexts and credential verification schemas. Full production OAuth2 / JWT cookie sessions are documented for future institutional deployment.
2. **Local Neo4j Dependency**: The backend relies on an active Neo4j daemon listening on `bolt://localhost:7687`. When Neo4j is offline, the backend surfaces descriptive 503 errors and the frontend renders actionable troubleshooting instructions.

---

## 16. Conclusion and Future Scope

LibraFlow successfully demonstrates the migration of a college DBMS relational library system into a modern graph database application. By leveraging Neo4j's index-free adjacency and Cypher's expressive pattern matching, the system achieves constant-time relationship traversals, intuitive collaborative filtering recommendations, and multi-dimensional circulation analytics that would require complex, slow queries in Oracle SQL.

### Future Scope:
- Integration of graph algorithms via Neo4j Graph Data Science (GDS) library (PageRank, Louvain community detection for catalog clustering).
- Deployment of a hybrid vector index for semantic book search combining Cypher graph patterns with vector embeddings.
- Full mobile-responsive progressive web app (PWA) with offline catalog browsing.

---
*End of Report — LibraFlow DBMS DA3 Final Submission*
