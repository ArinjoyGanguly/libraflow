// =============================================================================
// LibraFlow — Neo4j Seed Data
// File   : database/seed.cypher
// Purpose: Populate the database with realistic demo data.
//          ALL statements use MERGE so re-running does NOT create duplicates.
//
// Prerequisites: Run database/constraints.cypher first.
//
// IDs preserved from DA2 Oracle design:
//   Authors    : A101, A102, A103
//   Publishers : PUB01, PUB02, PUB03
//   Books      : B001, B002, B003
//   Members    : M001, M002
//   Employees  : E01, E02
//   Admins     : AD01, AD02
//
// Additional IDs added for loan/request demonstration:
//   Authors    : A104, A105
//   Publishers : PUB04
//   Books      : B004, B005
//   Members    : M003, M004
//   Libraries  : LIB01, LIB02
//   Loans      : L001–L007
//   Requests   : REQ001–REQ006
//
// Password note:
//   All passwordHash values below are the bcrypt hash of "password123"
//   with 10 salt rounds.  In production the Node.js backend creates these.
//   Hash: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVv/E7tMq
//   (generated via: require('bcryptjs').hashSync('password123', 10))
//
//   Admin/Employee hash is bcrypt of "admin123":
//   $2b$10$TKh8H1.PfJAj1ZWHK4A9wuKqYj1.YBZ5hLPv/s3K4pz9QCO.6z3Wy
//
// How to run:
//   Neo4j Browser : paste entire file, press Ctrl+Enter
//   Cypher Shell  : cypher-shell -u neo4j -p <password> -f database/seed.cypher
// =============================================================================


// =============================================================================
// PART 1 — LIBRARIES
// =============================================================================

MERGE (lib1:Library {libraryId: 'LIB01'})
SET lib1.name    = 'Central City Library',
    lib1.address = '12 MG Road',
    lib1.city    = 'Bengaluru',
    lib1.phone   = '+91-80-22001100',
    lib1.email   = 'central@libraflow.edu';

MERGE (lib2:Library {libraryId: 'LIB02'})
SET lib2.name    = 'North Campus Library',
    lib2.address = '7 College Avenue',
    lib2.city    = 'Bengaluru',
    lib2.phone   = '+91-80-22001200',
    lib2.email   = 'north@libraflow.edu';


// =============================================================================
// PART 2 — AUTHORS  (DA2 IDs: A101, A102, A103; extra: A104, A105)
// =============================================================================

MERGE (a101:Author {authorId: 'A101'})
SET a101.name    = 'Ruskin Bond',
    a101.email   = 'ruskin.bond@authors.net',
    a101.phone   = '+91-135-0001',
    a101.country = 'India';

MERGE (a102:Author {authorId: 'A102'})
SET a102.name    = 'Chetan Bhagat',
    a102.email   = 'chetan.b@authors.net',
    a102.phone   = '+91-11-0002',
    a102.country = 'India';

MERGE (a103:Author {authorId: 'A103'})
SET a103.name    = 'Amish Tripathi',
    a103.email   = 'amish.t@authors.net',
    a103.phone   = '+91-22-0003',
    a103.country = 'India';

MERGE (a104:Author {authorId: 'A104'})
SET a104.name    = 'Arundhati Roy',
    a104.email   = 'arundhati.r@authors.net',
    a104.phone   = '+91-11-0004',
    a104.country = 'India';

MERGE (a105:Author {authorId: 'A105'})
SET a105.name    = 'R.K. Narayan',
    a105.email   = 'rk.narayan@authors.net',
    a105.phone   = '+91-821-0005',
    a105.country = 'India';


// =============================================================================
// PART 3 — PUBLISHERS  (DA2 IDs: PUB01, PUB02, PUB03; extra: PUB04)
// =============================================================================

MERGE (pub1:Publisher {publisherId: 'PUB01'})
SET pub1.name    = 'Penguin Books India',
    pub1.address = 'Community Centre, Panchsheel Park, New Delhi',
    pub1.phone   = '+91-11-40575000',
    pub1.email   = 'info@penguinbooks.in',
    pub1.website = 'www.penguinindia.com';

