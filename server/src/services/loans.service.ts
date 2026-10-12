import neo4j from 'neo4j-driver';
import { withSession, withTransaction } from '../config/neo4j';
import { config } from '../config/env';
import { LoanDTO, OverdueLoanDTO, IssueBookInput, ReturnBookInput, PaginationQuery, PaginatedResult } from '../types';
import { NotFoundError, ConflictError, BadRequestError, ForbiddenError } from '../utils/errors';
import { toNative } from '../utils/neo4j-helpers';

export class LoansService {
  /**
   * Issue a book to a member within an ACID transaction.
   * Enforces:
   * 1. Member exists and is ACTIVE (not SUSPENDED).
   * 2. Book exists and has available copies > 0.
   * 3. Member does NOT currently have an ACTIVE loan for the same book.
   * 4. Atomic decrement of book.availableCopies and creation of (:Loan) node with relationships.
   */
  static async issueBook(input: IssueBookInput): Promise<LoanDTO> {
    const loanPeriodDays = input.loanPeriodDays || config.business.loanPeriodDays || 14;

    return withTransaction(async (tx) => {
      // 1. Verify Member existence and status
      const memberRes = await tx.run(
        'MATCH (m:Member {memberId: $memberId}) RETURN m',
        { memberId: input.memberId }
      );
      if (memberRes.records.length === 0) {
        throw new NotFoundError(`Member with ID '${input.memberId}' not found`);
      }
      const member = toNative(memberRes.records[0].get('m'));
      if (member.status === 'SUSPENDED') {
        throw new ForbiddenError(`Member account '${input.memberId}' is SUSPENDED and cannot borrow books`);
      }

      // 2. Verify Book existence
      const bookRes = await tx.run(
        'MATCH (b:Book {bookId: $bookId}) RETURN b',
        { bookId: input.bookId }
      );
      if (bookRes.records.length === 0) {
        throw new NotFoundError(`Book with ID '${input.bookId}' not found`);
      }
      const book = toNative(bookRes.records[0].get('b'));

      // 3. Check for available copies
      if (book.availableCopies <= 0) {
        throw new BadRequestError(`No copies available for book '${input.bookId}' (${book.title})`);
      }

      // 4. Verify no active duplicate loan for this member and book
      const duplicateRes = await tx.run(
        `MATCH (m:Member {memberId: $memberId})-[:BORROWED]->(l:Loan)-[:FOR_BOOK]->(b:Book {bookId: $bookId})
         WHERE l.status IN ['ACTIVE', 'OVERDUE']
         RETURN l.loanId AS loanId`,
        { memberId: input.memberId, bookId: input.bookId }
      );
      if (duplicateRes.records.length > 0) {
        throw new ConflictError(
          `Member '${input.memberId}' already has an active loan (${duplicateRes.records[0].get('loanId')}) for book '${input.bookId}'`
        );
      }

      // 5. Verify Employee if provided
      if (input.employeeId) {
        const empRes = await tx.run(
          'MATCH (e:Employee {employeeId: $employeeId}) RETURN e',
          { employeeId: input.employeeId }
        );
        if (empRes.records.length === 0) {
          throw new NotFoundError(`Employee with ID '${input.employeeId}' not found`);
        }
      }

      // 6. Generate Loan ID if not supplied
      let loanId = input.loanId;
      if (!loanId) {
        const idCheck = await tx.run(
          `MATCH (l:Loan)
           RETURN count(l) AS count`
        );
        const count = toNative(idCheck.records[0].get('count')) || 0;
        loanId = `L${String(count + 1).padStart(3, '0')}_${Date.now().toString(36).toUpperCase()}`;
      } else {
        // Ensure loanId uniqueness
        const existRes = await tx.run(
          'MATCH (l:Loan {loanId: $loanId}) RETURN l.loanId',
          { loanId }
        );
        if (existRes.records.length > 0) {
          throw new ConflictError(`Loan with ID '${loanId}' already exists`);
        }
      }

      // 7. Atomic transaction: Acquire exclusive lock on Book, decrement availableCopies, create Loan
      const issueCypher = `
        MATCH (b:Book {bookId: $bookId})
        WHERE b.availableCopies > 0
        SET b.availableCopies = b.availableCopies - 1
        WITH b
        MATCH (m:Member {memberId: $memberId})
        CREATE (l:Loan {
          loanId: $loanId,
          issueDate: date(),
          dueDate: date() + duration({days: $loanPeriodDays}),
          returnDate: null,
          status: 'ACTIVE',
          fineAmount: 0.0
        })
        CREATE (m)-[:BORROWED]->(l)
        CREATE (l)-[:FOR_BOOK]->(b)
        WITH l, b, m
        OPTIONAL MATCH (e:Employee {employeeId: $employeeId})
        FOREACH (_ IN CASE WHEN e IS NOT NULL THEN [1] ELSE [] END |
          CREATE (e)-[:ISSUED]->(l)
        )
        RETURN l,
               { memberId: m.memberId, name: m.name, email: m.email } AS member,
               { bookId: b.bookId, title: b.title, isbn: b.isbn } AS book,
               { employeeId: e.employeeId, name: e.name } AS issuedBy
      `;

      const result = await tx.run(issueCypher, {
        bookId: input.bookId,
        memberId: input.memberId,
        loanId,
        loanPeriodDays: neo4j.int(loanPeriodDays),
        employeeId: input.employeeId || null,
      });

      if (result.records.length === 0) {
        throw new BadRequestError(`Failed to issue loan: book copies depleted during transaction`);
      }

      const rec = result.records[0];
      const loanNode = toNative(rec.get('l'));
      const memberNode = toNative(rec.get('member'));
      const bookNode = toNative(rec.get('book'));
      const issuedByNode = toNative(rec.get('issuedBy'));

      return {
        ...loanNode,
        member: memberNode?.memberId ? memberNode : undefined,
        book: bookNode?.bookId ? bookNode : undefined,
        issuedBy: issuedByNode?.employeeId ? issuedByNode : undefined,
      };
    });
  }

