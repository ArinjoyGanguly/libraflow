// =============================================================================
// LibraFlow — Neo4j Database Schema
// File   : database/constraints.cypher
// Purpose: Apply all uniqueness constraints and performance indexes.
//          Run this file ONCE against a fresh database before seeding data.
//          It is safe to run again — IF NOT EXISTS makes all statements idempotent.
//
// Compatible with: Neo4j 5.x Community and Enterprise
// How to run:
//   Option A – Neo4j Browser : paste the entire file and press Run (Ctrl+Enter)
//   Option B – Cypher Shell  : cypher-shell -u neo4j -p <password> -f database/constraints.cypher
// =============================================================================


// -----------------------------------------------------------------------------
// SECTION 1 — UNIQUENESS CONSTRAINTS
// Each constraint also implicitly creates a backing B-tree index on that property.
// Constraint names are intentionally verbose so SHOW CONSTRAINTS is self-documenting.
// -----------------------------------------------------------------------------

// --- Author ---
CREATE CONSTRAINT unique_author_id IF NOT EXISTS
  FOR (a:Author) REQUIRE a.authorId IS UNIQUE;

// --- Publisher ---
CREATE CONSTRAINT unique_publisher_id IF NOT EXISTS
  FOR (p:Publisher) REQUIRE p.publisherId IS UNIQUE;

// --- Book ---
CREATE CONSTRAINT unique_book_id IF NOT EXISTS
  FOR (b:Book) REQUIRE b.bookId IS UNIQUE;

CREATE CONSTRAINT unique_book_isbn IF NOT EXISTS
  FOR (b:Book) REQUIRE b.isbn IS UNIQUE;

// --- Library ---
CREATE CONSTRAINT unique_library_id IF NOT EXISTS
  FOR (l:Library) REQUIRE l.libraryId IS UNIQUE;

// --- Member ---
CREATE CONSTRAINT unique_member_id IF NOT EXISTS
  FOR (m:Member) REQUIRE m.memberId IS UNIQUE;

CREATE CONSTRAINT unique_member_email IF NOT EXISTS
  FOR (m:Member) REQUIRE m.email IS UNIQUE;

// --- Employee ---
CREATE CONSTRAINT unique_employee_id IF NOT EXISTS
  FOR (e:Employee) REQUIRE e.employeeId IS UNIQUE;

CREATE CONSTRAINT unique_employee_email IF NOT EXISTS
  FOR (e:Employee) REQUIRE e.email IS UNIQUE;

// --- Admin ---
CREATE CONSTRAINT unique_admin_id IF NOT EXISTS
  FOR (a:Admin) REQUIRE a.adminId IS UNIQUE;

CREATE CONSTRAINT unique_admin_email IF NOT EXISTS
  FOR (a:Admin) REQUIRE a.email IS UNIQUE;

// --- Loan ---
CREATE CONSTRAINT unique_loan_id IF NOT EXISTS
  FOR (l:Loan) REQUIRE l.loanId IS UNIQUE;

// --- Request ---
CREATE CONSTRAINT unique_request_id IF NOT EXISTS
  FOR (r:Request) REQUIRE r.requestId IS UNIQUE;


// -----------------------------------------------------------------------------
// SECTION 2 — PERFORMANCE INDEXES
// These are range/lookup indexes on frequently queried non-unique properties.
// They complement the backing indexes already created by the constraints above.
// -----------------------------------------------------------------------------

// Loan.status — queried heavily for ACTIVE / RETURNED / OVERDUE filters
CREATE INDEX idx_loan_status IF NOT EXISTS
  FOR (l:Loan) ON (l.status);

// Loan.dueDate — queried for overdue detection (WHERE l.dueDate < date())
CREATE INDEX idx_loan_due_date IF NOT EXISTS
  FOR (l:Loan) ON (l.dueDate);

// Book.title — queried for full-text-style CONTAINS searches
CREATE INDEX idx_book_title IF NOT EXISTS
  FOR (b:Book) ON (b.title);

// Book.genre — queried for genre-based filtering
CREATE INDEX idx_book_genre IF NOT EXISTS
  FOR (b:Book) ON (b.genre);

// Book.availableCopies — queried in pre-condition check before issuing
CREATE INDEX idx_book_available IF NOT EXISTS
  FOR (b:Book) ON (b.availableCopies);

// Request.status — queried to list PENDING requests
CREATE INDEX idx_request_status IF NOT EXISTS
  FOR (r:Request) ON (r.status);

// Member.status — queried to check ACTIVE/SUSPENDED before issuing
CREATE INDEX idx_member_status IF NOT EXISTS
  FOR (m:Member) ON (m.status);


// -----------------------------------------------------------------------------
// SECTION 3 — VERIFICATION (run separately after applying constraints)
// -----------------------------------------------------------------------------
// SHOW CONSTRAINTS;
// SHOW INDEXES;
//
// Expected: 13 constraints + 7 extra indexes
// =============================================================================