MERGE (pub2:Publisher {publisherId: 'PUB02'})
SET pub2.name    = 'HarperCollins India',
    pub2.address = 'A-75, Sector 57, Noida',
    pub2.phone   = '+91-120-4044800',
    pub2.email   = 'info@harpercollins.co.in',
    pub2.website = 'www.harpercollins.co.in';

MERGE (pub3:Publisher {publisherId: 'PUB03'})
SET pub3.name    = 'Rupa Publications',
    pub3.address = '7/16 Ansari Road, Daryaganj, New Delhi',
    pub3.phone   = '+91-11-23278586',
    pub3.email   = 'info@rupapublications.com',
    pub3.website = 'www.rupapublications.com';

MERGE (pub4:Publisher {publisherId: 'PUB04'})
SET pub4.name    = 'Oxford University Press India',
    pub4.address = 'YMCA Library Building, Jai Singh Road, New Delhi',
    pub4.phone   = '+91-11-23360823',
    pub4.email   = 'info@oup.com',
    pub4.website = 'www.oup.com/academic/india';


// =============================================================================
// PART 4 — BOOKS  (DA2 IDs: B001, B002, B003; extra: B004, B005)
// availableCopies reflects current state AFTER loans below are applied.
// totalCopies is fixed. Adjust availableCopies manually if re-seeding.
// =============================================================================

MERGE (b001:Book {bookId: 'B001'})
SET b001.isbn            = '978-0143330684',
    b001.title           = 'The Room on the Roof',
    b001.genre           = 'Fiction',
    b001.language        = 'English',
    b001.edition         = '1st',
    b001.year            = 1956,
    b001.totalCopies     = 4,
    b001.availableCopies = 2;
// 2 copies currently on loan (L001 ACTIVE, L003 ACTIVE)

MERGE (b002:Book {bookId: 'B002'})
SET b002.isbn            = '978-8129135728',
    b002.title           = 'Five Point Someone',
    b002.genre           = 'Fiction',
    b002.language        = 'English',
    b002.edition         = '2nd',
    b002.year            = 2004,
    b002.totalCopies     = 3,
    b002.availableCopies = 3;
// All copies available (L002 RETURNED)

MERGE (b003:Book {bookId: 'B003'})
SET b003.isbn            = '978-9381626597',
    b003.title           = 'The Immortals of Meluha',
    b003.genre           = 'Mythology',
    b003.language        = 'English',
    b003.edition         = '1st',
    b003.year            = 2010,
    b003.totalCopies     = 5,
    b003.availableCopies = 3;
// 2 copies on loan: L004 OVERDUE, L005 ACTIVE

MERGE (b004:Book {bookId: 'B004'})
SET b004.isbn            = '978-0143028475',
    b004.title           = 'The God of Small Things',
    b004.genre           = 'Literary Fiction',
    b004.language        = 'English',
    b004.edition         = '1st',
    b004.year            = 1997,
    b004.totalCopies     = 3,
    b004.availableCopies = 2;
// 1 copy on loan: L006 ACTIVE

MERGE (b005:Book {bookId: 'B005'})
SET b005.isbn            = '978-0143029823',
    b005.title           = 'Malgudi Days',
    b005.genre           = 'Short Stories',
    b005.language        = 'English',
    b005.edition         = '3rd',
    b005.year            = 1943,
    b005.totalCopies     = 4,
    b005.availableCopies = 4;
// All copies available (L007 RETURNED)


// =============================================================================
// PART 5 — MEMBERS  (DA2 IDs: M001, M002; extra: M003, M004)
// =============================================================================

MERGE (m001:Member {memberId: 'M001'})
SET m001.name         = 'Priya Sharma',
    m001.email        = 'priya.sharma@student.edu',
    m001.passwordHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVv/E7tMq',
    m001.phone        = '+91-9876543210',
    m001.address      = '14 Lakeview Colony, Bengaluru',
    m001.joinDate     = date('2025-07-01'),
    m001.status       = 'ACTIVE',
    m001.role         = 'member';

