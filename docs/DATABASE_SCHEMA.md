# LibraFlow — Database Schema Reference

> **DA3 Assignment** | Neo4j Graph Database | v5.x Community Edition  
> **Last Updated**: 2026-10-12  
> **Author**: LibraFlow Architecture Team

---

## 1. Overview

LibraFlow uses Neo4j as its sole database. The schema migrates all eight
Oracle DA2 entities into Neo4j node labels, preserving every original
identifier, and adds two new node labels to support borrowing history
(Loan) and request tracking (Request).

```
DA2 Entities (8) preserved:  Author · Publisher · Book · Library
                              Member · Employee · Admin · Send_Request

New for Neo4j (2):           Loan (borrowing history)
                             [Request replaces Send_Request with richer status]

Total node labels: 9
Total relationship types: 10
```

---

## 2. Node Labels

### 2.1 Author
**DA2 Origin**: `Author(Author_Id, Author_Name, Email, Phone, Country)`

| Property | Type | Constraint | Notes |
|----------|------|-----------|-------|
| `authorId` | String | **UNIQUE** | PK — preserved from DA2. Format: A101, A102 … |
| `name` | String | — | Full author name |
| `email` | String | — | Contact email |
| `phone` | String | — | Optional phone |
| `country` | String | — | Country of origin |

Seed IDs: **A101, A102, A103** (DA2) + A104, A105 (added)

---

### 2.2 Publisher
**DA2 Origin**: `Publisher(Publisher_Id, Publisher_Name, Address, Phone, Email, Website)`

| Property | Type | Constraint | Notes |
|----------|------|-----------|-------|
| `publisherId` | String | **UNIQUE** | PK. Format: PUB01, PUB02 … |
| `name` | String | — | Publisher company name |
| `address` | String | — | Street address |
| `phone` | String | — | Contact phone |
| `email` | String | — | Contact email |
| `website` | String | — | URL |

Seed IDs: **PUB01, PUB02, PUB03** (DA2) + PUB04 (added)

---

### 2.3 Book
**DA2 Origin**: `Books(Book_Id, ISBN, Title, Genre, Language, Edition, Year)`

| Property | Type | Constraint | Notes |
|----------|------|-----------|-------|
| `bookId` | String | **UNIQUE** | PK. Format: B001, B002 … |
| `isbn` | String | **UNIQUE** | International Standard Book Number |
| `title` | String | — | Book title (indexed for search) |
| `genre` | String | — | Genre / subject category (indexed) |
| `language` | String | — | e.g. "English" |
| `edition` | String | — | Optional edition string |
| `year` | Integer | — | Publication year |
| `totalCopies` | Integer | — | Physical copies owned by library |
| `availableCopies` | Integer | — | Updated atomically on issue/return |

> **availableCopies** is a performance denormalization. The backend MUST
> update it inside the same write transaction as the Loan creation/return.
> Integrity check: `availableCopies + activeLoans = totalCopies` always.

Seed IDs: **B001, B002, B003** (DA2) + B004, B005 (added)

---

### 2.4 Library
**DA2 Origin**: `Library(Library_Id, Library_Name, Address, City, Phone, Email)`

| Property | Type | Constraint | Notes |
|----------|------|-----------|-------|
| `libraryId` | String | **UNIQUE** | PK. Format: LIB01, LIB02 |
| `name` | String | — | Branch name |
| `address` | String | — | Street address |
| `city` | String | — | City |
| `phone` | String | — | Optional phone |
| `email` | String | — | Optional email |

Seed IDs: **LIB01, LIB02** (both added — DA2 had no specific library rows)

---

### 2.5 Member
**DA2 Origin**: `Member(Member_Id, Name, Email, Phone, Address, Join_Date)`

| Property | Type | Constraint | Notes |
|----------|------|-----------|-------|
| `memberId` | String | **UNIQUE** | PK. Format: M001, M002 … |
| `name` | String | — | Full name |
| `email` | String | **UNIQUE** | Login credential |
| `passwordHash` | String | — | bcrypt hash (never returned by API) |
| `phone` | String | — | Optional |
| `address` | String | — | Optional |
| `joinDate` | Date | — | Library membership start date |
| `status` | String | — | `ACTIVE` or `SUSPENDED` (indexed) |
| `role` | String | — | Fixed value `"member"` |

