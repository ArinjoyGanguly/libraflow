# LibraFlow — Library Management System

LibraFlow is a modern full-stack Library Management System designed for college DBMS (DA3). It transitions an Oracle SQL/PLSQL relational database (DA2) into an end-to-end graph-powered system using Neo4j as the primary database.

- **Frontend**: React + Vite + TypeScript + Tailwind CSS (Port `5173`)
- **Backend**: Node.js + Express + TypeScript (Port `5000`)
- **Database**: Neo4j Graph Database (Bolt port `7687`, HTTP port `7474`)

---

## Workspace Structure

```
LIBRARY/
├── database/                    # Cypher schema, idempotent seed, and demo queries
│   ├── constraints.cypher       # 13 uniqueness constraints + 7 performance indexes
│   ├── seed.cypher              # Idempotent MERGE script for all 37 base nodes
│   └── demo-queries.cypher      # 25 test queries and 7 integrity checks (IC01-IC07)
├── docs/                        # Complete design & specification documentation
│   ├── ARCHITECTURE.md          # Architecture, contracts, transactions, security
│   ├── DATABASE_SCHEMA.md       # Graph schema, labels, relationships, node properties
│   └── IMPLEMENTATION_PLAN.md   # Phased step-by-step roadmap
├── server/                      # Express + Node.js + TypeScript backend (Phase 3)
│   ├── src/
│   │   ├── config/              # Centralized Neo4j connection & env loader
│   │   ├── middleware/          # Logger, global error handler, validation helpers
│   │   ├── routes/              # Health & readiness routes
│   │   ├── types/               # TypeScript interfaces & API response contracts
│   │   ├── utils/               # Structured response helpers
│   │   ├── app.ts               # Express application initialization & middleware
│   │   └── server.ts            # Server bootstrap & lifecycle shutdown hooks
│   ├── tests/                   # Backend test suite (Jest + Supertest)
│   ├── .env.example             # Template for required environment variables
│   ├── tsconfig.json            # Strict TypeScript configuration
│   └── package.json             # Backend dependencies and scripts
└── PROJECT_STATE.md             # Project lifecycle tracker & audit log
```

---

## Prerequisites

1. **Node.js**: v20.x LTS or higher
2. **npm**: v10.x or higher
3. **Neo4j**: v5.x (Neo4j Desktop, Local Community/Enterprise, or Neo4j AuraDB)

---

## Backend Setup & Execution

### 1. Install Server Dependencies

Navigate to the `server/` directory and install runtime and developer packages:

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Create your local `.env` configuration file from the provided `.env.example`:

```bash
cp .env.example .env
```

Ensure `.env` contains the correct credentials for your running Neo4j instance:

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Neo4j Graph Database
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_secure_password
NEO4J_DATABASE=neo4j

# Authentication & Business Logic
JWT_SECRET=replace_with_a_secure_random_key_of_at_least_32_characters
JWT_EXPIRES_IN=24h
FINE_RATE_PER_DAY=2
LOAN_PERIOD_DAYS=14
```

> **Note**: `.env` is ignored by Git to prevent credential leaks.

### 3. Initialize Neo4j Database (First-time setup)

Before running the backend, execute the Cypher scripts in your Neo4j Browser or via `cypher-shell`:

1. Apply constraints and indexes:
   ```bash
   cypher-shell -u neo4j -p your_secure_password -f ../database/constraints.cypher
   ```
2. Apply seed data:
   ```bash
   cypher-shell -u neo4j -p your_secure_password -f ../database/seed.cypher
   ```

### 4. Build and Run Backend

- **Development Mode** (with hot reload):
  ```bash
  npm run dev
  ```
- **Production Build** (compiles TypeScript to `dist/`):
  ```bash
  npm run build
  ```
- **Production Start**:
  ```bash
  npm start
  ```
- **Execute Test Suite**:
  ```bash
  npm test
  ```

---

## Health & Database Readiness Endpoints

LibraFlow cleanly separates HTTP process liveness from Neo4j database readiness:

### 1. HTTP Liveness Check
- **Endpoint**: `GET /health` (also aliased at `GET /api/health`)
- **Status**: Always `200 OK` if Express server is running.
- **Sample Response**:
  ```json
  {
    "success": true,
    "data": {
      "status": "UP",
      "uptime": 12.34,
      "timestamp": "2026-10-12T18:00:00.000Z"
    }
  }
  ```

### 2. Neo4j Database Readiness Check
- **Endpoint**: `GET /health/db` (also aliased at `GET /api/health/db`)
- **Behavior**: Truly executes `driver.verifyConnectivity()` against the configured Neo4j instance. Does **not** fabricate success.
- **When Connected (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "status": "CONNECTED",
      "database": "neo4j",
      "uri": "bolt://localhost:7687"
    }
  }
  ```
- **When Unreachable (`503 Service Unavailable`)**:
  ```json
  {
    "success": false,
    "error": "Neo4j database connection failed",
    "details": "Failed to connect to bolt://localhost:7687",
    "data": {
      "status": "DISCONNECTED",
      "database": "neo4j",
      "uri": "bolt://localhost:7687"
    }
  }
  ```

---

## API Response Format Convention

All responses from LibraFlow follow a standardized JSON schema:

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-10-12T18:00:00.000Z"
  }
}

// Error
{
  "success": false,
  "error": "Error message description",
  "details": { ... } // optional
}
```