MERGE (m002:Member {memberId: 'M002'})
SET m002.name         = 'Arjun Mehta',
    m002.email        = 'arjun.mehta@student.edu',
    m002.passwordHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVv/E7tMq',
    m002.phone        = '+91-9876543211',
    m002.address      = '22 Garden Street, Bengaluru',
    m002.joinDate     = date('2025-08-15'),
    m002.status       = 'ACTIVE',
    m002.role         = 'member';

MERGE (m003:Member {memberId: 'M003'})
SET m003.name         = 'Kavitha Nair',
    m003.email        = 'kavitha.nair@student.edu',
    m003.passwordHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVv/E7tMq',
    m003.phone        = '+91-9876543212',
    m003.address      = '8 Hill View Apartments, Bengaluru',
    m003.joinDate     = date('2025-09-01'),
    m003.status       = 'ACTIVE',
    m003.role         = 'member';

MERGE (m004:Member {memberId: 'M004'})
SET m004.name         = 'Rohan Das',
    m004.email        = 'rohan.das@student.edu',
    m004.passwordHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVv/E7tMq',
    m004.phone        = '+91-9876543213',
    m004.address      = '3 River Road, Bengaluru',
    m004.joinDate     = date('2025-10-01'),
    m004.status       = 'SUSPENDED',
    m004.role         = 'member';
// M004 is SUSPENDED to demonstrate that suspended members cannot borrow


// =============================================================================
// PART 6 — EMPLOYEES  (DA2 IDs: E01, E02)
// =============================================================================

MERGE (e01:Employee {employeeId: 'E01'})
SET e01.name         = 'Suresh Kumar',
    e01.email        = 'suresh.kumar@libraflow.edu',
    e01.passwordHash = '$2b$10$TKh8H1.PfJAj1ZWHK4A9wuKqYj1.YBZ5hLPv/s3K4pz9QCO.6z3Wy',
    e01.phone        = '+91-9900001001',
    e01.position     = 'Senior Librarian',
    e01.libraryId    = 'LIB01',
    e01.role         = 'employee';

MERGE (e02:Employee {employeeId: 'E02'})
SET e02.name         = 'Meena Rajan',
    e02.email        = 'meena.rajan@libraflow.edu',
    e02.passwordHash = '$2b$10$TKh8H1.PfJAj1ZWHK4A9wuKqYj1.YBZ5hLPv/s3K4pz9QCO.6z3Wy',
    e02.phone        = '+91-9900001002',
    e02.position     = 'Library Assistant',
    e02.libraryId    = 'LIB02',
    e02.role         = 'employee';


// =============================================================================
// PART 7 — ADMINS  (DA2 IDs: AD01, AD02)
// =============================================================================

MERGE (ad01:Admin {adminId: 'AD01'})
SET ad01.name         = 'Dr. Lakshmi Rao',
    ad01.email        = 'admin1@libraflow.edu',
    ad01.passwordHash = '$2b$10$TKh8H1.PfJAj1ZWHK4A9wuKqYj1.YBZ5hLPv/s3K4pz9QCO.6z3Wy',
    ad01.role         = 'admin';

MERGE (ad02:Admin {adminId: 'AD02'})
SET ad02.name         = 'Prof. Vikram Singh',
    ad02.email        = 'admin2@libraflow.edu',
    ad02.passwordHash = '$2b$10$TKh8H1.PfJAj1ZWHK4A9wuKqYj1.YBZ5hLPv/s3K4pz9QCO.6z3Wy',
    ad02.role         = 'admin';


// =============================================================================
// PART 8 — RELATIONSHIPS: AUTHORSHIP, PUBLISHING, LIBRARY HOLDINGS
// =============================================================================

