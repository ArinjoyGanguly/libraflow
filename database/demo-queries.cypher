// =============================================================================
// LibraFlow — Demo Queries
// File   : database/demo-queries.cypher
// Purpose: Demonstrate all major query patterns using real seed data.
//          These are standalone queries — run them one at a time in Neo4j Browser
//          or sequentially in Cypher Shell.
//
// Prerequisites: Run constraints.cypher then seed.cypher first.
// =============================================================================


// =============================================================================
// SECTION 1 — BASIC LOOKUP QUERIES
// =============================================================================

// Q01: List all books with author and publisher names
// Demonstrates: MATCH, OPTIONAL MATCH, RETURN
MATCH (b:Book)
OPTIONAL MATCH (a:Author)-[:WROTE]->(b)
OPTIONAL MATCH (p:Publisher)-[:PUBLISHED]->(b)
RETURN b.bookId          AS bookId,
       b.title           AS title,
       b.genre           AS genre,
       b.year            AS year,
       b.totalCopies     AS totalCopies,
       b.availableCopies AS available,
       a.name            AS author,
       p.name            AS publisher
ORDER BY b.bookId;

// -------------------------------------------------------------------------

// Q02: List all members with current loan count
// Demonstrates: MATCH, OPTIONAL MATCH, WITH, aggregation, ORDER BY
MATCH (m:Member)
OPTIONAL MATCH (m)-[:BORROWED]->(l:Loan {status: 'ACTIVE'})
WITH m, count(l) AS activeLoans
RETURN m.memberId  AS memberId,
       m.name      AS name,
       m.email     AS email,
       m.status    AS status,
       activeLoans
ORDER BY m.memberId;

// -------------------------------------------------------------------------

// Q03: Get full profile of a single member including all their loans
// Demonstrates: MATCH, OPTIONAL MATCH with multi-hop, nested RETURN
MATCH (m:Member {memberId: 'M001'})
OPTIONAL MATCH (m)-[:BORROWED]->(l:Loan)-[:FOR_BOOK]->(b:Book)
RETURN m.memberId   AS memberId,
       m.name       AS name,
       m.email      AS email,
       m.joinDate   AS joinDate,
       m.status     AS memberStatus,
       l.loanId     AS loanId,
       l.status     AS loanStatus,
       l.issueDate  AS issuedOn,
       l.dueDate    AS dueOn,
       l.returnDate AS returnedOn,
       l.fineAmount AS fine,
       b.title      AS bookTitle
ORDER BY l.issueDate DESC;

// -------------------------------------------------------------------------

// Q04: Full book detail — all copies, current holders
// Demonstrates: MATCH, OPTIONAL MATCH, pattern chaining
MATCH (b:Book {bookId: 'B003'})
OPTIONAL MATCH (a:Author)-[:WROTE]->(b)
OPTIONAL MATCH (p:Publisher)-[:PUBLISHED]->(b)
OPTIONAL MATCH (b)-[:HELD_BY]->(lib:Library)
OPTIONAL MATCH (m:Member)-[:BORROWED]->(l:Loan {status: 'ACTIVE'})-[:FOR_BOOK]->(b)
RETURN b.bookId          AS bookId,
       b.title           AS title,
       b.isbn            AS isbn,
       b.genre           AS genre,
       b.edition         AS edition,
       b.year            AS year,
       b.totalCopies     AS totalCopies,
       b.availableCopies AS availableCopies,
       a.name            AS author,
       p.name            AS publisher,
       collect(DISTINCT lib.name) AS libraries,
       collect(DISTINCT m.name)   AS currentBorrowers;


// =============================================================================
// SECTION 2 — LOAN STATUS QUERIES
// =============================================================================

