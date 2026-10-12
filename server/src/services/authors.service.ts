import { withSession } from '../config/neo4j';
import { AuthorDTO, CreateAuthorInput, UpdateAuthorInput, PaginationQuery, PaginatedResult } from '../types';
import { NotFoundError, ConflictError } from '../utils/errors';
import { toNative } from '../utils/neo4j-helpers';

export class AuthorsService {
  /**
   * List authors with pagination, sorting, and optional search.
   */
  static async listAuthors(query: PaginationQuery): Promise<PaginatedResult<AuthorDTO>> {
    return withSession(async (session) => {
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
      const skip = (page - 1) * limit;
      const search = query.search?.trim() || '';

      const whereClause = search
        ? 'WHERE toLower(a.name) CONTAINS toLower($search) OR toLower(a.country) CONTAINS toLower($search)'
        : '';

      const countCypher = `
        MATCH (a:Author)
        ${whereClause}
        RETURN count(a) AS total
      `;

      const listCypher = `
        MATCH (a:Author)
        ${whereClause}
        OPTIONAL MATCH (a)-[:WROTE]->(b:Book)
        WITH a, collect(DISTINCT { bookId: b.bookId, title: b.title }) AS rawBooks
        WITH a, [b IN rawBooks WHERE b.bookId IS NOT NULL] AS books
        RETURN a, books
        ORDER BY a.name ASC
        SKIP $skip
        LIMIT $limit
      `;

      const countRes = await session.run(countCypher, { search });
      const total = toNative(countRes.records[0]?.get('total')) || 0;

      const listRes = await session.run(listCypher, {
        search,
        skip: neo4jInt(skip),
        limit: neo4jInt(limit),
      });

      const items: AuthorDTO[] = listRes.records.map((rec) => {
        const authorNode = toNative(rec.get('a'));
        const books = toNative(rec.get('books'));
        return {
          ...authorNode,
          books,
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
   * Get author by ID with books written.
   */
  static async getAuthorById(authorId: string): Promise<AuthorDTO> {
    return withSession(async (session) => {
      const cypher = `
        MATCH (a:Author {authorId: $authorId})
        OPTIONAL MATCH (a)-[:WROTE]->(b:Book)
        WITH a, collect(DISTINCT { bookId: b.bookId, title: b.title }) AS rawBooks
        WITH a, [b IN rawBooks WHERE b.bookId IS NOT NULL] AS books
        RETURN a, books
      `;

      const res = await session.run(cypher, { authorId });
      if (res.records.length === 0) {
        throw new NotFoundError(`Author with ID '${authorId}' not found`);
      }

      const authorNode = toNative(res.records[0].get('a'));
      const books = toNative(res.records[0].get('books'));

      return {
        ...authorNode,
        books,
      };
    }, { accessMode: 'READ' });
  }

  /**
   * Create new author.
   */
  static async createAuthor(input: CreateAuthorInput): Promise<AuthorDTO> {
    return withSession(async (session) => {
      // Check ID existence
      const checkRes = await session.run(
        'MATCH (a:Author {authorId: $authorId}) RETURN a.authorId AS id',
        { authorId: input.authorId }
      );
      if (checkRes.records.length > 0) {
        throw new ConflictError(`Author with ID '${input.authorId}' already exists`);
      }

      const cypher = `
        CREATE (a:Author {
          authorId: $authorId,
          name: $name,
          email: $email,
          phone: $phone,
          country: $country
        })
        RETURN a
      `;

      const res = await session.run(cypher, {
        authorId: input.authorId,
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        country: input.country || null,
      });

      return toNative(res.records[0].get('a'));
    }, { accessMode: 'WRITE' });
  }

  /**
   * Update existing author.
   */
  static async updateAuthor(authorId: string, input: UpdateAuthorInput): Promise<AuthorDTO> {
    return withSession(async (session) => {
      const checkRes = await session.run(
        'MATCH (a:Author {authorId: $authorId}) RETURN a',
        { authorId }
      );
      if (checkRes.records.length === 0) {
        throw new NotFoundError(`Author with ID '${authorId}' not found`);
      }

      const cypher = `
        MATCH (a:Author {authorId: $authorId})
        SET a.name = coalesce($name, a.name),
            a.email = coalesce($email, a.email),
            a.phone = coalesce($phone, a.phone),
            a.country = coalesce($country, a.country)
        RETURN a
      `;

      const res = await session.run(cypher, {
        authorId,
        name: input.name !== undefined ? input.name : null,
        email: input.email !== undefined ? input.email : null,
        phone: input.phone !== undefined ? input.phone : null,
        country: input.country !== undefined ? input.country : null,
      });

      return toNative(res.records[0].get('a'));
    }, { accessMode: 'WRITE' });
  }

  /**
   * Delete author.
   */
  static async deleteAuthor(authorId: string): Promise<void> {
    await withSession(async (session) => {
      const checkRes = await session.run(
        'MATCH (a:Author {authorId: $authorId}) RETURN a',
        { authorId }
      );
      if (checkRes.records.length === 0) {
        throw new NotFoundError(`Author with ID '${authorId}' not found`);
      }

      // Detach delete author
      await session.run(
        'MATCH (a:Author {authorId: $authorId}) DETACH DELETE a',
        { authorId }
      );
    }, { accessMode: 'WRITE' });
  }
}

// Helper for Neo4j integer parameter
import neo4j from 'neo4j-driver';
const neo4jInt = (val: number) => neo4j.int(val);