// --- Authorship ---
MATCH (a:Author {authorId: 'A101'}), (b:Book {bookId: 'B001'})
MERGE (a)-[:WROTE]->(b);

MATCH (a:Author {authorId: 'A102'}), (b:Book {bookId: 'B002'})
MERGE (a)-[:WROTE]->(b);

MATCH (a:Author {authorId: 'A103'}), (b:Book {bookId: 'B003'})
MERGE (a)-[:WROTE]->(b);

MATCH (a:Author {authorId: 'A104'}), (b:Book {bookId: 'B004'})
MERGE (a)-[:WROTE]->(b);

MATCH (a:Author {authorId: 'A105'}), (b:Book {bookId: 'B005'})
MERGE (a)-[:WROTE]->(b);

// --- Publishing ---
MATCH (p:Publisher {publisherId: 'PUB01'}), (b:Book {bookId: 'B001'})
MERGE (p)-[:PUBLISHED]->(b);

MATCH (p:Publisher {publisherId: 'PUB02'}), (b:Book {bookId: 'B002'})
MERGE (p)-[:PUBLISHED]->(b);

MATCH (p:Publisher {publisherId: 'PUB03'}), (b:Book {bookId: 'B003'})
MERGE (p)-[:PUBLISHED]->(b);

MATCH (p:Publisher {publisherId: 'PUB01'}), (b:Book {bookId: 'B004'})
MERGE (p)-[:PUBLISHED]->(b);
// PUB01 publishes both B001 and B004 (demonstrates one-to-many)

MATCH (p:Publisher {publisherId: 'PUB04'}), (b:Book {bookId: 'B005'})
MERGE (p)-[:PUBLISHED]->(b);

// --- Library Holdings ---
// LIB01 holds B001, B002, B003, B004
MATCH (b:Book {bookId: 'B001'}), (l:Library {libraryId: 'LIB01'})
MERGE (b)-[:HELD_BY]->(l);

MATCH (b:Book {bookId: 'B002'}), (l:Library {libraryId: 'LIB01'})
MERGE (b)-[:HELD_BY]->(l);

MATCH (b:Book {bookId: 'B003'}), (l:Library {libraryId: 'LIB01'})
MERGE (b)-[:HELD_BY]->(l);

MATCH (b:Book {bookId: 'B004'}), (l:Library {libraryId: 'LIB01'})
MERGE (b)-[:HELD_BY]->(l);

// LIB02 holds B003, B005 (B003 is in both libraries)
MATCH (b:Book {bookId: 'B003'}), (l:Library {libraryId: 'LIB02'})
MERGE (b)-[:HELD_BY]->(l);

MATCH (b:Book {bookId: 'B005'}), (l:Library {libraryId: 'LIB02'})
MERGE (b)-[:HELD_BY]->(l);

// --- Employee-Library (works at) ---
MATCH (e:Employee {employeeId: 'E01'}), (l:Library {libraryId: 'LIB01'})
MERGE (e)-[:WORKS_AT]->(l);

MATCH (e:Employee {employeeId: 'E02'}), (l:Library {libraryId: 'LIB02'})
MERGE (e)-[:WORKS_AT]->(l);

// --- Admin manages libraries ---
MATCH (a:Admin {adminId: 'AD01'}), (l:Library {libraryId: 'LIB01'})
MERGE (a)-[:MANAGES]->(l);

MATCH (a:Admin {adminId: 'AD02'}), (l:Library {libraryId: 'LIB02'})
MERGE (a)-[:MANAGES]->(l);


// =============================================================================
// PART 9 — LOAN NODES
//
// Loan status scenarios covered:
//   L001 — ACTIVE       (on time,  M001 has B001)
//   L002 — RETURNED     (on time,  M001 returned B002)
//   L003 — ACTIVE       (on time,  M002 has B001)
//   L004 — OVERDUE      (past due, M002 has B003)  ← OVERDUE example
//   L005 — ACTIVE       (on time,  M003 has B003)
//   L006 — ACTIVE       (on time,  M003 has B004)
//   L007 — RETURNED     (late,     M004 returned B005 with fine)
//
// IMPORTANT: These Loan nodes are created with MERGE on loanId.
// The issueDate / dueDate use fixed dates relative to 2026-10-12
// so that overdue logic is stable for demonstration purposes.
// =============================================================================