Seed IDs: **M001, M002** (DA2) + M003, M004 (M004 is SUSPENDED)

---

### 2.6 Employee
**DA2 Origin**: `Employee(Employee_Id, Name, Email, Phone, Position, Library_Id)`

| Property | Type | Constraint | Notes |
|----------|------|-----------|-------|
| `employeeId` | String | **UNIQUE** | PK. Format: E01, E02 |
| `name` | String | — | Full name |
| `email` | String | **UNIQUE** | Login credential |
| `passwordHash` | String | — | bcrypt hash |
| `phone` | String | — | Optional |
| `position` | String | — | e.g. "Senior Librarian" |
| `libraryId` | String | — | Denormalized FK (canonical: WORKS_AT rel) |
| `role` | String | — | Fixed value `"employee"` |

Seed IDs: **E01, E02** (DA2)

---

### 2.7 Admin
**DA2 Origin**: `Admin(Admin_Id, Name, Email)`

| Property | Type | Constraint | Notes |
|----------|------|-----------|-------|
| `adminId` | String | **UNIQUE** | PK. Format: AD01, AD02 |
| `name` | String | — | Full name |
| `email` | String | **UNIQUE** | Login credential |
| `passwordHash` | String | — | bcrypt hash |
| `role` | String | — | Fixed value `"admin"` |

Seed IDs: **AD01, AD02** (DA2)

---

### 2.8 Loan _(New — not in DA2)_
**Replaces**: Junction/history table that would exist in relational model

| Property | Type | Constraint | Notes |
|----------|------|-----------|-------|
| `loanId` | String | **UNIQUE** | PK. Format: L001, L002 … |
| `issueDate` | Date | — | Date book was issued |
| `dueDate` | Date | — | issueDate + LOAN_PERIOD_DAYS (default 14) |
| `returnDate` | Date | — | `null` until returned; indexed implicitly |
| `status` | String | — | `ACTIVE` \| `RETURNED` \| `OVERDUE` (indexed) |
| `fineAmount` | Float | — | 0.0 until overdue; FINE_RATE_PER_DAY × days late |

**Design rationale**: Loan is a node (not a relationship property) so:
- Each loan has a unique addressable ID for the REST API
- A member can have multiple historical loans for the same book
- Fine amount is stored as a first-class property
- Status can be indexed efficiently

Seed IDs: L001 (ACTIVE), L002 (RETURNED), L003 (ACTIVE), L004 (OVERDUE),
          L005 (ACTIVE), L006 (ACTIVE), L007 (RETURNED with fine)

---

### 2.9 Request
**DA2 Origin**: `Send_Request(Request_Id, Request_Date, Status)`

| Property | Type | Constraint | Notes |
|----------|------|-----------|-------|
| `requestId` | String | **UNIQUE** | PK. Format: REQ001 … |
| `requestDate` | Date | — | Date member submitted the request |
| `status` | String | — | `PENDING` \| `APPROVED` \| `REJECTED` (indexed) |
| `notes` | String | — | Optional member comment |

Seed IDs: REQ001 (PENDING), REQ002 (APPROVED), REQ003 (REJECTED),
          REQ004 (PENDING from suspended member), REQ005 (PENDING), REQ006 (APPROVED)

---

## 3. Relationship Types

| Relationship | From | To | Meaning |
|-------------|------|----|---------|
| `[:WROTE]` | Author | Book | Author wrote this book |
| `[:PUBLISHED]` | Publisher | Book | Publisher published this book |
| `[:HELD_BY]` | Book | Library | Library physically holds this book |
| `[:WORKS_AT]` | Employee | Library | Employee is assigned to this library |
| `[:MANAGES]` | Admin | Library | Admin oversees this library branch |
| `[:BORROWED]` | Member | Loan | Member is the borrower for this loan |
| `[:ISSUED]` | Employee | Loan | Employee who issued the loan |
| `[:FOR_BOOK]` | Loan | Book | The book this loan is for |
| `[:SENT]` | Member | Request | Member submitted this request |
| `[:REQUESTS_BOOK]` | Request | Book | The book being requested |
| `[:PROCESSED]` | Employee | Request | Employee who approved/rejected |

