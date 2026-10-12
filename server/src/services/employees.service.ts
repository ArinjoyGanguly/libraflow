import neo4j from 'neo4j-driver';
import bcrypt from 'bcryptjs';
import { withSession } from '../config/neo4j';
import { EmployeeDTO, CreateEmployeeInput, UpdateEmployeeInput, PaginationQuery, PaginatedResult } from '../types';
import { NotFoundError, ConflictError } from '../utils/errors';
import { toNative, sanitizeEntity } from '../utils/neo4j-helpers';

export class EmployeesService {
  static async listEmployees(query: PaginationQuery): Promise<PaginatedResult<EmployeeDTO>> {
    return withSession(async (session) => {
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
      const skip = (page - 1) * limit;
      const search = query.search?.trim() || '';

      const whereClause = search
        ? 'WHERE toLower(e.name) CONTAINS toLower($search) OR toLower(e.email) CONTAINS toLower($search) OR toLower(e.position) CONTAINS toLower($search)'
        : '';

      const countCypher = `
        MATCH (e:Employee)
        ${whereClause}
        RETURN count(e) AS total
      `;

      const listCypher = `
        MATCH (e:Employee)
        ${whereClause}
        RETURN e {
          .employeeId,
          .name,
          .email,
          .phone,
          .position,
          .libraryId,
          .role
        } AS employee
        ORDER BY employee.name ASC
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

      const items: EmployeeDTO[] = listRes.records.map((rec) => {
        return sanitizeEntity(toNative(rec.get('employee'))) as EmployeeDTO;
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

  static async getEmployeeById(employeeId: string): Promise<EmployeeDTO> {
    return withSession(async (session) => {
      const cypher = `
        MATCH (e:Employee {employeeId: $employeeId})
        RETURN e {
          .employeeId,
          .name,
          .email,
          .phone,
          .position,
          .libraryId,
          .role
        } AS employee
      `;

      const res = await session.run(cypher, { employeeId });
      if (res.records.length === 0) {
        throw new NotFoundError(`Employee with ID '${employeeId}' not found`);
      }

      return sanitizeEntity(toNative(res.records[0].get('employee'))) as EmployeeDTO;
    }, { accessMode: 'READ' });
  }

  static async createEmployee(input: CreateEmployeeInput): Promise<EmployeeDTO> {
    return withSession(async (session) => {
      // Check ID existence
      const idRes = await session.run(
        'MATCH (e:Employee {employeeId: $employeeId}) RETURN e.employeeId AS id',
        { employeeId: input.employeeId }
      );
      if (idRes.records.length > 0) {
        throw new ConflictError(`Employee with ID '${input.employeeId}' already exists`);
      }

      // Check unique email
      const emailRes = await session.run(
        'MATCH (e:Employee {email: $email}) RETURN e.email AS email',
        { email: input.email }
      );
      if (emailRes.records.length > 0) {
        throw new ConflictError(`Employee with email '${input.email}' already exists`);
      }

      const rawPassword = input.password || 'staff123';
      const passwordHash = await bcrypt.hash(rawPassword, 10);

      const cypher = `
        CREATE (e:Employee {
          employeeId: $employeeId,
          name: $name,
          email: $email,
          passwordHash: $passwordHash,
          phone: $phone,
          position: $position,
          libraryId: $libraryId,
          role: 'employee'
        })
        RETURN e {
          .employeeId,
          .name,
          .email,
          .phone,
          .position,
          .libraryId,
          .role
        } AS employee
      `;

      const res = await session.run(cypher, {
        employeeId: input.employeeId,
        name: input.name,
        email: input.email,
        passwordHash,
        phone: input.phone || null,
        position: input.position,
        libraryId: input.libraryId,
      });

      // Relate to Library
      if (input.libraryId) {
        await session.run(
          `MATCH (e:Employee {employeeId: $employeeId}), (l:Library {libraryId: $libraryId})
           MERGE (e)-[:WORKS_AT]->(l)`,
          { employeeId: input.employeeId, libraryId: input.libraryId }
        );
      }

      return sanitizeEntity(toNative(res.records[0].get('employee'))) as EmployeeDTO;
    }, { accessMode: 'WRITE' });
  }

  static async updateEmployee(employeeId: string, input: UpdateEmployeeInput): Promise<EmployeeDTO> {
    return withSession(async (session) => {
      const checkRes = await session.run(
        'MATCH (e:Employee {employeeId: $employeeId}) RETURN e',
        { employeeId }
      );
      if (checkRes.records.length === 0) {
        throw new NotFoundError(`Employee with ID '${employeeId}' not found`);
      }

      if (input.email) {
        const emailRes = await session.run(
          'MATCH (e:Employee {email: $email}) WHERE e.employeeId <> $employeeId RETURN e.email AS email',
          { email: input.email, employeeId }
        );
        if (emailRes.records.length > 0) {
          throw new ConflictError(`Employee with email '${input.email}' already exists`);
        }
      }

      let passwordHash: string | null = null;
      if (input.password) {
        passwordHash = await bcrypt.hash(input.password, 10);
      }

      const cypher = `
        MATCH (e:Employee {employeeId: $employeeId})
        SET e.name = coalesce($name, e.name),
            e.email = coalesce($email, e.email),
            e.phone = coalesce($phone, e.phone),
            e.position = coalesce($position, e.position),
            e.libraryId = coalesce($libraryId, e.libraryId),
            e.passwordHash = coalesce($passwordHash, e.passwordHash)
        RETURN e {
          .employeeId,
          .name,
          .email,
          .phone,
          .position,
          .libraryId,
          .role
        } AS employee
      `;

      const res = await session.run(cypher, {
        employeeId,
        name: input.name !== undefined ? input.name : null,
        email: input.email !== undefined ? input.email : null,
        phone: input.phone !== undefined ? input.phone : null,
        position: input.position !== undefined ? input.position : null,
        libraryId: input.libraryId !== undefined ? input.libraryId : null,
        passwordHash,
      });

      if (input.libraryId !== undefined) {
        await session.run('MATCH (e:Employee {employeeId: $employeeId})-[r:WORKS_AT]->(:Library) DELETE r', { employeeId });
        if (input.libraryId) {
          await session.run(
            `MATCH (e:Employee {employeeId: $employeeId}), (l:Library {libraryId: $libraryId})
             MERGE (e)-[:WORKS_AT]->(l)`,
            { employeeId, libraryId: input.libraryId }
          );
        }
      }

      return sanitizeEntity(toNative(res.records[0].get('employee'))) as EmployeeDTO;
    }, { accessMode: 'WRITE' });
  }

  static async deleteEmployee(employeeId: string): Promise<void> {
    await withSession(async (session) => {
      const checkRes = await session.run(
        'MATCH (e:Employee {employeeId: $employeeId}) RETURN e',
        { employeeId }
      );
      if (checkRes.records.length === 0) {
        throw new NotFoundError(`Employee with ID '${employeeId}' not found`);
      }

      await session.run(
        'MATCH (e:Employee {employeeId: $employeeId}) DETACH DELETE e',
        { employeeId }
      );
    }, { accessMode: 'WRITE' });
  }
}