// --- L001: M001 currently borrowing B001 (ACTIVE, due 2026-10-20) ---
MERGE (l001:Loan {loanId: 'L001'})
SET l001.issueDate   = date('2026-10-06'),
    l001.dueDate     = date('2026-10-20'),
    l001.returnDate  = null,
    l001.status      = 'ACTIVE',
    l001.fineAmount  = 0.0;

MATCH (m:Member {memberId: 'M001'}), (loan:Loan {loanId: 'L001'})
MERGE (m)-[:BORROWED]->(loan);

MATCH (loan:Loan {loanId: 'L001'}), (b:Book {bookId: 'B001'})
MERGE (loan)-[:FOR_BOOK]->(b);

MATCH (e:Employee {employeeId: 'E01'}), (loan:Loan {loanId: 'L001'})
MERGE (e)-[:ISSUED]->(loan);


// --- L002: M001 returned B002 on time (RETURNED) ---
MERGE (l002:Loan {loanId: 'L002'})
SET l002.issueDate   = date('2026-09-01'),
    l002.dueDate     = date('2026-09-15'),
    l002.returnDate  = date('2026-09-14'),
    l002.status      = 'RETURNED',
    l002.fineAmount  = 0.0;

MATCH (m:Member {memberId: 'M001'}), (loan:Loan {loanId: 'L002'})
MERGE (m)-[:BORROWED]->(loan);

MATCH (loan:Loan {loanId: 'L002'}), (b:Book {bookId: 'B002'})
MERGE (loan)-[:FOR_BOOK]->(b);

MATCH (e:Employee {employeeId: 'E01'}), (loan:Loan {loanId: 'L002'})
MERGE (e)-[:ISSUED]->(loan);


// --- L003: M002 currently borrowing B001 (ACTIVE, due 2026-10-25) ---
MERGE (l003:Loan {loanId: 'L003'})
SET l003.issueDate   = date('2026-10-11'),
    l003.dueDate     = date('2026-10-25'),
    l003.returnDate  = null,
    l003.status      = 'ACTIVE',
    l003.fineAmount  = 0.0;

MATCH (m:Member {memberId: 'M002'}), (loan:Loan {loanId: 'L003'})
MERGE (m)-[:BORROWED]->(loan);

MATCH (loan:Loan {loanId: 'L003'}), (b:Book {bookId: 'B001'})
MERGE (loan)-[:FOR_BOOK]->(b);

MATCH (e:Employee {employeeId: 'E02'}), (loan:Loan {loanId: 'L003'})
MERGE (e)-[:ISSUED]->(loan);


// --- L004: M002 has B003 OVERDUE (dueDate was 2026-09-28, today is 2026-10-12) ---
MERGE (l004:Loan {loanId: 'L004'})
SET l004.issueDate   = date('2026-09-14'),
    l004.dueDate     = date('2026-09-28'),
    l004.returnDate  = null,
    l004.status      = 'OVERDUE',
    l004.fineAmount  = 28.0;
// Fine = 14 days overdue * 2 per day = 28

MATCH (m:Member {memberId: 'M002'}), (loan:Loan {loanId: 'L004'})
MERGE (m)-[:BORROWED]->(loan);

MATCH (loan:Loan {loanId: 'L004'}), (b:Book {bookId: 'B003'})
MERGE (loan)-[:FOR_BOOK]->(b);

MATCH (e:Employee {employeeId: 'E01'}), (loan:Loan {loanId: 'L004'})
MERGE (e)-[:ISSUED]->(loan);