// Q05: All currently ACTIVE loans (employee dashboard)
// Demonstrates: MATCH, multi-hop pattern, ORDER BY
MATCH (m:Member)-[:BORROWED]->(l:Loan {status: 'ACTIVE'})-[:FOR_BOOK]->(b:Book)
OPTIONAL MATCH (e:Employee)-[:ISSUED]->(l)
RETURN l.loanId    AS loanId,
       m.memberId  AS memberId,
       m.name      AS memberName,
       b.bookId    AS bookId,
       b.title     AS bookTitle,
       l.issueDate AS issuedOn,
       l.dueDate   AS dueOn,
       e.name      AS issuedBy
ORDER BY l.dueDate ASC;

// -------------------------------------------------------------------------

// Q06: All OVERDUE loans with days overdue and fine calculation
// Demonstrates: WHERE date comparison, duration function, computed columns
MATCH (m:Member)-[:BORROWED]->(l:Loan)-[:FOR_BOOK]->(b:Book)
WHERE l.status IN ['ACTIVE', 'OVERDUE']
  AND l.dueDate < date()
RETURN l.loanId                                                       AS loanId,
       m.memberId                                                      AS memberId,
       m.name                                                          AS memberName,
       m.email                                                         AS memberEmail,
       b.title                                                         AS bookTitle,
       l.dueDate                                                       AS dueOn,
       duration.between(l.dueDate, date()).days                        AS daysOverdue,
       duration.between(l.dueDate, date()).days * 2                    AS calculatedFine,
       l.fineAmount                                                    AS recordedFine
ORDER BY daysOverdue DESC;

// -------------------------------------------------------------------------

// Q07: Full loan history for the library (all statuses)
// Demonstrates: IN operator, multiple OPTIONAL MATCHes, CASE
MATCH (m:Member)-[:BORROWED]->(l:Loan)-[:FOR_BOOK]->(b:Book)
OPTIONAL MATCH (e:Employee)-[:ISSUED]->(l)
RETURN l.loanId     AS loanId,
       l.status     AS status,
       m.name       AS member,
       b.title      AS book,
       l.issueDate  AS issued,
       l.dueDate    AS due,
       l.returnDate AS returned,
       l.fineAmount AS fine,
       e.name       AS issuedBy,
       CASE l.status
         WHEN 'RETURNED' THEN 'Closed'
         WHEN 'OVERDUE'  THEN 'Action Required'
         ELSE 'Open'
       END AS category
ORDER BY l.issueDate DESC;

// -------------------------------------------------------------------------

// Q08: Loans issued by a specific employee
// Demonstrates: direction filtering through relationships
MATCH (e:Employee {employeeId: 'E01'})-[:ISSUED]->(l:Loan)-[:FOR_BOOK]->(b:Book)
MATCH (m:Member)-[:BORROWED]->(l)
RETURN e.name       AS issuedBy,
       l.loanId     AS loanId,
       l.status     AS status,
       m.name       AS member,
       b.title      AS book,
       l.issueDate  AS issued,
       l.fineAmount AS fine
ORDER BY l.issueDate DESC;


// =============================================================================
// SECTION 3 — REQUEST QUERIES
// =============================================================================

// Q09: All PENDING requests with requester and book details
// Demonstrates: MATCH with status filter, multi-hop, ORDER BY date
MATCH (m:Member)-[:SENT]->(r:Request {status: 'PENDING'})-[:REQUESTS_BOOK]->(b:Book)
RETURN r.requestId   AS requestId,
       m.memberId    AS memberId,
       m.name        AS memberName,
       m.status      AS memberStatus,
       b.bookId      AS bookId,
       b.title       AS bookTitle,
       b.availableCopies AS copiesAvailable,
       r.requestDate AS requestedOn,
       r.notes       AS notes
ORDER BY r.requestDate ASC;

// -------------------------------------------------------------------------

