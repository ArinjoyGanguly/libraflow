import neo4j from 'neo4j-driver';
import { withSession } from '../config/neo4j';
import { RequestDTO, CreateRequestInput, UpdateRequestInput, PaginationQuery, PaginatedResult } from '../types';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';
import { toNative } from '../utils/neo4j-helpers';

export class RequestsService {
  /**
   * List requests with pagination and status / memberId filtering.
   */
  static async listRequests(query: PaginationQuery & { memberId?: string }): Promise<PaginatedResult<RequestDTO>> {
    return withSession(async (session) => {
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
      const skip = (page - 1) * limit;
      const status = query.status?.trim() || '';
      const memberId = query.memberId?.trim() || '';

      const whereClauses: string[] = [];
      if (status) {
        whereClauses.push('r.status = $status');
      }
      if (memberId) {
        whereClauses.push('m.memberId = $memberId');
      }

      const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      const countCypher = `
        MATCH (r:Request)
        OPTIONAL MATCH (m:Member)-[:SENT]->(r)
        ${whereStr}
        RETURN count(r) AS total
      `;

      const listCypher = `
        MATCH (r:Request)
        OPTIONAL MATCH (m:Member)-[:SENT]->(r)
        OPTIONAL MATCH (r)-[:REQUESTS_BOOK]->(b:Book)
        OPTIONAL MATCH (e:Employee)-[:PROCESSED]->(r)
        ${whereStr}
        RETURN r,
               { memberId: m.memberId, name: m.name, email: m.email } AS member,
               { bookId: b.bookId, title: b.title, isbn: b.isbn } AS book,
               { employeeId: e.employeeId, name: e.name } AS processedBy
        ORDER BY r.requestDate DESC, r.requestId DESC
        SKIP $skip
        LIMIT $limit
      `;

      const countRes = await session.run(countCypher, { status, memberId });
      const total = toNative(countRes.records[0]?.get('total')) || 0;

      const listRes = await session.run(listCypher, {
        status,
        memberId,
        skip: neo4j.int(skip),
        limit: neo4j.int(limit),
      });

      const items: RequestDTO[] = listRes.records.map((rec) => {
        const reqNode = toNative(rec.get('r'));
        const member = toNative(rec.get('member'));
        const book = toNative(rec.get('book'));
        const processedBy = toNative(rec.get('processedBy'));

        return {
          ...reqNode,
          member: member?.memberId ? member : undefined,
          book: book?.bookId ? book : undefined,
          processedBy: processedBy?.employeeId ? processedBy : undefined,
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
   * Detail of a single request.
   */
  static async getRequestById(requestId: string): Promise<RequestDTO> {
    return withSession(async (session) => {
      const cypher = `
        MATCH (r:Request {requestId: $requestId})
        OPTIONAL MATCH (m:Member)-[:SENT]->(r)
        OPTIONAL MATCH (r)-[:REQUESTS_BOOK]->(b:Book)
        OPTIONAL MATCH (e:Employee)-[:PROCESSED]->(r)
        RETURN r,
               { memberId: m.memberId, name: m.name, email: m.email } AS member,
               { bookId: b.bookId, title: b.title, isbn: b.isbn } AS book,
               { employeeId: e.employeeId, name: e.name } AS processedBy
      `;

      const res = await session.run(cypher, { requestId });
      if (res.records.length === 0) {
        throw new NotFoundError(`Request with ID '${requestId}' not found`);
      }

      const reqNode = toNative(res.records[0].get('r'));
      const member = toNative(res.records[0].get('member'));
      const book = toNative(res.records[0].get('book'));
      const processedBy = toNative(res.records[0].get('processedBy'));

      return {
        ...reqNode,
        member: member?.memberId ? member : undefined,
        book: book?.bookId ? book : undefined,
        processedBy: processedBy?.employeeId ? processedBy : undefined,
      };
    }, { accessMode: 'READ' });
  }

  /**
   * Create a new request.
   */
  static async createRequest(input: CreateRequestInput): Promise<RequestDTO> {
    return withSession(async (session) => {
      // Check ID uniqueness
      const idRes = await session.run(
        'MATCH (r:Request {requestId: $requestId}) RETURN r.requestId AS id',
        { requestId: input.requestId }
      );
      if (idRes.records.length > 0) {
        throw new ConflictError(`Request with ID '${input.requestId}' already exists`);
      }

      // Check member existence
      const memberRes = await session.run(
        'MATCH (m:Member {memberId: $memberId}) RETURN m',
        { memberId: input.memberId }
      );
      if (memberRes.records.length === 0) {
        throw new NotFoundError(`Member with ID '${input.memberId}' not found`);
      }

      // Check book existence
      const bookRes = await session.run(
        'MATCH (b:Book {bookId: $bookId}) RETURN b',
        { bookId: input.bookId }
      );
      if (bookRes.records.length === 0) {
        throw new NotFoundError(`Book with ID '${input.bookId}' not found`);
      }

      const cypher = `
        MATCH (m:Member {memberId: $memberId}), (b:Book {bookId: $bookId})
        CREATE (r:Request {
          requestId: $requestId,
          requestDate: date(),
          status: 'PENDING',
          notes: $notes
        })
        CREATE (m)-[:SENT]->(r)
        CREATE (r)-[:REQUESTS_BOOK]->(b)
        RETURN r
      `;

      await session.run(cypher, {
        requestId: input.requestId,
        memberId: input.memberId,
        bookId: input.bookId,
        notes: input.notes || null,
      });

      return RequestsService.getRequestById(input.requestId);
    }, { accessMode: 'WRITE' });
  }

  /**
   * Update request status or notes.
   */
  static async updateRequest(requestId: string, input: UpdateRequestInput): Promise<RequestDTO> {
    return withSession(async (session) => {
      const checkRes = await session.run(
        'MATCH (r:Request {requestId: $requestId}) RETURN r',
        { requestId }
      );
      if (checkRes.records.length === 0) {
        throw new NotFoundError(`Request with ID '${requestId}' not found`);
      }

      const currentReq = toNative(checkRes.records[0].get('r'));
      const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];

      if (input.status) {
        if (!validStatuses.includes(input.status)) {
          throw new BadRequestError(`Invalid status '${input.status}'. Allowed: ${validStatuses.join(', ')}`);
        }

        // Prevent modifying already processed requests (e.g. APPROVED or REJECTED)
        if (currentReq.status !== 'PENDING' && currentReq.status !== input.status) {
          throw new BadRequestError(
            `Invalid status transition: request '${requestId}' is already ${currentReq.status} and cannot be transitioned to ${input.status}`
          );
        }
      }

      // If processed by employee, verify employee exists
      if (input.employeeId) {
        const empRes = await session.run(
          'MATCH (e:Employee {employeeId: $employeeId}) RETURN e',
          { employeeId: input.employeeId }
        );
        if (empRes.records.length === 0) {
          throw new NotFoundError(`Employee with ID '${input.employeeId}' not found`);
        }
      }

      const updateCypher = `
        MATCH (r:Request {requestId: $requestId})
        SET r.status = coalesce($status, r.status),
            r.notes = coalesce($notes, r.notes)
        RETURN r
      `;

      await session.run(updateCypher, {
        requestId,
        status: input.status !== undefined ? input.status : null,
        notes: input.notes !== undefined ? input.notes : null,
      });

      if (input.employeeId) {
        await session.run(
          `MATCH (e:Employee {employeeId: $employeeId}), (r:Request {requestId: $requestId})
           MERGE (e)-[:PROCESSED]->(r)`,
          { employeeId: input.employeeId, requestId }
        );
      }


      return RequestsService.getRequestById(requestId);
    }, { accessMode: 'WRITE' });
  }

  /**
   * Delete request.
   */
  static async deleteRequest(requestId: string): Promise<void> {
    await withSession(async (session) => {
      const checkRes = await session.run(
        'MATCH (r:Request {requestId: $requestId}) RETURN r',
        { requestId }
      );
      if (checkRes.records.length === 0) {
        throw new NotFoundError(`Request with ID '${requestId}' not found`);
      }

      await session.run(
        'MATCH (r:Request {requestId: $requestId}) DETACH DELETE r',
        { requestId }
      );
    }, { accessMode: 'WRITE' });
  }
}