// --- L005: M003 currently borrowing B003 (ACTIVE, due 2026-10-22) ---
MERGE (l005:Loan {loanId: 'L005'})
SET l005.issueDate   = date('2026-10-08'),
    l005.dueDate     = date('2026-10-22'),
    l005.returnDate  = null,
    l005.status      = 'ACTIVE',
    l005.fineAmount  = 0.0;

MATCH (m:Member {memberId: 'M003'}), (loan:Loan {loanId: 'L005'})
MERGE (m)-[:BORROWED]->(loan);

MATCH (loan:Loan {loanId: 'L005'}), (b:Book {bookId: 'B003'})
MERGE (loan)-[:FOR_BOOK]->(b);

MATCH (e:Employee {employeeId: 'E02'}), (loan:Loan {loanId: 'L005'})
MERGE (e)-[:ISSUED]->(loan);


// --- L006: M003 currently borrowing B004 (ACTIVE, due 2026-10-19) ---
MERGE (l006:Loan {loanId: 'L006'})
SET l006.issueDate   = date('2026-10-05'),
    l006.dueDate     = date('2026-10-19'),
    l006.returnDate  = null,
    l006.status      = 'ACTIVE',
    l006.fineAmount  = 0.0;

MATCH (m:Member {memberId: 'M003'}), (loan:Loan {loanId: 'L006'})
MERGE (m)-[:BORROWED]->(loan);

MATCH (loan:Loan {loanId: 'L006'}), (b:Book {bookId: 'B004'})
MERGE (loan)-[:FOR_BOOK]->(b);

MATCH (e:Employee {employeeId: 'E01'}), (loan:Loan {loanId: 'L006'})
MERGE (e)-[:ISSUED]->(loan);


// --- L007: M004 returned B005 LATE (RETURNED with fine) ---
MERGE (l007:Loan {loanId: 'L007'})
SET l007.issueDate   = date('2026-08-01'),
    l007.dueDate     = date('2026-08-15'),
    l007.returnDate  = date('2026-08-22'),
    l007.status      = 'RETURNED',
    l007.fineAmount  = 14.0;
// Fine = 7 days late * 2 per day = 14

MATCH (m:Member {memberId: 'M004'}), (loan:Loan {loanId: 'L007'})
MERGE (m)-[:BORROWED]->(loan);

MATCH (loan:Loan {loanId: 'L007'}), (b:Book {bookId: 'B005'})
MERGE (loan)-[:FOR_BOOK]->(b);

MATCH (e:Employee {employeeId: 'E02'}), (loan:Loan {loanId: 'L007'})
MERGE (e)-[:ISSUED]->(loan);


// =============================================================================
// PART 10 — REQUEST NODES
// Preserves the DA2 Member-to-Employee request association.
// Each Request is linked to the Member who sent it,
// the Book requested, and (if processed) the Employee who handled it.
//
// Status examples:
//   REQ001 — PENDING   (M001 wants B003,  not yet processed)
//   REQ002 — APPROVED  (M002 wanted B004, E01 approved it -> became L006)
//   REQ003 — REJECTED  (M003 wanted B002, E01 rejected)
//   REQ004 — PENDING   (M004 wants B005,  will be rejected — suspended member)
//   REQ005 — PENDING   (M002 wants B005,  not yet processed)
//   REQ006 — APPROVED  (M003 wanted B003, E02 approved -> became L005)
// =============================================================================

MERGE (req001:Request {requestId: 'REQ001'})
SET req001.requestDate = date('2026-10-10'),
    req001.status      = 'PENDING',
    req001.notes       = 'Would like to borrow for project research';

MATCH (m:Member {memberId: 'M001'}), (r:Request {requestId: 'REQ001'})
MERGE (m)-[:SENT]->(r);

MATCH (r:Request {requestId: 'REQ001'}), (b:Book {bookId: 'B003'})
MERGE (r)-[:REQUESTS_BOOK]->(b);


MERGE (req002:Request {requestId: 'REQ002'})
SET req002.requestDate = date('2026-10-04'),
    req002.status      = 'APPROVED',
    req002.notes       = 'Reading for literature class';