All relationships are directional. No properties are stored on relationships —
all transaction metadata lives on Loan and Request nodes.

---

## 4. Graph Diagram (ASCII)

```
(Admin)-[:MANAGES]---->(Library)<-[:HELD_BY]---(Book)<-[:WROTE]---(Author)
                           ^                     ^  ^<-[:PUBLISHED]-(Publisher)
                           |                     |  |
                    [:WORKS_AT]          [:FOR_BOOK] |
                           |                     |  |
                      (Employee)---[:ISSUED]-->(Loan)
                           |                     ^
                     [:PROCESSED]        [:BORROWED]
                           |                     |
                      (Request)<-----[:SENT]---(Member)
                           ^
                  [:REQUESTS_BOOK]
                           |
                         (Book)
```

---

## 5. Constraints and Indexes

Applied by: `database/constraints.cypher`

### 5.1 Uniqueness Constraints (13 total)

| Constraint Name | Node Label | Property |
|----------------|-----------|---------|
| `unique_author_id` | Author | authorId |
| `unique_publisher_id` | Publisher | publisherId |
| `unique_book_id` | Book | bookId |
| `unique_book_isbn` | Book | isbn |
| `unique_library_id` | Library | libraryId |
| `unique_member_id` | Member | memberId |
| `unique_member_email` | Member | email |
| `unique_employee_id` | Employee | employeeId |
| `unique_employee_email` | Employee | email |
| `unique_admin_id` | Admin | adminId |
| `unique_admin_email` | Admin | email |
| `unique_loan_id` | Loan | loanId |
| `unique_request_id` | Request | requestId |

### 5.2 Performance Indexes (7 additional)

| Index Name | Node Label | Property | Use Case |
|-----------|-----------|---------|---------|
| `idx_loan_status` | Loan | status | Filter ACTIVE / RETURNED / OVERDUE |
| `idx_loan_due_date` | Loan | dueDate | Overdue detection: `dueDate < date()` |
| `idx_book_title` | Book | title | Keyword search: `CONTAINS` |
| `idx_book_genre` | Book | genre | Genre filtering |
| `idx_book_available` | Book | availableCopies | Pre-condition check |
| `idx_request_status` | Request | status | Filter PENDING requests |
| `idx_member_status` | Member | status | Check ACTIVE before issuing |

> Note: Each uniqueness constraint already creates a backing index on that
> property, so the constraint list also contributes 13 implicit indexes.

---

## 6. Seed Data Summary

Applied by: `database/seed.cypher`

| Label | Count | IDs |
|-------|-------|-----|
| Library | 2 | LIB01, LIB02 |
| Author | 5 | A101–A103 (DA2), A104–A105 |
| Publisher | 4 | PUB01–PUB03 (DA2), PUB04 |
| Book | 5 | B001–B003 (DA2), B004–B005 |
| Member | 4 | M001–M002 (DA2), M003, M004 (SUSPENDED) |
| Employee | 2 | E01, E02 (DA2) |
| Admin | 2 | AD01, AD02 (DA2) |
| Loan | 7 | L001 (ACTIVE), L002 (RETURNED), L003 (ACTIVE), L004 (OVERDUE), L005 (ACTIVE), L006 (ACTIVE), L007 (RETURNED+fine) |
| Request | 6 | REQ001–REQ006 (mix of PENDING, APPROVED, REJECTED) |
| **Total** | **37** | |

### Loan–Book consistency cross-check

| Book | totalCopies | Active Loans | Available |
|------|------------|-------------|---------|
| B001 | 4 | L001, L003 (2) | 2 |
| B002 | 3 | — (0) | 3 |
| B003 | 5 | L004, L005 (2) | 3 |
| B004 | 3 | L006 (1) | 2 |
| B005 | 4 | — (0) | 4 |

---

## 7. Transaction Rules (Implementation Reference)