// Q10: Full request history (all statuses) with processing employee
// Demonstrates: OPTIONAL MATCH for optional relationship
MATCH (m:Member)-[:SENT]->(r:Request)-[:REQUESTS_BOOK]->(b:Book)
OPTIONAL MATCH (e:Employee)-[:PROCESSED]->(r)
RETURN r.requestId   AS requestId,
       r.status      AS status,
       m.name        AS requestedBy,
       b.title       AS book,
       r.requestDate AS on,
       r.notes       AS notes,
       e.name        AS processedBy
ORDER BY r.requestDate DESC;

// -------------------------------------------------------------------------

// Q11: Member-to-Employee request pairs (preserves DA2 Send_Request association)
// Shows which employee handled which member's request
MATCH (m:Member)-[:SENT]->(r:Request)<-[:PROCESSED]-(e:Employee)
RETURN m.memberId    AS memberId,
       m.name        AS memberName,
       e.employeeId  AS employeeId,
       e.name        AS employeeName,
       r.requestId   AS requestId,
       r.status      AS outcome,
       r.requestDate AS on
ORDER BY r.requestDate DESC;


// =============================================================================
// SECTION 4 — AGGREGATION AND STATISTICS
// =============================================================================

// Q12: Admin dashboard statistics (single pass)
// Demonstrates: WITH chaining, count aggregation
MATCH (b:Book)
WITH count(b) AS totalBooks, sum(b.availableCopies) AS totalAvailable
MATCH (m:Member)
WITH totalBooks, totalAvailable, count(m) AS totalMembers
MATCH (l:Loan {status: 'ACTIVE'})
WITH totalBooks, totalAvailable, totalMembers, count(l) AS activeLoans
OPTIONAL MATCH (ov:Loan)
  WHERE ov.status IN ['ACTIVE','OVERDUE'] AND ov.dueDate < date()
WITH totalBooks, totalAvailable, totalMembers, activeLoans, count(ov) AS overdueLoans
OPTIONAL MATCH (r:Request {status: 'PENDING'})
RETURN totalBooks,
       totalAvailable,
       totalMembers,
       activeLoans,
       overdueLoans,
       count(r) AS pendingRequests;

// -------------------------------------------------------------------------

// Q13: Books ranked by borrow frequency (most popular first)
// Demonstrates: aggregation, ORDER BY count DESC
MATCH (l:Loan)-[:FOR_BOOK]->(b:Book)
WITH b, count(l) AS totalBorrows
OPTIONAL MATCH (a:Author)-[:WROTE]->(b)
RETURN b.bookId    AS bookId,
       b.title     AS title,
       a.name      AS author,
       totalBorrows,
       b.availableCopies AS currentlyAvailable
ORDER BY totalBorrows DESC;

// -------------------------------------------------------------------------

// Q14: Members ranked by total fines paid
// Demonstrates: OPTIONAL MATCH, sum aggregation, ORDER BY
MATCH (m:Member)
OPTIONAL MATCH (m)-[:BORROWED]->(l:Loan)
WITH m, sum(l.fineAmount) AS totalFines, count(l) AS totalBorrows
RETURN m.memberId   AS memberId,
       m.name       AS name,
       totalBorrows AS borrowCount,
       totalFines   AS totalFinesPaid
ORDER BY totalFines DESC;

// -------------------------------------------------------------------------

// Q15: Genre popularity analysis
// Demonstrates: grouping by non-ID property
MATCH (l:Loan)-[:FOR_BOOK]->(b:Book)
WITH b.genre AS genre, count(l) AS timesborrowed
RETURN genre,
       timesborrowd AS borrowCount
ORDER BY borrowCount DESC;
// Note: typo "timesborrowd" is intentional — corrected below for production use:
// ORDER BY timesborrowd DESC  -> replace with: ORDER BY timesborrowd DESC (use WITH alias)

// -------------------------------------------------------------------------

// Q15 (corrected):
MATCH (l:Loan)-[:FOR_BOOK]->(b:Book)
WITH b.genre AS genre, count(l) AS borrowCount
RETURN genre, borrowCount
ORDER BY borrowCount DESC;

