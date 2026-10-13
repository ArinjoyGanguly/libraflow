# LibraFlow — Live Demonstration Checklist & Runbook
## Step-by-Step Evaluator Demo Sequence

Follow this verified sequence during the college laboratory demonstration.

---

### Phase 1: Environment Readiness & Startup

#### 1. Start Neo4j Database
- If using command line:
  ```powershell
  neo4j start
  ```
- If using Neo4j Desktop:
  Click **Start** on the DBMS project.
- Verify Neo4j is listening on `bolt://localhost:7687` and HTTP browser at `http://localhost:7474`.

#### 2. Seed Database (One-time or refresh)
Open Neo4j Browser at `http://localhost:7474` and execute:
1. `database/constraints.cypher` (creates 13 constraints and 7 indexes).
2. `database/seed.cypher` (idempotently creates all initial nodes and relationships).

#### 3. Start Backend Server
In Terminal 1:
```powershell
cd server
npm run dev
```
**Expected Console Output**:
```
[SERVER] LibraFlow Backend running on port 5000 [development]
[SERVER] HTTP Liveness: http://localhost:5000/health
[SERVER] DB Readiness:  http://localhost:5000/health/db
[NEO4J] Connected to bolt://localhost:7687 (database: neo4j)
```

#### 4. Start Frontend Client
In Terminal 2:
```powershell
cd client
npm run dev
```
**Expected Console Output**:
```
  VITE v8.3.4  ready in 250 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### Phase 2: Live Demonstration Sequence

#### Step 1: Open Dashboard (`http://localhost:5173/`)
- **Key Features to Highlight**:
  - Live Neo4j green badge ("Live Neo4j Graph").
  - Summary metric cards populated from real Neo4j Cypher aggregation: Total Catalog Titles, Active Loans, Overdue Loans, Pending Requests.
  - Active Circulation Log table displaying live borrowed books and due dates.
  - Pending Borrow Requests queue showing student requests.

#### Step 2: Books Catalogue (`http://localhost:5173/books`)
- **Action**:
  - Filter by Genre (e.g. "Fiction" or "Classic").
  - Search for "Gatsby" or "Meluha".
  - Observe real-time filtering with available copies displayed.
- **Explain to Evaluator**:
  - Each book displays physical availability. Deleting a book with active loans is blocked by referential integrity guards.

#### Step 3: Graph Discovery (`http://localhost:5173/discovery`)
- **Action**:
  - Select Anchor Node: `The Great Gatsby (B001)`.
  - Point out the 1st-degree neighbors:
    - Author Node: `F. Scott Fitzgerald (A101)` via `-[:WROTE]-`
    - Publisher Node: `Scribner (PUB01)` via `-[:PUBLISHED]-`
  - Show the 3 neighbor cards:
    - Author Bibliography Circle: other books by the same author.
    - Publisher Catalog Imprint: other books from the same publisher.
    - Collaborative Co-Borrowing: books borrowed by readers who read Gatsby.
- **Demonstrate Personalized 3-Hop Recommendations**:
  - Scroll to the "Personalized Member Reading Recommendations" section.
  - Select member: `Alice Kumar (M001)`.
  - Point out the explainability badge: *"Recommended because X readers with overlapping borrowing taste also read this."*
  - Explain the 3-hop traversal query that computes this in real-time without relational self-joins.

#### Step 4: Circulation Desk — Issue & Return (`http://localhost:5173/circulation`)
- **Action**:
  1. **Issue a Book**:
     - Select Member: `Bob Smith (M002)`.
     - Select Book: `To Kill a Mockingbird (B002)`.
     - Click **Issue Book**.
     - Observe success notification, active loan creation, and physical available copies decremented.
  2. **Demonstrate Guard**:
     - Attempt to issue the exact same book to the same member again.
     - Observe system rejection: "Member already has an active loan for this book".
  3. **Return a Book**:
     - Switch to the Return tab.
     - Select the newly issued loan.
     - Click **Process Return**.
     - Observe return status update, fine calculation (if overdue), and copy reinstatement.

#### Step 5: Library Analytics & Reports (`http://localhost:5173/analytics`)
- **Key Features to Highlight**:
  - Most Borrowed Books Leaderboard (Bar chart and ranked table from Cypher Q13 query).
  - Genre Circulation Distribution (Pie chart from Cypher Q15 query).
  - Top Active Readers (Patron Activity ranking from Cypher Q14 query).
  - Circulation Health & Delinquency Assessment (Overdue loan count, average delinquency days, active fines).
  - Campus Library Stock Report (Q18 query displaying branch copies, stock, and staff allocations).

#### Step 6: System Settings & Health Probes (`http://localhost:5173/settings`)
- **Action**:
  - Click **Run System Connection Diagnostic**.
  - Show that it executes live HTTP probes against `/health` and `/health/db`.
  - Evaluators can see uptime, environment mode, and database connection status.

---

### Phase 3: Error Handling & Resilience Demonstration

If the evaluator asks: *"What happens if the database goes down?"*
1. Stop Neo4j: `neo4j stop` (or click Stop in Neo4j Desktop).
2. Click **Refresh Live Data** on the Dashboard.
3. Observe the graceful response:
   - Dashboard displays a clear warning: *"Neo4j Database Unavailable: Express server is running, but Neo4j is unreachable at bolt://localhost:7687"*.
   - Displays exact troubleshooting steps (`neo4j start`).
   - Does not crash and does not show fabricated dummy data.
4. Restart Neo4j: `neo4j start`.
5. Click **Retry Connection** -> Dashboard instantly reconnects and displays live metrics.
