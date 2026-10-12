import neo4j from 'neo4j-driver';
import bcrypt from 'bcryptjs';
import { withSession } from '../config/neo4j';
import { MemberDTO, CreateMemberInput, UpdateMemberInput, PaginationQuery, PaginatedResult } from '../types';
import { NotFoundError, ConflictError } from '../utils/errors';
import { toNative, sanitizeEntity } from '../utils/neo4j-helpers';

export class MembersService {
  /**
   * List members with pagination, search, and status filter (never returns passwordHash).
   */
  static async listMembers(query: PaginationQuery): Promise<PaginatedResult<MemberDTO>> {
    return withSession(async (session) => {
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
      const skip = (page - 1) * limit;
      const search = query.search?.trim() || '';
      const status = query.status?.trim() || '';

      const whereClauses: string[] = [];
      if (search) {
        whereClauses.push('(toLower(m.name) CONTAINS toLower($search) OR toLower(m.email) CONTAINS toLower($search))');
      }
      if (status) {
        whereClauses.push('m.status = $status');
      }

      const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      const countCypher = `
        MATCH (m:Member)
        ${whereStr}
        RETURN count(m) AS total
      `;

      const listCypher = `
        MATCH (m:Member)
        ${whereStr}
        OPTIONAL MATCH (m)-[:BORROWED]->(l:Loan {status: 'ACTIVE'})
        WITH m, count(l) AS activeLoansCount
        RETURN m {
          .memberId,
          .name,
          .email,
          .phone,
          .address,
          .joinDate,
          .status,
          .role
        } AS member, activeLoansCount
        ORDER BY member.name ASC
        SKIP $skip
        LIMIT $limit
      `;

      const countRes = await session.run(countCypher, { search, status });
      const total = toNative(countRes.records[0]?.get('total')) || 0;

      const listRes = await session.run(listCypher, {
        search,
        status,
        skip: neo4j.int(skip),
        limit: neo4j.int(limit),
      });

      const items: MemberDTO[] = listRes.records.map((rec) => {
        const member = toNative(rec.get('member'));
        const activeLoansCount = toNative(rec.get('activeLoansCount')) || 0;
        return sanitizeEntity({
          ...member,
          activeLoansCount,
        }) as MemberDTO;
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
   * Detail of a single member with active and past loans (passwordHash omitted).
   */
  static async getMemberById(memberId: string): Promise<MemberDTO & { loans: any[] }> {
    return withSession(async (session) => {
      const cypher = `
        MATCH (m:Member {memberId: $memberId})
        OPTIONAL MATCH (m)-[:BORROWED]->(l:Loan)-[:FOR_BOOK]->(b:Book)
        WITH m, collect(DISTINCT {
          loanId: l.loanId,
          issueDate: l.issueDate,
          dueDate: l.dueDate,
          returnDate: l.returnDate,
          status: l.status,
          fineAmount: l.fineAmount,
          book: { bookId: b.bookId, title: b.title }
        }) AS rawLoans
        WITH m, [l IN rawLoans WHERE l.loanId IS NOT NULL] AS loans
        RETURN m {
          .memberId,
          .name,
          .email,
          .phone,
          .address,
          .joinDate,
          .status,
          .role
        } AS member, loans
      `;

      const res = await session.run(cypher, { memberId });
      if (res.records.length === 0) {
        throw new NotFoundError(`Member with ID '${memberId}' not found`);
      }

      const member = toNative(res.records[0].get('member'));
      const loans = toNative(res.records[0].get('loans'));

      return {
        ...sanitizeEntity(member),
        loans,
      } as MemberDTO & { loans: any[] };
    }, { accessMode: 'READ' });
  }

  /**
   * Create new member.
   */
  static async createMember(input: CreateMemberInput): Promise<MemberDTO> {
    return withSession(async (session) => {
      // Check ID existence
      const idRes = await session.run(
        'MATCH (m:Member {memberId: $memberId}) RETURN m.memberId AS id',
        { memberId: input.memberId }
      );
      if (idRes.records.length > 0) {
        throw new ConflictError(`Member with ID '${input.memberId}' already exists`);
      }

      // Check unique email
      const emailRes = await session.run(
        'MATCH (m:Member {email: $email}) RETURN m.email AS email',
        { email: input.email }
      );
      if (emailRes.records.length > 0) {
        throw new ConflictError(`Member with email '${input.email}' already exists`);
      }

      const rawPassword = input.password || 'libraflow123';
      const passwordHash = await bcrypt.hash(rawPassword, 10);
      const status = input.status || 'ACTIVE';

      const cypher = `
        CREATE (m:Member {
          memberId: $memberId,
          name: $name,
          email: $email,
          passwordHash: $passwordHash,
          phone: $phone,
          address: $address,
          joinDate: date(),
          status: $status,
          role: 'member'
        })
        RETURN m {
          .memberId,
          .name,
          .email,
          .phone,
          .address,
          .joinDate,
          .status,
          .role
        } AS member
      `;

      const res = await session.run(cypher, {
        memberId: input.memberId,
        name: input.name,
        email: input.email,
        passwordHash,
        phone: input.phone || null,
        address: input.address || null,
        status,
      });

      return sanitizeEntity(toNative(res.records[0].get('member'))) as MemberDTO;
    }, { accessMode: 'WRITE' });
  }

  /**
   * Update existing member.
   */
  static async updateMember(memberId: string, input: UpdateMemberInput): Promise<MemberDTO> {
    return withSession(async (session) => {
      const checkRes = await session.run(
        'MATCH (m:Member {memberId: $memberId}) RETURN m',
        { memberId }
      );
      if (checkRes.records.length === 0) {
        throw new NotFoundError(`Member with ID '${memberId}' not found`);
      }

      // Check unique email if updating
      if (input.email) {
        const emailRes = await session.run(
          'MATCH (m:Member {email: $email}) WHERE m.memberId <> $memberId RETURN m.email AS email',
          { email: input.email, memberId }
        );
        if (emailRes.records.length > 0) {
          throw new ConflictError(`Member with email '${input.email}' already exists`);
        }
      }

      let passwordHash: string | null = null;
      if (input.password) {
        passwordHash = await bcrypt.hash(input.password, 10);
      }

      const cypher = `
        MATCH (m:Member {memberId: $memberId})
        SET m.name = coalesce($name, m.name),
            m.email = coalesce($email, m.email),
            m.phone = coalesce($phone, m.phone),
            m.address = coalesce($address, m.address),
            m.status = coalesce($status, m.status),
            m.passwordHash = coalesce($passwordHash, m.passwordHash)
        RETURN m {
          .memberId,
          .name,
          .email,
          .phone,
          .address,
          .joinDate,
          .status,
          .role
        } AS member
      `;

      const res = await session.run(cypher, {
        memberId,
        name: input.name !== undefined ? input.name : null,
        email: input.email !== undefined ? input.email : null,
        phone: input.phone !== undefined ? input.phone : null,
        address: input.address !== undefined ? input.address : null,
        status: input.status !== undefined ? input.status : null,
        passwordHash,
      });

      return sanitizeEntity(toNative(res.records[0].get('member'))) as MemberDTO;
    }, { accessMode: 'WRITE' });
  }

  /**
   * Delete member with referential integrity check:
   * Prevents deletion if member has active loans.
   */
  static async deleteMember(memberId: string): Promise<void> {
    await withSession(async (session) => {
      const checkRes = await session.run(
        `MATCH (m:Member {memberId: $memberId})
         OPTIONAL MATCH (m)-[:BORROWED]->(l:Loan {status: 'ACTIVE'})
         RETURN m, count(l) AS activeLoansCount`,
        { memberId }
      );

      if (checkRes.records.length === 0 || !checkRes.records[0].get('m')) {
        throw new NotFoundError(`Member with ID '${memberId}' not found`);
      }

      const activeLoansCount = toNative(checkRes.records[0].get('activeLoansCount')) || 0;
      if (activeLoansCount > 0) {
        throw new ConflictError(
          `Cannot delete member '${memberId}': member has ${activeLoansCount} active loan(s)`
        );
      }

      await session.run(
        'MATCH (m:Member {memberId: $memberId}) DETACH DELETE m',
        { memberId }
      );
    }, { accessMode: 'WRITE' });
  }
}