  /**
   * Return a book within an ACID transaction.
   * Enforces:
   * 1. Loan exists.
   * 2. Loan is currently ACTIVE or OVERDUE (rejects already RETURNED loans).
   * 3. Atomically sets status='RETURNED', records returnDate, calculates fine if overdue,
   *    and increments book.availableCopies.
   */
  static async returnBook(loanId: string, input?: ReturnBookInput): Promise<LoanDTO> {
    const fineRatePerDay = input?.fineRatePerDay !== undefined
      ? input.fineRatePerDay
      : (config.business.fineRatePerDay || 2);

    return withTransaction(async (tx) => {
      // 1. Check current loan existence and status
      const loanRes = await tx.run(
        `MATCH (l:Loan {loanId: $loanId})
         OPTIONAL MATCH (l)-[:FOR_BOOK]->(b:Book)
         RETURN l, b`,
        { loanId }
      );

      if (loanRes.records.length === 0 || !loanRes.records[0].get('l')) {
        throw new NotFoundError(`Loan with ID '${loanId}' not found`);
      }

      const currentLoan = toNative(loanRes.records[0].get('l'));
      if (currentLoan.status === 'RETURNED') {
        throw new BadRequestError(
          `Loan '${loanId}' has already been returned on ${currentLoan.returnDate || 'record'}`
        );
      }

      // 2. Atomic return transaction: Update loan status, calculate fine, restore book copy
      const returnCypher = `
        MATCH (l:Loan {loanId: $loanId})-[:FOR_BOOK]->(b:Book)
        WHERE l.status IN ['ACTIVE', 'OVERDUE']
        WITH l, b, coalesce($customReturnDate, date()) AS actualReturnDate
        SET l.status = 'RETURNED',
            l.returnDate = actualReturnDate,
            l.fineAmount = CASE
              WHEN l.dueDate < actualReturnDate
              THEN duration.between(l.dueDate, actualReturnDate).days * $fineRatePerDay
              ELSE 0.0
            END,
            b.availableCopies = b.availableCopies + 1
        WITH l, b
        MATCH (m:Member)-[:BORROWED]->(l)
        OPTIONAL MATCH (e:Employee)-[:ISSUED]->(l)
        RETURN l,
               { memberId: m.memberId, name: m.name, email: m.email } AS member,
               { bookId: b.bookId, title: b.title, isbn: b.isbn } AS book,
               { employeeId: e.employeeId, name: e.name } AS issuedBy
      `;

      const result = await tx.run(returnCypher, {
        loanId,
        customReturnDate: input?.returnDate ? neo4j.types.Date.fromStandardDate(new Date(input.returnDate)) : null,
        fineRatePerDay,
      });

      if (result.records.length === 0) {
        throw new BadRequestError(`Failed to process return for loan '${loanId}'`);
      }

      const rec = result.records[0];
      const loanNode = toNative(rec.get('l'));
      const memberNode = toNative(rec.get('member'));
      const bookNode = toNative(rec.get('book'));
      const issuedByNode = toNative(rec.get('issuedBy'));

      return {
        ...loanNode,
        member: memberNode?.memberId ? memberNode : undefined,
        book: bookNode?.bookId ? bookNode : undefined,
        issuedBy: issuedByNode?.employeeId ? issuedByNode : undefined,
      };
    });
  }