MATCH (m:Member {memberId: 'M003'}), (r:Request {requestId: 'REQ002'})
MERGE (m)-[:SENT]->(r);

MATCH (r:Request {requestId: 'REQ002'}), (b:Book {bookId: 'B004'})
MERGE (r)-[:REQUESTS_BOOK]->(b);

MATCH (e:Employee {employeeId: 'E01'}), (r:Request {requestId: 'REQ002'})
MERGE (e)-[:PROCESSED]->(r);


MERGE (req003:Request {requestId: 'REQ003'})
SET req003.requestDate = date('2026-09-28'),
    req003.status      = 'REJECTED',
    req003.notes       = 'Member already has 2 active loans';

MATCH (m:Member {memberId: 'M003'}), (r:Request {requestId: 'REQ003'})
MERGE (m)-[:SENT]->(r);

MATCH (r:Request {requestId: 'REQ003'}), (b:Book {bookId: 'B002'})
MERGE (r)-[:REQUESTS_BOOK]->(b);

MATCH (e:Employee {employeeId: 'E01'}), (r:Request {requestId: 'REQ003'})
MERGE (e)-[:PROCESSED]->(r);


MERGE (req004:Request {requestId: 'REQ004'})
SET req004.requestDate = date('2026-10-11'),
    req004.status      = 'PENDING',
    req004.notes       = 'Urgent request';

MATCH (m:Member {memberId: 'M004'}), (r:Request {requestId: 'REQ004'})
MERGE (m)-[:SENT]->(r);

MATCH (r:Request {requestId: 'REQ004'}), (b:Book {bookId: 'B005'})
MERGE (r)-[:REQUESTS_BOOK]->(b);
// REQ004 from suspended member M004 — will be rejected by employee


MERGE (req005:Request {requestId: 'REQ005'})
SET req005.requestDate = date('2026-10-12'),
    req005.status      = 'PENDING',
    req005.notes       = 'Personal reading';

MATCH (m:Member {memberId: 'M002'}), (r:Request {requestId: 'REQ005'})
MERGE (m)-[:SENT]->(r);

MATCH (r:Request {requestId: 'REQ005'}), (b:Book {bookId: 'B005'})
MERGE (r)-[:REQUESTS_BOOK]->(b);


MERGE (req006:Request {requestId: 'REQ006'})
SET req006.requestDate = date('2026-10-07'),
    req006.status      = 'APPROVED',
    req006.notes       = 'Mythology assignment';

MATCH (m:Member {memberId: 'M002'}), (r:Request {requestId: 'REQ006'})
MERGE (m)-[:SENT]->(r);

MATCH (r:Request {requestId: 'REQ006'}), (b:Book {bookId: 'B003'})
MERGE (r)-[:REQUESTS_BOOK]->(b);

MATCH (e:Employee {employeeId: 'E02'}), (r:Request {requestId: 'REQ006'})
MERGE (e)-[:PROCESSED]->(r);


// =============================================================================
// PART 11 — VERIFICATION QUERIES (uncomment to check after seeding)
// =============================================================================

// Check total node counts
// MATCH (n) RETURN labels(n)[0] AS label, count(n) AS count ORDER BY label;

// Verify Book/Loan consistency
// MATCH (b:Book)
// OPTIONAL MATCH (l:Loan {status:'ACTIVE'})-[:FOR_BOOK]->(b)
// RETURN b.bookId, b.title, b.availableCopies, b.totalCopies,
//        count(l) AS activeLoans,
//        b.totalCopies - count(l) AS expectedAvailable;

// Confirm no orphan Loan nodes
// MATCH (l:Loan) WHERE NOT ()-[:BORROWED]->(l) RETURN l.loanId;

// Expected node counts after seeding:
//   Library     : 2
//   Author      : 5
//   Publisher   : 4
//   Book        : 5
//   Member      : 4
//   Employee    : 2
//   Admin       : 2
//   Loan        : 7
//   Request     : 6
//   TOTAL       : 37 nodes
// =============================================================================
