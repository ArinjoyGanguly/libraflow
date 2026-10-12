import neo4j from 'neo4j-driver';
import bcrypt from 'bcryptjs';
import { withSession } from '../config/neo4j';
import { AdminDTO, CreateAdminInput, UpdateAdminInput, PaginationQuery, PaginatedResult } from '../types';
import { NotFoundError, ConflictError } from '../utils/errors';
import { toNative, sanitizeEntity } from '../utils/neo4j-helpers';

export class AdminsService {
  static async listAdmins(query: PaginationQuery): Promise<PaginatedResult<AdminDTO>> {
    return withSession(async (session) => {
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
      const skip = (page - 1) * limit;
      const search = query.search?.trim() || '';

      const whereClause = search
        ? 'WHERE toLower(a.name) CONTAINS toLower($search) OR toLower(a.email) CONTAINS toLower($search)'
        : '';

      const countCypher = `
        MATCH (a:Admin)
        ${whereClause}
        RETURN count(a) AS total
      `;

      const listCypher = `
        MATCH (a:Admin)
        ${whereClause}
        RETURN a {
          .adminId,
          .name,
          .email,
          .role
        } AS admin
        ORDER BY admin.name ASC
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

      const items: AdminDTO[] = listRes.records.map((rec) => {
        return sanitizeEntity(toNative(rec.get('admin'))) as AdminDTO;
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

  static async getAdminById(adminId: string): Promise<AdminDTO> {
    return withSession(async (session) => {
      const cypher = `
        MATCH (a:Admin {adminId: $adminId})
        RETURN a {
          .adminId,
          .name,
          .email,
          .role
        } AS admin
      `;

      const res = await session.run(cypher, { adminId });
      if (res.records.length === 0) {
        throw new NotFoundError(`Admin with ID '${adminId}' not found`);
      }

      return sanitizeEntity(toNative(res.records[0].get('admin'))) as AdminDTO;
    }, { accessMode: 'READ' });
  }

  static async createAdmin(input: CreateAdminInput): Promise<AdminDTO> {
    return withSession(async (session) => {
      // Check ID existence
      const idRes = await session.run(
        'MATCH (a:Admin {adminId: $adminId}) RETURN a.adminId AS id',
        { adminId: input.adminId }
      );
      if (idRes.records.length > 0) {
        throw new ConflictError(`Admin with ID '${input.adminId}' already exists`);
      }

      // Check unique email
      const emailRes = await session.run(
        'MATCH (a:Admin {email: $email}) RETURN a.email AS email',
        { email: input.email }
      );
      if (emailRes.records.length > 0) {
        throw new ConflictError(`Admin with email '${input.email}' already exists`);
      }

      const rawPassword = input.password || 'admin123';
      const passwordHash = await bcrypt.hash(rawPassword, 10);

      const cypher = `
        CREATE (a:Admin {
          adminId: $adminId,
          name: $name,
          email: $email,
          passwordHash: $passwordHash,
          role: 'admin'
        })
        RETURN a {
          .adminId,
          .name,
          .email,
          .role
        } AS admin
      `;

      const res = await session.run(cypher, {
        adminId: input.adminId,
        name: input.name,
        email: input.email,
        passwordHash,
      });

      return sanitizeEntity(toNative(res.records[0].get('admin'))) as AdminDTO;
    }, { accessMode: 'WRITE' });
  }

  static async updateAdmin(adminId: string, input: UpdateAdminInput): Promise<AdminDTO> {
    return withSession(async (session) => {
      const checkRes = await session.run(
        'MATCH (a:Admin {adminId: $adminId}) RETURN a',
        { adminId }
      );
      if (checkRes.records.length === 0) {
        throw new NotFoundError(`Admin with ID '${adminId}' not found`);
      }

      if (input.email) {
        const emailRes = await session.run(
          'MATCH (a:Admin {email: $email}) WHERE a.adminId <> $adminId RETURN a.email AS email',
          { email: input.email, adminId }
        );
        if (emailRes.records.length > 0) {
          throw new ConflictError(`Admin with email '${input.email}' already exists`);
        }
      }

      let passwordHash: string | null = null;
      if (input.password) {
        passwordHash = await bcrypt.hash(input.password, 10);
      }

      const cypher = `
        MATCH (a:Admin {adminId: $adminId})
        SET a.name = coalesce($name, a.name),
            a.email = coalesce($email, a.email),
            a.passwordHash = coalesce($passwordHash, a.passwordHash)
        RETURN a {
          .adminId,
          .name,
          .email,
          .role
        } AS admin
      `;

      const res = await session.run(cypher, {
        adminId,
        name: input.name !== undefined ? input.name : null,
        email: input.email !== undefined ? input.email : null,
        passwordHash,
      });

      return sanitizeEntity(toNative(res.records[0].get('admin'))) as AdminDTO;
    }, { accessMode: 'WRITE' });
  }

  static async deleteAdmin(adminId: string): Promise<void> {
    await withSession(async (session) => {
      const checkRes = await session.run(
        'MATCH (a:Admin {adminId: $adminId}) RETURN a',
        { adminId }
      );
      if (checkRes.records.length === 0) {
        throw new NotFoundError(`Admin with ID '${adminId}' not found`);
      }

      await session.run(
        'MATCH (a:Admin {adminId: $adminId}) DETACH DELETE a',
        { adminId }
      );
    }, { accessMode: 'WRITE' });
  }
}