  /**
   * List loans with pagination and filters.
   */
  static async listLoans(
    query: PaginationQuery & { memberId?: string; bookId?: string }
  ): Promise<PaginatedResult<LoanDTO>> {
    return withSession(async (session) => {
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
      const skip = (page - 1) * limit;
      const status = query.status?.trim() || '';
      const memberId = query.memberId?.trim() || '';
      const bookId = query.bookId?.trim() || '';

      const whereClauses: string[] = [];
      if (status) {
        whereClauses.push('l.status = $status');
      }
      if (memberId) {
        whereClauses.push('m.memberId = $memberId');
      }
      if (bookId) {
        whereClauses.push('b.bookId = $bookId');
      }

      const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      const countCypher = `
        MATCH (m:Member)-[:BORROWED]->(l:Loan)-[:FOR_BOOK]->(b:Book)
        ${whereStr}
        RETURN count(l) AS total
      `;

      const listCypher = `
        MATCH (m:Member)-[:BORROWED]->(l:Loan)-[:FOR_BOOK]->(b:Book)
        OPTIONAL MATCH (e:Employee)-[:ISSUED]->(l)
        ${whereStr}
        RETURN l,
               { memberId: m.memberId, name: m.name, email: m.email } AS member,
               { bookId: b.bookId, title: b.title, isbn: b.isbn } AS book,
               { employeeId: e.employeeId, name: e.name } AS issuedBy
        ORDER BY l.issueDate DESC, l.loanId DESC
        SKIP $skip
        LIMIT $limit
      `;

      const countRes = await session.run(countCypher, { status, memberId, bookId });
      const total = toNative(countRes.records[0]?.get('total')) || 0;

      const listRes = await session.run(listCypher, {
        status,
        memberId,
        bookId,
        skip: neo4j.int(skip),
        limit: neo4j.int(limit),
      });

      const items: LoanDTO[] = listRes.records.map((rec) => {
        const loanNode = toNative(rec.get('l'));
        const memberNode = toNative(rec.get('member'));
        const bookNode = toNative(rec.get('book'));
        const issuedByNode = toNative(rec.get('issuedBy'));

        return {
          ...loanNode,
          member: memberNode?.memberId ? memberNode : undefined,
          book: bookNode?.bookId ? bookNode : undefined,
          issuedBy: issuedByNode?.employeeId ? issuedByNode : undefined,
        };
      });

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    }, { accessMode: 'READ' });
  }

  /**
   * Retrieve a specific loan by ID.
   */
  static async getLoanById(loanId: string): Promise<LoanDTO> {
    return withSession(async (session) => {
      const cypher = `
        MATCH (l:Loan {loanId: $loanId})
        OPTIONAL MATCH (m:Member)-[:BORROWED]->(l)
        OPTIONAL MATCH (l)-[:FOR_BOOK]->(b:Book)
        OPTIONAL MATCH (e:Employee)-[:ISSUED]->(l)
        RETURN l,
               { memberId: m.memberId, name: m.name, email: m.email } AS member,
               { bookId: b.bookId, title: b.title, isbn: b.isbn } AS book,
               { employeeId: e.employeeId, name: e.name } AS issuedBy
      `;

      const res = await session.run(cypher, { loanId });
      if (res.records.length === 0) {
        throw new NotFoundError(`Loan with ID '${loanId}' not found`);
      }

      const rec = res.records[0];
      const loanNode = toNative(rec.get('l'));
      const memberNode = toNative(rec.get('member'));
      const bookNode = toNative(rec.get('book'));
      const issuedByNode = toNative(rec.get('issuedBy'));

      return {
        ...loanNode,
        member: memberNode?.memberId ? memberNode : undefined,
        book: bookNode?.bookId ? bookNode : undefined,
        issuedBy: issuedByNode?.employeeId ? issuedByNode : undefined,
      };
    }, { accessMode: 'READ' });
  }