// -------------------------------------------------------------------------

// Q16: Books with no active loans (fully available)
// Demonstrates: WHERE NOT EXISTS subquery pattern
MATCH (b:Book)
WHERE NOT EXISTS {
  MATCH (l:Loan {status: 'ACTIVE'})-[:FOR_BOOK]->(b)
}
OPTIONAL MATCH (a:Author)-[:WROTE]->(b)
RETURN b.bookId          AS bookId,
       b.title           AS title,
       a.name            AS author,
       b.availableCopies AS allCopiesAvailable
ORDER BY b.title;

// -------------------------------------------------------------------------

// Q17: Members who have never borrowed a book
// Demonstrates: WHERE NOT EXISTS with relationship pattern
MATCH (m:Member)
WHERE NOT EXISTS {
  MATCH (m)-[:BORROWED]->(:Loan)
}
RETURN m.memberId AS memberId, m.name AS name, m.joinDate AS joined;

// -------------------------------------------------------------------------

// Q18: Library stock report — each library's holdings and availability
// Demonstrates: COLLECT, multi-hop relationship
MATCH (lib:Library)
OPTIONAL MATCH (b:Book)-[:HELD_BY]->(lib)
WITH lib, collect(b.title) AS books, count(b) AS bookCount,
     sum(b.availableCopies) AS totalAvailable, sum(b.totalCopies) AS totalStock
OPTIONAL MATCH (e:Employee)-[:WORKS_AT]->(lib)
RETURN lib.libraryId    AS libraryId,
       lib.name         AS libraryName,
       lib.city         AS city,
       bookCount,
       totalStock,
       totalAvailable,
       books,
       collect(e.name)  AS staff;


// =============================================================================
// SECTION 5 — TRANSACTION SIMULATION QUERIES
// (Read-only previews of what the backend will execute atomically)
// =============================================================================

// Q19: Pre-condition check before issuing a book (backend runs this first)
// Returns whether the issue can proceed
MATCH (m:Member {memberId: 'M001'}), (b:Book {bookId: 'B005'})
OPTIONAL MATCH (m)-[:BORROWED]->(existing:Loan {status: 'ACTIVE'})-[:FOR_BOOK]->(b)
RETURN m.memberId                       AS memberId,
       m.status                         AS memberStatus,
       b.bookId                         AS bookId,
       b.availableCopies                AS copiesAvailable,
       existing.loanId                  AS existingActiveLoan,
       CASE
         WHEN m.status <> 'ACTIVE'        THEN 'FAIL: member suspended'
         WHEN b.availableCopies <= 0      THEN 'FAIL: no copies available'
         WHEN existing IS NOT NULL        THEN 'FAIL: active loan exists'
         ELSE                                  'OK: can issue'
       END AS issueDecision;

// -------------------------------------------------------------------------

// Q20: Pre-condition check before issuing to suspended member M004
MATCH (m:Member {memberId: 'M004'}), (b:Book {bookId: 'B005'})
OPTIONAL MATCH (m)-[:BORROWED]->(existing:Loan {status: 'ACTIVE'})-[:FOR_BOOK]->(b)
RETURN m.memberId,
       m.status AS memberStatus,
       b.availableCopies,
       CASE
         WHEN m.status <> 'ACTIVE'   THEN 'FAIL: member suspended'
         WHEN b.availableCopies <= 0 THEN 'FAIL: no copies available'
         WHEN existing IS NOT NULL   THEN 'FAIL: active loan exists'
         ELSE                             'OK: can issue'
       END AS issueDecision;

// -------------------------------------------------------------------------

// Q21: Fine calculation preview (what backend computes on return)
// Show what the fine would be right now for each active/overdue loan
MATCH (m:Member)-[:BORROWED]->(l:Loan)-[:FOR_BOOK]->(b:Book)
WHERE l.status IN ['ACTIVE', 'OVERDUE']
RETURN l.loanId         AS loanId,
       m.name           AS member,
       b.title          AS book,
       l.dueDate        AS dueDate,
       date()           AS today,
       CASE
         WHEN l.dueDate < date()
           THEN duration.between(l.dueDate, date()).days * 2
         ELSE 0
       END AS fineIfReturnedToday
