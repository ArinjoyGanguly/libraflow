import neo4j from 'neo4j-driver';
import { withSession } from '../config/neo4j';
import { PublisherDTO, CreatePublisherInput, UpdatePublisherInput, PaginationQuery, PaginatedResult } from '../types';
import { NotFoundError, ConflictError } from '../utils/errors';
import { toNative } from '../utils/neo4j-helpers';

export class PublishersService {
  static async listPublishers(query: PaginationQuery): Promise<PaginatedResult<PublisherDTO>> {
    return withSession(async (session) => {
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
      const skip = (page - 1) * limit;
      const search = query.search?.trim() || '';

      const whereClause = search
        ? 'WHERE toLower(p.name) CONTAINS toLower($search) OR toLower(p.address) CONTAINS toLower($search)'
        : '';

      const countCypher = `
        MATCH (p:Publisher)
        ${whereClause}
        RETURN count(p) AS total
      `;

      const listCypher = `
        MATCH (p:Publisher)
        ${whereClause}
        OPTIONAL MATCH (p)-[:PUBLISHED]->(b:Book)
        WITH p, collect(DISTINCT { bookId: b.bookId, title: b.title }) AS rawBooks
        WITH p, [b IN rawBooks WHERE b.bookId IS NOT NULL] AS books
        RETURN p, books
        ORDER BY p.name ASC
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

      const items: PublisherDTO[] = listRes.records.map((rec) => {
        const pubNode = toNative(rec.get('p'));
        const books = toNative(rec.get('books'));
        return {
          ...pubNode,
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

  static async getPublisherById(publisherId: string): Promise<PublisherDTO> {
    return withSession(async (session) => {
      const cypher = `
        MATCH (p:Publisher {publisherId: $publisherId})
        OPTIONAL MATCH (p)-[:PUBLISHED]->(b:Book)
        WITH p, collect(DISTINCT { bookId: b.bookId, title: b.title }) AS rawBooks
        WITH p, [b IN rawBooks WHERE b.bookId IS NOT NULL] AS books
        RETURN p, books
      `;

      const res = await session.run(cypher, { publisherId });
      if (res.records.length === 0) {
        throw new NotFoundError(`Publisher with ID '${publisherId}' not found`);
      }

      const pubNode = toNative(res.records[0].get('p'));
      const books = toNative(res.records[0].get('books'));

      return {
        ...pubNode,
        books,
      };
    }, { accessMode: 'READ' });
  }

  static async createPublisher(input: CreatePublisherInput): Promise<PublisherDTO> {
    return withSession(async (session) => {
      const checkRes = await session.run(
        'MATCH (p:Publisher {publisherId: $publisherId}) RETURN p.publisherId AS id',
        { publisherId: input.publisherId }
      );
      if (checkRes.records.length > 0) {
        throw new ConflictError(`Publisher with ID '${input.publisherId}' already exists`);
      }

      const cypher = `
        CREATE (p:Publisher {
          publisherId: $publisherId,
          name: $name,
          address: $address,
          phone: $phone,
          email: $email,
          website: $website
        })
        RETURN p
      `;

      const res = await session.run(cypher, {
        publisherId: input.publisherId,
        name: input.name,
        address: input.address || null,
        phone: input.phone || null,
        email: input.email || null,
        website: input.website || null,
      });

      return toNative(res.records[0].get('p'));
    }, { accessMode: 'WRITE' });
  }

  static async updatePublisher(publisherId: string, input: UpdatePublisherInput): Promise<PublisherDTO> {
    return withSession(async (session) => {
      const checkRes = await session.run(
        'MATCH (p:Publisher {publisherId: $publisherId}) RETURN p',
        { publisherId }
      );
      if (checkRes.records.length === 0) {
        throw new NotFoundError(`Publisher with ID '${publisherId}' not found`);
      }

      const cypher = `
        MATCH (p:Publisher {publisherId: $publisherId})
        SET p.name = coalesce($name, p.name),
            p.address = coalesce($address, p.address),
            p.phone = coalesce($phone, p.phone),
            p.email = coalesce($email, p.email),
            p.website = coalesce($website, p.website)
        RETURN p
      `;

      const res = await session.run(cypher, {
        publisherId,
        name: input.name !== undefined ? input.name : null,
        address: input.address !== undefined ? input.address : null,
        phone: input.phone !== undefined ? input.phone : null,
        email: input.email !== undefined ? input.email : null,
        website: input.website !== undefined ? input.website : null,
      });

      return toNative(res.records[0].get('p'));
    }, { accessMode: 'WRITE' });
  }

  static async deletePublisher(publisherId: string): Promise<void> {
    await withSession(async (session) => {
      const checkRes = await session.run(
        'MATCH (p:Publisher {publisherId: $publisherId}) RETURN p',
        { publisherId }
      );
      if (checkRes.records.length === 0) {
        throw new NotFoundError(`Publisher with ID '${publisherId}' not found`);
      }

      await session.run(
        'MATCH (p:Publisher {publisherId: $publisherId}) DETACH DELETE p',
        { publisherId }
      );
    }, { accessMode: 'WRITE' });
  }
}