  /**
   * List all overdue loans with calculated days overdue and fine amount.
   */
  static async listOverdueLoans(): Promise<OverdueLoanDTO[]> {
    return withSession(async (session) => {
      const fineRatePerDay = config.business.fineRatePerDay || 2;

      const cypher = `
        MATCH (m:Member)-[:BORROWED]->(l:Loan)-[:FOR_BOOK]->(b:Book)
        OPTIONAL MATCH (e:Employee)-[:ISSUED]->(l)
        WHERE l.status IN ['ACTIVE', 'OVERDUE']
          AND l.dueDate < date()
        RETURN l,
               { memberId: m.memberId, name: m.name, email: m.email } AS member,
               { bookId: b.bookId, title: b.title, isbn: b.isbn } AS book,
               { employeeId: e.employeeId, name: e.name } AS issuedBy,
               duration.between(l.dueDate, date()).days AS daysOverdue,
               duration.between(l.dueDate, date()).days * $fineRatePerDay AS calculatedFine
        ORDER BY daysOverdue DESC
      `;

      const res = await session.run(cypher, { fineRatePerDay });

      return res.records.map((rec) => {
        const loanNode = toNative(rec.get('l'));
        const memberNode = toNative(rec.get('member'));
        const bookNode = toNative(rec.get('book'));
        const issuedByNode = toNative(rec.get('issuedBy'));
        const daysOverdue = toNative(rec.get('daysOverdue')) || 0;
        const calculatedFine = toNative(rec.get('calculatedFine')) || 0;

        return {
          ...loanNode,
          member: memberNode?.memberId ? memberNode : undefined,
          book: bookNode?.bookId ? bookNode : undefined,
          issuedBy: issuedByNode?.employeeId ? issuedByNode : undefined,
          daysOverdue,
          calculatedFine,
        };
      });
    }, { accessMode: 'READ' });
  }

  /**
   * List borrowing history for a specific member.
   */
  static async getMemberLoans(memberId: string): Promise<LoanDTO[]> {
    return withSession(async (session) => {
      const memberCheck = await session.run(
        'MATCH (m:Member {memberId: $memberId}) RETURN m',
        { memberId }
      );
      if (memberCheck.records.length === 0) {
        throw new NotFoundError(`Member with ID '${memberId}' not found`);
      }

      const cypher = `
        MATCH (m:Member {memberId: $memberId})-[:BORROWED]->(l:Loan)-[:FOR_BOOK]->(b:Book)
        OPTIONAL MATCH (e:Employee)-[:ISSUED]->(l)
        RETURN l,
               { memberId: m.memberId, name: m.name, email: m.email } AS member,
               { bookId: b.bookId, title: b.title, isbn: b.isbn } AS book,
               { employeeId: e.employeeId, name: e.name } AS issuedBy
        ORDER BY l.issueDate DESC, l.loanId DESC
      `;

      const res = await session.run(cypher, { memberId });

      return res.records.map((rec) => {
        const loanNode = toNative(rec.get('l'));
        const memberNode = toNative(rec.get('member'));
        const bookNode = toNative(rec.get('book'));
        const issuedByNode = toNative(rec.get('issuedBy'));

        return {
          ...loanNode,
          member: memberNode?.memberId ? memberNode : undefined,
          book: bookNode?.bookId ? bookNode : undefined,
          issuedBy: issuedByNode?.employeeId ? issuedByNode : undefined,
        };
      });
    }, { accessMode: 'READ' });
  }
}