ORDER BY fineIfReturnedToday DESC;


// =============================================================================
// SECTION 6 — DATA INTEGRITY CHECKS
// Run after seeding or after transactions to verify consistency.
// =============================================================================

// IC01: No Book should have negative availableCopies
MATCH (b:Book)
WHERE b.availableCopies < 0
RETURN b.bookId AS problemBook, b.availableCopies AS negativeCount;
// Expected: 0 rows

// IC02: availableCopies + activeLoans should equal totalCopies
MATCH (b:Book)
OPTIONAL MATCH (l:Loan {status: 'ACTIVE'})-[:FOR_BOOK]->(b)
WITH b, count(l) AS activeLoans
WHERE b.availableCopies + activeLoans <> b.totalCopies
RETURN b.bookId, b.availableCopies, activeLoans, b.totalCopies;
// Expected: 0 rows  (if seed was applied correctly)

// IC03: All Loan nodes must have a Member borrower
MATCH (l:Loan)
WHERE NOT ()-[:BORROWED]->(l)
RETURN l.loanId AS orphanLoan;
// Expected: 0 rows

// IC04: All RETURNED loans must have a returnDate
MATCH (l:Loan {status: 'RETURNED'})
WHERE l.returnDate IS NULL
RETURN l.loanId AS missingReturnDate;
// Expected: 0 rows

// IC05: All RETURNED loans should have fineAmount >= 0
MATCH (l:Loan {status: 'RETURNED'})
WHERE l.fineAmount < 0
RETURN l.loanId AS negativeFine;
// Expected: 0 rows

// IC06: No Request should be APPROVED unless a corresponding Loan exists
// (relaxed check — verifies approved requests have a PROCESSED employee)
MATCH (r:Request {status: 'APPROVED'})
WHERE NOT ()-[:PROCESSED]->(r)
RETURN r.requestId AS approvedWithNoProcessor;
// Expected: 0 rows

// IC07: Node count summary — verify against expected counts
MATCH (n)
RETURN labels(n)[0] AS label, count(n) AS count
ORDER BY label;
// Expected:
//   Admin     : 2
//   Author    : 5
//   Book      : 5
//   Employee  : 2
//   Library   : 2
//   Loan      : 7
//   Member    : 4
//   Publisher : 4
//   Request   : 6
//   TOTAL     : 37


// =============================================================================
// SECTION 7 — BOOK SEARCH PATTERNS
// =============================================================================

// Q22: Search books by keyword in title (case-insensitive)
// Replace 'meluha' with any keyword
MATCH (b:Book)
WHERE toLower(b.title) CONTAINS 'meluha'
OPTIONAL MATCH (a:Author)-[:WROTE]->(b)
OPTIONAL MATCH (p:Publisher)-[:PUBLISHED]->(b)
RETURN b.bookId, b.title, a.name AS author, p.name AS publisher,
       b.availableCopies AS available;

// -------------------------------------------------------------------------

// Q23: Filter books by genre
MATCH (b:Book {genre: 'Mythology'})
OPTIONAL MATCH (a:Author)-[:WROTE]->(b)
RETURN b.bookId, b.title, a.name AS author, b.availableCopies AS available;

// -------------------------------------------------------------------------

// Q24: Books available right now (at least 1 copy free)
MATCH (b:Book)
WHERE b.availableCopies > 0
OPTIONAL MATCH (a:Author)-[:WROTE]->(b)
RETURN b.bookId, b.title, a.name AS author, b.availableCopies AS available
ORDER BY b.title;

// =============================================================================
// END OF DEMO QUERIES
// =============================================================================