### 7.1 Issue a Book
```
Pre-conditions (checked in single READ):
  1. book.availableCopies > 0
  2. member.status = 'ACTIVE'
  3. NOT EXISTS (member)-[:BORROWED]->(Loan {status:'ACTIVE'})-[:FOR_BOOK]->(book)

Atomic WRITE transaction:
  CREATE (:Loan {loanId, issueDate:date(), dueDate:date()+14d, status:'ACTIVE', fineAmount:0})
  CREATE (member)-[:BORROWED]->(loan)
  CREATE (loan)-[:FOR_BOOK]->(book)
  CREATE (employee)-[:ISSUED]->(loan)
  SET book.availableCopies = book.availableCopies - 1
```

### 7.2 Return a Book
```
Pre-conditions:
  1. loan.status = 'ACTIVE'

Atomic WRITE transaction:
  SET loan.status     = 'RETURNED'
  SET loan.returnDate = date()
  SET loan.fineAmount = CASE WHEN loan.dueDate < date()
                             THEN duration.between(loan.dueDate,date()).days * FINE_RATE
                             ELSE 0.0 END
  SET book.availableCopies = book.availableCopies + 1
```

---

## 8. How to Apply Scripts

### Prerequisites
- Neo4j 5.x Desktop, Server, or Aura running
- Default Bolt port: `7687`
- Default HTTP Browser port: `7474`

### Option A — Neo4j Browser (recommended for students)

1. Open Neo4j Browser at `http://localhost:7474`
2. Log in with your credentials
3. Click the file icon or paste script into the editor
4. Run `constraints.cypher` first — paste entire file, press **Ctrl+Enter**
5. Verify: type `SHOW CONSTRAINTS;` — should see 13 rows
6. Run `seed.cypher` — paste entire file, press **Ctrl+Enter**
7. Verify: type `MATCH (n) RETURN count(n);` — should return **37**
8. Run queries from `demo-queries.cypher` one section at a time

### Option B — Cypher Shell

```bash
# Apply constraints
cypher-shell -u neo4j -p <your_password> -f database/constraints.cypher

# Apply seed data
cypher-shell -u neo4j -p <your_password> -f database/seed.cypher

# Run a specific query inline
cypher-shell -u neo4j -p <your_password> "MATCH (n) RETURN labels(n)[0] AS label, count(n) AS count ORDER BY label;"
```

### Option C — Via the Node.js backend (Phase 3)

The backend will read `.env` for credentials and use `neo4j-driver` v5.
The server startup sequence (Phase 3) will call `driver.verifyConnectivity()`
and log `Connected to Neo4j` on success.

---

## 9. Data Integrity Checks

Run these after any seed or transaction to verify consistency:

```cypher
-- IC01: No negative available copies
MATCH (b:Book) WHERE b.availableCopies < 0 RETURN b;

-- IC02: availableCopies + activeLoans = totalCopies
MATCH (b:Book)
OPTIONAL MATCH (l:Loan {status:'ACTIVE'})-[:FOR_BOOK]->(b)
WITH b, count(l) AS al
WHERE b.availableCopies + al <> b.totalCopies
RETURN b.bookId, b.availableCopies, al, b.totalCopies;

-- IC03: No orphan Loan nodes
MATCH (l:Loan) WHERE NOT ()-[:BORROWED]->(l) RETURN l.loanId;

-- IC04: No RETURNED loan missing returnDate
MATCH (l:Loan {status:'RETURNED'}) WHERE l.returnDate IS NULL RETURN l.loanId;
```
All four queries must return **0 rows** on a clean database.

---

## 10. Password Reference (Development Only)

| Role | ID | Plain Password | bcrypt Hash Prefix |
|------|----|---------------|-------------------|
| Member | M001–M004 | `password123` | `$2b$10$N9qo8uLO...` |
| Employee | E01, E02 | `admin123` | `$2b$10$TKh8H1.P...` |
| Admin | AD01, AD02 | `admin123` | `$2b$10$TKh8H1.P...` |

> These hashes are pre-computed with bcryptjs saltRounds=10.  
> **Never commit real passwords or production hashes to git.**

---

## 11. File Reference

| File | Purpose | Run Order |
|------|---------|-----------|
| `database/constraints.cypher` | Constraints + indexes | 1st |
| `database/seed.cypher` | All node and relationship data | 2nd |
| `database/demo-queries.cypher` | 24 demo queries for testing | Any time after seed |
| `docs/DATABASE_SCHEMA.md` | This document | Reference only |
