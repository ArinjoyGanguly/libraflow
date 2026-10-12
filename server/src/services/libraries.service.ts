import neo4j from 'neo4j-driver';
import { withSession } from '../config/neo4j';
import { LibraryDTO, CreateLibraryInput, UpdateLibraryInput, PaginationQuery, PaginatedResult } from '../types';
import { NotFoundError, ConflictError } from '../utils/errors';
import { toNative } from '../utils/neo4j-helpers';

export class LibrariesService {
  static async listLibraries(query: PaginationQuery): Promise<PaginatedResult<LibraryDTO>> {
    return withSession(async (session) => {
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
      const skip = (page - 1) * limit;
      const search = query.search?.trim() || '';

      const whereClause = search
        ? 'WHERE toLower(l.name) CONTAINS toLower($search) OR toLower(l.city) CONTAINS toLower($search)'
        : '';

      const countCypher = `
        MATCH (l:Library)
        ${whereClause}
        RETURN count(l) AS total
      `;

      const listCypher = `
        MATCH (l:Library)
        ${whereClause}
        OPTIONAL MATCH (b:Book)-[:HELD_BY]->(l)
        OPTIONAL MATCH (e:Employee)-[:WORKS_AT]->(l)
        WITH l, count(DISTINCT b) AS booksCount, count(DISTINCT e) AS employeesCount
        RETURN l, booksCount, employeesCount
        ORDER BY l.name ASC
        SKIP $skip
        LIMIT $limit
      `;

      const countRes = await session.run(countCypher, { search });
      const total = toNative(countRes.records[0]?.get('total')) || 0;

      const listRes = await session.run(listCypher, {
        search,
        skip: neo4j.int(skip),
        limit: neo4j.int(limit),
      });

      const items: LibraryDTO[] = listRes.records.map((rec) => {
        const libNode = toNative(rec.get('l'));
        const booksCount = toNative(rec.get('booksCount')) || 0;
        const employeesCount = toNative(rec.get('employeesCount')) || 0;
        return {
          ...libNode,
          booksCount,
          employeesCount,
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

  static async getLibraryById(libraryId: string): Promise<LibraryDTO> {
    return withSession(async (session) => {
      const cypher = `
        MATCH (l:Library {libraryId: $libraryId})
        OPTIONAL MATCH (b:Book)-[:HELD_BY]->(l)
        OPTIONAL MATCH (e:Employee)-[:WORKS_AT]->(l)
        WITH l, count(DISTINCT b) AS booksCount, count(DISTINCT e) AS employeesCount
        RETURN l, booksCount, employeesCount
      `;

      const res = await session.run(cypher, { libraryId });
      if (res.records.length === 0) {
        throw new NotFoundError(`Library with ID '${libraryId}' not found`);
      }

      const libNode = toNative(res.records[0].get('l'));
      const booksCount = toNative(res.records[0].get('booksCount')) || 0;
      const employeesCount = toNative(res.records[0].get('employeesCount')) || 0;

      return {
        ...libNode,
        booksCount,
        employeesCount,
      };
    }, { accessMode: 'READ' });
  }

  static async createLibrary(input: CreateLibraryInput): Promise<LibraryDTO> {
    return withSession(async (session) => {
      const checkRes = await session.run(
        'MATCH (l:Library {libraryId: $libraryId}) RETURN l.libraryId AS id',
        { libraryId: input.libraryId }
      );
      if (checkRes.records.length > 0) {
        throw new ConflictError(`Library with ID '${input.libraryId}' already exists`);
      }

      const cypher = `
        CREATE (l:Library {
          libraryId: $libraryId,
          name: $name,
          address: $address,
          city: $city,
          phone: $phone,
          email: $email
        })
        RETURN l
      `;

      const res = await session.run(cypher, {
        libraryId: input.libraryId,
        name: input.name,
        address: input.address,
        city: input.city,
        phone: input.phone || null,
        email: input.email || null,
      });

      return {
        ...toNative(res.records[0].get('l')),
        booksCount: 0,
        employeesCount: 0,
      };
    }, { accessMode: 'WRITE' });
  }

  static async updateLibrary(libraryId: string, input: UpdateLibraryInput): Promise<LibraryDTO> {
    return withSession(async (session) => {
      const checkRes = await session.run(
        'MATCH (l:Library {libraryId: $libraryId}) RETURN l',
        { libraryId }
      );
      if (checkRes.records.length === 0) {
        throw new NotFoundError(`Library with ID '${libraryId}' not found`);
      }

      const cypher = `
        MATCH (l:Library {libraryId: $libraryId})
        SET l.name = coalesce($name, l.name),
            l.address = coalesce($address, l.address),
            l.city = coalesce($city, l.city),
            l.phone = coalesce($phone, l.phone),
            l.email = coalesce($email, l.email)
        RETURN l
      `;

      const res = await session.run(cypher, {
        libraryId,
        name: input.name !== undefined ? input.name : null,
        address: input.address !== undefined ? input.address : null,
        city: input.city !== undefined ? input.city : null,
        phone: input.phone !== undefined ? input.phone : null,
        email: input.email !== undefined ? input.email : null,
      });

      return toNative(res.records[0].get('l'));
    }, { accessMode: 'WRITE' });
  }

  static async deleteLibrary(libraryId: string): Promise<void> {
    await withSession(async (session) => {
      const checkRes = await session.run(
        'MATCH (l:Library {libraryId: $libraryId}) RETURN l',
        { libraryId }
      );
      if (checkRes.records.length === 0) {
        throw new NotFoundError(`Library with ID '${libraryId}' not found`);
      }

      // Check if books are held here
      const bookRes = await session.run(
        'MATCH (b:Book)-[:HELD_BY]->(l:Library {libraryId: $libraryId}) RETURN count(b) AS count',
        { libraryId }
      );
      const bookCount = toNative(bookRes.records[0].get('count'));
      if (bookCount > 0) {
        throw new ConflictError(
          `Cannot delete library '${libraryId}': ${bookCount} books are still held at this library`
        );
      }

      await session.run(
        'MATCH (l:Library {libraryId: $libraryId}) DETACH DELETE l',
        { libraryId }
      );
    }, { accessMode: 'WRITE' });
  }
}
