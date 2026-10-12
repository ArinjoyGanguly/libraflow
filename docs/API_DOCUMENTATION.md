# LibraFlow — REST API Documentation

This document describes all implemented REST endpoints in the LibraFlow backend. All responses adhere to the standard JSON response format:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-10-12T18:00:00.000Z"
  }
}
```

Errors return HTTP 4xx or 5xx:
```json
{
  "success": false,
  "error": "Error description message",
  "details": { ... }
}
```

---

## 1. Health & Database Readiness

### `GET /health` (or `/api/health`)
HTTP server liveness probe.
- **Status**: `200 OK`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "status": "UP",
      "uptime": 24.5,
      "timestamp": "2026-10-12T18:00:00.000Z",
      "environment": "development"
    }
  }
  ```

### `GET /health/db` (or `/api/health/db`)
Real Neo4j database readiness check (uses `driver.verifyConnectivity()`).
- **Status**: `200 OK` (connected) or `503 Service Unavailable` (unreachable).
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "status": "CONNECTED",
      "database": "neo4j",
      "uri": "bolt://localhost:7687",
      "serverAddress": "localhost:7687"
    }
  }
  ```

---

## 2. Books API (`/api/books`)

### `GET /api/books`
List books with pagination, sorting, and filtering.
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10, max: 100)
  - `search`: Keyword search in title, ISBN, or author name
  - `genre`: Exact genre filter (e.g., `Classic`, `Dystopian`, `Mythology`)
  - `sortBy`: Property to sort by (`title`, `year`, `availableCopies`, `totalCopies`)
  - `sortOrder`: `asc` or `desc` (default: `asc`)
- **Example Request**: `GET /api/books?search=Gatsby&page=1&limit=5`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "bookId": "B001",
          "isbn": "978-0743273565",
          "title": "The Great Gatsby",
          "genre": "Classic",
          "language": "English",
          "edition": "1st",
          "year": 1925,
          "totalCopies": 4,
          "availableCopies": 2,
          "author": { "authorId": "A101", "name": "F. Scott Fitzgerald" },
          "publisher": { "publisherId": "PUB01", "name": "Scribner" },
          "library": { "libraryId": "LIB01", "name": "Central University Library" }
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 5,
      "totalPages": 1
    }
  }
  ```

### `GET /api/books/:bookId`
Detail of a single book with linked author, publisher, and holding library.
- **Response**: `200 OK`

### `POST /api/books`
Create a new book.
- **Body**:
  ```json
  {
    "bookId": "B006",
    "isbn": "978-0140449136",
    "title": "Crime and Punishment",
    "genre": "Psychological Fiction",
    "language": "English",
    "edition": "Penguin Classics",
    "year": 1866,
    "totalCopies": 3,
    "authorId": "A101",
    "publisherId": "PUB01",
    "libraryId": "LIB01"
  }
  ```
- **Response**: `201 Created`

### `PUT /api/books/:bookId`
Update book attributes or relationships.
- **Body**: Any optional subset of book fields.
- **Response**: `200 OK`

### `DELETE /api/books/:bookId`
Delete a book.
- **Integrity Rule**: Blocked with `409 Conflict` if any active loans (`[:FOR_BOOK]`) exist.
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": { "message": "Book 'B006' successfully deleted" }
  }
  ```

---

## 3. Authors API (`/api/authors`)

- `GET /api/authors`: List authors with `page`, `limit`, and `search`.
- `GET /api/authors/:authorId`: Detail of author with list of authored books.
- `POST /api/authors`: Create author (`authorId`, `name`, `email`, optional `phone`, `country`).
- `PUT /api/authors/:authorId`: Update author.
- `DELETE /api/authors/:authorId`: Detach delete author.

---

## 4. Publishers API (`/api/publishers`)

- `GET /api/publishers`: List publishers with `page`, `limit`, and `search`.
- `GET /api/publishers/:publisherId`: Detail of publisher with published books.
- `POST /api/publishers`: Create publisher (`publisherId`, `name`, optional `address`, `phone`, `email`, `website`).
- `PUT /api/publishers/:publisherId`: Update publisher.
- `DELETE /api/publishers/:publisherId`: Detach delete publisher.

---

## 5. Libraries API (`/api/libraries`)

- `GET /api/libraries`: List libraries with book counts and staff counts.
- `GET /api/libraries/:libraryId`: Detail with holdings and staff statistics.
- `POST /api/libraries`: Create library (`libraryId`, `name`, `address`, `city`, optional `phone`, `email`).
- `PUT /api/libraries/:libraryId`: Update library.
- `DELETE /api/libraries/:libraryId`: Delete library (blocked with `409 Conflict` if books are currently held).

---

## 6. Members API (`/api/members`)

> **Security Guarantee**: Stored `passwordHash` is NEVER returned by any Member endpoint.

- `GET /api/members`: List members with active loan counts. Optional `status` and `search` query.
- `GET /api/members/:memberId`: Member detail with complete borrowing history.
- `POST /api/members`: Register/create member (`memberId`, `name`, `email`, optional `password`, `phone`, `address`, `status`).
- `PUT /api/members/:memberId`: Update member attributes.
- `DELETE /api/members/:memberId`: Delete member (blocked with `409 Conflict` if member has active loans).

---

## 7. Employees API (`/api/employees`)

> **Security Guarantee**: Stored `passwordHash` is NEVER returned.

- `GET /api/employees`: List employees.
- `GET /api/employees/:employeeId`: Employee detail.
- `POST /api/employees`: Create employee (`employeeId`, `name`, `email`, `position`, `libraryId`, optional `password`, `phone`).
- `PUT /api/employees/:employeeId`: Update employee attributes.
- `DELETE /api/employees/:employeeId`: Delete employee.

---

## 8. Administrators API (`/api/admins`)

> **Security Guarantee**: Stored `passwordHash` is NEVER returned.

- `GET /api/admins`: List administrators.
- `GET /api/admins/:adminId`: Admin detail.
- `POST /api/admins`: Create admin (`adminId`, `name`, `email`, optional `password`).
- `PUT /api/admins/:adminId`: Update admin attributes.
- `DELETE /api/admins/:adminId`: Delete administrator.

---

## 9. Member Requests API (`/api/requests`)

Preserves the original DA2 Member-to-Employee request pair model.

### `GET /api/requests`
List book requests.
- **Query Parameters**:
  - `status`: Filter by `PENDING`, `APPROVED`, or `REJECTED`.
  - `memberId`: Filter by requesting member.
  - `page`, `limit`: Pagination controls.

### `GET /api/requests/:requestId`
Detail showing the requesting member, requested book, and processing employee.

### `POST /api/requests`
Create a request:
```json
{
  "requestId": "REQ007",
  "memberId": "M001",
  "bookId": "B002",
  "notes": "Need for final exam study"
}
```

### `PUT /api/requests/:requestId`
Update request status and associate processing employee:
```json
{
  "status": "APPROVED",
  "employeeId": "E01",
  "notes": "Approved for 14-day borrowing"
}
```

### `DELETE /api/requests/:requestId`
Delete request node.
